import type { WheelSignals } from './wheel-types';

// ----------------------------------------------------------------------

const AREA_DEFINITIONS = `
- HEALTH (Sức khỏe): thể chất, tinh thần, giấc ngủ, dinh dưỡng, vận động.
- CAREER (Sự nghiệp): công việc chính, kỹ năng chuyên môn, định hướng nghề.
- FINANCE (Tài chính): thu nhập, chi tiêu hợp lý, đầu tư, tiết kiệm, an toàn tài chính.
- GROWTH (Phát triển bản thân): học tập, đọc sách, viết nhật ký, mục tiêu cá nhân.
- FAMILY (Gia đình): vợ/chồng, con cái, bố mẹ, anh chị em.
- SOCIAL (Bạn bè & Xã hội): bạn bè, quan hệ xã hội, đóng góp cộng đồng.
- RECREATION (Giải trí): nghỉ ngơi, sở thích, giải trí lành mạnh.
- SPIRITUALITY (Tâm linh): cầu nguyện, thiền, đời sống tinh thần, sự biết ơn, ý nghĩa cuộc sống.
`;

export function buildWheelPrompt(signals: WheelSignals): string {
  return `Bạn là một huấn luyện viên cuộc sống (life coach) thông minh, ấm áp và trung thực. Nhiệm vụ của bạn: dựa vào dữ liệu hoạt động ${signals.periodDays} ngày gần nhất của người dùng, chấm điểm 8 khía cạnh "Vòng tròn cuộc sống" (Wheel of Life) từ 1 đến 10, và đưa ra đề xuất cải thiện cho các khía cạnh yếu nhất.

NGUYÊN TẮC CHẤM ĐIỂM:
- 10 = rất cân bằng, có hành động đều đặn, có kết quả rõ.
- 7-8 = đang chú tâm, có hoạt động, nhưng chưa đa dạng.
- 4-6 = có quan tâm nhưng chưa đủ, lác đác.
- 1-3 = bỏ bê, gần như không có dữ liệu.
- KHÔNG được cho tất cả khía cạnh điểm 5. Chấm thẳng thắn, có khác biệt rõ.
- Trong ${signals.periodDays} ngày: KHÔNG có task / note / giao dịch liên quan → điểm thấp.
- Có nhiều task đã hoàn thành (done) → điểm cao hơn nhiều task tạo nhưng chưa làm.

8 KHÍA CẠNH:
${AREA_DEFINITIONS}

GỢI Ý SIGNAL:
- tasksByArea: số task gắn tag mỗi khía cạnh + số đã xong. (Người dùng có thể quên gắn tag → điểm thấp ở đây KHÔNG đồng nghĩa với kém — phải kết hợp textMentions bên dưới.)
- notesByType: nhật ký (daily), mục tiêu (GOAL), bài học (LESSON), nguyên tắc (PRINCIPLE), đặc điểm (TRAIT)... GOAL/LESSON/PRINCIPLE đặc biệt phản ánh GROWTH.
- gratitudeStats: nhật ký biết ơn → SPIRITUALITY + tinh thần (HEALTH).
- txStats.expenseByLifeArea: tổng chi đã map sang khía cạnh dựa trên tên danh mục (vd "Giải trí" → RECREATION, "Ăn uống" → HEALTH).
- aboutMeStats: số entry GOAL/LESSON/PRINCIPLE → GROWTH.
- **textMentions** (QUAN TRỌNG để bù khi user chưa tag task): đếm số lần keyword của từng khía cạnh xuất hiện trong:
  - noteHits: nội dung note + journal hằng ngày
  - gratitudeHits: items nhật ký biết ơn (đặc biệt phản ánh FAMILY, SOCIAL, HEALTH, SPIRITUALITY)
  - transactionHits: mô tả giao dịch + tên danh mục
  Nếu noteHits/gratitudeHits cho FAMILY = 0 và tasksByArea cũng không có FAMILY → điểm FAMILY thấp. Ngược lại, nếu gratitudeHits.FAMILY cao dù không có task → vẫn cho điểm FAMILY ổn (5-7) vì người dùng đang để tâm đến gia đình.

DỮ LIỆU NGƯỜI DÙNG:
\`\`\`json
${JSON.stringify(signals, null, 2)}
\`\`\`

YÊU CẦU OUTPUT:
- scores: 8 keys (HEALTH, CAREER, FINANCE, GROWTH, FAMILY, SOCIAL, RECREATION, SPIRITUALITY), mỗi key là số nguyên 1-10.
- suggestions: 2-5 mục cho các khía cạnh có điểm ≤ 5 (sắp xếp ưu tiên khía cạnh yếu nhất trước). Mỗi mục:
  - area: tên khía cạnh viết hoa.
  - message: 1-2 câu tiếng Việt đồng cảm, cụ thể, KHÔNG dạy đời. Tối đa ~200 ký tự.
  - reason: 1 câu dẫn chứng TỪ CHÍNH DỮ LIỆU ở trên (số task, lượt nhắc trong note/biết ơn, chi tiêu...). VD: "30 ngày qua chưa có task Gia đình nào và chỉ 1 lượt nhắc trong nhật ký." Tối đa ~150 ký tự.
  - recommendedTasks: ĐÚNG 3 gợi ý task đa dạng theo 3 mức độ, theo thứ tự:
    1. Việc nhỏ làm ngay hôm nay, dưới 15 phút. VD "Nhắn tin hỏi thăm mẹ".
    2. Thói quen lặp lại hằng tuần. VD "Đi bộ 20 phút mỗi tối thứ 2-4-6".
    3. Hành động sâu / dài hạn hơn. VD "Lên kế hoạch về thăm nhà cuối tháng".
    Mỗi task là mệnh lệnh ngắn, cụ thể, đo được, tối đa ~80 ký tự, KHÔNG trùng ý nhau, cá nhân hoá theo dữ liệu người dùng (tên danh mục chi tiêu, chủ đề note...) thay vì gợi ý chung chung.
- Toàn bộ message + reason + recommendedTasks bằng tiếng Việt tự nhiên.
- Chỉ trả JSON đúng schema, không thêm văn bản khác.`;
}
