import { useState, type FormEvent } from 'react';
import { ArrowLeft, Send, Upload, X, ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { type IssueInput, type Page } from '@/types';
import { useToast } from '@/components/Toast';
import { PageHeader, LoadingSpinner } from '@/components/ui';
import {
  ISSUE_CATEGORIES,
  PRIORITIES,
  REPORTER_ROLES,
  BUILDINGS,
} from '@/lib/constants';

interface ReportIssueProps {
  onNavigate: (page: Page) => void;
}

interface FormErrors {
  reporter_name?: string;
  reporter_email?: string;
  classroom_number?: string;
  building?: string;
  category?: string;
  priority?: string;
  description?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ReportIssue({ onNavigate }: ReportIssueProps) {
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [form, setForm] = useState<IssueInput>({
    reporter_name: '',
    reporter_email: '',
    reporter_role: 'Student',
    classroom_number: '',
    building: '',
    category: '',
    priority: '',
    description: '',
    image_url: null,
  });

  const update = (field: keyof IssueInput, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'Image must be less than 5MB');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.reporter_name.trim()) e.reporter_name = 'Name is required';
    if (!form.reporter_email.trim()) e.reporter_email = 'Email is required';
    else if (!EMAIL_REGEX.test(form.reporter_email)) e.reporter_email = 'Please enter a valid email address';
    if (!form.classroom_number.trim()) e.classroom_number = 'Classroom number is required';
    if (!form.building) e.building = 'Please select a building';
    if (!form.category) e.category = 'Please select an issue category';
    if (!form.priority) e.priority = 'Please select a priority level';
    if (!form.description.trim()) e.description = 'Description is required';
    else if (form.description.trim().length < 20) e.description = 'Description must be at least 20 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      showToast('error', 'Please fix the errors in the form');
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl: string | null = null;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `issue-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('issue-images')
          .upload(fileName, imageFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('issue-images').getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      }

      const { data, error: insertError } = await supabase
        .from('issues')
        .insert({
          reporter_name: form.reporter_name.trim(),
          reporter_email: form.reporter_email.trim(),
          reporter_role: form.reporter_role,
          classroom_number: form.classroom_number.trim(),
          building: form.building,
          category: form.category,
          priority: form.priority,
          description: form.description.trim(),
          image_url: imageUrl,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      showToast('success', `Issue ${data.issue_code} reported successfully!`);
      onNavigate('dashboard');
    } catch (err) {
      showToast('error', 'Failed to submit issue. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitting) return <LoadingSpinner message="Submitting your issue report..." />;

  return (
    <div className="animate-fade-in">
      <button
        onClick={() => onNavigate('dashboard')}
        className="mb-4 flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </button>

      <PageHeader title="Report an Issue" subtitle="Fill out the form below to report a classroom problem" />

      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
        <div className="card p-6 sm:p-8">
          {/* Reporter info */}
          <div className="mb-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">1</span>
              Reporter Information
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label-text">Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.reporter_name}
                  onChange={(e) => update('reporter_name', e.target.value)}
                  className="input-field"
                  placeholder="Enter your full name"
                />
                {errors.reporter_name && <p className="error-text">{errors.reporter_name}</p>}
              </div>
              <div>
                <label className="label-text">Email <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  value={form.reporter_email}
                  onChange={(e) => update('reporter_email', e.target.value)}
                  className="input-field"
                  placeholder="your.email@college.edu"
                />
                {errors.reporter_email && <p className="error-text">{errors.reporter_email}</p>}
              </div>
              <div>
                <label className="label-text">Role</label>
                <select
                  value={form.reporter_role}
                  onChange={(e) => update('reporter_role', e.target.value)}
                  className="input-field"
                >
                  {REPORTER_ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Location info */}
          <div className="mb-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">2</span>
              Location Details
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label-text">Classroom Number <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.classroom_number}
                  onChange={(e) => update('classroom_number', e.target.value)}
                  className="input-field"
                  placeholder="e.g. A-201"
                />
                {errors.classroom_number && <p className="error-text">{errors.classroom_number}</p>}
              </div>
              <div>
                <label className="label-text">Building / Block <span className="text-red-500">*</span></label>
                <select
                  value={form.building}
                  onChange={(e) => update('building', e.target.value)}
                  className="input-field"
                >
                  <option value="">Select building</option>
                  {BUILDINGS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                {errors.building && <p className="error-text">{errors.building}</p>}
              </div>
            </div>
          </div>

          {/* Issue details */}
          <div className="mb-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">3</span>
              Issue Details
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label-text">Category <span className="text-red-500">*</span></label>
                <select
                  value={form.category}
                  onChange={(e) => update('category', e.target.value)}
                  className="input-field"
                >
                  <option value="">Select category</option>
                  {ISSUE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {errors.category && <p className="error-text">{errors.category}</p>}
              </div>
              <div>
                <label className="label-text">Priority <span className="text-red-500">*</span></label>
                <select
                  value={form.priority}
                  onChange={(e) => update('priority', e.target.value)}
                  className="input-field"
                >
                  <option value="">Select priority</option>
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                {errors.priority && <p className="error-text">{errors.priority}</p>}
              </div>
            </div>
            <div className="mt-4">
              <label className="label-text">
                Description <span className="text-red-500">*</span>
                <span className="ml-1 text-xs font-normal text-slate-400">(min 20 characters)</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                rows={4}
                className="input-field resize-none"
                placeholder="Describe the issue in detail. What is the problem? When did it start? Any other relevant information?"
              />
              <div className="mt-1 flex items-center justify-between">
                {errors.description ? (
                  <p className="error-text">{errors.description}</p>
                ) : (
                  <span />
                )}
                <span className={`text-xs ${form.description.length < 20 ? 'text-slate-400' : 'text-emerald-600'}`}>
                  {form.description.length} chars
                </span>
              </div>
            </div>
          </div>

          {/* Image upload */}
          <div className="mb-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">4</span>
              Attach Image <span className="font-normal normal-case text-slate-400">(optional)</span>
            </h3>
            {imagePreview ? (
              <div className="relative inline-block">
                <img src={imagePreview} alt="Preview" className="max-h-48 rounded-lg border border-gray-200" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white shadow-md hover:bg-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-8 transition-colors hover:border-brand-400 hover:bg-brand-50">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                    {imageFile ? <ImageIcon className="h-6 w-6 text-slate-600" /> : <Upload className="h-6 w-6 text-slate-400" />}
                  </div>
                  <p className="text-sm font-medium text-slate-600">Click to upload an image</p>
                  <p className="text-xs text-slate-400">PNG, JPG up to 5MB</p>
                </div>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            )}
          </div>

          {/* Submit */}
          <div className="flex flex-col gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => onNavigate('dashboard')} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              <Send className="h-4 w-4" />
              Submit Report
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
