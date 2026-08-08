import { auth } from '@/server/auth';
import { toNextJsHandler } from 'better-auth/next-js';

/**
 * Catch-all Better Auth route handler for the Next.js App Router.
 * `toNextJsHandler` adapts the Better Auth `handler(request)` to the
 * Next.js Route Handler signature (`GET`/`POST`/`PATCH`/`PUT`/`DELETE`).
 */
export const { GET, POST, PATCH, PUT, DELETE } = toNextJsHandler(auth);
