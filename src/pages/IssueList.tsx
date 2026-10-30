import { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal, ClipboardList, ChevronRight, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { type Issue } from '@/types';
import { PageHeader, LoadingSpinner, EmptyState } from '@/components/ui';
import { StatusBadge, PriorityBadge } from '@/components/Badges';
import {
  ISSUE_CATEGORIES,
  PRIORITIES,
  STATUSES,
  BUILDINGS,
  formatDateShort,
  CATEGORY_ICONS,
} from '@/lib/constants';
import { getCategoryIcon } from '@/lib/icons';

interface IssueListProps {
  onViewIssue: (id: string) => void;
}

export function IssueList({ onViewIssue }: IssueListProps) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    priority: '',
    status: '',
    building: '',
    date: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('issues').select('*').order('reported_at', { ascending: false });
      if (data) setIssues(data as Issue[]);
      setLoading(false);
    }
    load();
  }, []);

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter(Boolean).length,
    [filters]
  );

  const filtered = useMemo(() => {
    return issues.filter((issue) => {
      if (search) {
        const q = search.toLowerCase();
        if (!issue.issue_code.toLowerCase().includes(q) && !issue.classroom_number.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (filters.category && issue.category !== filters.category) return false;
      if (filters.priority && issue.priority !== filters.priority) return false;
      if (filters.status && issue.status !== filters.status) return false;
      if (filters.building && issue.building !== filters.building) return false;
      if (filters.date) {
        const issueDate = new Date(issue.reported_at).toISOString().split('T')[0];
        if (issueDate !== filters.date) return false;
      }
      return true;
    });
  }, [issues, search, filters]);

  const clearFilters = () => {
    setFilters({ category: '', priority: '', status: '', building: '', date: '' });
    setSearch('');
  };

  if (loading) return <LoadingSpinner message="Loading issues..." />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="All Issues"
        subtitle={`${filtered.length} of ${issues.length} issues shown`}
      />

      {/* Search and filter bar */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Issue ID or classroom number..."
            className="input-field pl-10"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary relative ${showFilters || activeFilterCount > 0 ? 'border-brand-400 text-brand-700' : ''}`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
        {activeFilterCount > 0 && (
          <button onClick={clearFilters} className="btn-ghost">
            <X className="h-4 w-4" />
            Clear
          </button>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="mb-5 card p-4 animate-slide-down">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="label-text">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="input-field"
              >
                <option value="">All</option>
                {ISSUE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label-text">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="input-field"
              >
                <option value="">All</option>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="label-text">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="input-field"
              >
                <option value="">All</option>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label-text">Building</label>
              <select
                value={filters.building}
                onChange={(e) => setFilters({ ...filters, building: e.target.value })}
                className="input-field"
              >
                <option value="">All</option>
                {BUILDINGS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="label-text">Date</label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                className="input-field"
              />
            </div>
          </div>
        </div>
      )}

      {/* Table (desktop) / Cards (mobile) */}
      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={ClipboardList}
            title="No issues found"
            message={activeFilterCount > 0 || search ? "Try adjusting your search or filters." : "No issues have been reported yet."}
          />
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden lg:block card">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-slate-50">
                <tr>
                  <th className="px-5 py-3 font-semibold text-slate-600">Issue ID</th>
                  <th className="px-5 py-3 font-semibold text-slate-600">Classroom</th>
                  <th className="px-5 py-3 font-semibold text-slate-600">Category</th>
                  <th className="px-5 py-3 font-semibold text-slate-600">Description</th>
                  <th className="px-5 py-3 font-semibold text-slate-600">Priority</th>
                  <th className="px-5 py-3 font-semibold text-slate-600">Status</th>
                  <th className="px-5 py-3 font-semibold text-slate-600">Date</th>
                  <th className="px-5 py-3 font-semibold text-slate-600">Reporter</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((issue) => {
                  const Icon = getCategoryIcon(issue.category);
                  return (
                    <tr
                      key={issue.id}
                      onClick={() => onViewIssue(issue.id)}
                      className="cursor-pointer transition-colors hover:bg-slate-50"
                    >
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs font-semibold text-brand-600">{issue.issue_code}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-slate-800">{issue.classroom_number}</p>
                        <p className="text-xs text-slate-500">{issue.building}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-700">{issue.category}</span>
                        </div>
                      </td>
                      <td className="max-w-xs px-5 py-3.5">
                        <p className="truncate text-slate-600">{issue.description}</p>
                      </td>
                      <td className="px-5 py-3.5"><PriorityBadge priority={issue.priority} size="xs" /></td>
                      <td className="px-5 py-3.5"><StatusBadge status={issue.status} size="xs" /></td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">{formatDateShort(issue.reported_at)}</td>
                      <td className="px-5 py-3.5">
                        <p className="text-slate-700">{issue.reporter_name}</p>
                        <p className="text-xs text-slate-500">{issue.reporter_role}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 lg:hidden">
            {filtered.map((issue) => {
              const Icon = getCategoryIcon(issue.category);
              return (
                <button
                  key={issue.id}
                  onClick={() => onViewIssue(issue.id)}
                  className="w-full card p-4 text-left transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-slate-400" />
                      <div>
                        <span className="font-mono text-xs font-semibold text-brand-600">{issue.issue_code}</span>
                        <p className="text-sm font-medium text-slate-800">{issue.classroom_number} &middot; {issue.building}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">{issue.description}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-500">{issue.category}</span>
                    <PriorityBadge priority={issue.priority} size="xs" />
                    <StatusBadge status={issue.status} size="xs" />
                  </div>
                  <p className="mt-2 text-xs text-slate-400">{formatDateShort(issue.reported_at)} &middot; {issue.reporter_name}</p>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
