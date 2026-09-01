/**
 * Pengambil data untuk metadata SEO, dipakai `loader`/`head` route.
 *
 * Sengaja tidak lewat `apiClient` karena klien itu membaca `localStorage` —
 * tidak ada di server.
 *
 * Cache: `fetch(..., { next: { revalidate: 3600 } })` milik Next sudah tidak
 * ada padanannya. Penggantinya `cachedFetch` di bawah — cache TTL sederhana di
 * memori proses. Konsekuensi yang harus disadari: cache-nya per-proses (tidak
 * dibagi antar-container) dan hilang saat restart. Untuk data SEO yang berubah
 * pelan, itu cukup; yang penting halaman artikel dan sitemap tidak memukul API
 * di setiap request crawler.
 */

import type { ForumThread, ForumComment } from './types';
import { env } from '@/lib/env';

const BASE_URL = env.apiBaseUrl;
export const SITE_URL = env.siteUrl;

const CACHE_TTL_MS = 3600 * 1000;
const cache = new Map<string, { at: number; response: unknown }>();

/**
 * `fetch` + cache TTL satu jam, disimpan sebagai JSON hasil parse.
 *
 * Hanya untuk GET data publik: tidak ada header autentikasi di sini, jadi tak
 * ada risiko data satu user tersimpan lalu terbaca user lain.
 */
async function cachedFetchJson(url: string): Promise<unknown | null> {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.response;

  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  cache.set(url, { at: Date.now(), response: json });
  return json;
}

export function parseTags(csv?: string): string[] {
  return csv?.split(',').map((t) => t.trim()).filter(Boolean) || [];
}

