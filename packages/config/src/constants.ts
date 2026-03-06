/** Application-wide constants */

export const APP_NAME = "Axiora";
export const APP_DESCRIPTION = "Pilotage stratégique des achats publics";
export const APP_VERSION = "0.1.0";

/** AI model configuration */
export const AI_MODEL = "claude-sonnet-4-6";
export const AI_MAX_TOKENS = 4096;
export const AI_TEMPERATURE = 0.1;
export const AI_MAX_RETRIES = 3;

/** Pagination defaults */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** File upload limits */
export const MAX_FILE_SIZE_MB = 10;
export const ALLOWED_FILE_TYPES = ["text/csv", "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];

/** Cache TTL (seconds) */
export const CACHE_TTL_SHORT = 60;         // 1 minute
export const CACHE_TTL_MEDIUM = 60 * 15;  // 15 minutes
export const CACHE_TTL_LONG = 60 * 60;    // 1 hour
