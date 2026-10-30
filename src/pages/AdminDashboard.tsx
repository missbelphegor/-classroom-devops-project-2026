import { useEffect, useState } from 'react';
import {
  ShieldCheck, UserCheck, Loader2, CheckCircle2, ClipboardList, Trash2,
  Edit3, X, Save, ChevronRight, FilePlus2, AlertTriangle, Search,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { type Issue, type IssueUpdate } from '@/types';
import { PageHeader, LoadingSpinner, EmptyState, StatCard } from '@/components/ui';
import { StatusBadge, PriorityBadge } from '@/components/Badges';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';
import {
  STATUSES, PRIORITIES, STATUS_FLOW, formatDateShort,
} from '@/lib/constants';
import { getCategoryIcon } from '@/lib/icons';

interface AdminDashboardProps {
  onViewIssue: (id: string) => void;
}

export function AdminDashboard({ onViewIssue }: AdminDashboardProps) {
  const { showToast } = useToast();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editIssue, setEditIssue] = useState<Issue | null>(null);
  const [deleteIssue, setDeleteIssue] = useState<Issue | null>(null);
  const [updating, setUpdating] = useState(false);

  // Edit form state
  const [editStatus, setEditStatus] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editAssignedTo, setEditAssignedTo] = useState('');
  const [editRemark, setEditRemark] = useState('');

  useEffect(() => {
    loadIssues();
  }, []);

  async function loadIssues() {
    setLoading(true);
    const { data } = await supabase.from('issues').select('*').order('reported_at', { ascending: false });
    if (data) setIssues(data as Issue[]);
    setLoading(false);
  }

  const filtered = issues.filter((issue) => {
    if (search) {
      const q = search.toLowerCase();
      if (!issue.issue_code.toLowerCase().includes(q) &&
          !issue.classroom_number.toLowerCase().includes(q) &&
          !issue.reporter_name.toLowerCase().includes(q)) return false;
    }
    if (statusFilter && issue.status !== statusFilter) return false;
    return true;
  });

  const stats = {
    total: issues.length,
    reported: issues.filter((i) => i.status === 'Reported').length,
    assigned: issues.filter((i) => i.status === 'Assigned').length,
    inProgress: issues.filter((i) => i.status === 'In Progress').length,
    resolved: issues.filter((i) => i.status === 'Resolved').length,
  };

  const openEditModal = (issue: Issue) => {
    setEditIssue(issue);
    setEditStatus(issue.status);
    setEditPriority(issue.priority);
    setEditAssignedTo(issue.assigned_to || '');
    setEditRemark('');
  };

  const handleSaveEdit = async () => {
    if (!editIssue) return;
    setUpdating(true);

    try {
      const updates: Partial<Issue> = {
        status: editStatus,
        priority: editPriority,
        assigned_to: editAssignedTo.trim() || null,
      };

      const { error: updateError } = await supabase
        .from('issues')
        .update(updates)
        .eq('id', editIssue.id);

      if (updateError) throw updateError;

      // Log the update if status changed or remark added
      if (editStatus !== editIssue.status || editRemark.trim()) {
        const updateEntry: Partial<IssueUpdate> = {
          issue_id: editIssue.id,
          previous_status: editIssue.status,
          new_status: editStatus !== editIssue.status ? editStatus : editIssue.status,
          remark: editRemark.trim() || null,
          updated_by: 'Admin',
        };
        await supabase.from('issue_updates').insert(updateEntry);
      }

      showToast('success', `Issue ${editIssue.issue_code} updated successfully`);
      setEditIssue(null);
      await loadIssues();
    } catch (err) {
      showToast('error', 'Failed to update issue. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteIssue) return;
    setUpdating(true);
    try {
      const { error } = await supabase.from('issues').delete().eq('id', deleteIssue.id);
      if (error) throw error;
      showToast('success', `Issue ${deleteIssue.issue_code} has been deleted`);
      setDeleteIssue(null);
      await loadIssues();
    } catch (err) {
      showToast('error', 'Failed to delete issue. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const advanceStatus = async (issue: Issue) => {
    const currentIdx = STATUS_FLOW.indexOf(issue.status as typeof STATUS_FLOW[number]);
    if (currentIdx < 0 || currentIdx >= STATUS_FLOW.length - 1) return;
    const nextStatus = STATUS_FLOW[currentIdx + 1];

    try {
      const { error } = await supabase
        .from('issues')
        .update({ status: nextStatus })
        .eq('id', issue.id);
      if (error) throw error;

      await supabase.from('issue_updates').insert({
        issue_id: issue.id,
        previous_status: issue.status,
        new_status: nextStatus,
        remark: `Status advanced from ${issue.status} to ${nextStatus}`,
        updated_by: 'Admin',
      });

      showToast('success', `Issue ${issue.issue_code} moved to ${nextStatus}`);
      await loadIssues();
    } catch (err) {
      showToast('error', 'Failed to update status');
    }
  };

  if (loading) return <LoadingSpinner message="Loading admin dashboard..." />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Manage all reported classroom issues, assign staff, and track resolutions"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total" value={stats.total} icon={ClipboardList} color="slate" />
        <StatCard label="Reported" value={stats.reported} icon={FilePlus2} color="blue" />
        <StatCard label="Assigned" value={stats.assigned} icon={UserCheck} color="amber" />
        <StatCard label="In Progress" value={stats.inProgress} icon={Loader2} color="violet" />
        <StatCard label="Resolved" value={stats.resolved} icon={CheckCircle2} color="emerald" />
      </div>

      {/* Search and filter */}
      <div className="mt-6 mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Issue ID, classroom, or reporter..."
            className="input-field pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field sm:w-48"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Issue management table */}
      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={ClipboardList}
            title="No issues to manage"
            message="There are no issues matching your current filters."
          />
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden lg:block card">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-600">Issue ID</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Classroom</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Category</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Priority</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Assigned To</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Date</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((issue) => {
                  const Icon = getCategoryIcon(issue.category);
                  const canAdvance = STATUS_FLOW.includes(issue.status as typeof STATUS_FLOW[number]) &&
                    STATUS_FLOW.indexOf(issue.status as typeof STATUS_FLOW[number]) < STATUS_FLOW.length - 1;
                  return (
                    <tr key={issue.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <button onClick={() => onViewIssue(issue.id)} className="font-mono text-xs font-semibold text-brand-600 hover:underline">
                          {issue.issue_code}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{issue.classroom_number}</p>
                        <p className="text-xs text-slate-500">{issue.building}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-700">{issue.category}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><PriorityBadge priority={issue.priority} size="xs" /></td>
                      <td className="px-4 py-3"><StatusBadge status={issue.status} size="xs" /></td>
                      <td className="px-4 py-3">
                        {issue.assigned_to ? (
                          <span className="text-slate-700">{issue.assigned_to}</span>
                        ) : (
                          <span className="text-xs text-slate-400">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{formatDateShort(issue.reported_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {canAdvance && (
                            <button
                              onClick={() => advanceStatus(issue)}
                              className="rounded-md p-1.5 text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title="Advance status"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => openEditModal(issue)}
                            className="rounded-md p-1.5 text-brand-600 hover:bg-brand-50 transition-colors"
                            title="Edit issue"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteIssue(issue)}
                            className="rounded-md p-1.5 text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete issue"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
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
              const canAdvance = STATUS_FLOW.includes(issue.status as typeof STATUS_FLOW[number]) &&
                STATUS_FLOW.indexOf(issue.status as typeof STATUS_FLOW[number]) < STATUS_FLOW.length - 1;
              return (
                <div key={issue.id} className="card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-slate-400" />
                      <div>
                        <button onClick={() => onViewIssue(issue.id)} className="font-mono text-xs font-semibold text-brand-600">
                          {issue.issue_code}
                        </button>
                        <p className="text-sm font-medium text-slate-800">{issue.classroom_number} &middot; {issue.building}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <PriorityBadge priority={issue.priority} size="xs" />
                    <StatusBadge status={issue.status} size="xs" />
                  </div>
                  {issue.assigned_to && (
                    <p className="mt-2 text-xs text-slate-500">Assigned to: {issue.assigned_to}</p>
                  )}
                  <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3">
                    {canAdvance && (
                      <button onClick={() => advanceStatus(issue)} className="btn-secondary text-xs px-3 py-1.5">
                        <ChevronRight className="h-3.5 w-3.5" />
                        Advance
                      </button>
                    )}
                    <button onClick={() => openEditModal(issue)} className="btn-secondary text-xs px-3 py-1.5">
                      <Edit3 className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button onClick={() => setDeleteIssue(issue)} className="btn-secondary text-xs px-3 py-1.5 text-red-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Edit Modal */}
      <Modal
        open={!!editIssue}
        onClose={() => setEditIssue(null)}
        title={editIssue ? `Edit Issue ${editIssue.issue_code}` : ''}
        size="lg"
      >
        {editIssue && (
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 px-4 py-3">
              <p className="text-sm text-slate-600">
                <span className="font-medium">{editIssue.category}</span> in {editIssue.classroom_number}, {editIssue.building}
              </p>
              <p className="mt-1 line-clamp-2 text-xs text-slate-500">{editIssue.description}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label-text">Status</label>
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="input-field">
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label-text">Priority</label>
                <select value={editPriority} onChange={(e) => setEditPriority(e.target.value)} className="input-field">
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="label-text">Assign To</label>
              <input
                type="text"
                value={editAssignedTo}
                onChange={(e) => setEditAssignedTo(e.target.value)}
                className="input-field"
                placeholder="Maintenance staff name"
              />
            </div>

            <div>
              <label className="label-text">Maintenance Remarks</label>
              <textarea
                value={editRemark}
                onChange={(e) => setEditRemark(e.target.value)}
                rows={3}
                className="input-field resize-none"
                placeholder="Add a remark about this update..."
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
              <button onClick={() => setEditIssue(null)} className="btn-secondary">
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button onClick={handleSaveEdit} disabled={updating} className="btn-primary">
                <Save className="h-4 w-4" />
                Save Changes
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={!!deleteIssue}
        onClose={() => setDeleteIssue(null)}
        title="Delete Issue"
        size="sm"
      >
        {deleteIssue && (
          <div>
            <div className="flex items-start gap-3 rounded-lg bg-red-50 px-4 py-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-800">Are you sure?</p>
                <p className="mt-1 text-sm text-red-600">
                  You are about to delete issue <span className="font-mono font-semibold">{deleteIssue.issue_code}</span>.
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => setDeleteIssue(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleDelete} disabled={updating} className="btn-danger">
                <Trash2 className="h-4 w-4" />
                Delete Permanently
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
