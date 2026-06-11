import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Sidebar from './Sidebar'
import DashboardHeader from './DashboardHeader'

export default function DashboardLayout() {
    const { user, logout } = useAuth()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="min-h-screen bg-slate-50/60 text-slate-900">
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
                                />
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </Dialog>
            </Transition.Root>

            <div className="flex min-h-screen flex-col">
                <DashboardHeader user={user} logout={logout} setSidebarOpen={setSidebarOpen} />

                <main className="flex-1 overflow-x-hidden py-6 sm:py-10">
                    <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
                        <div className="animate-enter">
                            <Outlet />
                        </div>
                    </div>
                </main>

                <footer className="mt-auto border-t border-slate-200 bg-slate-950 px-4 py-5 sm:px-8 lg:px-10">
                    <div className="mx-auto max-w-7xl">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-center text-sm font-medium text-slate-300 sm:text-left">
                                (c) 2026 <span className="font-bold text-white">SportSphere</span>. All rights reserved.
                            </p>
                            <div className="flex items-center justify-center gap-3 sm:justify-end">
                                <Link
                                    to="/privacy"
                                    className="text-sm font-bold text-slate-300 transition-colors hover:text-white"
                                >
                                    Privacy
                                </Link>
                                <span className="h-4 w-px bg-white/15" aria-hidden />
                                <Link
                                    to="/support"
                                    className="text-sm font-bold text-slate-300 transition-colors hover:text-white"
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
