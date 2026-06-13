import type { ModuleType } from '@/types';
import { MODULE_LABELS, MODULE_COLORS } from '@/utils/constants';
import { Tag } from '@/components/ui/Tag';

interface ModuleTagProps {
  module: ModuleType;
  className?: string;
}

export function ModuleTag({ module, className }: ModuleTagProps) {
  return (
    <Tag colorClass={MODULE_COLORS[module]} className={className}>
      {MODULE_LABELS[module]}
    </Tag>
  );
}
