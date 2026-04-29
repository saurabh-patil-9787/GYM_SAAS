import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import ProtectedRoute from './components/ProtectedRoute';
import VersionChecker from './components/VersionChecker';
import BicepCurlLoader from './components/BicepCurlLoader';

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
const GymSetup = React.lazy(() => import('./pages/GymSetup'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));

// Using BicepCurlLoader for global loading fallbacks

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <div className="app-wrapper">
          <Router>
            <Suspense fallback={<BicepCurlLoader text="Loading TrackON..." fullScreen={true} />}>
              <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />

              {/* Owner Routes */}
              <Route element={<ProtectedRoute allowedRoles={['owner']} />}>
                <Route path="/dashboard" element={<DashboardLayout />}>
                  <Route index element={<DashboardStats />} />
                  <Route path="members" element={<MembersPage />} />
                  <Route path="follow-up" element={<MemberFollowUp />} />
                  <Route path="settings" element={<GymSettingsPage />} />
                  <Route path="revenue" element={<RevenuePage />} />
                  <Route path="subscription" element={<SubscriptionPage />} />
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
  );
}

export default App;
