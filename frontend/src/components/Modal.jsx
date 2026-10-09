import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/** Accessible dialog. variant "drawer" slides in from the right on desktop; both are bottom sheets on phones. */
export default function Modal({ open, onClose, title, children, variant = 'center', size = 'lg' }) {
  const panel = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  const drawer = variant === 'drawer';
  const width = { sm: 'sm:max-w-sm', md: 'sm:max-w-md', lg: 'sm:max-w-lg' }[size];

  return (
    <div className={`fixed inset-0 z-50 flex ${drawer ? 'items-end md:items-stretch md:justify-end' : 'items-end sm:items-center sm:justify-center'}`}>
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-2xl outline-none dark:bg-slate-900 ${
          drawer ? 'md:h-full md:max-h-full md:max-w-md md:rounded-none md:rounded-l-2xl' : `${width} sm:rounded-2xl`
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
