import { ReactNode } from 'react';
import * as LucideIcons from 'lucide-react';
import { YinYang } from '../components/icons/YinYang';
import { TableTennis } from '../components/icons/TableTennis';

export type CategoryIconKey = string;

export interface CategoryIconOption {
  key: CategoryIconKey;
  label: string;
  theme: string;
  icon: ReactNode;
}

const SportoIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 4h12l-2 16H8z" />
    <path d="M9 9h6" />
    <path d="M10 14h4" />
  </svg>
);

const iconGroupRules = [
  { title: 'Navigation', keywords: ['Map', 'Compass', 'Route', 'Pin', 'Location', 'Globe', 'Navigation', 'Direction', 'Home', 'Building', 'Road'] },
  { title: 'Interfaces', keywords: ['Grid', 'Menu', 'Layout', 'Layers', 'List', 'Table', 'Calendar', 'Toggle', 'Settings', 'View', 'Columns', 'Page', 'Sidebar'] },
  { title: 'Communication', keywords: ['Mail', 'Message', 'Chat', 'Phone', 'RSS', 'Share', 'Send', 'Mic', 'Video', 'Bell', 'Comment', 'User', 'Users', 'Inbox'] },
  { title: 'Files', keywords: ['File', 'Folder', 'Document', 'Archive', 'Clipboard', 'Paperclip', 'Download', 'Upload', 'Receipt', 'Save'] },
  { title: 'Commerce', keywords: ['Shopping', 'Cart', 'Bag', 'Dollar', 'CreditCard', 'Receipt', 'Price', 'Tag', 'Coin', 'Banknote', 'Shop'] },
  { title: 'Media', keywords: ['Camera', 'Video', 'Music', 'Image', 'Photo', 'Play', 'Pause', 'Record', 'Media', 'Podcast', 'Film'] },
  { title: 'Status', keywords: ['Check', 'X', 'Plus', 'Minus', 'Alert', 'Info', 'Warning', 'Lock', 'Shield', 'Badge', 'Verified', 'Eye', 'Power'] },
  { title: 'Design', keywords: ['Color', 'Palette', 'Paint', 'Brush', 'Feather', 'Sparkle', 'Star', 'Heart', 'Crown', 'Diamond'] },
  { title: 'Nature', keywords: ['Leaf', 'Tree', 'Flower', 'Sun', 'Moon', 'Cloud', 'Wave', 'Droplet', 'Flame', 'Snow'] },
  { title: 'Sports', keywords: ['Trophy', 'Target', 'Dumbbell', 'Football', 'Basketball', 'Tennis', 'Soccer', 'Volleyball', 'Ping', 'Pong', 'TableTennis', 'Skate', 'Ski'] },
  { title: 'People', keywords: ['Person', 'People', 'User', 'Users', 'Team', 'Group', 'Handshake', 'Friends'] },
  { title: 'Objects', keywords: ['Anchor', 'Key', 'Battery', 'Lightbulb', 'Umbrella', 'Tool', 'Rocket', 'Gift', 'Flag', 'Clock'] },
];

const getIconTheme = (name: string) => {
  const found = iconGroupRules.find(rule => rule.keywords.some(keyword => name.includes(keyword)));
  return found ? found.title : 'Other';
};

const lucideIconOptions: CategoryIconOption[] = Object.entries(LucideIcons)
  .filter(([name, value]) => {
  if (!name.startsWith('Lucide')) return false; // только Lucide* — убирает дубли
  if (name === 'LucideIcon') return false;
  if (typeof value !== 'function' && !(value && typeof value === 'object' && '$$typeof' in (value as object))) return false;
  return true;
})
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([name, Icon]) => {
    const IconComponent = Icon as React.ComponentType<React.SVGProps<SVGSVGElement>>;
    return {
      key: name,
      label: name,
      theme: getIconTheme(name),
      icon: <IconComponent className="w-5 h-5" />,
    };
  });

export const categoryIconOptions: CategoryIconOption[] = [
  { key: 'sporto', label: 'Sporto', theme: 'Default', icon: <SportoIcon className="w-5 h-5" /> },
  { key: 'yinYang', label: 'YinYang', theme: 'Custom', icon: <YinYang className="w-5 h-5" /> },
  { key: 'tableTennis', label: 'TableTennis', theme: 'Custom', icon: <TableTennis className="w-5 h-5" /> },
  ...lucideIconOptions,
];

export const categoryIconNodeMap: Record<CategoryIconKey, ReactNode> = Object.fromEntries(
  categoryIconOptions.map(option => [option.key, option.icon]),
) as Record<CategoryIconKey, ReactNode>;

export function getCategoryIcon(iconKey?: string): ReactNode | null {
  if (!iconKey) return null;
  return categoryIconNodeMap[iconKey] ?? null;
}
