import React, { useState, Fragment } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Dialog, Transition } from '@headlessui/react';
import {
    TrophyIcon,
} from '@heroicons/react/24/outline';
import DashboardHeader from './DashboardHeader';
import Sidebar from './Sidebar';
import { buildProfessionalNavigation } from './navigationConfig';

const ProfessionalLayout = () => {
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const navigation = buildProfessionalNavigation();

    return (
        <div className="min-h-screen bg-slate-50/60">
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
                                <Sidebar
                                    user={user}
                                    logout={logout}
                                    onCloseMobile={() => setSidebarOpen(false)}
                                    isMobile={true}
                                    navigation={navigation}
                                    brandTitle="Pro Portal"
                                    brandEyebrow="Competitive lane"
                                    brandDescription="Stay match-ready with fast access to sparring, tournaments, sessions, and court time."
                                    brandIcon={TrophyIcon}
                                    brandVariant="professional"
                                />
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </Dialog>
            </Transition.Root>

            <div className="flex min-h-screen flex-col">
                <DashboardHeader
                    user={user}
                    logout={logout}
                    setSidebarOpen={setSidebarOpen}
                    navigation={navigation}
                    navigationContext="professional"
                />
                <main className="flex-1 py-10 px-6 sm:px-8 lg:px-10">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default ProfessionalLayout;
