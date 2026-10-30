export const ISSUE_CATEGORIES = [
  'Fan',
  'Light',
  'AC',
  'Projector',
  'Wi-Fi/Network',
  'Electrical',
  'Furniture',
  'Door/Window',
  'Cleaning',
  'Speaker/Microphone',
  'Other',
] as const;

export const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'] as const;

export const STATUSES = ['Reported', 'Assigned', 'In Progress', 'Resolved', 'Rejected'] as const;

export const REPORTER_ROLES = ['Student', 'Faculty', 'Staff'] as const;

export const BUILDINGS = ['Block A', 'Block B', 'Block C', 'Block D', 'Main Building', 'Library Block', 'Lab Block'] as const;

export const STATUS_FLOW = ['Reported', 'Assigned', 'In Progress', 'Resolved'] as const;

export const CATEGORY_ICONS: Record<string, string> = {
  Fan: 'Wind',
  Light: 'Lightbulb',
  AC: 'Snowflake',
  Projector: 'Projector',
  'Wi-Fi/Network': 'Wifi',
  Electrical: 'Zap',
  Furniture: 'Armchair',
  'Door/Window': 'DoorOpen',
  Cleaning: 'Sparkles',
  'Speaker/Microphone': 'Volume2',
  Other: 'Wrench',
};

export function statusBadgeClass(status: string): string {
  switch (status) {
    case 'Reported':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'Assigned':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'In Progress':
      return 'bg-violet-100 text-violet-700 border-violet-200';
    case 'Resolved':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'Rejected':
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

export function statusDotClass(status: string): string {
  switch (status) {
    case 'Reported':
      return 'bg-blue-500';
    case 'Assigned':
      return 'bg-amber-500';
    case 'In Progress':
      return 'bg-violet-500';
    case 'Resolved':
      return 'bg-emerald-500';
    case 'Rejected':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
}

export function priorityBadgeClass(priority: string): string {
  switch (priority) {
    case 'Low':
      return 'bg-slate-100 text-slate-600 border-slate-200';
    case 'Medium':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'High':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'Critical':
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}
