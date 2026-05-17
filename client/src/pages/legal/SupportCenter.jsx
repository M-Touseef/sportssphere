import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    LifebuoyIcon,
    EnvelopeIcon,
    ChevronDownIcon,
    CalendarDaysIcon,
    TrophyIcon,
    UserGroupIcon,
    CreditCardIcon
} from '@heroicons/react/24/outline';
import LegalPageLayout, { LegalCard } from '../../components/legal/LegalPageLayout';

const faqs = [
    {
        id: 'booking',
        icon: CalendarDaysIcon,
        question: 'How do I book a court or coaching session?',
        answer:
            'Sign in, browse Courts or Coaches, select an available slot, and submit your request. For sessions with a professional player or coach, you will receive a notification when your request is accepted. Complete payment when prompted to confirm your booking.',
    },
    {
        id: 'payment',
        icon: CreditCardIcon,
        question: 'What payment methods are supported?',
        answer:
            'SportsSphere supports online payment flows including JazzCash for eligible bookings. Payment status is shown on your bookings and sessions pages. If payment fails, you can retry from the same screen or contact support with your booking reference.',
    },
    {
        id: 'sparring',
        icon: UserGroupIcon,
        question: 'How does sparring matchmaking work?',
        answer:
            'Non-professional players can find professional players and send a sparring request. The professional has 30 minutes to accept or the request is auto-cancelled. Once accepted, complete payment to lock in your slot. Check Sparring Invites in your dashboard for status updates.',
    },
    {
        id: 'tournaments',
        icon: TrophyIcon,
        question: 'How do I join a tournament?',
        answer:
            'Open Tournaments from your dashboard, choose an event, and register for your category. Pay any entry fee if required. Brackets and schedules appear on the tournament detail page once the organizer publishes them.',
    },
    {
        id: 'account',
        icon: UserGroupIcon,
        question: 'I forgot my password or cannot log in.',
        answer:
            'Use the login page and follow password recovery if available, or email support with your registered email address. For new professional or coach accounts, verification may be required before full access is granted.',
    },
    {
        id: 'cancel',
        icon: CalendarDaysIcon,
        question: 'Can I cancel a booking or session?',
        answer:
            'Cancellation depends on booking status. Pending requests can often be withdrawn before acceptance. Confirmed bookings may be subject to venue or coach policies. Check your My Schedule or Sessions page for cancel options where available.',
    },
];

const FaqItem = ({ item, isOpen, onToggle }) => (
    <div className="border border-slate-100 rounded-2xl sm:rounded-3xl bg-white overflow-hidden shadow-sm">
        <button
            type="button"
            onClick={onToggle}
            className="w-full flex items-start sm:items-center gap-4 p-5 sm:p-6 text-left hover:bg-slate-50/80 transition-colors"
            aria-expanded={isOpen}
        >
            <div className="h-10 w-10 shrink-0 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <item.icon className="h-5 w-5" />
            </div>
            <span className="flex-1 text-sm sm:text-base font-bold text-slate-900 pr-2">{item.question}</span>
            <ChevronDownIcon
                className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
            />
        </button>
        {isOpen && (
            <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
                <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed sm:pl-14">
                    {item.answer}
                </p>
            </div>
        )}
    </div>
);

const SupportCenter = () => {
    const [openId, setOpenId] = useState(faqs[0]?.id);

    return (
        <LegalPageLayout
            icon={LifebuoyIcon}
            title="Support Center"
            subtitle="Find answers to common questions or reach our team for help with bookings, payments, and your account."
            lastUpdated="May 17, 2026"
        >
            <LegalCard className="flex flex-col gap-4 max-w-xl">
                <div className="h-11 w-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                    <EnvelopeIcon className="h-6 w-6" />
                </div>
                <div>
                    <h3 className="text-lg font-black text-slate-900">Email support</h3>
                    <p className="mt-2 text-sm text-slate-600 font-medium">
                        We typically respond within 1–2 business days.
                    </p>
                </div>
                <a
                    href="mailto:support@sportssphere.com"
                    className="text-sm font-bold text-indigo-600 hover:underline break-all"
                >
                    support@sportssphere.com
                </a>
            </LegalCard>

            <div className="mt-12 sm:mt-16">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-6 sm:mb-8">
                    Frequently asked questions
                </h2>
                <div className="space-y-3 sm:space-y-4">
                    {faqs.map((item) => (
                        <FaqItem
                            key={item.id}
                            item={item}
                            isOpen={openId === item.id}
                            onToggle={() => setOpenId(openId === item.id ? null : item.id)}
                        />
                    ))}
                </div>
            </div>

            <LegalCard className="mt-12 sm:mt-16 bg-indigo-50/50 border-indigo-100">
                <p className="text-sm sm:text-base text-slate-700 font-medium leading-relaxed">
                    Still need help? Review our{' '}
                    <Link to="/privacy" className="text-indigo-600 font-bold hover:underline">
                        Privacy Policy
                    </Link>{' '}
                    and{' '}
                    <Link to="/terms" className="text-indigo-600 font-bold hover:underline">
                        Terms of Service
                    </Link>
                    , or email us with your account email and a short description of the issue.
                </p>
            </LegalCard>
        </LegalPageLayout>
    );
};

export default SupportCenter;
