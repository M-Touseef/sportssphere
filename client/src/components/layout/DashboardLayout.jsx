import { Fragment, useState } from 'react'
import { Dialog, Transition, Menu } from '@headlessui/react'
import { Bars3Icon, BellIcon, MagnifyingGlassIcon, UserIcon, ArrowRightOnRectangleIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'
import Sidebar from './Sidebar'
import DashboardHeader from './DashboardHeader'
import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
export default function DashboardLayout() {
    const { user, logout } = useAuth()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="min-h-screen bg-slate-50/10 text-slate-900 flex">
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
                                <Sidebar user={user} onCloseMobile={() => setSidebarOpen(false)} isMobile={true} />
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </Dialog>
            </Transition.Root>

            {/* Static Desktop Sidebar */}
            <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
                <Sidebar user={user} />
            </aside>

            {/* Main Content Area */}
            <div className="lg:pl-72 flex flex-col min-h-screen grow">
                <DashboardHeader user={user} logout={logout} setSidebarOpen={setSidebarOpen} />

                <main className="flex-1 py-6 sm:py-10 overflow-x-hidden">
                    <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-10">
                        <div className="animate-enter">
                            <Outlet />
                        </div>
                    </div>
                </main>

                <footer className="mt-auto border-t border-amber-200/60 bg-gradient-to-r from-indigo-950 via-indigo-900 to-indigo-950 px-4 py-5 sm:px-8 lg:px-10">
                    <div className="mx-auto max-w-7xl">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-center sm:text-left text-sm text-indigo-200/90 font-medium">
                                © 2026 <span className="font-bold text-amber-100">SportSphere</span>. All rights reserved.
                            </p>
                            <div className="flex items-center justify-center sm:justify-end gap-3">
                                <Link
                                    to="/privacy"
                                    className="text-sm font-bold text-amber-200/90 hover:text-amber-100 transition-colors"
                                >
                                    Privacy
                                </Link>
                                <span className="h-4 w-px bg-white/15" aria-hidden />
                                <Link
                                    to="/support"
                                    className="text-sm font-bold text-amber-200/90 hover:text-amber-100 transition-colors"
                                >
                                    Support
                                </Link>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    )
}
