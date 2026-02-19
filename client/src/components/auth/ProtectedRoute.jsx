import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ allowedRoles, allowedSkillLevels }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <svg className="h-10 w-10 animate-spin text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        );
    }

    if (!user) {
        // Redirect to login, saving the current location they were trying to go to
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Allow access to onboarding routes regardless of status
    const onboardingPaths = ['/role-selection', '/profile-setup', '/pending-verification'];
    if (onboardingPaths.includes(location.pathname)) {
        return <Outlet />;
    }

    // Check if user has completed the onboarding flow
    // Step 1: Role must be assigned
    if (!user.role) {
        return <Navigate to="/role-selection" replace />;
    }

    // Step 2: Profile must be complete for certain roles
    const needsProfileCompletion =
        (user.role === 'coach' || user.role === 'organizer' ||
            (user.role === 'player' && user.skillLevel === 'professional')) &&
        !user.isProfileComplete;

    if (needsProfileCompletion) {
        return <Navigate to="/profile-setup" replace />;
    }

    // Step 3: Check status - only approved users can access protected routes
    if (user.status !== 'approved' && user.role !== 'admin') {
        return <Navigate to="/pending-verification" replace />;
    }

    // Role-based access control
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/app" replace />;
    }

    if (allowedSkillLevels && !allowedSkillLevels.includes(user.skillLevel)) {
        return <Navigate to="/app" replace />;
    }

    return <Outlet />;
}
