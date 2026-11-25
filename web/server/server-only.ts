/**
 * Stands in for the `server-only` package in tests. That package throws
 * unless Next.js is the one importing it; the queries it guards are still
 * shared with the Next.js app until the cutover.
 */
export {};
