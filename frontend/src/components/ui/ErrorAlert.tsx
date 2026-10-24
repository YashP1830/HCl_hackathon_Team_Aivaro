import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

interface Props {
  message: string;
  onRetry?: () => void;
  dismissible?: boolean;
}

export default function ErrorAlert({ message, onRetry, dismissible = true }: Props) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-red-800">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-sm font-medium text-red-700 underline hover:text-red-900"
          >
            Try again
          </button>
        )}
      </div>
      {dismissible && (
        <button onClick={() => setVisible(false)} className="text-red-400 hover:text-red-600">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
