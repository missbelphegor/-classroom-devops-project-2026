import { useEffect, useState } from 'react';
import { ClipboardList, FilePlus2, UserCheck, Loader2, CheckCircle2, ArrowRight, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { type Issue, type Page } from '@/types';
import { StatCard, PageHeader, LoadingSpinner, EmptyState } from '@/components/ui';
import { StatusBadge, PriorityBadge } from '@/components/Badges';
import { formatDateShort, timeAgo, CATEGORY_ICONS } from '@/lib/constants';
import { getCategoryIcon } from '@/lib/icons';

interface DashboardProps {
  onNavigate: (page: Page) => void;
  onViewIssue: (id: string) => void;
}

export function Dashboard({ onNavigate, onViewIssue }: DashboardProps) {
  const [stats, setStats] = useState({ total: 0, reported: 0, assigned: 0, inProgress: 0, resolved: 0 });
  const [recentIssues, setRecentIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('issues')
        .select('*')
        .order('reported_at', { ascending: false });

      if (data) {
        const all = data as Issue[];
        setStats({
          total: all.length,
          reported: all.filter((i) => i.status === 'Reported').length,
          assigned: all.filter((i) => i.status === 'Assigned').length,
          inProgress: all.filter((i) => i.status === 'In Progress').length,
          resolved: all.filter((i) => i.status === 'Resolved').length,
        });
        setRecentIssues(all.slice(0, 6));
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of all classroom issues and their current status"
        action={
          <button onClick={() => onNavigate('report')} className="btn-primary">
            <Plus className="h-4 w-4" />
            Report New Issue
          </button>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total Issues" value={stats.total} icon={ClipboardList} color="slate" />
        <StatCard label="Reported" value={stats.reported} icon={FilePlus2} color="blue" />
        <StatCard label="Assigned" value={stats.assigned} icon={UserCheck} color="amber" />
        <StatCard label="In Progress" value={stats.inProgress} icon={Loader2} color="violet" />
        <StatCard label="Resolved" value={stats.resolved} icon={CheckCircle2} color="emerald" />
      </div>

      {/* Recent issues */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Recently Reported Issues</h2>
          <button
            onClick={() => onNavigate('issues')}
            className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {recentIssues.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={ClipboardList}
              title="No issues reported yet"
              message="Be the first to report a classroom issue. Click 'Report New Issue' to get started."
            />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentIssues.map((issue) => {
              const Icon = getCategoryIcon(issue.category);
              return (
                <button
                  key={issue.id}
                  onClick={() => onViewIssue(issue.id)}
                  className="card p-5 text-left transition-all hover:shadow-md hover:border-brand-300 animate-slide-up"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                        <Icon className="h-5 w-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="font-mono text-xs font-semibold text-brand-600">{issue.issue_code}</p>
                        <p className="text-sm font-medium text-slate-800">{issue.category}</p>
                      </div>
                    </div>
                    <PriorityBadge priority={issue.priority} size="xs" />
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-slate-600">{issue.description}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={issue.status} size="xs" />
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-slate-600">{issue.classroom_number}</p>
                      <p className="text-xs text-slate-400">{timeAgo(issue.reported_at)}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick stats summary */}
      <div className="mt-8 card p-6">
        <h3 className="text-sm font-semibold text-slate-700">Summary by Category</h3>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Object.entries(
            recentIssues.reduce<Record<string, number>>((acc, i) => {
              acc[i.category] = (acc[i.category] || 0) + 1;
              return acc;
            }, {})
          ).map(([cat, count]) => {
            const Icon = getCategoryIcon(cat);
            return (
              <div key={cat} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                <Icon className="h-4 w-4 text-slate-500" />
                <span className="text-xs font-medium text-slate-600">{cat}</span>
                <span className="ml-auto text-xs font-bold text-slate-800">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
