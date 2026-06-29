/**
 * Server-side fetch helpers for SEO metadata generation.
 * These are lightweight functions that bypass the client-side apiClient
 * (which uses localStorage) and work in Next.js server components.
 */

import type { TherapyLocation, ForumThread, ForumComment } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082/v1';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://disabilitasku.id';

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

export type TherapyLocationSEO = Pick<
  TherapyLocation,
  | 'id'
  | 'name'
  | 'type'
  | 'address'
  | 'city_code'
  | 'city_name'
  | 'description'
  | 'phone'
  | 'email'
  | 'website'
  | 'latitude'
  | 'longitude'
  | 'is_verified'
  | 'services'
  | 'open_hours'
  | 'created_at'
  | 'updated_at'
  | 'contact_locked'
>;

export type ForumThreadSEO = ForumThread & { comments?: ForumComment[] };

interface BasicListItem {
  id: string;
  updated_at?: string;
  created_at?: string;
}

async function seoFetch<T>(endpoint: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json.data ?? json) as T;
  } catch {
    return null;
  }
}

async function seoFetchList<T>(endpoint: string): Promise<T[]> {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const result = json.data ?? json;
    const list = Array.isArray(result) ? (result as T[]) : [];
    const limitMatch = endpoint.match(/[?&]limit=(\d+)/);
    if (limitMatch && list.length === Number(limitMatch[1])) {
      console.warn(`[sitemap-canary] ${endpoint} returned exactly ${list.length} items — list likely truncated, consider paginating with generateSitemaps()`);
    }
    return list;
  } catch {
    return [];
  }
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
  return seoFetchList<ArticleListItem>('/public/articles?limit=1000');
}

export async function getAllEventIds() {
  return seoFetchList<EventListItem>('/events?limit=1000');
}

export async function getAllCommunityIds(): Promise<CommunityListItem[]> {
  const raw = await seoFetchList<RawCommunitySEO>('/public/communities?per_page=100');
  return raw
    .map((c) => ({ id: c.ID || c.id || '', created_at: c.CreatedAt || c.created_at || '' }))
    .filter((c) => c.id);
}

type TherapyLocationDetailEnvelope =
  | TherapyLocationSEO
  | { summary: TherapyLocationSEO; open_hours?: TherapyLocation['open_hours'] };

function hasSummary(
  raw: TherapyLocationDetailEnvelope,
): raw is { summary: TherapyLocationSEO; open_hours?: TherapyLocation['open_hours'] } {
  return (raw as { summary?: TherapyLocationSEO }).summary !== undefined;
}

export async function getTherapyLocationForSEO(id: string): Promise<TherapyLocationSEO | null> {
  const raw = await seoFetch<TherapyLocationDetailEnvelope>(`/therapy/locations/${id}`);
  if (!raw) return null;
  if (hasSummary(raw)) {
    return { ...raw.summary, open_hours: raw.open_hours };
  }
  return raw;
}

export async function getAllTherapyLocationIds() {
  return seoFetchList<BasicListItem>('/therapy/locations?limit=1000');
}

export async function getForumThreadForSEO(id: string) {
  return seoFetch<ForumThreadSEO>(`/public/forum/threads/${id}`);
}

export async function getAllForumThreadIds() {
  return seoFetchList<BasicListItem>('/public/forum/threads?limit=1000');
}

export async function getAllJobIds() {
  return seoFetchList<BasicListItem>('/public/jobs?limit=1000');
}

export async function getAllTrainingIds() {
  return seoFetchList<BasicListItem>('/public/trainings?limit=1000');
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
    const res = await fetch(`${BASE_URL}${endpoint}`, { next: { revalidate: 3600 } });
    if (!res.ok) return { total: 0 };
    const json: ListMetaEnvelope = await res.json();
    return {
      total: json.meta?.total ?? (Array.isArray(json.data) ? json.data.length : 0),
    };
  } catch {
    return { total: 0 };
  }
}

export async function getHomepageStats() {
  try {
    const res = await fetch(`${BASE_URL}/public/stats`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const json = await res.json();
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
