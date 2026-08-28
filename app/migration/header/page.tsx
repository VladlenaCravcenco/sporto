import { redirect } from 'next/navigation';

export const metadata = {
  title: 'SPORTO Header migration preview',
  robots: { index: false, follow: false },
};

export default function HeaderMigrationPreview() {
  redirect('/ro');
}