export function truncate(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

interface ArticleSEO {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_image?: string;
  author_name?: string;
  category: string;
  tags?: string;
  published_at?: string;
  created_at: string;
}

interface EventSEO {
  id: string;
  title: string;
  mode: string;
  start_at: string;
  end_at: string;
  location?: string;
  status: string;
  created_at: string;
}

interface CommunitySEO {
  id: string;
  name: string;
  description?: string;
  tags?: string;
  created_at: string;
}

interface ArticleListItem {
  slug: string;
  updated_at?: string;
  published_at?: string;
  created_at: string;
}

interface EventListItem {
  id: string;
  updated_at?: string;
  created_at: string;
}

interface CommunityListItem {
  id: string;
  updated_at?: string;
  created_at: string;
}

export type ForumThreadSEO = ForumThread & { comments?: ForumComment[] };

interface BasicListItem {
  id: string;
  updated_at?: string;
  created_at?: string;
}

async function seoFetch<T>(endpoint: string): Promise<T | null> {
  try {
    const json = (await cachedFetchJson(`${BASE_URL}${endpoint}`)) as
      | { data?: unknown }
      | null;
    if (json === null) return null;
    return (json.data ?? json) as T;
  } catch {
    return null;
  }
}

async function seoFetchList<T>(endpoint: string): Promise<T[]> {
  try {
    const json = (await cachedFetchJson(`${BASE_URL}${endpoint}`)) as any;
    if (json === null) return [];
    const result = json.data ?? json;
    return Array.isArray(result) ? (result as T[]) : [];
  } catch {
    return [];
  }
}

/**
 * Ambil SELURUH isi sebuah list endpoint dengan menyusuri halamannya.
 *
 * `?limit=1000` yang dipakai sebelumnya tidak pernah bekerja: `clampLimit` di
 * Go memotong limit apa pun ke maksimal 100, jadi sitemap diam-diam berhenti
 * di 100 entri pertama. Yang dulu menjaga hal ini cuma `console.warn`
 * "[sitemap-canary]" — peringatan yang ikut menyala untuk pemanggilan biasa
 * seperti `getHomepageArticles(6)` (6 artikel = tepat sebanyak limit), jadi
 * log produksi penuh olehnya sementara pemotongan aslinya tetap terjadi.
 *
 * Di sini halaman ditarik satu per satu sampai `meta.total` terpenuhi. Ada dua
 * bentuk meta di API: `{ total, curr_page, total_page }` (respondList) dan
 * `{ total, page, per_page }` (resp.Meta) — keduanya cukup diperiksa lewat
 * `total`, jadi tidak perlu tahu handler mana yang menjawab.
 */
async function seoFetchAll<T>(
  path: string,
  { perPage = 100, maxPages = 50, param = 'limit' as 'limit' | 'per_page' } = {}
): Promise<T[]> {
  const items: T[] = [];

  for (let page = 1; page <= maxPages; page++) {
    const sep = path.includes('?') ? '&' : '?';
    const url = `${BASE_URL}${path}${sep}${param}=${perPage}&page=${page}`;

    let json: any;
    try {
      json = await cachedFetchJson(url);
    } catch {
      break;
    }
    if (json === null) break;

    const batch = json.data ?? json;
    if (!Array.isArray(batch) || batch.length === 0) break;
    items.push(...(batch as T[]));

    const total = Number(json.meta?.total ?? 0);
    if (!total || items.length >= total) break;
    // Halaman penuh terakhir: berhenti daripada meminta halaman kosong.
    if (batch.length < perPage) break;
  }

  return items;
}

export async function getArticleForSEO(slug: string) {
  return seoFetch<ArticleSEO>(`/public/articles/${slug}`);
}

export async function getEventForSEO(id: string) {
  return seoFetch<EventSEO>(`/events/${id}`);
}

// Go serialises Community fields in PascalCase (no json tags on the entity)
interface RawCommunitySEO {
  ID?: string;
  id?: string;
  Name?: string;
  name?: string;
  Description?: string;
  description?: string;
  Tags?: string;
  tags?: string;
  CreatedAt?: string;
  created_at?: string;
}

export async function getCommunityForSEO(id: string): Promise<CommunitySEO | null> {
  const raw = await seoFetch<RawCommunitySEO>(`/public/communities/${id}`);
  const cid = raw?.ID || raw?.id;
  if (!raw || !cid) return null;
  return {
    id: cid,
    name: raw.Name || raw.name || '',
    description: raw.Description || raw.description,
    tags: raw.Tags || raw.tags,
    created_at: raw.CreatedAt || raw.created_at || '',
  };
}

export async function getAllArticleSlugs() {
  return seoFetchAll<ArticleListItem>('/public/articles');
}

export async function getAllEventIds() {
  return seoFetchAll<EventListItem>('/events');
}

export async function getAllCommunityIds(): Promise<CommunityListItem[]> {
  // `/public/communities` satu-satunya list yang memakai `per_page`, bukan
  // `limit` (lihat pagination.FromQuery di Go); `limit` di sini diabaikan diam-diam.
  const raw = await seoFetchAll<RawCommunitySEO>('/public/communities', { param: 'per_page' });
  return raw
    .map((c) => ({ id: c.ID || c.id || '', created_at: c.CreatedAt || c.created_at || '' }))
    .filter((c) => c.id);
}

export async function getForumThreadForSEO(id: string) {
  return seoFetch<ForumThreadSEO>(`/public/forum/threads/${id}`);
}

export async function getAllForumThreadIds() {
  return seoFetchAll<BasicListItem>('/public/forum/threads');
}

export async function getAllTrainingIds() {
  return seoFetchAll<BasicListItem>('/public/trainings');
}

export interface TherapistSEO {
  id: string;
  full_name?: string;
  email?: string;
  city?: string;
  district?: string;
  bio?: string;
  specialization?: string;
  experience_years?: number;
  is_verified?: boolean;
  locations?: Array<{ id: string; name: string; city_name?: string }>;
}

export interface TrainingSEO {
  id: string;
  title: string;
  description?: string;
  category?: string;
  training_type?: string;
  skill_level?: string;
  organizer_name?: string;
  cover_image?: string;
}

/** Satu pelatihan untuk metadata halaman `/pelatihan/$id`. */
export async function getTrainingForSEO(id: string) {
  return seoFetch<TrainingSEO>(`/public/trainings/${id}`);
}

/** Profil satu terapis untuk metadata halaman `/terapis/$id`. */
export async function getTherapistForSEO(id: string) {
  return seoFetch<TherapistSEO>(`/therapy/providers/${id}`);
}

/**
 * Semua id terapis untuk sitemap.
 *
 * Halaman profil terapis adalah halaman terpenting platform ini dan sebelumnya
 * tidak satu pun masuk sitemap.
 */
export async function getAllTherapistIds(): Promise<BasicListItem[]> {
  const raw = await seoFetchAll<{ id?: string; ID?: string; updated_at?: string; created_at?: string }>(
    '/therapy/providers'
  );
  return raw
    .map((t) => ({ id: t.id || t.ID || '', updated_at: t.updated_at, created_at: t.created_at }))
    .filter((t) => t.id);
}

export async function getHomepageArticles(limit = 6) {
  return seoFetchList<import('./types').ArticleSummary>(`/public/articles?limit=${limit}`);
}

export async function getHomepageThreads(limit = 4) {
  return seoFetchList<ForumThread>(`/public/forum/threads?limit=${limit}`);
}

export async function getHomepageEvents(limit = 3) {
  return seoFetchList<import('./types').Event>(`/events?limit=${limit}`);
}

interface ListMetaEnvelope {
  data?: unknown[];
  meta?: { total?: number };
}

async function seoFetchMeta(endpoint: string): Promise<{ total: number }> {
  try {
    const json = (await cachedFetchJson(`${BASE_URL}${endpoint}`)) as ListMetaEnvelope | null;
    if (json === null) return { total: 0 };
    return {
      total: json.meta?.total ?? (Array.isArray(json.data) ? json.data.length : 0),
    };
  } catch {
    return { total: 0 };
  }
}

export async function getHomepageStats() {
  try {
    const json = (await cachedFetchJson(`${BASE_URL}/public/stats`)) as any;
    if (json !== null) {
      const d = json.data ?? {};
      return {
        users: d.users ?? 0,
        therapy: d.locations ?? 0,
        articles: d.articles ?? 0,
        forum: d.threads ?? 0,
        communities: d.communities ?? 0,
      };
    }
  } catch {}
  return { users: 0, therapy: 0, articles: 0, forum: 0, communities: 0 };
}
