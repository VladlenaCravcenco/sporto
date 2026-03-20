import { Link } from 'react-router';
import { Building2, Wrench, ArrowUpRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

// ─── Unsplash images (same as on the home page) ────────────────────────────────
const IMG_TURNKEY =
  'https://images.unsplash.com/photo-1740895307943-7878df384db1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tZXJjaWFsJTIwZ3ltJTIwdHJlYWRtaWxscyUyMGRhcmslMjBoYWxsJTIwZml0bmVzcyUyMGVxdWlwbWVudCUyMHJvd3xlbnwxfHx8fDE3NzMyMTQ0ODl8MA&ixlib=rb-4.1.0&q=80&w=1080';

const IMG_MAINTENANCE =
  'https://images.unsplash.com/photo-1667771511112-d7eed0ccfaa7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWNoYW5pYyUyMGZpeGluZyUyMGV4ZXJjaXNlJTIwbWFjaGluZSUyMHRvb2xzJTIwd3JlbmNoJTIwbWFpbnRlbmFuY2V8ZW58MXx8fHwxNzczMjE0NDg0fDA&ixlib=rb-4.1.0&q=80&w=1080';

export function ServicesBento() {
  const { language, t } = useLanguage();

  return (
    <div className="grid md:grid-cols-2 gap-2 md:gap-3">

      {/* ── Turnkey Solutions ── */}
      <Link
        to="/turnkey-solutions"
        className="group bg-white border border-gray-200 hover:border-black transition-all duration-200 overflow-hidden flex flex-col"
      >
        <div className="aspect-[16/7] bg-gray-900 flex items-center justify-center relative overflow-hidden">
          <img
            src={IMG_TURNKEY}
            alt="Fitness club interior"
            className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-60 group-hover:scale-[1.03] transition-all duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-4 left-4 z-10">
            <span className="text-xs text-white/50 uppercase tracking-widest">
              {language === 'ro' ? 'Soluții complete' : 'Комплексные решения'}
            </span>
          </div>
        </div>
        <div className="p-6 flex-1 flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 bg-black flex items-center justify-center text-white group-hover:bg-gray-700 transition-colors">
              <Building2 className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-black transition-colors mt-2" />
          </div>
          <h3 className="text-gray-900 mb-2">{t('services.turnkey.title')}</h3>
          <p className="text-sm text-gray-500 leading-relaxed">{t('services.turnkey.desc')}</p>
        </div>
      </Link>

      {/* ── Maintenance Service ── */}
      <Link
        to="/maintenance-service"
        className="group bg-white border border-gray-200 hover:border-black transition-all duration-200 overflow-hidden flex flex-col"
      >
        <div className="aspect-[16/7] bg-black flex items-center justify-center relative overflow-hidden">
          <img
            src={IMG_MAINTENANCE}
            alt="Equipment maintenance"
            className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-55 group-hover:scale-[1.03] transition-all duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
          <div className="absolute bottom-4 left-4 z-10">
            <span className="text-xs text-white/50 uppercase tracking-widest">
              {language === 'ro' ? 'Mentenanță profesională' : 'Профессиональное обслуживание'}
            </span>
          </div>
        </div>
        <div className="p-6 flex-1 flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 bg-black flex items-center justify-center text-white group-hover:bg-gray-700 transition-colors">
              <Wrench className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-black transition-colors mt-2" />
          </div>
          <h3 className="text-gray-900 mb-2">{t('services.maintenance.title')}</h3>
          <p className="text-sm text-gray-500 leading-relaxed">{t('services.maintenance.desc')}</p>
        </div>
      </Link>

    </div>
  );
}
