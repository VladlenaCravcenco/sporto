import Link from 'next/link';

export default function AdminHubPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-4">Admin Panel</h2>
        <p className="text-gray-600 mb-6">Welcome to the admin dashboard. Select an option below:</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            className="p-6 bg-white rounded-lg border border-gray-200 hover:border-red-600 hover:shadow-lg transition-all"
          >
            <div className="text-3xl mb-2">{item.icon}</div>
            <h3 className="font-semibold text-gray-900">{item.title}</h3>
          </Link>
        ))}
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> This admin layout is server-side protected. Non-admin users are automatically redirected to login.
        </p>
      </div>
    </div>
  );
}
