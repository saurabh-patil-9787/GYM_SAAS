import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminForgotPassword from './pages/AdminForgotPassword';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardStats from './pages/dashboard/DashboardStats';
import MembersPage from './pages/dashboard/MembersPage';
import MemberFollowUp from './pages/dashboard/MemberFollowUp';
import GymSettingsPage from './pages/dashboard/GymSettingsPage';
import SubscriptionPage from './pages/dashboard/SubscriptionPage';
import RevenuePage from './pages/dashboard/RevenuePage';
import GymSetup from './pages/GymSetup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <Router>
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
        </Router>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
