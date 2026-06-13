import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  colorClass?: string;
}

export function Tag({ children, colorClass = 'bg-gray-100 text-gray-700', className, ...props }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md',
        colorClass,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
