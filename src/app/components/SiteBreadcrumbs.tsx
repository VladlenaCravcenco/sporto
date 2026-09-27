export interface BreadcrumbItem { label: string; href: string }

export function SiteBreadcrumbs({ items, language, className = '', siteUrl = 'https://www.sporto.md' }: {
  items: BreadcrumbItem[]; language: 'ro' | 'ru'; className?: string; siteUrl?: string;
}) {
  if (!items.length) return null;
  return <div className={className}>
    <nav aria-label={language === 'ro' ? 'Navigare ierarhică' : 'Хлебные крошки'} className="text-sm text-gray-400">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, index) => <li key={item.href} className="flex min-w-0 items-center gap-2">
          {index > 0 && <span aria-hidden="true">/</span>}
          {index === items.length - 1
            ? <span aria-current="page" className="text-gray-700">{item.label}</span>
            : <a href={item.href} className="transition-colors hover:text-gray-900">{item.label}</a>}
        </li>)}
      </ol>
    </nav>
    {items.length > 1 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem', position: index + 1, name: item.label, item: new URL(item.href, siteUrl).href,
      })),
    }).replace(/</g, '\\u003c') }} />}
  </div>;
}
