/** Clear, consistent status badges for borrowing records. */
export const BORROW_STATUS_LABEL: Record<string, string> = {
  borrowed: 'Dipinjam',
  returned: 'Dikembalikan',
  overdue: 'Terlambat',
  cancelled: 'Dibatalkan',
};

export const BORROW_STATUS_TONE: Record<string, string> = {
  borrowed: 'info',
  returned: 'success',
  overdue: 'error',
  cancelled: 'neutral',
};

export default function StatusBadge({ status }: { status: string }) {
  const tone = BORROW_STATUS_TONE[status] ?? 'neutral';
  return (
    <span className={`badge ${tone}`}>
      {BORROW_STATUS_LABEL[status] ?? status}
    </span>
  );
}
