import { statusBadgeClass, statusDotClass, priorityBadgeClass } from '@/lib/constants';

export function StatusBadge({ status, size = 'sm' }: { status: string; size?: 'sm' | 'xs' }) {
  const sizeClass = size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${statusBadgeClass(status)} ${sizeClass}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${statusDotClass(status)}`} />
      {status}
    </span>
  );
}

export function PriorityBadge({ priority, size = 'sm' }: { priority: string; size?: 'sm' | 'xs' }) {
  const sizeClass = size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';
  return (
    <span className={`inline-flex items-center rounded-full border font-semibold ${priorityBadgeClass(priority)} ${sizeClass}`}>
      {priority}
    </span>
  );
}
