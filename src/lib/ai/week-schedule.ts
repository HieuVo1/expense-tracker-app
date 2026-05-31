import type { TimeSlot, LifeArea, TaskPriority } from '@prisma/client';

import { Type, GoogleGenAI } from '@google/genai';

// ----------------------------------------------------------------------

const MODEL = 'gemini-3.1-flash-lite';

const SLOTS: TimeSlot[] = ['morning', 'afternoon', 'evening'];

// ----------------------------------------------------------------------

export type SchedulableTask = {
  id: string;
  title: string;
  priority: TaskPriority;
  lifeArea: LifeArea | null;
  dueDate: string | null; // YYYY-MM-DD — deadline hint
  isDone: boolean;
};

export type AlreadyScheduled = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  slot: TimeSlot;
};

export type ScheduleAssignment = {
  taskId: string;
  date: string; // YYYY-MM-DD inside week range
  slot: TimeSlot;
};

// ----------------------------------------------------------------------

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set in environment');
  return new GoogleGenAI({ apiKey });
}

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    assignments: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          taskId: { type: Type.STRING },
          date: { type: Type.STRING },
          slot: { type: Type.STRING, enum: SLOTS },
        },
        required: ['taskId', 'date', 'slot'],
      },
    },
  },
  required: ['assignments'],
};

function buildPrompt(input: {
  weekStart: string;
  weekEnd: string;
  weekDays: string[];
  unscheduled: SchedulableTask[];
  alreadyScheduled: AlreadyScheduled[];
}): string {
  return `Bạn là trợ lý quản lý thời gian. Hãy sắp xếp các task chưa lên lịch vào các slot trong tuần hiện tại theo MA TRẬN EISENHOWER (Khẩn cấp & Quan trọng).

TUẦN HIỆN TẠI: ${input.weekStart} đến ${input.weekEnd}
Các ngày trong tuần: ${input.weekDays.join(', ')}

NGUYÊN TẮC SẮP XẾP:
1. **do_first (Q1 - Khẩn cấp + Quan trọng)**: xếp vào những ngày đầu tuần (đầu danh sách weekDays), slot "morning" hoặc "afternoon". Ưu tiên cao nhất, làm sớm để tránh kéo dài stress.
2. **schedule (Q2 - Quan trọng)**: rải đều khắp tuần, slot "morning" khi có thể (sức tập trung tốt nhất). Đây là task đầu tư dài hạn.
3. **delegate (Q3 - Khẩn cấp)**: ép vào slot "afternoon" hoặc "evening" để không chiếm thời gian deep work.
4. **eliminate (Q4 - Không quan trọng)**: chỉ xếp vào "evening" và chỉ khi còn slot trống. Có thể bỏ qua nếu tuần quá đầy.
5. **dueDate có giá trị**: PHẢI xếp trước hoặc đúng ngày dueDate.
6. **Tránh chất đống cùng 1 ngày**: tối đa 3 task/ngày nếu có thể.
7. **Không trùng slot đã có task**: xem danh sách alreadyScheduled bên dưới.
8. **lifeArea**: rải các khía cạnh khác nhau ra để không dồn vào 1 ngày (ví dụ không nhồi 3 task HEALTH cùng buổi sáng).

TASK ĐÃ CÓ LỊCH (KHÔNG ĐỘNG VÀO):
${input.alreadyScheduled.length > 0 ? JSON.stringify(input.alreadyScheduled, null, 2) : '(không có)'}

TASK CẦN SẮP XẾP:
${JSON.stringify(input.unscheduled, null, 2)}

YÊU CẦU OUTPUT:
- Mảng "assignments", mỗi phần tử gồm taskId, date (chuỗi YYYY-MM-DD trong weekDays), slot ("morning"|"afternoon"|"evening").
- Mọi task chưa done trong danh sách CẦN SẮP XẾP đều phải có assignment, TRỪ task Q4 (eliminate) có thể bỏ qua nếu lịch chật.
- Tuyệt đối không tạo task mới, không đổi taskId.
- Chỉ trả JSON đúng schema.`;
}

// ----------------------------------------------------------------------

export async function requestWeekSchedule(input: {
  weekStart: string;
  weekEnd: string;
  weekDays: string[];
  unscheduled: SchedulableTask[];
  alreadyScheduled: AlreadyScheduled[];
}): Promise<ScheduleAssignment[]> {
  if (input.unscheduled.length === 0) return [];

  const client = getClient();

  const response = await client.models.generateContent({
    model: MODEL,
    contents: [{ role: 'user', parts: [{ text: buildPrompt(input) }] }],
    config: { responseMimeType: 'application/json', responseSchema, temperature: 0.3 },
  });

  const text = response.text;
  if (!text) throw new Error('Gemini returned empty response');

  let parsed: { assignments?: unknown[] };
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Gemini returned non-JSON: ${text.slice(0, 200)}`);
  }

  const validIds = new Set(input.unscheduled.map((t) => t.id));
  const validDates = new Set(input.weekDays);

  const out: ScheduleAssignment[] = [];
  for (const a of parsed.assignments ?? []) {
    if (typeof a !== 'object' || a === null) continue;
    const obj = a as Record<string, unknown>;
    if (typeof obj.taskId !== 'string' || !validIds.has(obj.taskId)) continue;
    if (typeof obj.date !== 'string' || !validDates.has(obj.date)) continue;
    if (typeof obj.slot !== 'string' || !SLOTS.includes(obj.slot as TimeSlot)) continue;
    out.push({
      taskId: obj.taskId,
      date: obj.date,
      slot: obj.slot as TimeSlot,
    });
  }
  return out;
}
