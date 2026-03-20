import { Link } from 'react-router';
import { useLanguage, Language } from '../contexts/LanguageContext';
import { ArrowRight } from 'lucide-react';

interface CategoryCardProps {
  category: {
    id: string;
    name: { ro: string; ru: string };
    description: { ro: string; ru: string };
    subcategories?: { id: string; name: { ro: string; ru: string } }[];
  };
  icon?: React.ReactNode;
  index?: number;
}

export function CategoryCard({ category, icon, index = 0 }: CategoryCardProps) {
  const { language } = useLanguage();
  const subcatCount = category.subcategories?.length ?? 0;

  return (
    <Link
      to={`/catalog?category=${category.id}`}
      className="group bg-white border border-gray-200 p-5 hover:border-gray-900 transition-colors flex flex-col gap-3"
    >
      <div className="flex items-start justify-between">
        {icon ? (
          <div className="w-10 h-10 bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-gray-900 group-hover:text-white transition-colors">
            {icon}
          </div>
        ) : (
          <div className="w-10 h-10 bg-gray-100 flex items-center justify-center text-xs text-gray-400 group-hover:bg-gray-900 group-hover:text-white transition-colors tabular-nums">
            {String(index + 1).padStart(2, '0')}
          </div>
        )}
        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" />
      </div>

      <div>
        <h3 className="text-sm text-gray-900 mb-1">
          {category.name[language as Language]}
        </h3>
        <p className="text-xs text-gray-400 line-clamp-2">
          {category.description[language as Language]}
        </p>
      </div>

      {subcatCount > 0 && (
        <div className="text-xs text-gray-400 mt-auto pt-2 border-t border-gray-100">
          {subcatCount} {language === 'ro' ? 'subcategorii' : 'подкатегорий'}
        </div>
      )}
    </Link>
  );
}
