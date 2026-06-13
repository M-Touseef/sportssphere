import React, { useState, useRef, useEffect } from 'react';
import {
    PaperAirplaneIcon,
    ChatBubbleLeftRightIcon,
    XMarkIcon,
    MinusIcon,
    SparklesIcon,
    BoltIcon,
    Bars3CenterLeftIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../services/axiosInstance';
import { motion, AnimatePresence } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

const MotionButton = motion.button;
const MotionDiv = motion.div;

const MessageBubble = ({ message }) => {
    const isUser = message.sender === 'user';

    return (
        <MotionDiv
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={twMerge(
                "flex w-full mb-6 gap-3",
                isUser ? "flex-row-reverse" : "flex-row"
            )}
        >
            <div className={twMerge(
                "h-8 w-8 shrink-0 rounded-xl flex items-center justify-center text-xs font-black shadow-sm border",
                isUser
                    ? "bg-primary text-primary-foreground border-primary/20"
                    : "bg-muted text-muted-foreground border-border"
            )}>
                {isUser ? 'ME' : <SparklesIcon className="h-4 w-4" />}
            </div>

            <div className={twMerge(
                "flex flex-col gap-1.5 max-w-[80%]",
                isUser ? "items-end" : "items-start"
            )}>
                <div className={twMerge(
                    "px-4 py-3 rounded-2xl text-[13px] font-medium leading-relaxed shadow-sm transition-all",
                    isUser
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : "bg-card border border-border text-foreground rounded-tl-none"
                )}>
                    {message.text}
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50 px-1">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
        </MotionDiv>
    );
};

const TypingIndicator = () => (
    <MotionDiv
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-3 mb-6"
    >
        <div className="h-8 w-8 shrink-0 rounded-xl bg-muted flex items-center justify-center border border-border">
            <SparklesIcon className="h-4 w-4 text-primary animate-pulse" />
        </div>
        <div className="bg-muted/50 p-4 rounded-2xl rounded-tl-none border border-border/50">
            <div className="flex gap-1.5">
                <MotionDiv
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                    className="h-1.5 w-1.5 rounded-full bg-primary/40"
                />
                <MotionDiv
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                    className="h-1.5 w-1.5 rounded-full bg-primary/40"
                />
                <MotionDiv
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                    className="h-1.5 w-1.5 rounded-full bg-primary/40"
                />
            </div>
        </div>
    </MotionDiv>
);

export default function ChatWindow() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, sender: 'bot', text: "Hi! I'm your SportsSphere Assistant. How can I help you with your game today?", timestamp: new Date() }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [conversationId, setConversationId] = useState(null);
    const messagesEndRef = useRef(null);
    const { isAuthenticated } = useAuth();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isTyping, isOpen]);

    useEffect(() => {
        if (isOpen && isAuthenticated && !conversationId) {
            createConversation();
        }
    }, [isOpen, isAuthenticated]);

    const createConversation = async () => {
        try {
            const response = await axiosInstance.post('/chat/conversations', {
                title: 'AI Chat'
            });
            setConversationId(response.data.data._id);
        } catch (error) {
            console.error('Failed to create conversation:', error);
        }
    };

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userMsg = {
            id: Date.now(),
            sender: 'user',
            text: inputValue,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsTyping(true);

        try {
            if (isAuthenticated && conversationId) {
                const response = await axiosInstance.post(`/chat/conversations/${conversationId}/messages`, {
                    message: userMsg.text
                });

                const botMsg = {
                    id: Date.now() + 1,
                    sender: 'bot',
                    text: response.data.data.aiMessage.content,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, botMsg]);
            } else {
                setTimeout(() => {
                    const botMsg = {
                        id: Date.now() + 1,
                        sender: 'bot',
                        text: 'Please log in to your account for personalized coaching and strategy advice.',
                        timestamp: new Date()
                    };
                    setMessages(prev => [...prev, botMsg]);
                    setIsTyping(false);
                }, 1000);
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                sender: 'bot',
                text: "Sorry, I couldn't send that. Please try again.",
                timestamp: new Date()
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="fixed bottom-8 right-8 z-[9999]">
            <AnimatePresence>
                {!isOpen && (
                    <MotionButton
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 45 }}
                        onClick={() => setIsOpen(true)}
                        className="h-16 w-16 bg-primary text-primary-foreground rounded-[1.5rem] shadow-2xl flex items-center justify-center hover:scale-110 transition-transform shadow-primary/30"
                    >
                        <SparklesIcon className="h-8 w-8" />
                        <div className="absolute -top-1 -right-1 h-4 w-4 bg-accent rounded-full border-2 border-background animate-pulse" />
                    </MotionButton>
                )}

                {isOpen && (
                    <MotionDiv
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        className="w-80 sm:w-[400px] h-[600px] bg-background border border-border rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-enter"
                    >
                        {/* Header */}
                        <div className="px-6 py-5 bg-card/80 backdrop-blur-xl border-b border-border flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                                    <SparklesIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-widest leading-none">Sphere AI</h3>
                                    <div className="flex items-center gap-1.5 mt-1.5">
                                        <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse" />
                                        <span className="text-[10px] font-black text-green-500 uppercase">Assistant Online</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-muted rounded-xl transition-colors text-muted-foreground hover:text-foreground"
                            >
                                <MinusIcon className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-2 custom-scrollbar bg-background/50">
                            {messages.map(msg => (
                                <MessageBubble key={msg.id} message={msg} />
                            ))}
                            <AnimatePresence>
                                {isTyping && <TypingIndicator />}
                            </AnimatePresence>
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-5 bg-card/60 backdrop-blur-xl border-t border-border">
                            <form
                                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                className="relative flex items-center gap-2"
                            >
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        placeholder="Type your message..."
                                        className="w-full h-12 pl-5 pr-12 rounded-2xl bg-muted/50 border border-border font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:font-normal placeholder:opacity-50"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!inputValue.trim()}
                                        className="absolute right-1.5 top-1.5 h-9 w-9 bg-primary text-primary-foreground rounded-xl flex items-center justify-center disabled:opacity-30 transition-all hover:scale-[1.05] active:scale-95"
                                    >
                                        <PaperAirplaneIcon className="h-4 w-4 -rotate-12" />
                                    </button>
                                </div>
                            </form>
                            <p className="mt-3 text-center text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-30">
                                SportsSphere AI Support
                            </p>
                        </div>
                    </MotionDiv>
                )}
            </AnimatePresence>
        </div>
    );
}
