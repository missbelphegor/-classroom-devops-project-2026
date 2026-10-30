import { useState, type FormEvent } from 'react';
import { Search, ArrowRight, MapPin, Calendar, User, Building2, Tag, AlertCircle, History, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { type Issue, type IssueUpdate, type Page } from '@/types';
import { LoadingSpinner, EmptyState } from '@/components/ui';
import { StatusBadge, PriorityBadge } from '@/components/Badges';
import { formatDate } from '@/lib/constants';
import { getCategoryIcon } from '@/lib/icons';

interface TrackIssueProps {
  onViewIssue: (id: string) => void;
}

export function TrackIssue({ onViewIssue }: TrackIssueProps) {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [issue, setIssue] = useState<Issue | null>(null);
  const [updates, setUpdates] = useState<IssueUpdate[]>([]);
  const [error, setError] = useState('');

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setError('Please enter an Issue ID');
      return;
    }

    setSearching(true);
    setError('');
    setSearched(false);
    setIssue(null);
    setUpdates([]);

    const code = query.trim().toUpperCase();
    const { data, error: queryError } = await supabase
      .from('issues')
      .select('*')
      .eq('issue_code', code)
      .maybeSingle();

    if (queryError) {
      setError('Failed to search for issue. Please try again.');
      setSearching(false);
      return;
    }

    if (!data) {
      setError(`No issue found with ID "${code}". Please check and try again.`);
      setSearching(false);
      setSearched(true);
      return;
    }

    const { data: updateData } = await supabase
      .from('issue_updates')
      .select('*')
      .eq('issue_id', data.id)
      .order('created_at', { ascending: true });

    setIssue(data as Issue);
    if (updateData) setUpdates(updateData as IssueUpdate[]);
    setSearching(false);
    setSearched(true);
  };

  const CategoryIcon = issue ? getCategoryIcon(issue.category) : getCategoryIcon('Other');

  return (
    <div className="animate-fade-in mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Track an Issue</h1>
        <p className="mt-1 text-sm text-slate-500">Enter your Issue ID to check the current status and history</p>
      </div>

      {/* Search box */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="card p-6">
          <label className="label-text">Issue ID</label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setError('');
                }}
                placeholder="e.g. CR-1001"
                className="input-field pl-10 font-mono"
              />
            </div>
            <button type="submit" className="btn-primary" disabled={searching}>
              <Search className="h-4 w-4" />
              Track
            </button>
          </div>
          {error && <p className="error-text mt-2">{error}</p>}
          <p className="mt-2 text-xs text-slate-400">Try one of the sample IDs: CR-1001, CR-1002, CR-1003</p>
        </div>
      </form>

      {searching && <LoadingSpinner message="Searching..." />}

      {/* No results */}
      {searched && !issue && !searching && !error && (
        <div className="card">
          <EmptyState
            icon={ClipboardList}
            title="Issue not found"
            message="No issue matches the ID you entered. Please verify the Issue ID and try again."
          />
        </div>
      )}

      {/* Results */}
      {issue && (
        <div className="space-y-4 animate-slide-up">
          {/* Status banner */}
          <div className="card overflow-hidden">
            <div className="flex flex-col gap-4 border-b border-gray-100 bg-slate-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100">
                  <CategoryIcon className="h-6 w-6 text-brand-600" />
                </div>
                <div>
                  <p className="font-mono text-lg font-bold text-brand-600">{issue.issue_code}</p>
                  <p className="text-sm text-slate-600">{issue.category} &middot; {issue.classroom_number}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={issue.status} />
                <PriorityBadge priority={issue.priority} />
              </div>
            </div>

            {/* Quick info */}
            <div className="grid gap-px bg-gray-100 sm:grid-cols-2">
              <InfoRow icon={Building2} label="Building" value={issue.building} />
              <InfoRow icon={MapPin} label="Classroom" value={issue.classroom_number} />
              <InfoRow icon={User} label="Reporter" value={issue.reporter_name} />
              <InfoRow icon={Calendar} label="Reported" value={formatDate(issue.reported_at)} />
            </div>

            {/* Description */}
            <div className="border-t border-gray-100 px-6 py-4">
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Description</h3>
              <p className="text-sm leading-relaxed text-slate-600">{issue.description}</p>
            </div>

            {/* Assigned */}
            {issue.assigned_to && (
              <div className="border-t border-gray-100 px-6 py-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-500">Assigned to:</span>
                  <span className="font-medium text-slate-700">{issue.assigned_to}</span>
                </div>
              </div>
            )}

            <div className="border-t border-gray-100 px-6 py-3">
              <button
                onClick={() => onViewIssue(issue.id)}
                className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                View full details
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Status timeline */}
          <div className="card p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <History className="h-4 w-4 text-slate-400" />
              Status Timeline
            </h3>
            {updates.length === 0 ? (
              <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3">
                <MessageSquare className="h-5 w-5 text-slate-300" />
                <p className="text-sm text-slate-500">No updates yet. This issue is awaiting action.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {updates.map((update, idx) => (
                  <div key={update.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        update.new_status === 'Resolved' ? 'bg-emerald-100' :
                        update.new_status === 'Rejected' ? 'bg-red-100' :
                        'bg-brand-100'
                      }`}>
                        <div className={`h-2.5 w-2.5 rounded-full ${
                          update.new_status === 'Resolved' ? 'bg-emerald-500' :
                          update.new_status === 'Rejected' ? 'bg-red-500' :
                          'bg-brand-500'
                        }`} />
                      </div>
                      {idx < updates.length - 1 && <div className="h-full w-px bg-gray-200" />}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2">
                        {update.previous_status && (
                          <>
                            <StatusBadge status={update.previous_status} size="xs" />
                            <span className="text-xs text-slate-400">&rarr;</span>
                          </>
                        )}
                        {update.new_status && <StatusBadge status={update.new_status} size="xs" />}
                      </div>
                      {update.remark && (
                        <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{update.remark}</p>
                      )}
                      <p className="mt-1.5 text-xs text-slate-400">
                        {formatDate(update.created_at)}
                        {update.updated_by && ` \u00b7 by ${update.updated_by}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="bg-white px-6 py-3.5">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-0.5 text-sm font-medium text-slate-700">{value}</p>
    </div>
  );
}
