/**
 * Unified API exports.
 *
 * When VITE_USE_MOCK=true, all calls go through the mock adapter so the
 * frontend can be developed without a running backend.
 */
export * from './endpoints';
export { default as client } from './client';
export { getErrorMessage } from './client';
export { mockApi } from './mock';
