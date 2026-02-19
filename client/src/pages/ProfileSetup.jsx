import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import {
    TrophyIcon,
    AcademicCapIcon,
    BuildingOffice2Icon,
    DocumentArrowUpIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

const ProfileSetup = () => {
    const { completeProfile, user } = useAuth();
    const { success, error: toastError } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm({
        defaultValues: {
            city: '',
            phone: '',
            rank: '',
            achievements: '',
            coachLevel: ''
        }
    });

    const pakistanCities = [
        'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad',
        'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala'
    ];

    // Determine which fields to show based on user's role
    const isProfessionalPlayer = user?.role === 'player' && user?.skillLevel === 'professional';
    const isCoach = user?.role === 'coach';
    const isOrganizer = user?.role === 'organizer';

    const getRoleIcon = () => {
        if (isProfessionalPlayer) return TrophyIcon;
        if (isCoach) return AcademicCapIcon;
        if (isOrganizer) return BuildingOffice2Icon;
        return TrophyIcon;
    };

    const getRoleLabel = () => {
        if (isProfessionalPlayer) return 'Professional Player';
        if (isCoach) return 'Coach';
        if (isOrganizer) return 'Court Owner / Organizer';
        return 'Profile';
    };

    const getRoleColor = () => {
        if (isProfessionalPlayer) return 'emerald';
        if (isCoach) return 'amber';
        if (isOrganizer) return 'violet';
        return 'indigo';
    };

    const RoleIcon = getRoleIcon();
    const roleColor = getRoleColor();

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const formData = new FormData();

            formData.append('city', data.city);
            if (data.phone) formData.append('phone', data.phone);

            // Append role-specific fields
            if (isProfessionalPlayer) {
                if (data.rank) formData.append('rank', data.rank);
                if (data.achievements) formData.append('achievements', data.achievements);
                if (data.verificationDocument && data.verificationDocument[0]) {
                    formData.append('verificationDocument', data.verificationDocument[0]);
                }
            } else if (isCoach) {
                if (data.coachLevel) formData.append('coachLevel', data.coachLevel);
                if (data.achievements) formData.append('achievements', data.achievements);
                if (data.verificationDocument && data.verificationDocument[0]) {
                    formData.append('verificationDocument', data.verificationDocument[0]);
                }
            } else if (isOrganizer) {
                if (data.verificationDocument && data.verificationDocument[0]) {
                    formData.append('verificationDocument', data.verificationDocument[0]);
                }
            }

            await completeProfile(formData);

            success('Profile submitted! Your account is pending admin verification.');
            navigate('/pending-verification');
        } catch (err) {
            toastError(err.response?.data?.error || 'Profile setup failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl w-full">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-8 rounded-2xl shadow-xl"
                >
                    <div className="text-center mb-8">
                        <div className={`mx-auto h-16 w-16 bg-${roleColor}-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-${roleColor}-200`}>
                            <RoleIcon className="h-9 w-9 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-3">
                            Complete Your {getRoleLabel()} Profile
                        </h1>
                        <p className="text-slate-500">
                            Provide additional details to complete your verification request.
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                        {/* Professional Player Fields */}
                        {isProfessionalPlayer && (
                            <div className="space-y-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                <h3 className="font-semibold text-emerald-900 flex items-center gap-2">
                                    <TrophyIcon className="h-5 w-5" />
                                    Professional Details
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Input
                                        label="Current Rank"
                                        placeholder="e.g. National Rank #5"
                                        {...register('rank', { required: 'Rank is required for professionals' })}
                                        error={errors.rank}
                                    />
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Verification Document *
                                        </label>
                                        <input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200"
                                            {...register('verificationDocument', { required: 'Verification document is required' })}
                                        />
                                        {errors.verificationDocument && (
                                            <p className="text-sm text-red-600 mt-1">{errors.verificationDocument.message}</p>
                                        )}
                                        <p className="text-xs text-slate-400 mt-1">Upload ID or Certificate (PDF/Image)</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Key Achievements</label>
                                    <textarea
                                        className="w-full p-4 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                                        rows="3"
                                        placeholder="List your major tournament wins or titles..."
                                        {...register('achievements')}
                                    ></textarea>
                                </div>
                            </div>
                        )}

                        {/* Coach Fields */}
                        {isCoach && (
                            <div className="space-y-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
                                <h3 className="font-semibold text-amber-900 flex items-center gap-2">
                                    <AcademicCapIcon className="h-5 w-5" />
                                    Coaching Credentials
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Input
                                        label="Certification Level"
                                        placeholder="e.g. BWF Level 1, National Certified"
                                        {...register('coachLevel', { required: 'Certification level is required' })}
                                        error={errors.coachLevel}
                                    />
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Verification Document *
                                        </label>
                                        <input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200"
                                            {...register('verificationDocument', { required: 'Verification document is required' })}
                                        />
                                        {errors.verificationDocument && (
                                            <p className="text-sm text-red-600 mt-1">{errors.verificationDocument.message}</p>
                                        )}
                                        <p className="text-xs text-slate-400 mt-1">Upload Coaching Certificate (PDF/Image)</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Experience & Achievements</label>
                                    <textarea
                                        className="w-full p-4 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                                        rows="3"
                                        placeholder="Describe your coaching background and student successes..."
                                        {...register('achievements')}
                                    ></textarea>
                                </div>
                            </div>
                        )}

                        {/* Organizer Fields */}
                        {isOrganizer && (
                            <div className="space-y-4 p-4 bg-violet-50 rounded-xl border border-violet-100">
                                <h3 className="font-semibold text-violet-900 flex items-center gap-2">
                                    <BuildingOffice2Icon className="h-5 w-5" />
                                    Business Verification
                                </h3>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Business/Venue Document *
                                    </label>
                                    <div className="border-2 border-dashed border-violet-200 rounded-xl p-6 text-center bg-white">
                                        <DocumentArrowUpIcon className="h-10 w-10 text-violet-400 mx-auto mb-3" />
                                        <input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-violet-100 file:text-violet-700 hover:file:bg-violet-200"
                                            {...register('verificationDocument', { required: 'Business document is required' })}
                                        />
                                        {errors.verificationDocument && (
                                            <p className="text-sm text-red-600 mt-2">{errors.verificationDocument.message}</p>
                                        )}
                                        <p className="text-xs text-slate-400 mt-2">Upload business license, venue ownership, or registration document</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Common Fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    City *
                                </label>
                                <select
                                    className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    {...register('city', { required: 'City is required' })}
                                >
                                    <option value="">Select your city</option>
                                    {pakistanCities.map(city => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                                    <option value="other">Other</option>
                                </select>
                                {errors.city && (
                                    <p className="text-sm text-red-600 mt-1">{errors.city.message}</p>
                                )}
                            </div>
                            <Input
                                label="Phone Number (Optional)"
                                placeholder="+92 300 1234567"
                                error={errors.phone}
                                {...register('phone')}
                            />
                        </div>

                        <Button
                            type="submit"
                            fullWidth
                            size="lg"
                            isLoading={loading}
                            className="h-14 font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200"
                        >
                            Submit for Verification
                        </Button>

                        <p className="text-center text-sm text-slate-500">
                            Your profile will be reviewed by an admin. You'll receive access once approved.
                        </p>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

export default ProfileSetup;
