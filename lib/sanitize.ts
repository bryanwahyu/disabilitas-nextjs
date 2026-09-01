import sanitizeHtml from 'sanitize-html';

/**
 * Sanitasi HTML artikel.
 *
 * Dulu memakai `isomorphic-dompurify`, yang di server menjalankan DOMPurify di
 * atas **jsdom**. Itu tidak bisa dipertahankan setelah pindah ke TanStack Start:
 * jsdom gagal di-bundle Rollup saat `vite build` (parser tersandung `cssstyle`),
 * dan memuat implementasi DOM penuh di server SSR memang pemborosan.
 *
 * `sanitize-html` bekerja di atas parser HTML murni (htmlparser2) — tidak
 * butuh DOM, jalan sama persis di server dan browser.
 *
 * Model keamanannya tetap sama dan itu yang penting: **allowlist**, bukan
 * blocklist. Tag/atribut yang tidak disebut di bawah dibuang, jadi `onerror`,
 * `onclick`, `<script>`, `<iframe>` gugur karena tidak ada di daftar — bukan
 * karena diblokir satu per satu.
 */

/** Tag yang boleh muncul di isi artikel (dibaca pengunjung). */
const ARTICLE_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'a', 'img',
  'blockquote', 'pre', 'code',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'div', 'span', 'hr',
  'figure', 'figcaption',
];

/** Tag yang boleh disimpan dari editor admin (tanpa `hr`/`s`, sesuai perilaku lama). */
const EDITOR_TAGS = [
  'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'a',
  'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'img', 'figure', 'figcaption', 'pre', 'code',
  'span', 'div', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
];

const COMMON_ATTRS: sanitizeHtml.IOptions['allowedAttributes'] = {
  '*': ['class', 'id', 'title'],
  a: ['href', 'target', 'rel'],
  img: ['src', 'alt', 'width', 'height'],
  th: ['colspan', 'rowspan'],
  td: ['colspan', 'rowspan'],
};

function baseOptions(tags: string[]): sanitizeHtml.IOptions {
  return {
    allowedTags: tags,
    allowedAttributes: COMMON_ATTRS,
    // Isi <script>/<style> ikut dibuang, bukan cuma tag-nya — kalau hanya tag
    // yang hilang, isinya muncul sebagai teks telanjang di halaman.
    nonTextTags: ['script', 'style', 'textarea', 'noscript'],
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    // Gambar inline base64 tetap diizinkan (konten artikel lama memakainya).
    allowedSchemesByTag: { img: ['http', 'https', 'data'] },
    // `target="_blank"` tanpa `rel` membuka tab anak yang bisa menyetir tab
    // induk lewat `window.opener`.
    transformTags: {
      a: (tagName, attribs) =>
        attribs.target === '_blank'
          ? { tagName, attribs: { ...attribs, rel: 'noopener noreferrer' } }
          : { tagName, attribs },
    },
  };
}

/** Untuk menampilkan isi artikel ke pembaca. */
export function sanitizeArticleHtml(html: string): string {
  return sanitizeHtml(html, baseOptions(ARTICLE_TAGS));
}

/** Untuk isi yang diketik admin sebelum dikirim ke API. */
export function sanitizeEditorHtml(html: string): string {
  return sanitizeHtml(html, baseOptions(EDITOR_TAGS));
}
