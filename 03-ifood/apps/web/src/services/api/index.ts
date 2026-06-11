const GATEWAY_URL = 'http://localhost:8085';

export async function _get(endpoint: string, init?: RequestInit) {
  return await fetch(`${GATEWAY_URL}${endpoint}`, {
    ...init,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    credentials: init?.credentials || 'include',
  });
}

export async function _post(endpoint: string, body?: unknown, init?: RequestInit) {
  return await fetch(`${GATEWAY_URL}${endpoint}`, {
    ...init,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: init?.credentials || 'include',
  });
}

export async function _put(endpoint: string, body?: unknown, init?: RequestInit) {
  return await fetch(`${GATEWAY_URL}${endpoint}`, {
    ...init,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: init?.credentials || 'include',
  });
}

export async function _delete(endpoint: string, init?: RequestInit) {
  return await fetch(`${GATEWAY_URL}${endpoint}`, {
    ...init,
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    credentials: init?.credentials || 'include',
  });
}

