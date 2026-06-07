import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, token, loading } = useAuth();

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    if (!token || !user) {
        // Redirect members to member find-gym, others to owner login
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // If a member tries to access owner routes, redirect to member dashboard
        if (user.role === 'member') {
            return <Navigate to="/member/dashboard" replace />;
        }
        return <Navigate to="/" replace />; // Or unauthorized page
    }

    return <Outlet />;
};

// Separate component for member-protected routes
export const MemberProtectedRoute = () => {
    const { user, token, loading } = useAuth();

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    if (!token || !user) {
        return <Navigate to="/member/find-gym" replace />;
    }

    if (user.role !== 'member') {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
