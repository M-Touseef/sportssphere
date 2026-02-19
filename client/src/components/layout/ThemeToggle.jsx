import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { useTheme } from "../../context/ThemeContext";
import Button from "../ui/Button";
import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";

export function ThemeToggle() {
    const { setTheme, theme } = useTheme();

    return (
        <Menu as="div" className="relative inline-block text-left">
            <Menu.Button as="div">
                <Button variant="ghost" size="icon" className="h-9 w-9 px-0">
                    <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </Menu.Button>
            <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
                <Menu.Items className="absolute right-0 z-50 mt-2 w-36 origin-top-right rounded-md bg-popover shadow-md ring-1 ring-border focus:outline-none">
                    <div className="py-1">
                        <Menu.Item>
                            {({ active }) => (
                                <button
                                    onClick={() => setTheme("light")}
                                    className={`${active ? 'bg-accent text-accent-foreground' : 'text-foreground'
                                        } group flex w-full items-center px-4 py-2 text-sm`}
                                >
                                    Light
                                </button>
                            )}
                        </Menu.Item>
                        <Menu.Item>
                            {({ active }) => (
                                <button
                                    onClick={() => setTheme("dark")}
                                    className={`${active ? 'bg-accent text-accent-foreground' : 'text-foreground'
                                        } group flex w-full items-center px-4 py-2 text-sm`}
                                >
                                    Dark
                                </button>
                            )}
                        </Menu.Item>
                        <Menu.Item>
                            {({ active }) => (
                                <button
                                    onClick={() => setTheme("system")}
                                    className={`${active ? 'bg-accent text-accent-foreground' : 'text-foreground'
                                        } group flex w-full items-center px-4 py-2 text-sm`}
                                >
                                    System
                                </button>
                            )}
                        </Menu.Item>
                    </div>
                </Menu.Items>
            </Transition>
        </Menu>
    );
}
