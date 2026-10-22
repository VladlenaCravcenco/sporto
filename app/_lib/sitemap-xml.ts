import type { MetadataRoute } from 'next';

function escapeXml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
export function sitemapXml(entries: MetadataRoute.Sitemap) {
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
    + entries.map(entry => '<url><loc>' + escapeXml(entry.url) + '</loc>'
      + (entry.lastModified ? '<lastmod>' + escapeXml(entry.lastModified instanceof Date ? entry.lastModified.toISOString() : entry.lastModified) + '</lastmod>' : '')
      + Object.entries(entry.alternates?.languages || {}).map(([language, url]) => `<xhtml:link rel="alternate" hreflang="${escapeXml(language)}" href="${escapeXml(String(url))}" />`).join('')
      + '</url>').join('\n') + '\n</urlset>';
}
