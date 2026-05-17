import { ToastProvider } from './context/ToastContext';
import { BrowserRouter, Routes, Route, Outlet, useLocation, Navigate } from 'react-router-dom'
import { useEffect } from 'react';
import axiosInstance from './services/axiosInstance';
import TournamentView from './pages/tournament/TournamentView'
import ChatWindow from './components/chat/ChatWindow'
import Navbar from './components/layout/Navbar'
import DashboardLayout from './components/layout/DashboardLayout'
import PlayerDashboard from './pages/dashboard/PlayerDashboard'
import CoachDashboard from './pages/dashboard/CoachDashboard'
import OrganizerDashboard from './pages/dashboard/OrganizerDashboard'
import AdminDashboard from './pages/AdminDashboard'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import PageTransition from './components/ui/PageTransition'
import { AnimatePresence } from 'framer-motion'

// Page Components
import CourtList from './pages/CourtList';
import CourtDetails from './pages/CourtDetails';
import Home from './pages/Home';
import CoachList from './pages/CoachList';
import TournamentList from './pages/TournamentList';
import TournamentDetails from './pages/TournamentDetails';
import TournamentBrackets from './pages/TournamentBrackets';
import CreateTournament from './pages/CreateTournament';
import MyTournaments from './pages/MyTournaments';
import Login from './pages/Login';
import Register from './pages/Register';
import CoachProfile from './pages/CoachProfile';
import Profile from './pages/Profile';
import MySessions from './pages/MySessions';
import MyRegistrations from './pages/MyRegistrations';

import Chatbot from './pages/Chatbot';
import VerificationStatus from './pages/VerificationStatus';
import PendingVerification from './pages/PendingVerification';
import ProfileSetup from './pages/ProfileSetup';
import RoleSelection from './pages/RoleSelection';
import PaymentReturn from './pages/PaymentReturn';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import TermsOfService from './pages/legal/TermsOfService';
import SupportCenter from './pages/legal/SupportCenter';

// Coach Pages
import CoachLayout from './components/layout/CoachLayout';
import CoachProfileEditor from './pages/coach/CoachProfileEditor';
import CoachSchedule from './pages/coach/CoachSchedule';
import CoachBookingRequests from './pages/coach/CoachBookingRequests';

// Professional Player Pages
import ProfessionalLayout from './components/layout/ProfessionalLayout';
import ProfessionalDashboard from './pages/professional/ProfessionalDashboard';
import ProfessionalProfile from './pages/professional/ProfessionalProfile';
import AvailabilityManager from './pages/professional/AvailabilityManager';
import BookingRequests from './pages/professional/BookingRequests';

// Sparring System (Unified)
import FindProfessional from './pages/sparring/FindProfessional';
import MyBookings from './pages/MyBookings';
import MySparringRequests from './pages/sparring/MySparringRequestsV2';
import OrganizerCourts from './pages/organizer/OrganizerCourts';
import CreateCourt from './pages/organizer/CreateCourt';

