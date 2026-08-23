import { HomeMigrationPreview } from '../../_components/HomeMigrationPreview';
import { getHomeHeroData } from '../../_lib/home-data';

export const metadata = {
  title: 'SPORTO Header migration preview',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function HeaderMigrationPreview() {
  const data = await getHomeHeroData();
  return <HomeMigrationPreview {...data} />;
}
