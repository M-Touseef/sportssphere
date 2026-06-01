import React, { useState, Fragment } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Dialog, Transition } from '@headlessui/react';
import {
    HomeIcon,
    UserCircleIcon,
    CalendarIcon,
    InboxIcon,
    AcademicCapIcon,
    ArrowLeftOnRectangleIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import DashboardHeader from './DashboardHeader';

const CoachLayout = () => {
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    const navigation = [
        { name: 'Dashboard', href: '/coach/dashboard', icon: HomeIcon },
        { name: 'My Profile', href: '/coach/profile', icon: UserCircleIcon },
        { name: 'Schedule & courts', href: '/coach/schedule', icon: CalendarIcon },
        { name: 'Requests', href: '/coach/requests', icon: InboxIcon },
    ];

    const handleLogout = () => {
        logout();
    };

    const SidebarContent = ({ isMobile = false }) => (
        <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-b from-slate-50 via-white to-slate-50 border-r border-slate-200/60 shadow-[10px_0_60px_-20px_rgba(0,0,0,0.12)]">
            <div className="flex items-center h-24 flex-shrink-0 px-8 border-b border-slate-200 justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-gradient-to-br from-emerald-600 to-green-700 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-200">
                        <AcademicCapIcon className="h-7 w-7" />
                    </div>
                    <span className="text-2xl font-black tracking-tight text-slate-900">
                        Coach <span className="text-emerald-600">Portal</span>
                    </span>
                </div>
                {isMobile && (
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all border border-slate-200">
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                )}
            </div>
            <div className="flex-1 flex flex-col overflow-y-auto p-6">
                <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400 mb-6 flex items-center gap-3">
                    Menu
                    <div className="h-px flex-1 bg-gradient-to-r from-slate-300 to-transparent" />
                </div>
                <nav className="flex-1 space-y-2">
                    {navigation.map((item) => {
                        const isActive =
                            location.pathname === item.href ||
                            (item.href === '/coach/schedule' &&
                                (location.pathname === '/coach/court-bookings' ||
                                    location.pathname === '/coach/availability'));
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                onClick={() => isMobile && setSidebarOpen(false)}
                                className={`group flex items-center gap-x-4 px-4 py-4 text-[13px] font-bold rounded-2xl transition-all duration-300 ${isActive
                                    ? 'bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-xl shadow-slate-300'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 hover:shadow-md'
                                    }`}
                            >
                                <item.icon
                                    className={`h-5 w-5 shrink-0 transition-all duration-300 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700 group-hover:-translate-y-0.5'
                                        }`}
                                    aria-hidden="true"
                                />
                                {item.name}
                                {isActive && (
                                    <div className="ml-auto h-2 w-2 rounded-full bg-white/90" />
                                )}
                            </Link>
                        );
                    })}
                </nav>
                <div className="pt-8 border-t border-slate-200 mt-8">
                    <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400 mb-6 flex items-center gap-3">
                        Account
                        <div className="h-px flex-1 bg-gradient-to-r from-slate-300 to-transparent" />
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-x-4 px-4 py-4 text-[13px] font-bold text-red-600 rounded-2xl hover:bg-red-50 hover:shadow-md transition-all"
                    >
                        <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50/10 flex">
            {/* Mobile Sidebar Overlay */}
            <Transition.Root show={sidebarOpen} as={Fragment}>
                <Dialog as="div" className="relative z-[100] lg:hidden" onClose={setSidebarOpen}>
                    <Transition.Child
                        as={Fragment}
                        enter="transition-opacity ease-linear duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="transition-opacity ease-linear duration-300"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 flex">
                        <Transition.Child
                            as={Fragment}
                            enter="transition ease-in-out duration-300 transform"
                            enterFrom="-translate-x-full"
                            enterTo="translate-x-0"
                            leave="transition ease-in-out duration-300 transform"
                            leaveFrom="translate-x-0"
                            leaveTo="-translate-x-full"
                        >
                            <Dialog.Panel className="relative flex w-full max-w-xs flex-1">
                                <SidebarContent isMobile={true} />
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </Dialog>
            </Transition.Root>

            {/* Static Desktop Sidebar */}
            <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
                <SidebarContent />
            </aside>

            {/* Main content */}
            <div className="flex flex-col flex-1 lg:pl-72 transition-all duration-300">
                <DashboardHeader user={user} logout={logout} setSidebarOpen={setSidebarOpen} />
                <main className="flex-1 py-10 px-6 sm:px-8 lg:px-10">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default CoachLayout;
