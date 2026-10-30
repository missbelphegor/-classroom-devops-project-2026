export interface Issue {
  id: string;
  issue_code: string;
  reporter_name: string;
  reporter_email: string;
  reporter_role: string;
  classroom_number: string;
  building: string;
  category: string;
  priority: string;
  description: string;
  status: string;
  assigned_to: string | null;
  image_url: string | null;
  reported_at: string;
  updated_at: string;
}

export interface IssueUpdate {
  id: string;
  issue_id: string;
  previous_status: string | null;
  new_status: string | null;
  remark: string | null;
  updated_by: string | null;
  created_at: string;
}

export interface IssueInput {
  reporter_name: string;
  reporter_email: string;
  reporter_role: string;
  classroom_number: string;
  building: string;
  category: string;
  priority: string;
  description: string;
  image_url?: string | null;
}
