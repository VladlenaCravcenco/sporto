import { createContext, useContext, useEffect, useRef, useId, useState, type ReactNode } from 'react';
import { FilePenLine, Eye, Languages } from 'lucide-react';
import { useAdminLang } from '../contexts/AdminLangContext';

const ContentLanguage = createContext<'ru' | 'ro'>('ru');
export const useContentLanguage = () => useContext(ContentLanguage);

/** Both panels remain mounted to preserve edits when switching views. */
export function AdminEditorWorkspace({ children, languages = false }: { children: ReactNode; languages?: boolean }) {
  const [panel, setPanel] = useState('editor');
  const { lang } = useAdminLang();
  const [contentLang, setContentLang] = useState<'ru' | 'ro'>(lang);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = root.current;
    const showEditor = () => setPanel('editor');
    node?.addEventListener('admin-focus-field', showEditor);
    return () => node?.removeEventListener('admin-focus-field', showEditor);
  }, []);
  return <ContentLanguage.Provider value={contentLang}><div ref={root} className="admin-editor-workspace" data-panel={panel}>
    <div className="admin-editor-controls">
      <div className="admin-editor-tabs" role="group" aria-label={lang === 'ru' ? 'Режим редактора' : 'Mod editor'}>
        <button type="button" aria-pressed={panel === 'editor'} aria-controls={id} onClick={() => setPanel('editor')}><FilePenLine size={16}/>{lang === 'ru' ? 'Редактор' : 'Editor'}</button>
        <button type="button" aria-pressed={panel === 'preview'} aria-controls={id} onClick={() => setPanel('preview')}><Eye size={16}/>{lang === 'ru' ? 'Предпросмотр' : 'Previzualizare'}</button>
      </div>
      {languages && panel === 'editor' && <div className="admin-content-language">
        <span><Languages size={15}/>{lang === 'ru' ? 'Язык контента' : 'Limba conținutului'}</span>
        <div role="group" aria-label={lang === 'ru' ? 'Язык контента' : 'Limba conținutului'}>
          <button type="button" aria-pressed={contentLang === 'ru'} onClick={() => setContentLang('ru')}>RU</button>
          <button type="button" aria-pressed={contentLang === 'ro'} onClick={() => setContentLang('ro')}>RO</button>
        </div>
      </div>}
    </div>
    <div id={id} className="admin-editor-panels">{children}</div>
  </div></ContentLanguage.Provider>;
}
