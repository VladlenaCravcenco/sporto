import Link from 'next/link';

export default function AdminHubPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-4 text-xl font-bold">Admin Panel</h2>
        <p className="mb-6 text-gray-600">Welcome to the admin dashboard. Select an option below:</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          { href: '/admin/products', title: 'Products', icon: '📦' },
          { href: '/admin/brands', title: 'Brands', icon: '🏢' },
          { href: '/admin/categories', title: 'Categories', icon: '📂' },
          { href: '/admin/requests', title: 'Orders', icon: '📋' },
          { href: '/admin/clients', title: 'Clients', icon: '👥' },
          { href: '/admin/content', title: 'Content', icon: '📝' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-lg border border-gray-200 bg-white p-6 transition-all hover:border-red-600 hover:shadow-lg"
          >
            <div className="mb-2 text-3xl">{item.icon}</div>
            <h3 className="font-semibold text-gray-900">{item.title}</h3>
          </Link>
        ))}
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> This admin layout is server-side protected. Non-admin users are automatically redirected to login.
        </p>
      </div>
    </div>
  );
}