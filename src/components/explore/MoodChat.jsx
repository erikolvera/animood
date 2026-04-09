import { useEffect, useState } from "react";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, TransitionChild } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useNavigate, useSearchParams } from "react-router-dom";
// import ExploreControls from "./ExploreControls";
// import AnimeSection from "./AnimeSection";


export default function MoodBot() {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState("")
    const [isThinking, setIsThinking] = useState(false)
    const [messages, setMessages] = useState([
        { role: "assistant", content: "Hi! I'm MoodBot. Tell me what kind of mood you're in and I'll recommend some anime!" }
    ])

    return (
        <div>
            <button 
            onClick={() => setOpen(true)}
            className="rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-[2px]">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-[#fefcf4] px-2 py-0.5 text-sm text-black">
                    MoodBot
                </div>
            </button>

            <Dialog open={open} onClose={setOpen} className="relative z-10">
                <DialogBackdrop
                    transition
                    className="inset-0 bg-gray-900/50 transition-opacity duration-500 ease-in-out data-closed:opacity-0"
                />

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
                            <DialogPanel
                                transition
                                className="pointer-events-auto relative w-screen max-w-md transform transition duration-500 ease-in-out data-closed:translate-x-full sm:duration-700"
                            >
                                <TransitionChild>
                                    <div className="absolute top-0 left-0 -ml-8 flex pt-4 pr-2 duration-500 ease-in-out data-closed:opacity-0 sm:-ml-10 sm:pr-4">
                                        <button
                                            type="button"
                                            onClick={() => setOpen(false)}
                                            className="relative rounded-md text-gray-400 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                                        >
                                            <span className="absolute -inset-2.5" />
                                            <span className="sr-only">Close panel</span>
                                            <XMarkIcon aria-hidden="true" className="size-6" />
                                        </button>
                                    </div>
                                </TransitionChild>
                                <div className="relative flex h-full flex-col overflow-y-auto bg-gray-800 py-6 shadow-xl after:absolute after:inset-y-0 after:left-0 after:w-px after:bg-white/10">
                                    <div className="px-4 sm:px-6">
                                        <DialogTitle className="text-base font-semibold text-white">Panel title</DialogTitle>
                                    </div>
                                    <div className="relative mt-6 flex-1 px-4 sm:px-6">{/* Your content */}</div>
                                </div>
                            </DialogPanel>
                        </div>
                    </div>
                </div>
            </Dialog>
        </div>
    )

}