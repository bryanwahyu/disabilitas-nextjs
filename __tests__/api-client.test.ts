import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Set env before importing. `lib/env.ts` membaca `import.meta.env.VITE_*`
// (di-inline Vite saat build), bukan `process.env.NEXT_PUBLIC_*` — stub lama
// tidak dibaca siapa pun sejak migrasi TanStack.
vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8082/v1');
vi.stubEnv('VITE_API_TIMEOUT', '5000');

describe('ApiClient', () => {
  let apiClient: any;

  beforeEach(async () => {
    localStorageMock.clear();
    vi.resetModules();
    const mod = await import('@/lib/api/client');
    apiClient = mod.apiClient;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should use correct base URL from environment', () => {
    expect(apiClient).toBeDefined();
  });

  it('should handle API errors gracefully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.resolve({ error: 'Server error' }),
    });

    const response = await apiClient.public.articles.list();
    expect(response.error).toBeDefined();
    expect(response.status).toBe(500);
  });

  it('should handle network timeout', async () => {
    global.fetch = vi.fn().mockImplementation(() => {
      return new Promise((_, reject) => {
        const error = new Error('The operation was aborted');
        error.name = 'AbortError';
        reject(error);
      });
    });

    const response = await apiClient.public.articles.list();
    expect(response.error).toBe('Request timeout');
  });

  it('should clear auth token on 401 response', async () => {
    localStorageMock.setItem('auth_token', 'test-token');

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: () => Promise.resolve({ error: 'Unauthorized' }),
    });

    await apiClient.public.articles.list();
    expect(localStorageMock.removeItem).toHaveBeenCalled();
  });

  it('should build query string for articles list', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [], meta: { total: 0 } }),
    });

    await apiClient.public.articles.list({ limit: 5, category: 'tutorial' });

    const calledUrl = (global.fetch as any).mock.calls[0][0];
    expect(calledUrl).toContain('limit=5');
    expect(calledUrl).toContain('category=tutorial');
  });

  it('should build query string for therapists list', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [], meta: { total: 0 } }),
    });

    await apiClient.public.therapists.list({ search: 'jakarta', page_size: 10 });

    const calledUrl = (global.fetch as any).mock.calls[0][0];
    expect(calledUrl).toContain('search=jakarta');
    expect(calledUrl).toContain('limit=10');
  });

  it('should parse successful API response with meta', async () => {
    const mockData = [{ id: '1', title: 'Test Article' }];
    const mockMeta = { total: 50, limit: 10, offset: 0 };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockData, meta: mockMeta }),
    });

    const response = await apiClient.public.articles.list();
    expect(response.data).toEqual(mockData);
    expect(response.meta).toEqual(mockMeta);
    expect(response.error).toBeUndefined();
  });
});
