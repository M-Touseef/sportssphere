import React, { useState, Fragment } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Dialog, Transition } from '@headlessui/react';
import {
    HomeIcon,
    UserCircleIcon,
    CalendarIcon,
    InboxIcon,
    ArrowLeftOnRectangleIcon,
    UserGroupIcon,
    TrophyIcon,
    IdentificationIcon,
    AcademicCapIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import DashboardHeader from './DashboardHeader';

const ProfessionalLayout = () => {
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    const navigation = [
        { name: 'Dashboard', href: '/pro/dashboard', icon: HomeIcon },
        { name: 'My Profile', href: '/pro/profile', icon: UserCircleIcon },
        { name: 'Sparring Availability', href: '/pro/availability', icon: CalendarIcon },
        { name: 'Tournaments', href: '/tournaments', icon: TrophyIcon },
        { name: 'My Tournaments', href: '/pro/registrations', icon: UserGroupIcon },
        { name: 'Find Coaches', href: '/coaches', icon: AcademicCapIcon },
        { name: 'Coaching Sessions', href: '/pro/sessions', icon: IdentificationIcon },
        { name: 'Court Bookings', href: '/pro/bookings', icon: CalendarIcon },
        { name: 'Matching Requests', href: '/pro/requests', icon: InboxIcon },
    ];

    const handleLogout = () => {
        logout();
    };

    const SidebarContent = ({ isMobile = false }) => (
        <div className="flex-1 flex flex-col min-h-0 bg-white">
            <div className="flex items-center h-20 flex-shrink-0 px-8 border-b border-slate-100 justify-between">
                <span className="text-xl font-black tracking-tighter text-slate-900 uppercase">
                    SportSphere <span className="text-indigo-600">Pro</span>
                </span>
                {isMobile && (
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-slate-300">
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                )}
            </div>
            <div className="flex-1 flex flex-col overflow-y-auto p-4">
                <nav className="flex-1 space-y-2">
                    {navigation.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                onClick={() => isMobile && setSidebarOpen(false)}
                                className={`group flex items-center px-4 py-3 text-[13px] font-bold rounded-2xl transition-all duration-200 ${isActive
                                    ? 'bg-slate-900 text-white shadow-2xl shadow-slate-200'
                                    : 'text-slate-400 hover:bg-slate-50 hover:text-indigo-600'
                                    }`}
                            >
                                <item.icon
                                    className={`mr-3 flex-shrink-0 h-5 w-5 transition-colors ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-indigo-600'
                                        }`}
                                    aria-hidden="true"
                                />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
                <div className="pt-4 border-t border-slate-100 mt-4">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-3 text-[13px] font-bold text-red-600 rounded-2xl hover:bg-red-50 transition-colors"
                    >
                        <ArrowLeftOnRectangleIcon className="mr-3 h-5 w-5" />
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
            <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col border-r border-slate-100">
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

export default ProfessionalLayout;
