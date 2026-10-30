/**
 * Gemini model names in one place. Override with GEMINI_MODEL / GEMINI_FALLBACK_MODEL.
 * Both defaults are listed in the Gemini API model catalogue (ai.google.dev/gemini-api/docs/models).
 */
export const getGeminiModel = (): string => process.env.GEMINI_MODEL || 'gemini-3.8-flash';
export const getGeminiFallbackModel = (): string =>
  process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.1-flash-lite';
