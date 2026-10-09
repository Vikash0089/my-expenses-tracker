import Modal from './Modal';

export default function ConfirmDialog({ open, title = 'Are you sure?', message, confirmLabel = 'Delete', loading, onConfirm, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="button" className="btn-danger" onClick={onConfirm} disabled={loading}>{loading ? 'Please wait…' : confirmLabel}</button>
      </div>
    </Modal>
  );
}
