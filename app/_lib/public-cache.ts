// One bounded public snapshot per loader. No user/session data or URL-keyed cache.
// Concurrent requests share the pending load; expired data is released before refresh.
export function publicSnapshot<T>(loader: () => Promise<T>, ttlMs = 30_000) {
  let value: T | undefined;
  let expires = 0;
  let pending: Promise<T> | undefined;
  return async (): Promise<T> => {
    if (value !== undefined && Date.now() < expires) return value;
    if (pending) return pending;
    value = undefined;
    pending = loader().then(result => {
      value = result;
      expires = Date.now() + ttlMs;
      return result;
    }).finally(() => { pending = undefined; });
    return pending;
  };
}
