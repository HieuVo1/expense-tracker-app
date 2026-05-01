import type { OcrProvider, OcrProviderName } from './types';

import { geminiProvider } from './gemini';

export type { OcrProvider, OcrResult, TransactionExtract, VnCategory } from './types';
export { VN_CATEGORIES } from './types';

// OCR_PROVIDER env switch:
//   - "gemini"  → Gemini only (MVP default)
//   - "claude"  → Claude only (not implemented yet — falls back to Gemini)
//   - "compare" → run both in parallel for A/B (not implemented yet)
//
// Claude provider + compare mode are deferred to V2; the abstraction is in place
// so adding them later is a single new file plus a switch arm here.
export function getOcrProvider(): OcrProvider {
  const choice = (process.env.OCR_PROVIDER ?? 'gemini') as OcrProviderName | 'compare';

  switch (choice) {
    case 'gemini':
      return geminiProvider;
    case 'claude':
    case 'compare':
      console.warn(`OCR_PROVIDER=${choice} not implemented yet, using gemini`);
      return geminiProvider;
    default:
      return geminiProvider;
  }
}
