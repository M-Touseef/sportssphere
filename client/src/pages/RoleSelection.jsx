import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import {
    UserGroupIcon,
    AcademicCapIcon,
    TrophyIcon,
    BuildingOffice2Icon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

const RoleSelection = () => {
    const { selectRole } = useAuth();
    const { success, error: toastError } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);
    const [selectedSkillLevel, setSelectedSkillLevel] = useState(null);

    const roleOptions = [
        {
            id: 'non-professional',
            role: 'player',
            skillLevel: 'non-professional',
            label: 'Non-Professional Player',
            description: 'Casual player looking for courts and sparring partners. Get started immediately!',
            icon: UserGroupIcon,
            color: 'indigo',
            instant: true
        },
        {
            id: 'professional',
            role: 'player',
            skillLevel: 'professional',
            label: 'Professional Player',
            description: 'Elite player seeking tournaments and competitive matches. Requires verification.',
            icon: TrophyIcon,
            color: 'emerald',
            instant: false
        },
        {
            id: 'coach',
            role: 'coach',
            skillLevel: null,
            label: 'Coach',
            description: 'Certified coach offering training sessions. Requires verification.',
            icon: AcademicCapIcon,
            color: 'amber',
            instant: false
        },
        {
            id: 'organizer',
            role: 'organizer',
            skillLevel: null,
            label: 'Court Owner / Organizer',
            description: 'Venue owner or tournament organizer. Requires verification.',
            icon: BuildingOffice2Icon,
            color: 'violet',
            instant: false
        }
    ];

    const handleRoleSelect = (option) => {
        setSelectedRole(option.role);
        setSelectedSkillLevel(option.skillLevel);
    };

    const handleSubmit = async () => {
        if (!selectedRole) {
            toastError('Please select a role to continue');
            return;
        }

        setLoading(true);
        try {
            const roleData = { role: selectedRole };
            if (selectedSkillLevel) {
                roleData.skillLevel = selectedSkillLevel;
            }

            await selectRole(roleData);

            // Determine next step based on role
            const selectedOption = roleOptions.find(
                opt => opt.role === selectedRole && opt.skillLevel === selectedSkillLevel
            );

            if (selectedOption?.instant) {
                // Non-professional players go directly to dashboard
                success('Welcome to SportSphere! You\'re all set.');
                navigate('/app');
            } else {
                // Others need to complete their profile
                success('Role selected! Please complete your profile.');
                navigate('/profile-setup');
            }
        } catch (err) {
            toastError(err.response?.data?.error || 'Failed to select role. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getSelectedOption = () => {
        return roleOptions.find(
            opt => opt.role === selectedRole && opt.skillLevel === selectedSkillLevel
        );
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl w-full">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10"
                >
                    <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-200">
                        <TrophyIcon className="h-9 w-9 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-3">
                        How will you use SportSphere?
                    </h1>
                    <p className="text-slate-500 max-w-md mx-auto">
                        Select your role to personalize your experience. You can always update this later.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    {roleOptions.map((option, index) => (
                        <motion.div
                            key={option.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <button
                                type="button"
                                onClick={() => handleRoleSelect(option)}
                                className={twMerge(
                                    "w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 relative",
                                    getSelectedOption()?.id === option.id
                                        ? `border-${option.color}-500 bg-${option.color}-50 shadow-lg`
                                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                                )}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={twMerge(
                                        "flex-shrink-0 h-12 w-12 rounded-xl flex items-center justify-center",
                                        getSelectedOption()?.id === option.id
                                            ? `bg-${option.color}-100`
                                            : "bg-slate-100"
                                    )}>
                                        <option.icon className={twMerge(
                                            "h-6 w-6",
                                            getSelectedOption()?.id === option.id
                                                ? `text-${option.color}-600`
                                                : "text-slate-500"
                                        )} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className={twMerge(
                                                "font-semibold",
                                                getSelectedOption()?.id === option.id
                                                    ? `text-${option.color}-900`
                                                    : "text-slate-800"
                                            )}>
                                                {option.label}
                                            </h3>
                                            {option.instant && (
                                                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                                                    Instant
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-500 mt-1">
                                            {option.description}
                                        </p>
                                    </div>
                                </div>
                                {getSelectedOption()?.id === option.id && (
                                    <CheckCircleIcon className={`absolute top-4 right-4 h-6 w-6 text-${option.color}-600`} />
                                )}
                            </button>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <Button
                        onClick={handleSubmit}
                        fullWidth
                        size="lg"
                        isLoading={loading}
                        disabled={!selectedRole}
                        className="h-14 font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {getSelectedOption()?.instant ? 'Get Started' : 'Continue to Profile Setup'}
                    </Button>
                </motion.div>

                {getSelectedOption() && !getSelectedOption().instant && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center text-sm text-slate-500 mt-4"
                    >
                        Your account will require admin verification before you can access all features.
                    </motion.p>
                )}
            </div>
        </div>
    );
};

export default RoleSelection;
