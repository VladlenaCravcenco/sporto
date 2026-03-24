import { useLanguage } from '../contexts/LanguageContext';
import { ArrowLeft, UserCheck, FileText, Target, Database, ShieldCheck, Scale, MessageSquare, Settings } from 'lucide-react';
import { SeoHead, SEO_PAGES } from '../components/SeoHead';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { usePageContent } from '../hooks/usePageContent';

type Lang = 'ro' | 'ru';

const iconMap: Record<string, ReactNode> = {
  UserCheck:    <UserCheck    className="w-4 h-4" />,
  FileText:     <FileText     className="w-4 h-4" />,
  Target:       <Target       className="w-4 h-4" />,
  Database:     <Database     className="w-4 h-4" />,
  ShieldCheck:  <ShieldCheck  className="w-4 h-4" />,
  Scale:        <Scale        className="w-4 h-4" />,
  MessageSquare:<MessageSquare className="w-4 h-4" />,
  Settings:     <Settings     className="w-4 h-4" />,
};

const C = {
  ro: {
    back: 'Înapoi',
    eyebrow: 'Documente juridice',
    title: 'Politica de confidențialitate',
    intro: 'Prezenta Politică de confidențialitate a datelor cu caracter personal (în continuare – „Politica de confidențialitate\") se aplică tuturor informațiilor pe care magazinul online al companiei SPORTOSFERA S.R.L. , disponibil la adresa sporto.md, le poate obține despre Utilizator în timpul utilizării site-ului magazinului online.',
    updated: 'Operator economic al site-ului și operator de date: SPORTOSFERA S.R.L.',
    sections: [
      {
        icon: 'UserCheck',
        title: '1. Definirea termenilor',
        paragraphs: [
          '„Administrația site-ului magazinului online\" – angajați autorizați pentru gestionarea site-ului care organizează sau efectuează prelucrarea datelor cu caracter personal și stabilesc scopul prelucrării acestora.',
          '„Date cu caracter personal\" – orice informație referitoare la o persoană fizică identificată sau identificabilă.',
          '„Prelucrarea datelor cu caracter personal\" – orice operațiune efectuată asupra datelor cu caracter personal precum colectarea, stocarea, utilizarea, transmiterea sau ștergerea acestora.',
        ],
      },
      {
        icon: 'FileText',
        title: '2. Dispoziții generale',
        paragraphs: [
          'Utilizarea site-ului magazinului online de către Utilizator constituie acceptarea prezentei Politici de confidențialitate și a condițiilor de prelucrare a datelor cu caracter personal.',
        ],
      },
      {
        icon: 'Target',
        title: '3. Obiectul politicii de confidențialitate',
        paragraphs: [
          'Prezenta Politică stabilește obligațiile privind protecția și asigurarea confidențialității datelor cu caracter personal furnizate de Utilizator la înregistrarea pe site sau la plasarea unei comenzi.',
        ],
      },
      {
        icon: 'Database',
        title: '4. Scopul colectării datelor personale',
        paragraphs: [
          'Datele personale ale Utilizatorului pot fi utilizate pentru identificarea utilizatorului, procesarea comenzilor, livrarea produselor, comunicarea cu clientul și oferirea de suport tehnic.',
        ],
      },
      {
        icon: 'ShieldCheck',
        title: '5. Metode și termeni de prelucrare a datelor',
        paragraphs: [
          'Datele cu caracter personal sunt prelucrate în mod legal și protejate prin măsuri tehnice și organizatorice adecvate.',
        ],
      },
      {
        icon: 'Scale',
        title: '6. Obligațiile părților',
        paragraphs: [
          'Utilizatorul este obligat să furnizeze date corecte, iar Administrația site-ului este obligată să asigure confidențialitatea acestora.',
        ],
      },
      {
        icon: 'MessageSquare',
        title: '7. Responsabilitatea părților',
        paragraphs: [
          'Administrația site-ului este responsabilă pentru utilizarea legală a datelor cu caracter personal conform legislației Republicii Moldova.',
        ],
      },
      {
        icon: 'UserCheck',
        title: '8. Soluționarea litigiilor',
        paragraphs: [
          'Litigiile apărute în legătură cu utilizarea site-ului vor fi soluționate conform legislației în vigoare a Republicii Moldova.',
        ],
      },
      {
        icon: 'Settings',
        title: '9. Condiții suplimentare',
        paragraphs: [
          'Administrația site-ului are dreptul de a modifica prezenta Politică de confidențialitate. Noua versiune intră în vigoare din momentul publicării pe site.',
        ],
      },
    ],
  },
  ru: {
    back: 'Назад',
    eyebrow: 'Юридические документы',
    title: 'Политика конфиденциальности',
    intro: 'Настоящая Политика конфиденциальности персональных данных (далее – «Политика конфиденциальности») распространяется на всю информацию, которую интернет‑магазин компании SPORTOSFERA S.R.L. , размещенный на доменном имени sporto.md, может получить о Пользователе во время использования сайта интернет‑магазина.',
    updated: 'Экономический оператор сайта и оператор персональных данных: SPORTOSFERA S.R.L.',
    sections: [
      {
        icon: 'UserCheck',
        title: '1. Определение терминов',
        paragraphs: [
          '«Администрация сайта интернет‑магазина» – уполномоченные сотрудники, управляющие сайтом и осуществляющие обработку персональных данных пользователей.',
          '«Персональные данные» – любая информация, относящаяся к прямо или косвенно определенному физическому лицу.',
          '«Обработка персональных данных» – любое действие или совокупность действий с персональными данными, включая сбор, запись, хранение, использование, передачу или удаление данных.',
        ],
      },
      {
        icon: 'FileText',
        title: '2. Общие положения',
        paragraphs: [
          'Использование Пользователем сайта интернет‑магазина означает согласие с данной Политикой конфиденциальности и условиями обработки персональных данных.',
          'В случае несогласия с условиями Политики Пользователь должен прекратить использование сайта.',
        ],
      },
      {
        icon: 'Target',
        title: '3. Предмет политики конфиденциальности',
        paragraphs: [
          'Настоящая Политика устанавливает обязательства Администрации сайта по защите и обеспечению конфиденциальности персональных данных, предоставляемых Пользователем при регистрации или оформлении заказа.',
        ],
      },
      {
        icon: 'Database',
        title: '4. Цели сбора персональных данных',
        paragraphs: [
          'Персональные данные Пользователя могут использоваться для: идентификации пользователя при оформлении заказа; обработки и доставки заказов; связи с пользователем; предоставления технической поддержки; отправки информации о товарах, акциях и предложениях (с согласия пользователя).',
        ],
      },
      {
        icon: 'ShieldCheck',
        title: '5. Способы и сроки обработки персональных данных',
        paragraphs: [
          'Обработка персональных данных осуществляется без ограничения срока любым законным способом с использованием информационных систем или без них.',
          'Администрация сайта принимает необходимые организационные и технические меры для защиты персональных данных пользователя от неправомерного доступа, изменения или уничтожения.',
        ],
      },
      {
        icon: 'Scale',
        title: '6. Обязанности сторон',
        paragraphs: [
          'Пользователь обязан предоставлять достоверные персональные данные.',
          'Администрация сайта обязуется использовать полученную информацию исключительно в целях, указанных в настоящей Политике конфиденциальности.',
        ],
      },
      {
        icon: 'MessageSquare',
        title: '7. Ответственность сторон',
        paragraphs: [
          'Ад��инистрация сайта несет ответственность за убытки, причиненные Пользователю в результате неправомерного использования персональных данных, в соответствии с законодательством Республики Молдова.',
        ],
      },
      {
        icon: 'UserCheck',
        title: '8. Разрешение споров',
        paragraphs: [
          'Все споры и разногласия решаются путем переговоров, а при недостижении соглашения — в судебном порядке согласно законодательству Республики Молдова.',
        ],
      },
      {
        icon: 'Settings',
        title: '9. Дополнительные условия',
        paragraphs: [
          'Администрация сайта имеет право вносить изменения в настоящую Политику конфиденциальности без предварительного уведомления пользователя. Новая редакция вступает в силу с момента публикации на сайте.',
        ],
      },
    ],
  },
};

