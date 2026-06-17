import { ToastProvider } from './context/ToastContext';
import { BrowserRouter, Routes, Route, Outlet, useLocation, Navigate } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import axiosInstance from './services/axiosInstance';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PageTransition from './components/ui/PageTransition';
import { SocketProvider } from './context/SocketContext';

const ChatWindow = lazy(() => import('./components/chat/ChatWindow'));
const Navbar = lazy(() => import('./components/layout/Navbar'));
const DashboardLayout = lazy(() => import('./components/layout/DashboardLayout'));
const CoachLayout = lazy(() => import('./components/layout/CoachLayout'));
const ProfessionalLayout = lazy(() => import('./components/layout/ProfessionalLayout'));
const PlayerDashboard = lazy(() => import('./pages/dashboard/PlayerDashboard'));
const CoachDashboard = lazy(() => import('./pages/dashboard/CoachDashboard'));
const OrganizerDashboard = lazy(() => import('./pages/dashboard/OrganizerDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const CourtList = lazy(() => import('./pages/CourtList'));
const CourtDetails = lazy(() => import('./pages/CourtDetails'));
const Home = lazy(() => import('./pages/Home'));
const CoachList = lazy(() => import('./pages/CoachList'));
const TournamentList = lazy(() => import('./pages/TournamentList'));
const TournamentDetails = lazy(() => import('./pages/TournamentDetails'));
const TournamentBrackets = lazy(() => import('./pages/TournamentBrackets'));
const CreateTournament = lazy(() => import('./pages/CreateTournament'));
const MyTournaments = lazy(() => import('./pages/MyTournaments'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const CoachProfile = lazy(() => import('./pages/CoachProfile'));
const Profile = lazy(() => import('./pages/Profile'));
const MySessions = lazy(() => import('./pages/MySessions'));
const MyRegistrations = lazy(() => import('./pages/MyRegistrations'));
const Chatbot = lazy(() => import('./pages/Chatbot'));
const VerificationStatus = lazy(() => import('./pages/VerificationStatus'));
const PendingVerification = lazy(() => import('./pages/PendingVerification'));
const ProfileSetup = lazy(() => import('./pages/ProfileSetup'));
const RoleSelection = lazy(() => import('./pages/RoleSelection'));
const PaymentReturn = lazy(() => import('./pages/PaymentReturn'));
const TermsOfService = lazy(() => import('./pages/legal/TermsOfService'));
const SupportCenter = lazy(() => import('./pages/legal/SupportCenter'));
const CoachProfileEditor = lazy(() => import('./pages/coach/CoachProfileEditor'));
const CoachSchedule = lazy(() => import('./pages/coach/CoachSchedule'));
const CoachBookingRequests = lazy(() => import('./pages/coach/CoachBookingRequests'));
const ProfessionalDashboard = lazy(() => import('./pages/professional/ProfessionalDashboard'));
const ProfessionalProfile = lazy(() => import('./pages/professional/ProfessionalProfile'));
const AvailabilityManager = lazy(() => import('./pages/professional/AvailabilityManager'));
const BookingRequests = lazy(() => import('./pages/professional/BookingRequests'));
const FindProfessional = lazy(() => import('./pages/sparring/FindProfessional'));
const MyBookings = lazy(() => import('./pages/MyBookings'));
const MySparringRequests = lazy(() => import('./pages/sparring/MySparringRequestsV2'));
const OrganizerCourts = lazy(() => import('./pages/organizer/OrganizerCourts'));
const CreateCourt = lazy(() => import('./pages/organizer/CreateCourt'));
const OrganizerCourtDetails = lazy(() => import('./pages/organizer/OrganizerCourtDetails'));

const RouteFallback = () => (
  <div className="flex min-h-[40vh] items-center justify-center">
    <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" aria-label="Loading" />
  </div>
);

const LazyPage = ({ children }) => (
  <Suspense fallback={<RouteFallback />}>
    <PageTransition>{children}</PageTransition>
  </Suspense>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  const { user } = useAuth();

  const DashboardHome = () => {
    if (!user) return null;

    if (!user.role) return <Navigate to="/role-selection" replace />;

    if (!user.isProfileComplete && (user.role === 'coach' || user.role === 'organizer' || (user.role === 'player' && user.skillLevel === 'professional'))) {
      return <Navigate to="/profile-setup" replace />;
    }

    if (user.status === 'waiting_for_approval' || user.status === 'pending') {
      if (user.role !== 'admin') return <Navigate to="/pending-verification" replace />;
    }

    if (user.status === 'rejected') {
      return <Navigate to="/pending-verification" replace />;
    }

    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'organizer') return <OrganizerDashboard />;
    if (user.role === 'coach') return <Navigate to="/coach/dashboard" replace />;

    if (user.role === 'player') {
      if (user.skillLevel === 'professional') {
        return <Navigate to="/pro/dashboard" replace />;
      }
      return <PlayerDashboard />;
    }

    return <PlayerDashboard />;
  };

  const SparringHome = () => {
    if (user?.skillLevel === 'professional') {
      return <Navigate to="/pro/dashboard" replace />;
    }
    return <FindProfessional />;
  };

  const ProRedirect = ({ children, to }) => {
    if (user?.skillLevel === 'professional') {
      return <Navigate to={to} replace />;
    }
    return children;
  };

  const ContextualLayout = () => {
    if (!user) return <PublicLayout />;
    if (user.role === 'coach') return <CoachLayout />;
    if (user.role === 'player' && user.skillLevel === 'professional') return <ProfessionalLayout />;
    if (user.role === 'admin' || user.role === 'organizer' || user.role === 'player') return <DashboardLayout />;
    return <PublicLayout />;
  };

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes location={location} key={location.pathname}>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LazyPage><Home /></LazyPage>} />
          <Route path="/login" element={<LazyPage><Login /></LazyPage>} />
          <Route path="/register" element={<LazyPage><Register /></LazyPage>} />
          <Route path="/forgot-password" element={<LazyPage><ForgotPassword /></LazyPage>} />
          <Route path="/reset-password" element={<LazyPage><ForgotPassword /></LazyPage>} />
          <Route path="/pending-verification" element={<LazyPage><PendingVerification /></LazyPage>} />
          <Route path="/payment/return" element={<PaymentReturn />} />
          <Route path="/terms" element={<LazyPage><TermsOfService /></LazyPage>} />
          <Route path="/support" element={<LazyPage><SupportCenter /></LazyPage>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/role-selection" element={<LazyPage><RoleSelection /></LazyPage>} />
            <Route path="/profile-setup" element={<LazyPage><ProfileSetup /></LazyPage>} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<ContextualLayout />}>
            <Route path="/tournaments" element={<LazyPage><TournamentList /></LazyPage>} />
            <Route path="/tournaments/:id" element={<LazyPage><TournamentDetails /></LazyPage>} />
            <Route path="/tournaments/:id/brackets" element={<LazyPage><TournamentBrackets /></LazyPage>} />
            <Route path="/coaches" element={<LazyPage><CoachList /></LazyPage>} />
            <Route path="/coaches/:id" element={<LazyPage><CoachProfile /></LazyPage>} />
            <Route path="/courts" element={<LazyPage><CourtList /></LazyPage>} />
            <Route path="/courts/:id" element={<LazyPage><CourtDetails /></LazyPage>} />
          </Route>
        </Route>

        <Route element={<ContextualLayout />}>
          <Route path="/chatbot" element={<LazyPage><Chatbot /></LazyPage>} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/app" element={<LazyPage><DashboardHome /></LazyPage>} />
            <Route
              path="/app/profile"
              element={
                user?.role === 'admin'
                  ? <Navigate to="/admin/dashboard" replace />
                  : user?.role === 'player' && user?.skillLevel === 'professional'
                    ? <Navigate to="/pro/profile" replace />
                    : <LazyPage><Profile /></LazyPage>
              }
            />
            <Route path="/app/verification" element={<LazyPage><VerificationStatus /></LazyPage>} />
            <Route
              path="/app/bookings"
              element={
                user?.role === 'organizer'
                  ? <Navigate to="/app" replace />
                  : <LazyPage><ProRedirect to="/pro/bookings"><MyBookings /></ProRedirect></LazyPage>
              }
            />
            <Route path="/app/sessions" element={<LazyPage><ProRedirect to="/pro/sessions"><MySessions /></ProRedirect></LazyPage>} />
            <Route
              path="/app/settings"
              element={
                user?.role === 'admin'
                  ? <Navigate to="/admin/dashboard" replace />
                  : <LazyPage><SettingsPlaceholder /></LazyPage>
              }
            />

            <Route element={<ProtectedRoute allowedRoles={['player']} />}>
              <Route path="/app/sparring" element={<LazyPage><SparringHome /></LazyPage>} />
              <Route path="/app/sparring/requests" element={<LazyPage><MySparringRequests /></LazyPage>} />
              <Route path="/app/registrations" element={<LazyPage><ProRedirect to="/pro/registrations"><MyRegistrations /></ProRedirect></LazyPage>} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['admin', 'organizer']} />}>
              <Route path="/app/tournaments" element={<LazyPage><MyTournaments /></LazyPage>} />
              <Route path="/app/tournaments/create" element={<LazyPage><CreateTournament /></LazyPage>} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['organizer']} />}>
              <Route path="/org/courts" element={<LazyPage><OrganizerCourts /></LazyPage>} />
              <Route path="/org/coaching-requests" element={<Navigate to="/org/courts" replace />} />
              <Route path="/org/courts/create" element={<LazyPage><CreateCourt /></LazyPage>} />
              <Route path="/org/courts/:courtId/details" element={<LazyPage><OrganizerCourtDetails /></LazyPage>} />
              <Route path="/org/courts/:courtId/edit" element={<LazyPage><CreateCourt /></LazyPage>} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/admin/dashboard" element={<LazyPage><AdminDashboard /></LazyPage>} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['coach']} />}>
            <Route path="/coach" element={<CoachLayout />}>
              <Route path="dashboard" element={<LazyPage><CoachDashboard /></LazyPage>} />
              <Route path="profile" element={<LazyPage><CoachProfileEditor /></LazyPage>} />
              <Route path="schedule" element={<LazyPage><CoachSchedule /></LazyPage>} />
              <Route path="court-bookings" element={<Navigate to="/coach/schedule?tab=courts" replace />} />
              <Route path="availability" element={<Navigate to="/coach/schedule?tab=weekly" replace />} />
              <Route path="requests" element={<LazyPage><CoachBookingRequests /></LazyPage>} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['player']} allowedSkillLevels={['professional']} />}>
            <Route path="/pro" element={<ProfessionalLayout />}>
              <Route path="dashboard" element={<LazyPage><ProfessionalDashboard /></LazyPage>} />
              <Route path="profile" element={<LazyPage><ProfessionalProfile /></LazyPage>} />
              <Route path="availability" element={<LazyPage><AvailabilityManager /></LazyPage>} />
              <Route path="requests" element={<LazyPage><BookingRequests /></LazyPage>} />
              <Route path="registrations" element={<LazyPage><MyRegistrations /></LazyPage>} />
              <Route path="bookings" element={<LazyPage><MyBookings /></LazyPage>} />
              <Route path="sessions" element={<LazyPage><MySessions /></LazyPage>} />
            </Route>
          </Route>
        </Route>

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
    </Suspense>
  );
};

