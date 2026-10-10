export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function apiRequest<T>(path: string, body?: unknown): Promise<T> {
  const base = import.meta.env.VITE_API_BASE_URL || '';
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      credentials: 'include',
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });
  } catch { const error = new ApiError('Не удалось подключиться к серверу. Проверьте соединение и повторите.',503); window.dispatchEvent(new CustomEvent('svyazka:api-error',{detail:error})); throw error; }
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) {
    const error = new ApiError(data?.error || 'Сервер временно недоступен. Повторите попытку.', response.status);
    window.dispatchEvent(new CustomEvent('svyazka:api-error', { detail: error }));
    throw error;
  }
  return data.result as T;
}

// All asynchronous repository methods use one authenticated, persistent server.
// SSR exports the same domain implementations for the server adapter.
export function repositoryAdapter<T extends object>(name: string, local: T): T {
  if (import.meta.env.SSR) return local;
  const synchronous = new Set(['getProfileCompletion', 'prefillFromVk', 'getPrimaryAdminVkIds']);
  return new Proxy(local, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (typeof value !== 'function' || typeof property !== 'string') return value;
      if (synchronous.has(property)) return value.bind(target);
      return (...args: unknown[]) => apiRequest('/api/rpc', { repository: name, method: property, args }).then(result => {
        if (name === 'organization' && ['create','update'].includes(property) || name === 'organizationMembership' && ['create','remove','updateRole'].includes(property)) window.dispatchEvent(new Event('svyazka:organizations-changed'));
        if (name === 'account' && ['assignRole','removeRole'].includes(property)) window.dispatchEvent(new Event('svyazka:auth-changed'));
        return result;
      });
    },
  });
}
