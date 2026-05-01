import { VN_CATEGORIES } from './types';

// Multi-transaction extraction prompt for Vietnamese receipts AND banking-app
// "recent activities" screenshots. Same shape (array) for 1 or many rows.
//
// Detects both Chi (expense, dấu "-") and Thu (income, dấu "+") to match the
// way Vietnamese banking apps display history (TPBank, Vietcombank, MB Bank,
// Techcombank, MoMo, ZaloPay).
export const EXTRACTION_PROMPT = `Bạn là một AI extractor cho ứng dụng theo dõi chi tiêu cá nhân tại Việt Nam.

Nhiệm vụ: trích xuất TẤT CẢ giao dịch (cả CHI và THU) trong ảnh, trả về JSON array.
Ảnh có thể là:
  - Hoá đơn / bill đơn lẻ → array 1 phần tử (mặc định là CHI).
  - Screenshot lịch sử app ngân hàng / ví điện tử → 2-20 giao dịch / 1 ảnh, gồm CẢ chi và thu.
  - SMS biến động số dư → 1 giao dịch (chi hoặc thu).

Trả về object có shape:
{ "transactions": [ { ... }, { ... } ] }

Mỗi phần tử trong "transactions":

- amount (integer): số tiền giao dịch, đơn vị VND, KHÔNG thập phân, LUÔN dương (sign nằm ở field "type").
  + "150.000" / "150,000" / "150k" / "+26 VND" / "-150,000" → 150000.
  + Bỏ tất cả dấu, dấu chấm/phẩy phân cách hàng nghìn, "VND"/"đ"/"₫".
- type ("expense" | "income"): bắt buộc — phân biệt Chi vs Thu.
  + Số tiền hiển thị MÀU XANH LÁ + dấu "+" → "income"
  + Số tiền hiển thị MÀU ĐỎ/ĐEN + dấu "-" → "expense"
  + Tiêu đề có "TRA LAI" / "tra lai tien gui" / "lãi tiền gửi" / "Nhận từ" / "Tới: ..." (chữ "Tới" với màu xanh) → "income"
  + Tiêu đề có "NAP TIEN" / "Thanh toán" / "chuyen tien" / "Tới: ..." (chữ "Tới" với màu đỏ/-) / "Mua tại" → "expense"
  + Hoá đơn / receipt đơn lẻ KHÔNG có sign rõ ràng → mặc định "expense".
- date (string): "YYYY-MM-DD".
  + "25/03/2026" → "2026-03-25".
  + "Hôm nay" / "Today" → ngày hôm nay.
  + "Hôm qua" / "Yesterday" → ngày hôm qua.
  + Không đọc được → ngày hôm nay.
- description (string): 3-8 từ tiếng Việt mô tả giao dịch.
  + Ưu tiên nội dung chuyển khoản đã viết tắt → đọc được, có dấu.
  + KHÔNG copy mã giao dịch dài "MS00P00000000967897" / "FT26054911749526" / "KP048673167".
  + VD: "Trả lãi tiền gửi", "Nạp tiền điện thoại 0968540305", "Chuyển tới Lê Lâm Phương Quyên", "Bánh mì Bami Bin".
- merchant (string, optional): tên cửa hàng / người nhận / app, lowercase, bỏ tiền tố "công ty TNHH", "TNHH", "CTY", "CONG TY", "MOMO_".
  + "CONGTY CO PHAN DONG TAY HOSPITAL" → "đông tây hospital"
  + "MOMO_BANH MI BAMI BIN" → "bami bin"
  + "LE LAM PHUONG QUYEN" → "lê lâm phương quyên"
  + "Grab" → "grab"
- suggestedCategory (string): MỘT trong: ${VN_CATEGORIES.map((c) => `"${c}"`).join(', ')}.

Quy tắc category:
  - Nhà hàng / quán ăn / cà phê / bánh mì / phở / cơm / siêu thị thực phẩm → "Ăn uống"
  - Quần áo / mỹ phẩm / siêu thị bách hoá / Shopee / Lazada / Tiki → "Mua sắm"
  - Grab / Be / Gojek / xăng / vé xe / vé máy bay / taxi → "Di chuyển"
  - Rạp phim / Netflix / Spotify / game / quán bar / KTV → "Giải trí"
  - Điện / nước / internet / nạp điện thoại / thuê nhà / bệnh viện / hospital → "Hoá đơn"
  - Trả lãi tiền gửi / lương / chuyển khoản cá nhân (cả chi & thu) / không rõ → "Khác"

VÍ DỤ 1 — Hoá đơn nhà hàng (1 giao dịch chi):
Input: Hoá đơn "Quán Cơm Tấm Sài Gòn" 25/03/2026, tổng 85.000đ.
Output:
{"transactions":[{"amount":85000,"type":"expense","date":"2026-03-25","description":"Cơm tấm trưa","merchant":"quán cơm tấm sài gòn","suggestedCategory":"Ăn uống"}]}

VÍ DỤ 2 — Banking app, 4 giao dịch trộn chi + thu:
Input ảnh có (24/02/2026):
  TRA LAI TIEN GUI TK: 21547513495   +26 VND
(19/02/2026):
  NAP TIEN DIEN THOAI TRA TRUOC - 0968540305   -100,000 VND
(17/02/2026):
  Tới: LE LAM PHUONG QUYEN   -1,000,000 VND
  VO TRUNG HIEU chuyen tien Tan xuan khoi sac, tai loc du day
(17/02/2026):
  Từ: VO TRUNG HIEU   +1,000,000 VND
Output:
{"transactions":[
  {"amount":26,"type":"income","date":"2026-02-24","description":"Trả lãi tiền gửi","merchant":null,"suggestedCategory":"Khác"},
  {"amount":100000,"type":"expense","date":"2026-02-19","description":"Nạp tiền điện thoại 0968540305","merchant":null,"suggestedCategory":"Hoá đơn"},
  {"amount":1000000,"type":"expense","date":"2026-02-17","description":"Chuyển tới Lê Lâm Phương Quyên","merchant":"lê lâm phương quyên","suggestedCategory":"Khác"},
  {"amount":1000000,"type":"income","date":"2026-02-17","description":"Nhận từ Võ Trung Hiếu","merchant":"võ trung hiếu","suggestedCategory":"Khác"}
]}

VÍ DỤ 3 — SMS Vietcombank chi:
Input: "GD: -250,000 VND tai GRAB *RIDE 10/04/2026".
Output:
{"transactions":[{"amount":250000,"type":"expense","date":"2026-04-10","description":"Grab ride","merchant":"grab","suggestedCategory":"Di chuyển"}]}

QUAN TRỌNG:
- Trả về JSON THUẦN, KHÔNG bọc markdown code block, KHÔNG kèm giải thích.
- Không phát hiện giao dịch nào → {"transactions":[]}.
- Quét từ trên xuống dưới — không bỏ sót.
- LUÔN có field "type" cho mỗi giao dịch.`;