const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-white selection:bg-sky-200 selection:text-brand-navy">
      <Suspense fallback={<RouteFallback />}>
        <Navbar />
      </Suspense>
      <main className="relative z-0">
        <Outlet />
      </main>
    </div>
  );
};

const SettingsPlaceholder = () => (
  <div className="mx-auto max-w-4xl">
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <div className="bg-slate-950 px-6 py-8 text-white sm:px-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-200">Account settings</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Settings workspace</h1>
        <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-300">
          Core profile details, verification, bookings, and role-specific preferences are managed from the dedicated dashboard sections.
        </p>
      </div>
      <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
        {[
          ['Profile details', 'Update your name, phone, location, and public account photo from the profile page.'],
          ['Verification', 'Review account status and support options from the verification page.'],
          ['Notifications', 'Booking and request notifications are delivered through the dashboard header.'],
          ['Security', 'Password recovery is available from the sign-in flow.']
        ].map(([title, description]) => (
          <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-sm font-black text-slate-950">{title}</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-500">{description}</p>
          </div>
        ))}
      </div>
    </section>
  </div>
);

function App() {
  useEffect(() => {
    axiosInstance.get('/ping')
      .then((res) => console.log('Backend connection status:', res.data))
      .catch((err) => console.error('Backend connection error:', err));
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
            <Suspense fallback={null}>
              <ChatWindow />
            </Suspense>
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
