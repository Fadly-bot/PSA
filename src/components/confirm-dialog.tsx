'use client';

/**
 * Lightweight confirmation dialog for destructive actions (delete).
 * Uses the TBM Semesta Alam design tokens (.btn, .card, CSS variables) —
 * never the browser alert()/confirm().
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Hapus',
  cancelLabel = 'Batal',
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={busy ? undefined : onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(15, 23, 42, 0.5)',
        padding: 16,
      }}
    >
      <div
        className="card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 420,
          padding: 24,
          borderRadius: 14,
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <h2 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 700 }}>{title}</h2>
        <p style={{ margin: '0 0 20px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.55 }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="btn secondary" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button type="button" className="btn danger" onClick={onConfirm} disabled={busy}>
            {busy ? 'Menghapus...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