const AnimatedRoutes = () => {
  const location = useLocation();
  const { user } = useAuth();

  const DashboardHome = () => {
    if (!user) return null;

    // Step 1: Check if role is assigned
    if (!user.role) return <Navigate to="/role-selection" replace />;

    // Step 2: Check if profile is complete (for roles that need it)
    if (!user.isProfileComplete && (user.role === 'coach' || user.role === 'organizer' || (user.role === 'player' && user.skillLevel === 'professional'))) {
      return <Navigate to="/profile-setup" replace />;
    }

    // Step 3: Check status for restricted access
    if (user.status === 'waiting_for_approval' || user.status === 'pending') {
      if (user.role !== 'admin') return <Navigate to="/pending-verification" replace />;
    }

    if (user.status === 'rejected') {
      return <Navigate to="/pending-verification" replace />;
    }

    // Step 4: Route to appropriate dashboard
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'organizer') return <OrganizerDashboard />;
    if (user.role === 'coach') return <Navigate to="/coach/dashboard" replace />;

    // Player Role check
    if (user.role === 'player') {
      if (user.skillLevel === 'professional') {
        return <Navigate to="/pro/dashboard" replace />;
      }
      return <PlayerDashboard />;
    }

    return <PlayerDashboard />;
  }

  const SparringHome = () => {
    if (user?.skillLevel === 'professional') {
      return <Navigate to="/pro/dashboard" replace />;
    }
    return <FindProfessional />;
  }

  const ProRedirect = ({ children, to }) => {
    if (user?.skillLevel === 'professional') {
      return <Navigate to={to} replace />;
    }
    return children;
  }

  const ContextualLayout = () => {
    if (!user) return <PublicLayout />;
    if (user.role === 'coach') return <CoachLayout />;
    if (user.role === 'player' && user.skillLevel === 'professional') return <ProfessionalLayout />;
    if (user.role === 'admin' || user.role === 'organizer' || user.role === 'player') return <DashboardLayout />;
    return <PublicLayout />;
  }

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* ============================================================ */}
        {/* PUBLIC ROUTES (No Auth Required) */}
        {/* ============================================================ */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<PageTransition><Home /></PageTransition>} />
          <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
          <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
          <Route path="/pending-verification" element={<PageTransition><PendingVerification /></PageTransition>} />
          {/* JazzCash return URL — no auth required, browser redirect from JazzCash */}
          <Route path="/payment/return" element={<PaymentReturn />} />
          <Route path="/privacy" element={<PageTransition><PrivacyPolicy /></PageTransition>} />
          <Route path="/terms" element={<PageTransition><TermsOfService /></PageTransition>} />
          <Route path="/support" element={<PageTransition><SupportCenter /></PageTransition>} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/role-selection" element={<PageTransition><RoleSelection /></PageTransition>} />
          <Route path="/profile-setup" element={<PageTransition><ProfileSetup /></PageTransition>} />
        </Route>

        {/* ============================================================ */}
        {/* PUBLIC BROWSING (Context-Aware Layout) */}
        {/* ============================================================ */}
        <Route element={<ContextualLayout />}>
          <Route path="/tournaments" element={<PageTransition><TournamentList /></PageTransition>} />
          <Route path="/tournaments/:id" element={<PageTransition><TournamentDetails /></PageTransition>} />
          <Route path="/tournaments/:id/brackets" element={<PageTransition><TournamentBrackets /></PageTransition>} />
          <Route path="/coaches" element={<PageTransition><CoachList /></PageTransition>} />
          <Route path="/coaches/:id" element={<PageTransition><CoachProfile /></PageTransition>} />
          <Route path="/courts" element={<PageTransition><CourtList /></PageTransition>} />
          <Route path="/courts/:id" element={<PageTransition><CourtDetails /></PageTransition>} />
          <Route path="/chatbot" element={<PageTransition><Chatbot /></PageTransition>} />
        </Route>

        {/* ============================================================ */}
        {/* AUTHENTICATED APP ROUTES (/app/*) */}
        {/* ============================================================ */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            {/* Main Dashboard */}
            <Route path="/app" element={<PageTransition><DashboardHome /></PageTransition>} />
            <Route path="/app/profile" element={user?.role === 'admin' ? <Navigate to="/admin/dashboard" replace /> : <PageTransition><Profile /></PageTransition>} />
            <Route path="/app/verification" element={<PageTransition><VerificationStatus /></PageTransition>} />
            <Route path="/app/bookings" element={<PageTransition><ProRedirect to="/pro/bookings"><MyBookings /></ProRedirect></PageTransition>} />
            <Route path="/app/sessions" element={<PageTransition><ProRedirect to="/pro/sessions"><MySessions /></ProRedirect></PageTransition>} />
            <Route path="/app/settings" element={user?.role === 'admin' ? <Navigate to="/admin/dashboard" replace /> : <PageTransition><div className="p-4">User Settings</div></PageTransition>} />

            {/* Player Sparring Routes */}
            <Route element={<ProtectedRoute allowedRoles={['player']} />}>
              <Route path="/app/sparring" element={<PageTransition><SparringHome /></PageTransition>} />
              <Route path="/app/sparring/requests" element={<PageTransition><MySparringRequests /></PageTransition>} />
              <Route path="/app/registrations" element={<PageTransition><ProRedirect to="/pro/registrations"><MyRegistrations /></ProRedirect></PageTransition>} />
            </Route>

            {/* Tournament Management */}
            <Route element={<ProtectedRoute allowedRoles={['professional', 'admin', 'organizer']} />}>
              <Route path="/app/tournaments" element={<PageTransition><MyTournaments /></PageTransition>} />
              <Route path="/app/tournaments/create" element={<PageTransition><CreateTournament /></PageTransition>} />
            </Route>

            {/* Organizer Routes */}
            <Route element={<ProtectedRoute allowedRoles={['organizer']} />}>
              <Route path="/org/courts" element={<PageTransition><OrganizerCourts /></PageTransition>} />
              <Route path="/org/coaching-requests" element={<Navigate to="/org/courts" replace />} />
              <Route path="/org/courts/create" element={<PageTransition><CreateCourt /></PageTransition>} />
              <Route path="/org/courts/:courtId/edit" element={<PageTransition><CreateCourt /></PageTransition>} />
            </Route>
          </Route>

          {/* ============================================================ */}
          {/* ADMIN PORTAL (/admin/*) */}
          {/* ============================================================ */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/admin/dashboard" element={<PageTransition><AdminDashboard /></PageTransition>} />
            </Route>
          </Route>

          {/* ============================================================ */}
          {/* COACH PORTAL (/coach/*) */}
          {/* ============================================================ */}
          <Route element={<ProtectedRoute allowedRoles={['coach']} />}>
            <Route path="/coach" element={<CoachLayout />}>
              <Route path="dashboard" element={<PageTransition><CoachDashboard /></PageTransition>} />
              <Route path="profile" element={<PageTransition><CoachProfileEditor /></PageTransition>} />
              <Route path="schedule" element={<PageTransition><CoachSchedule /></PageTransition>} />
              <Route path="court-bookings" element={<Navigate to="/coach/schedule?tab=courts" replace />} />
              <Route path="availability" element={<Navigate to="/coach/schedule?tab=weekly" replace />} />
              <Route path="requests" element={<PageTransition><CoachBookingRequests /></PageTransition>} />
            </Route>
          </Route>

          {/* ============================================================ */}
          {/* PROFESSIONAL PLAYER PORTAL (/pro/*) */}
          {/* ============================================================ */}
          <Route element={<ProtectedRoute allowedRoles={['player']} allowedSkillLevels={['professional']} />}>
            <Route path="/pro" element={<ProfessionalLayout />}>
              <Route path="dashboard" element={<PageTransition><ProfessionalDashboard /></PageTransition>} />
              <Route path="profile" element={<PageTransition><ProfessionalProfile /></PageTransition>} />
              <Route path="availability" element={<PageTransition><AvailabilityManager /></PageTransition>} />
              <Route path="requests" element={<PageTransition><BookingRequests /></PageTransition>} />
              <Route path="registrations" element={<PageTransition><MyRegistrations /></PageTransition>} />
              <Route path="bookings" element={<PageTransition><MyBookings /></PageTransition>} />
              <Route path="sessions" element={<PageTransition><MySessions /></PageTransition>} />
            </Route>
          </Route>

        </Route>

        {/* ============================================================ */}
        {/* LEGACY REDIRECTS (for bookmarks/old links) */}
        {/* ============================================================ */}
        <Route path="/dashboard" element={<Navigate to="/app" replace />} />
        <Route path="/bookings" element={<Navigate to="/app/bookings" replace />} />
        <Route path="/my-sessions" element={<Navigate to="/app/sessions" replace />} />
        <Route path="/my-tournaments" element={<Navigate to="/app/tournaments" replace />} />
        <Route path="/my-registrations" element={<Navigate to="/app/registrations" replace />} />
        <Route path="/sparring" element={<Navigate to="/app/sparring" replace />} />
        <Route path="/sparring/requests" element={<Navigate to="/app/sparring/requests" replace />} />
        <Route path="/profile" element={<Navigate to="/app/profile" replace />} />
        <Route path="/verification-status" element={<Navigate to="/app/verification" replace />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/professional/*" element={<Navigate to="/pro/dashboard" replace />} />
        <Route path="/organizer/courts" element={<Navigate to="/org/courts" replace />} />
        <Route path="/courts/create" element={<Navigate to="/org/courts/create" replace />} />
        <Route path="/tournaments/create" element={<Navigate to="/app/tournaments/create" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

const PublicLayout = () => (
  <div className="min-h-screen bg-white selection:bg-indigo-100 selection:text-indigo-700">
    <Navbar />
    <main className="relative z-0">
      <Outlet />
    </main>
  </div>
)

import { SocketProvider } from './context/SocketContext';

// ... (existing imports)

function App() {
  useEffect(() => {
    axiosInstance.get('/ping')
      .then(res => console.log('Backend connection status:', res.data))
      .catch(err => console.error('Backend connection error:', err));
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
    try {
      localStorage.removeItem('vite-ui-theme');
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <ToastProvider>
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <AnimatedRoutes />
            <ChatWindow />
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </ToastProvider>
  )
}

export default App
