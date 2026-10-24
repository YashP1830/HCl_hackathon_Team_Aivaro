import type { LibraryStatus, AvailabilityStatus, EmbeddingStatus } from '../../types';
import { CheckCircle2, XCircle, BookX, Clock, AlertCircle } from 'lucide-react';

/* ── Library status (recommendations) ── */
const libraryConfig: Record<LibraryStatus, { label: string; className: string; icon: React.ReactNode }> = {
  in_library_available: {
    label: 'Available in Library',
    className: 'badge-available',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  in_library_out_of_stock: {
    label: 'Out of Stock',
    className: 'badge-out-of-stock',
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
  not_in_library: {
    label: 'Not in Library',
    className: 'badge-not-in-library',
    icon: <BookX className="w-3.5 h-3.5" />,
  },
};

export function LibraryStatusBadge({ status }: { status: LibraryStatus }) {
  const cfg = libraryConfig[status];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border ${cfg.className}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

/* ── Availability status (catalog) ── */
export function AvailabilityBadge({ status }: { status: AvailabilityStatus }) {
  if (status === 'available') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full badge-available">
        <CheckCircle2 className="w-3 h-3" /> In Stock
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full badge-out-of-stock">
      <XCircle className="w-3 h-3" /> Out of Stock
    </span>
  );
}

/* ── Embedding status (admin) ── */
const embeddingConfig: Record<EmbeddingStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Indexing Pending', color: 'bg-blue-100 text-blue-700', icon: <Clock className="w-3 h-3" /> },
  ready: { label: 'Indexed', color: 'bg-green-100 text-green-700', icon: <CheckCircle2 className="w-3 h-3" /> },
  failed: { label: 'Indexing Failed', color: 'bg-red-100 text-red-700', icon: <AlertCircle className="w-3 h-3" /> },
};

export function EmbeddingStatusBadge({ status }: { status: EmbeddingStatus }) {
  const cfg = embeddingConfig[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${cfg.color}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}
