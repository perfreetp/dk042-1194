import type { Priority } from '@/types';
import { PRIORITY_LABELS, PRIORITY_COLORS } from '@/utils/constants';
import { Tag } from '@/components/ui/Tag';

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  return (
    <Tag colorClass={PRIORITY_COLORS[priority]} className={className}>
      {PRIORITY_LABELS[priority]}
    </Tag>
  );
}
