import { useEffect, useState } from 'react';
import { Navbar, type Page } from '@/components/Navbar';
import { ToastProvider } from '@/components/Toast';
import { Dashboard } from '@/pages/Dashboard';
import { ReportIssue } from '@/pages/ReportIssue';
import { IssueList } from '@/pages/IssueList';
import { IssueDetails } from '@/pages/IssueDetails';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { TrackIssue } from '@/pages/TrackIssue';

function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  const navigate = (p: Page) => {
    setPage(p);
    window.scrollTo(0, 0);
  };

  const openIssueDetails = (id: string) => {
    setSelectedIssueId(id);
    setPage('details');
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    if (page !== 'details') {
      setSelectedIssueId(null);
    }
  }, [page]);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50">
        <Navbar currentPage={page} onNavigate={navigate} />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {page === 'dashboard' && <Dashboard onNavigate={navigate} onViewIssue={openIssueDetails} />}
          {page === 'report' && <ReportIssue onNavigate={navigate} />}
          {page === 'issues' && <IssueList onViewIssue={openIssueDetails} />}
          {page === 'details' && selectedIssueId && (
            <IssueDetails issueId={selectedIssueId} onNavigate={navigate} />
          )}
          {page === 'track' && <TrackIssue onViewIssue={openIssueDetails} />}
          {page === 'admin' && <AdminDashboard onViewIssue={openIssueDetails} />}
        </main>
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-6 text-center text-xs text-slate-400 sm:px-6 lg:px-8">
            Classroom Issue Reporting System &mdash; Facility Management
          </div>
        </footer>
      </div>
    </ToastProvider>
  );
}

export default App;
