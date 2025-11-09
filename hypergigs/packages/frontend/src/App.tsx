import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import LandingPage from './pages/LandingPage';
import TeamsPage from './pages/TeamsPage';
import TeamDetailPage from './pages/TeamDetailPage';
import FreelancersPage from './pages/FreelancersPage';
import ProjectsPage from './pages/ProjectsPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CompleteProfilePage from './pages/CompleteProfilePage';
import DashboardLayout from './components/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import ProfilePage from './pages/ProfilePage';
import MyTeamsPage from './pages/MyTeamsPage';
import CreateTeamPage from './pages/CreateTeamPage';
import InvitationsPage from './pages/InvitationsPage';
import RecommendationsPage from './pages/RecommendationsPage';
import JobBoardPage from './pages/JobBoardPage';
import JobDetailPage from './pages/JobDetailPage';
import TeamJobsPage from './pages/TeamJobsPage';
import JoinTeamInvitationPage from './pages/JoinTeamInvitationPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import Footer from './components/Footer';
import { Toaster } from '@/components/ui/toaster';

function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <div className="flex-1">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/teams/:teamSlug/jobs" element={<TeamJobsPage />} />
            <Route path="/teams/:identifier" element={<TeamDetailPage />} />
            <Route path="/freelancers" element={<FreelancersPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/jobs" element={<JobBoardPage />} />
            <Route path="/jobs/:jobId" element={<JobDetailPage />} />
            <Route path="/demo" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/join/:token" element={<JoinTeamInvitationPage />} />
            <Route path="/complete-profile" element={<CompleteProfilePage />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              {/* Dashboard with nested routes */}
              <Route path="/dashboard" element={<DashboardLayout><DashboardHome /></DashboardLayout>} />
              <Route path="/dashboard/teams" element={<DashboardLayout><MyTeamsPage /></DashboardLayout>} />
              <Route path="/dashboard/invitations" element={<DashboardLayout><InvitationsPage /></DashboardLayout>} />
              <Route path="/dashboard/recommendations" element={<DashboardLayout><RecommendationsPage /></DashboardLayout>} />
              <Route path="/dashboard/community" element={<DashboardLayout><FreelancersPage /></DashboardLayout>} />
              <Route path="/dashboard/profile" element={<DashboardLayout><ProfilePage /></DashboardLayout>} />
              <Route path="/dashboard/projects" element={<DashboardLayout><ProjectsPage /></DashboardLayout>} />
              <Route path="/dashboard/messages" element={<DashboardLayout><div className="text-center py-12"><h2 className="text-2xl font-bold">Messages</h2><p className="text-muted-foreground mt-2">Coming soon...</p></div></DashboardLayout>} />

              {/* Legacy routes */}
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/:username" element={<ProfilePage />} />
              <Route path="/teams/my" element={<MyTeamsPage />} />
              <Route path="/teams/create" element={<CreateTeamPage />} />
              <Route path="/invitations" element={<InvitationsPage />} />
            </Route>
          </Routes>
        </div>
        <Footer />
      </div>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
