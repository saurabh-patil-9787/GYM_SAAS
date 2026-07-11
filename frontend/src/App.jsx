import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import ProtectedRoute, { MemberProtectedRoute } from './components/ProtectedRoute';
import VersionChecker from './components/VersionChecker';
import BicepCurlLoader from './components/BicepCurlLoader';
import NotificationToast from './components/NotificationToast';
import { HelmetProvider } from 'react-helmet-async';

// --- Route-Level Code Splitting ---
// Every page is lazy-loaded so the initial bundle only contains
// the shell (Router, Auth, ProtectedRoute). Each page becomes its own
// chunk that is fetched on-demand when the user navigates to it.
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const AdminLogin = React.lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const AdminForgotPassword = React.lazy(() => import('./pages/AdminForgotPassword'));
const DashboardLayout = React.lazy(() => import('./layouts/DashboardLayout'));
const DashboardStats = React.lazy(() => import('./pages/dashboard/DashboardStats'));
const MembersPage = React.lazy(() => import('./pages/dashboard/MembersPage'));
const MemberFollowUp = React.lazy(() => import('./pages/dashboard/MemberFollowUp'));
const GymSettingsPage = React.lazy(() => import('./pages/dashboard/GymSettingsPage'));
const SubscriptionPage = React.lazy(() => import('./pages/dashboard/SubscriptionPage'));
const RevenuePage = React.lazy(() => import('./pages/dashboard/RevenuePage'));
const OwnerNotifications = React.lazy(() => import('./pages/dashboard/OwnerNotifications'));
const GymSetup = React.lazy(() => import('./pages/GymSetup'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy'));

// --- Member PWA Pages ---
const FindGym = React.lazy(() => import('./pages/member/FindGym'));
const MemberLogin = React.lazy(() => import('./pages/member/MemberLogin'));
const MemberRegister = React.lazy(() => import('./pages/member/MemberRegister'));
const MemberLayout = React.lazy(() => import('./layouts/MemberLayout'));
const MemberDashboard = React.lazy(() => import('./pages/member/MemberDashboard'));
const MemberPlans = React.lazy(() => import('./pages/member/MemberPlans'));
const MemberTransactions = React.lazy(() => import('./pages/member/MemberTransactions'));
const MemberNotifications = React.lazy(() => import('./pages/member/MemberNotifications'));
const MemberProfile = React.lazy(() => import('./pages/member/MemberProfile'));
const MemberHealth = React.lazy(() => import('./pages/member/MemberHealth'));
const MemberProgress = React.lazy(() => import('./pages/member/MemberProgress'));
const MemberLeaderboard = React.lazy(() => import('./pages/member/MemberLeaderboard'));
const MemberGamificationProfile = React.lazy(() => import('./pages/member/MemberGamificationProfile'));
const FitnessHub = React.lazy(() => import('./pages/member/FitnessHub'));

// --- Owner Plan Management ---
const OwnerPlans = React.lazy(() => import('./pages/dashboard/OwnerPlans'));

// Using BicepCurlLoader for global loading fallbacks

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <SettingsProvider>
          <div className="app-wrapper">
          <Router>
            {/* Global Teams-style notification toast — mounted inside Router so it can navigate on click */}
            <NotificationToast />
            <Suspense fallback={<BicepCurlLoader text="Loading माझी जिम..." fullScreen={true} />}>
              <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<PrivacyPolicy />} />
              <Route path="/contact" element={<PrivacyPolicy />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />

              {/* Member PWA Routes (public) */}
              <Route path="/member/find-gym" element={<FindGym />} />
              <Route path="/member/login" element={<MemberLogin />} />
              <Route path="/member/register" element={<MemberRegister />} />

              {/* Member PWA Routes (protected, with bottom nav layout) */}
              <Route element={<MemberProtectedRoute />}>
                <Route element={<MemberLayout />}>
                  <Route path="/member/dashboard" element={<MemberDashboard />} />
                  <Route path="/member/health" element={<MemberHealth />} />
                  <Route path="/member/progress" element={<MemberProgress />} />
                  <Route path="/member/leaderboard" element={<MemberLeaderboard />} />
                  <Route path="/member/gamification" element={<MemberGamificationProfile />} />
                  <Route path="/member/fitness-hub" element={<FitnessHub />} />
                  <Route path="/member/plans" element={<MemberPlans />} />
                  <Route path="/member/transactions" element={<MemberTransactions />} />
                  <Route path="/member/notifications" element={<MemberNotifications />} />
                  <Route path="/member/profile" element={<MemberProfile />} />
                </Route>
              </Route>

              {/* Owner Routes */}
              <Route element={<ProtectedRoute allowedRoles={['owner']} />}>
                <Route path="/dashboard" element={<DashboardLayout />}>
                  <Route index element={<DashboardStats />} />
                  <Route path="members" element={<MembersPage />} />
                  <Route path="follow-up" element={<MemberFollowUp />} />
                  <Route path="settings" element={<GymSettingsPage />} />
                  <Route path="revenue" element={<RevenuePage />} />
                  <Route path="subscription" element={<SubscriptionPage />} />
                  <Route path="plans" element={<OwnerPlans />} />
                  <Route path="notifications" element={<OwnerNotifications />} />
                </Route>
                <Route path="/gym-setup" element={<GymSetup />} />
              </Route>

              {/* Admin Routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
              </Route>

              </Routes>
            </Suspense>
          </Router>
          <VersionChecker />
        </div>
      </SettingsProvider>
    </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
