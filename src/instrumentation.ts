export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Warm up the cache at server startup so the first user request is instant
    try {
      await fetch('http://localhost:3000/api/articles', { signal: AbortSignal.timeout(60000) });
    } catch {
      // Server may not be ready yet — silently skip, cache will build on first request
    }
  }
}
