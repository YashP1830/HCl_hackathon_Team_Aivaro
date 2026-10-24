import { Loader2 } from 'lucide-react';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };

export default function LoadingSpinner({ size = 'md', className = '' }: Props) {
  return (
    <Loader2
      className={`animate-spin text-indigo-500 ${sizeMap[size]} ${className}`}
    />
  );
}
