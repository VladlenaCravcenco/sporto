import { useLanguage } from '../contexts/LanguageContext';
import { ServicesBentoView } from './ServicesBentoView';
export function ServicesBento() {
  const { language } = useLanguage();
  return <ServicesBentoView language={language} />;
}
