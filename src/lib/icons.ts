import * as LucideIcons from 'lucide-react';
import { type LucideIcon } from 'lucide-react';
import { CATEGORY_ICONS } from '@/lib/constants';

export function getCategoryIcon(category: string): LucideIcon {
  const name = CATEGORY_ICONS[category] || 'Wrench';
  return (LucideIcons as unknown as Record<string, LucideIcon>)[name] || LucideIcons.Wrench;
}
