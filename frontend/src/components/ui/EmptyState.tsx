import { SearchX } from 'lucide-react';

interface Props {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
}

export default function EmptyState({
  title = 'No results found',
  message = 'Try adjusting your search or filters.',
  icon,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon ?? <SearchX className="w-12 h-12 text-gray-300 mb-4" />}
      <h3 className="text-lg font-semibold text-gray-700 mb-1">{title}</h3>
      <p className="text-sm text-gray-400 max-w-md">{message}</p>
    </div>
  );
}
