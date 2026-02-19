import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { ExclamationTriangleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline';

export default function VerificationStatus() {
    const { user, logout } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (user.verified) {
        return <Navigate to="/app" replace />;
    }

    // Determine content based on status
    // If not verified and no rejection reason -> Pending
    // If not verified and has rejection reason -> Rejected

    const isRejected = !!user.rejectionReason;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
                    {isRejected ? (
                        <>
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
                                <XCircleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Verification Rejected</h2>
                            <p className="text-sm text-gray-500 mb-6">
                                Unfortunately, your request for verification has been rejected by the administrator.
                            </p>
                            <div className="bg-red-50 border border-red-100 rounded-md p-4 mb-6 text-left">
                                <h3 className="text-sm font-medium text-red-800">Reason for Rejection:</h3>
                                <p className="mt-1 text-sm text-red-700">{user.rejectionReason}</p>
                            </div>
                            <p className="text-xs text-gray-400 mb-6">
                                You can contact support for more details or register again with correct information.
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 mb-4">
                                <ClockIcon className="h-6 w-6 text-yellow-600" aria-hidden="true" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Verification Pending</h2>
                            <p className="text-sm text-gray-500 mb-6">
                                Your account is currently under review. This process typically takes 24-48 hours.
                            </p>
                            <div className="bg-yellow-50 border border-yellow-100 rounded-md p-4 mb-6 text-left">
                                <p className="text-sm text-yellow-700">
                                    You will be able to access the dashboard once an administrator approves your account.
                                </p>
                            </div>
                        </>
                    )}

                    <button
                        onClick={logout}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
}
