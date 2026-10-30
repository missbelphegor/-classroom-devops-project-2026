import { useEffect, useState } from 'react';
import { ArrowLeft, MapPin, Calendar, User, Mail, Tag, AlertCircle, MessageSquare, History, ImageIcon, Building2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { type Issue, type IssueUpdate, type Page } from '@/types';
import { LoadingSpinner, EmptyState } from '@/components/ui';
import { StatusBadge, PriorityBadge } from '@/components/Badges';
import { formatDate } from '@/lib/constants';
import { getCategoryIcon } from '@/lib/icons';

interface IssueDetailsProps {
  issueId: string;
  onNavigate: (page: Page) => void;
}

export function IssueDetails({ issueId, onNavigate }: IssueDetailsProps) {
  const [issue, setIssue] = useState<Issue | null>(null);
  const [updates, setUpdates] = useState<IssueUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: issueData }, { data: updateData }] = await Promise.all([
        supabase.from('issues').select('*').eq('id', issueId).maybeSingle(),
        supabase
          .from('issue_updates')
          .select('*')
          .eq('issue_id', issueId)
          .order('created_at', { ascending: true }),
      ]);
      if (issueData) setIssue(issueData as Issue);
      if (updateData) setUpdates(updateData as IssueUpdate[]);
      setLoading(false);
    }
    load();
  }, [issueId]);

  if (loading) return <LoadingSpinner message="Loading issue details..." />;

  if (!issue) {
    return (
      <div className="card">
        <EmptyState
          icon={ClipboardList}
          title="Issue not found"
          message="The issue you're looking for doesn't exist or has been removed."
        />
        <div className="pb-6 text-center">
          <button onClick={() => onNavigate('issues')} className="btn-primary">
            Back to Issues
          </button>
        </div>
      </div>
    );
  }

  const CategoryIcon = getCategoryIcon(issue.category);

  return (
    <div className="animate-fade-in">
      <button
        onClick={() => onNavigate('issues')}
        className="mb-4 flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Issues
      </button>

      {/* Header */}
      <div className="card mb-6 overflow-hidden">
        <div className="border-b border-gray-100 bg-slate-50 px-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100">
                <CategoryIcon className="h-6 w-6 text-brand-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-bold text-brand-600">{issue.issue_code}</span>
                  <span className="text-slate-300">|</span>
                  <span className="text-sm font-medium text-slate-700">{issue.category}</span>
                </div>
                <p className="text-xs text-slate-500">{issue.building} &middot; Room {issue.classroom_number}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={issue.status} />
              <PriorityBadge priority={issue.priority} />
            </div>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid gap-px bg-gray-100 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem icon={MapPin} label="Classroom" value={issue.classroom_number} />
          <DetailItem icon={Building2} label="Building" value={issue.building} />
          <DetailItem icon={Tag} label="Category" value={issue.category} />
          <DetailItem icon={AlertCircle} label="Priority" value={issue.priority} />
          <DetailItem icon={User} label="Reporter" value={issue.reporter_name} />
          <DetailItem icon={Mail} label="Email" value={issue.reporter_email} />
          <DetailItem icon={User} label="Role" value={issue.reporter_role} />
          <DetailItem icon={Calendar} label="Reported" value={formatDate(issue.reported_at)} />
          <DetailItem icon={Calendar} label="Last Updated" value={formatDate(issue.updated_at)} />
        </div>

        {/* Description */}
        <div className="border-t border-gray-100 px-6 py-5">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Description</h3>
          <p className="text-sm leading-relaxed text-slate-600">{issue.description}</p>
        </div>

        {/* Assigned to */}
        {issue.assigned_to && (
          <div className="border-t border-gray-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-500">Assigned to:</span>
              <span className="text-sm font-medium text-slate-700">{issue.assigned_to}</span>
            </div>
          </div>
        )}

        {/* Image */}
        {issue.image_url && (
          <div className="border-t border-gray-100 px-6 py-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <ImageIcon className="h-4 w-4 text-slate-400" />
              Attached Image
            </h3>
            <img
              src={issue.image_url}
              alt="Issue"
              className="max-h-80 rounded-lg border border-gray-200"
            />
          </div>
        )}
      </div>

      {/* Update history */}
      <div className="card p-6">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <History className="h-4 w-4 text-slate-400" />
          Update History
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
  );
}

function DetailItem({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="bg-white px-6 py-4">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1 text-sm font-medium text-slate-700">{value}</p>
    </div>
  );
}
