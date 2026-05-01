// OCR provider abstraction — lets us swap Gemini / Claude / future providers
// behind a single interface. The MVP ships with Gemini only; Claude can plug in
// later by implementing OcrProvider against the same contract.

// Allowed category names (Vietnamese). Mirrors the seed list in triggers.sql:
// 6 expense + 4 income. AI returns one of these names; the app maps name+type
// → category row in the user's account.
export const VN_CATEGORIES = [
  // Expense
  'Ăn uống',
  'Mua sắm',
  'Di chuyển',
  'Giải trí',
  'Hoá đơn',
  'Khác',
  // Income
  'Lương',
  'Thưởng',
  'Lãi tiền gửi',
  'Thu nhập khác',
] as const;

export type VnCategory = (typeof VN_CATEGORIES)[number];

export type TransactionExtract = {
  /** VND amount as integer (no decimal places), always positive. Sign lives in `type`. */
  amount: number;
  /** Chi (tiền ra) hoặc Thu (tiền vào). Detected from "+/-" sign or app convention. */
  type: 'expense' | 'income';
  /** ISO YYYY-MM-DD. */
  date: string;
  /** Short human description. */
  description: string;
  /** Optional merchant name (used for MerchantMemory lookup). */
  merchant?: string;
  /** One of VN_CATEGORIES. */
  suggestedCategory: VnCategory;
};

export type OcrProviderName = 'gemini' | 'claude';

// One image can contain multiple transactions — banking-app screenshots
// commonly show "recent activities" with 5+ rows. Single receipts return an
// array of length 1.
export type OcrResult = {
  provider: OcrProviderName;
  /** Wall-clock latency in ms. */
  latencyMs: number;
  /** Token usage if reported by the provider. */
  inputTokens?: number;
  outputTokens?: number;
  /** Detected transactions, ordered top → bottom as in the source image. */
  transactions: TransactionExtract[];
  /** Raw provider response, kept for debugging / OcrLog. */
  rawJson: unknown;
};

export interface OcrProvider {
  readonly name: OcrProviderName;
  /**
   * Extract every transaction visible in a receipt or banking screenshot.
   * @param image - PNG/JPEG/WebP buffer or Blob, ≤ provider's max image size.
   * @throws if the model refuses, returns malformed JSON, or the network fails.
   */
  extractTransactions(image: Buffer | Blob): Promise<OcrResult>;
}
