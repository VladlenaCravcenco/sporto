import { forwardRef, useId, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { useContentLanguage } from './AdminEditorWorkspace';

export const AdminEditorSection = forwardRef<HTMLDetailsElement, {
  title: string; children: ReactNode; defaultOpen?: boolean; className?: string;
}>(({ title, children, defaultOpen = false, className = '' }, ref) => (
  <details ref={ref} open={defaultOpen || undefined} className={`admin-edit-section ${className}`}>
    <summary><span>{title}</span><ChevronDown size={17}/></summary>
    <div className="admin-edit-section-body">{children}</div>
  </details>
));
AdminEditorSection.displayName = 'AdminEditorSection';

export function AdminBilingualField({ label, value, onChange, textarea, placeholder }: {
  label: string; value: { ro: string; ru: string };
  onChange: (value: { ro: string; ru: string }) => void;
  textarea?: boolean; placeholder?: { ro: string; ru: string };
}) {
  const lang = useContentLanguage();
  const id = useId();
  const props = { id, value: value[lang], placeholder: placeholder?.[lang],
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange({ ...value, [lang]: event.target.value }),
    className: 'admin-editor-input', lang };
  return <div className="admin-edit-field">
    <label htmlFor={id}>{label}<span>{lang.toUpperCase()}</span></label>
    {textarea ? <textarea {...props} rows={3}/> : <input {...props}/>}
  </div>;
}
