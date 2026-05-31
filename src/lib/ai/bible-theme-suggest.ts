import { Type, GoogleGenAI } from '@google/genai';

// Suggest 1-3 themes for a Bible verse, given the user's existing theme list
// + the lesson notes that introduced the verse. Returns theme NAMES; the
// action layer maps them to existing theme rows OR offers to create new ones.

const MODEL = 'gemini-3.1-flash-lite';

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set in environment');
  return new GoogleGenAI({ apiKey });
}

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    themes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: 'Tên chủ đề ngắn (1-3 từ), tiếng Việt' },
          isNew: {
            type: Type.BOOLEAN,
            description: 'true nếu đề xuất chủ đề mới chưa có trong danh sách',
          },
          reason: { type: Type.STRING, description: 'Giải thích ngắn (1 câu) vì sao gắn chủ đề này' },
        },
        required: ['name', 'isNew', 'reason'],
      },
    },
  },
  required: ['themes'],
};

export type ThemeSuggestion = {
  /** Theme name. If `isNew`, it doesn't exist yet in the user's themes. */
  name: string;
  /** True if model thinks this is a new theme; false → must match one of `existingThemes`. */
  isNew: boolean;
  /** Short rationale shown next to the suggestion chip. */
  reason: string;
};

function buildPrompt(
  verseRef: string,
  verseText: string,
  existingThemes: string[],
  lessonContext: string
): string {
  const themesList = existingThemes.length
    ? existingThemes.map((t) => `- ${t}`).join('\n')
    : '(chưa có chủ đề nào)';
  return `Bạn là trợ lý giúp người dùng phân loại câu Kinh Thánh theo chủ đề.

Câu kinh: ${verseRef}
Nội dung: "${verseText}"

Bối cảnh bài học (ghi chú của người dùng — có thể trống):
${lessonContext.slice(0, 1500) || '(không có)'}

Danh sách chủ đề người dùng đã tạo:
${themesList}

Hãy gợi ý 1 đến 3 chủ đề phù hợp nhất cho câu kinh này:
- Ưu tiên dùng lại tên trong danh sách (isNew=false).
- Chỉ đề xuất chủ đề mới (isNew=true) khi không có tên nào sẵn phù hợp.
- Tên chủ đề ngắn gọn 1-3 từ, viết hoa chữ cái đầu (ví dụ: "Đức tin", "Lo lắng", "Cầu nguyện").
- "reason" giải thích bằng 1 câu tiếng Việt vì sao câu kinh gợi chủ đề đó.

Trả về JSON theo schema.`;
}

export async function suggestThemesForVerse(input: {
  verseRef: string;          // "Ma-thi-ơ 6:33"
  verseText: string;
  existingThemes: string[];  // theme names user already has
  lessonContext?: string;    // lesson notes for grounding
}): Promise<ThemeSuggestion[]> {
  const client = getClient();
  const response = await client.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: buildPrompt(
              input.verseRef,
              input.verseText,
              input.existingThemes,
              input.lessonContext ?? ''
            ),
          },
        ],
      },
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema,
      temperature: 0.3,
    },
  });

  const text = response.text;
  if (!text) throw new Error('Gemini returned empty response');

  let parsed: { themes?: Partial<ThemeSuggestion>[] };
  try {
    parsed = JSON.parse(text) as typeof parsed;
  } catch {
    throw new Error(`Gemini returned non-JSON response: ${text.slice(0, 200)}`);
  }

  // Whitelist: if isNew=false, the name MUST exist in the user's themes.
  // Otherwise correct isNew → true. Defends against hallucinated existing themes.
  const existingSet = new Set(input.existingThemes);
  const suggestions = (parsed.themes ?? [])
    .filter((s): s is ThemeSuggestion => Boolean(s?.name?.trim()))
    .slice(0, 3)
    .map((s) => ({
      name: s.name.trim(),
      isNew: !existingSet.has(s.name.trim()),
      reason: s.reason?.trim() ?? '',
    }));
  return suggestions;
}