export function PrivacyPolicy() {
  const { language } = useLanguage();
  const content = C[language as Lang];
  const managed = usePageContent('privacy');

  if (managed) {
    return (
      <div className="min-h-screen bg-white">
        <SeoHead
          title={SEO_PAGES.privacy[language as 'ro' | 'ru'].title}
          description={SEO_PAGES.privacy[language as 'ro' | 'ru'].description}
          keywords={SEO_PAGES.privacy[language as 'ro' | 'ru'].keywords}
          canonical="/privacy-policy"
          lang={language as 'ro' | 'ru'}
          noIndex={false}
        />
        <section className="border-b border-gray-100">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
            <Link to="/" className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-black transition-colors mb-10 group">
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              {content.back}
            </Link>
            <p className="text-xs text-gray-400 uppercase tracking-[0.2em] mb-4">{content.eyebrow}</p>
            <h1 className="text-4xl lg:text-5xl text-black mb-6">{language === 'ro' ? managed.title_ro : managed.title_ru}</h1>
            <div className="whitespace-pre-wrap text-gray-600 leading-relaxed text-sm lg:text-base">
              {language === 'ro' ? managed.content_ro : managed.content_ru}
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <SeoHead
        title={SEO_PAGES.privacy[language as 'ro' | 'ru'].title}
        description={SEO_PAGES.privacy[language as 'ro' | 'ru'].description}
        keywords={SEO_PAGES.privacy[language as 'ro' | 'ru'].keywords}
        canonical="/privacy-policy"
        lang={language as 'ro' | 'ru'}
        noIndex={false}
      />

      {/* ── HERO ── */}
      <section className="border-b border-gray-100">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-black transition-colors mb-10 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            {content.back}
          </Link>

          <div className="max-w-3xl">
            <p className="text-xs text-gray-400 uppercase tracking-[0.2em] mb-4">{content.eyebrow}</p>
            <h1 className="text-4xl lg:text-5xl text-black mb-6">{content.title}</h1>
            <p className="text-gray-500 leading-relaxed max-w-2xl">{content.intro}</p>
          </div>
        </div>
      </section>

      {/* ── CONTENT ── */}
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Sticky sidebar */}
          <aside className="lg:col-span-3 hidden lg:block">
            <div className="sticky top-8">
              <p className="text-xs text-gray-400 uppercase tracking-[0.15em] mb-4">
                {language === 'ro' ? 'Cuprins' : 'Содержание'}
              </p>
              <nav className="space-y-1">
                {content.sections.map((s, i) => (
                  <a
                    key={i}
                    href={`#pp-section-${i}`}
                    className="flex items-center gap-2 text-xs text-gray-400 hover:text-black transition-colors py-1.5 border-l-2 border-transparent hover:border-black pl-3"
                  >
                    <span className="tabular-nums text-gray-300">{String(i + 1).padStart(2, '0')}</span>
                    {s.title.replace(/^\d+\.\s/, '')}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main text */}
          <div className="lg:col-span-9 space-y-0 divide-y divide-gray-100">
            {content.sections.map((section, i) => (
              <div key={i} id={`pp-section-${i}`} className="py-10 first:pt-0">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-8 h-8 bg-black text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                    {iconMap[section.icon]}
                  </div>
                  <h2 className="text-lg text-black">{section.title}</h2>
                </div>

                <div className="ml-12 space-y-3">
                  {section.paragraphs.map((para, j) => (
                    <p key={j} className="text-sm text-gray-600 leading-relaxed">
                      {para}
                    </p>
                  ))}
                </div>
              </div>
            ))}

            {/* Operator note */}
            <div className="py-10">
              <div className="border-l-2 border-black pl-5">
                <p className="text-xs text-gray-500 leading-relaxed">{content.updated}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="border-t border-gray-100 bg-gray-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              {language === 'ro'
                ? 'Întrebări despre politica de confidențialitate?'
                : 'Вопросы о политике конфиденциальности?'}
            </p>
            <Link
              to="/contacts"
              className="inline-flex items-center gap-2 bg-black text-white text-xs px-6 py-3 hover:bg-gray-900 transition-colors"
            >
              {language === 'ro' ? 'Contactează-ne' : 'Связаться с нами'}
              <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
