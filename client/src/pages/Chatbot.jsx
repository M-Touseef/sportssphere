import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import chatService from '../services/chatService';
import Button from '../components/ui/Button';
import {
    PaperAirplaneIcon,
    PlusIcon,
    TrashIcon,
    Bars3CenterLeftIcon,
    XMarkIcon,
    SparklesIcon,
    ChatBubbleBottomCenterTextIcon,
    EllipsisHorizontalIcon
} from '@heroicons/react/24/outline';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'framer-motion';

const MotionAside = motion.aside;
const MotionDiv = motion.div;

const Chatbot = () => {
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [sending, setSending] = useState(false); // Keeps track of API request status
    const [isTyping, setIsTyping] = useState(false); // Tracks AI typing status from socket
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const messagesEndRef = useRef(null);

    // Use the custom socket hook
    // Note: ensure you import useSocket from your context file at the top
    const socket = useSocket();

    useEffect(() => {
        fetchConversations();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, sending, isTyping]);

    // Socket Event Listeners
    useEffect(() => {
        if (!socket) return;

        const onTypingStart = ({ conversationId }) => {
            if (activeConversation?._id === conversationId) {
                setIsTyping(true);
            }
        };

        const onTypingEnd = ({ conversationId }) => {
            if (activeConversation?._id === conversationId) {
                setIsTyping(false);
            }
        };

        const onReceiveMessage = ({ conversationId, message }) => {
            if (activeConversation?._id === conversationId) {
                setMessages(prev => {
                    // Check if message with this ID already exists
                    if (message._id && prev.some(m => m._id === message._id)) {
                        return prev;
                    }

                    // If it's a user message, check if we have an optimistic version to replace
                    if (message.role === 'user') {
                        const optimisticIndex = prev.findIndex(m =>
                            m.role === 'user' &&
                            m.content === message.content &&
                            !m._id
                        );
                        if (optimisticIndex !== -1) {
                            const newMessages = [...prev];
                            newMessages[optimisticIndex] = message;
                            return newMessages;
                        }
                    }

                    return [...prev, message];
                });

                // Refresh conversation list to show updated last message/count
                fetchConversations();
            }
        };

        socket.on('typing_start', onTypingStart);
        socket.on('typing_end', onTypingEnd);
        socket.on('receive_message', onReceiveMessage);

        return () => {
            socket.off('typing_start', onTypingStart);
            socket.off('typing_end', onTypingEnd);
            socket.off('receive_message', onReceiveMessage);
        };
    }, [socket, activeConversation]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchConversations = async () => {
        try {
            const data = await chatService.getConversations();
            setConversations(data.data);

            if (data.data.length > 0 && !activeConversation) {
                // Only load first conversation if we don't have one selected
                // or if we just created one (handled separately)
                // Actually, existing logic loaded the first one on mount.
                // We keep this behavior for initial load.
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
    };

    const loadConversation = async (id) => {
        try {
            const data = await chatService.getConversation(id);
            setActiveConversation(data.data);
            setMessages(data.data.messages || []);
            setIsTyping(false); // Reset typing state on switch
        } catch (error) {
            console.error('Error loading conversation:', error);
        }
    };

    const handleNewConversation = async () => {
        try {
            const data = await chatService.createConversation({
                title: 'New Session',
                initialMessage: 'Hello! Ask me about badminton rules and technique, or your SportsSphere bookings and tournaments.'
            });

            setActiveConversation(data.data);
            setMessages(data.data.messages || []);
            await fetchConversations();
            return data.data;
        } catch (error) {
            console.error('Error creating conversation:', error);
            return null;
        }
    };

    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        if (!inputMessage.trim() || !activeConversation) return;

        const userMsg = {
            role: 'user',
            content: inputMessage,
            timestamp: new Date()
            // No _id implies optimistic
        };

        try {
            setSending(true);
            // Optimistic update
            setMessages(prev => [...prev, userMsg]);
            setInputMessage('');

            const data = await chatService.sendMessage(activeConversation._id, inputMessage);

            // Update the optimistic user message and append the HTTP assistant reply.
            // Socket events are still useful for sync; _id checks keep duplicates out.
            setMessages(prev => {
                let nextMessages = prev;
                const index = prev.findIndex(m => m === userMsg);
                if (index !== -1) {
                    nextMessages = [...prev];
                    nextMessages[index] = data.data.userMessage;
                }

                const aiMessage = data.data.aiMessage;
                if (aiMessage?._id && nextMessages.some(m => m._id === aiMessage._id)) {
                    return nextMessages;
                }

                return aiMessage ? [...nextMessages, aiMessage] : nextMessages;
            });

            await fetchConversations();
        } catch (error) {
            console.error('Error sending message:', error);
            // Revert optimistic update on error if needed, or show error state
        } finally {
            setSending(false);
        }
    };

    const handleDeleteConversation = async (id) => {
        if (!window.confirm('Delete this conversation? All session data will be cleared.')) return;
        try {
            await chatService.deleteConversation(id);
            if (activeConversation?._id === id) {
                setActiveConversation(null);
                setMessages([]);
            }
            await fetchConversations();
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const formatShortTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    };

    const sourceLabel = (source) => {
        if (source === 'database') return 'Live data';
        if (source === 'rag') return 'Knowledge base';
        if (source === 'gemini') return 'Gemini AI';
        if (source === 'deepseek') return 'Legacy AI';
        if (source === 'rules') return 'Assistant';
        return null;
    };

    const suggestedPrompts = [
        { label: 'My court bookings', text: 'What are my upcoming court bookings?' },
        { label: 'Badminton rules', text: 'Explain badminton scoring rules' },
        { label: 'Courts near me', text: 'List available courts on SportsSphere' },
        { label: 'Improve smash', text: 'How can I improve my smash technique?' },
        { label: 'My tournaments', text: 'Which tournaments am I registered for?' },
        { label: 'Find coaches', text: 'Show coaches on SportsSphere' }
    ];

    const sendSuggested = (text) => {
        if (!activeConversation || sending) return;
        setInputMessage(text);
    };

    return (
        <div className="flex h-[calc(100vh-80px)] bg-slate-50/50 text-slate-900 transition-all duration-300 overflow-hidden rounded-[2.5rem] border border-slate-100 shadow-2xl m-4">
            {/* Context Sidebar */}
            <AnimatePresence>
                {sidebarOpen && (
                    <MotionAside
                        initial={{ x: -300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -300, opacity: 0 }}
                        className="fixed inset-y-0 left-0 z-50 md:relative w-80 flex flex-col bg-white border-r border-slate-100 shadow-[1px_0_10px_rgba(0,0,0,0.02)]"
                    >
                        <div className="p-6 border-b border-slate-50">
                            <div className="flex items-center justify-between mb-6 px-1">
                                <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Conversations</h2>
                                <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2 hover:bg-slate-50 rounded-xl transition-colors">
                                    <XMarkIcon className="h-5 w-5 text-slate-400" />
                                </button>
                            </div>
                            <Button
                                onClick={handleNewConversation}
                                fullWidth
                                className="h-12 gap-2 shadow-lg shadow-indigo-100 rounded-2xl font-bold bg-indigo-600 hover:bg-indigo-700"
                            >
                                <PlusIcon className="h-4 w-4" />
                                New Chat
                            </Button>
                        </div>

                        <nav className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
                            {conversations.map((conv) => (
                                <div
                                    key={conv._id}
                                    onClick={() => loadConversation(conv._id)}
                                    className={twMerge(
                                        "group p-4 rounded-2xl cursor-pointer transition-all border relative overflow-hidden",
                                        activeConversation?._id === conv._id
                                            ? "bg-indigo-50 border-indigo-100 shadow-sm"
                                            : "bg-transparent border-transparent hover:bg-slate-50"
                                    )}
                                >
                                    <div className="flex justify-between items-start gap-4">
                                        <p className={twMerge(
                                            "text-sm font-bold truncate transition-colors",
                                            activeConversation?._id === conv._id ? "text-indigo-600" : "text-slate-700"
                                        )}>
                                            {conv.title}
                                        </p>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conv._id); }}
                                            className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-500 transition-all"
                                        >
                                            <TrashIcon className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-3 mt-2">
                                        <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                                            <ChatBubbleBottomCenterTextIcon className="h-3 w-3" />
                                            {conv.messageCount} msg
                                        </div>
                                        <div className="h-1 w-1 rounded-full bg-slate-200" />
                                        <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                                            {new Date(conv.updatedAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </nav>
                    </MotionAside>
                )}
            </AnimatePresence>

            {/* Chat Interface */}
            <main className="flex-1 flex flex-col h-full bg-white relative">
                {/* Header */}
                <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-50 px-8 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        {!sidebarOpen && (
                            <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-slate-50 rounded-xl transition-all border border-slate-100 mr-2">
                                <Bars3CenterLeftIcon className="h-5 w-5 text-slate-500" />
                            </button>
                        )}
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                                <SparklesIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <h1 className="text-base font-bold text-slate-900 tracking-tight">AI Sport Assistant</h1>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <div className={twMerge(
                                        "h-1.5 w-1.5 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.3)]",
                                        socket ? "bg-emerald-500" : "bg-amber-500"
                                    )} />
                                    <span className={twMerge(
                                        "text-[10px] font-bold uppercase tracking-widest",
                                        socket ? "text-emerald-600" : "text-amber-600"
                                    )}>
                                        {socket ? 'Active Link' : 'Connecting...'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            title="Options"
                            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all"
                        >
                            <EllipsisHorizontalIcon className="h-5 w-5" />
                        </button>
                    </div>
                </header>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto px-6 md:px-12 py-10 space-y-8 custom-scrollbar bg-slate-50/20">
                    {!activeConversation ? (
                        <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto pb-20">
                            <div className="h-24 w-24 bg-white shadow-2xl rounded-[2.5rem] flex items-center justify-center mb-8 border border-slate-100 transform -rotate-3">
                                <SparklesIcon className="h-12 w-12 text-indigo-600" />
                            </div>
                            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-4">Hybrid AI Assistant</h2>
                            <p className="text-slate-500 font-medium mb-6 leading-relaxed text-lg">
                                Ask badminton questions (rules, technique, equipment) — answered from our knowledge base.
                                Ask about SportsSphere — bookings, courts, coaches, and tournaments — answered from live data.
                            </p>
                            <div className="flex flex-wrap justify-center gap-2 mb-10 max-w-lg">
                                {suggestedPrompts.map((item) => (
                                    <button
                                        key={item.label}
                                        type="button"
                                        onClick={async () => {
                                            const conv = await handleNewConversation();
                                            if (conv) setInputMessage(item.text);
                                        }}
                                        className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-700 transition-colors"
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                            <Button size="lg" onClick={handleNewConversation} className="px-10 h-14 font-bold shadow-xl shadow-indigo-100 rounded-2xl bg-indigo-600 hover:bg-indigo-700">
                                Start Session
                            </Button>
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto space-y-8 pb-10">
                            {messages.map((msg, idx) => (
                                <MotionDiv
                                    key={idx}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={twMerge(
                                        "flex gap-4",
                                        msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                                    )}
                                >
                                    <div className={twMerge(
                                        "h-9 w-9 shrink-0 rounded-xl flex items-center justify-center shadow-sm border mt-1",
                                        msg.role === 'user'
                                            ? "bg-slate-900 text-white border-slate-900"
                                            : "bg-white border-slate-100 text-indigo-600"
                                    )}>
                                        {msg.role === 'user' ? <span className="text-[10px] font-bold">ME</span> : <SparklesIcon className="h-4.5 w-4.5" />}
                                    </div>

                                    <div className={twMerge(
                                        "flex flex-col gap-2 max-w-[80%]",
                                        msg.role === 'user' ? "items-end" : "items-start"
                                    )}>
                                        <div className={twMerge(
                                            "px-5 py-4 rounded-2xl text-[14px] font-medium leading-[1.6] shadow-sm transition-all border",
                                            msg.role === 'user'
                                                ? "bg-indigo-600 text-white border-indigo-600 rounded-tr-none"
                                                : "bg-white border-slate-100 text-slate-800 rounded-tl-none"
                                        )}>
                                            {msg.content}
                                        </div>
                                        <div className="px-1 flex items-center gap-2">
                                            {msg.role === 'assistant' && sourceLabel(msg.source) && (
                                                <span className={twMerge(
                                                    'text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full',
                                                    msg.source === 'database'
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : msg.source === 'gemini' || msg.source === 'deepseek'
                                                            ? 'bg-sky-50 text-sky-700'
                                                        : msg.source === 'rag'
                                                            ? 'bg-violet-50 text-violet-700'
                                                            : 'bg-slate-100 text-slate-500'
                                                )}>
                                                    {sourceLabel(msg.source)}
                                                </span>
                                            )}
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                                {formatShortTime(msg.timestamp || new Date())}
                                            </span>
                                        </div>
                                    </div>
                                </MotionDiv>
                            ))}

                            {(isTyping || sending) && (
                                <MotionDiv
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex gap-4"
                                >
                                    <div className="h-9 w-9 shrink-0 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-indigo-600 shadow-sm">
                                        <SparklesIcon className="h-4.5 w-4.5" />
                                    </div>
                                    <div className="bg-white border border-slate-100 px-6 py-4 rounded-2xl rounded-tl-none shadow-sm flex items-center">
                                        <div className="flex gap-1.5">
                                            <MotionDiv
                                                animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }}
                                                transition={{ repeat: Infinity, duration: 1 }}
                                                className="h-1.5 w-1.5 rounded-full bg-indigo-600"
                                            />
                                            <MotionDiv
                                                animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }}
                                                transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                                                className="h-1.5 w-1.5 rounded-full bg-indigo-600"
                                            />
                                            <MotionDiv
                                                animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }}
                                                transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                                                className="h-1.5 w-1.5 rounded-full bg-indigo-600"
                                            />
                                        </div>
                                    </div>
                                </MotionDiv>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Input Area */}
                {activeConversation && (
                    <div className="p-8 md:px-12 bg-white">
                        <div className="max-w-4xl mx-auto">
                            <div className="flex flex-wrap gap-2 mb-4">
                                {suggestedPrompts.map((item) => (
                                    <button
                                        key={item.label}
                                        type="button"
                                        disabled={sending}
                                        onClick={() => sendSuggested(item.text)}
                                        className="text-[10px] font-bold px-3 py-1.5 rounded-lg border border-slate-100 bg-slate-50 text-slate-500 hover:border-indigo-200 hover:text-indigo-700 disabled:opacity-50 transition-colors"
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                            <form
                                onSubmit={handleSendMessage}
                                className="relative bg-white border border-slate-200 rounded-2xl p-2 flex items-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] focus-within:border-indigo-500/50 focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all duration-300"
                            >
                                <input
                                    type="text"
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    placeholder="Badminton tips, rules, your bookings, courts, coaches..."
                                    className="flex-1 bg-transparent px-4 py-3 border-none ring-0 focus:ring-0 font-medium text-slate-800 placeholder:text-slate-400 text-sm h-12"
                                    disabled={sending}
                                />
                                <button
                                    type="submit"
                                    disabled={sending || !inputMessage.trim()}
                                    className={twMerge(
                                        "h-12 px-6 rounded-xl flex items-center justify-center transition-all duration-300 font-bold text-sm",
                                        sending || !inputMessage.trim()
                                            ? "bg-slate-50 text-slate-300 cursor-not-allowed"
                                            : "bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700"
                                    )}
                                >
                                    <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                                    Send
                                </button>
                            </form>
                            <p className="text-center text-[10px] font-semibold text-slate-400 mt-4 uppercase tracking-[0.2em]">SportsSphere AI Intelligence Core</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Chatbot;
