import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import LandingPage from './pages/LandingPage';
import TeamsPage from './pages/TeamsPage';
import FreelancersPage from './pages/FreelancersPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import MyTeamsPage from './pages/MyTeamsPage';
import CreateTeamPage from './pages/CreateTeamPage';
import InvitationsPage from './pages/InvitationsPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import Footer from './components/Footer';

function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <div className="flex-1">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/freelancers" element={<FreelancersPage />} />
            <Route path="/demo" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
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
    </BrowserRouter>
  );
}

export default App;
