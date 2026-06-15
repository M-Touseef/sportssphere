import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import tournamentService from '../services/tournamentService';
import courtService from '../services/courtService';
import uploadService from '../services/uploadService';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import {
    TrophyIcon,
    CalendarDaysIcon,
    MapPinIcon,
    EnvelopeIcon,
    PhoneIcon,
    Bars3CenterLeftIcon,
    PlusIcon,
    TrashIcon,
    InformationCircleIcon,
    PhotoIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import {
    TOURNAMENT_GRADES,
    TOURNAMENT_FORMAT,
    TOURNAMENT_FORMAT_LABEL,
    validateMobile11Digits
} from '../shared/constants';
import OrganizerPageHeader from '../components/organizer/OrganizerPageHeader';

const TOURNAMENT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const TOURNAMENT_IMAGE_MAX_SIZE = 5 * 1024 * 1024;

const CreateTournament = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { success, error: toastError } = useToast();
    const [loading, setLoading] = useState(false);
    const [myCourts, setMyCourts] = useState([]);
    const [courtsLoading, setCourtsLoading] = useState(true);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const fileInputRef = useRef(null);

    const {
        register,
        control,
        handleSubmit,
        watch,
        formState: { errors }
    } = useForm({
        defaultValues: {
            name: '',
            description: '',
            startDate: '',
            endDate: '',
            registrationDeadline: '',
            court: '',
            format: TOURNAMENT_FORMAT,
            rules: '',
            contactEmail: user?.email || '',
            contactPhone: '',
            banner: '',
            categories: [{
                name: 'mens_singles',
                maxParticipants: 16,
                entryFee: 0,
                skillLevel: 'division',
                prizePool: { first: 0, second: 0, third: 0 }
            }]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "categories"
    });

    const selectedCourtId = watch('court');

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await courtService.getMyCourts();
                if (!cancelled && res?.data) setMyCourts(res.data);
            } catch (e) {
                console.error(e);
                if (!cancelled) toastError('Could not load your courts.');
            } finally {
                if (!cancelled) setCourtsLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [toastError]);

    const selectedCourt = myCourts.find((c) => String(c._id) === String(selectedCourtId));

    useEffect(() => {
        return () => {
            if (imagePreview) URL.revokeObjectURL(imagePreview);
        };
    }, [imagePreview]);

    const handleImageChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!TOURNAMENT_IMAGE_TYPES.includes(file.type)) {
            toastError('Tournament image must be JPG, JPEG, PNG, or WEBP.');
            event.target.value = '';
            return;
        }

        if (file.size > TOURNAMENT_IMAGE_MAX_SIZE) {
            toastError('Tournament image must be 5MB or smaller.');
            event.target.value = '';
            return;
        }

        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const removeImage = () => {
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImageFile(null);
        setImagePreview('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            if (!data.court) {
                toastError('Please select a venue court.');
                setLoading(false);
                return;
            }
            const payload = {
                ...data,
                contactPhone: String(data.contactPhone || '').replace(/\D/g, '')
            };

            if (imageFile) {
                payload.banner = await uploadService.uploadSingleImage(imageFile);
            }

            await tournamentService.createTournament(payload);
            success('Tournament created successfully. Redirecting to your tournaments.');
            setTimeout(() => navigate('/app/tournaments'), 2000);
        } catch (error) {
            toastError(error.response?.data?.error || 'Failed to create tournament.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto max-w-[1200px] space-y-6 pb-10">
            <OrganizerPageHeader
                eyebrow="Event builder"
                title="Create tournament"
                description="Choose one of your courts as the venue, then set dates, divisions, prizes, media, and contact details."
                icon={TrophyIcon}
                actions={<Link to="/app/tournaments" className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-bold text-white hover:bg-white/10">My tournaments</Link>}
            />

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-10 pb-20">
                {/* Basic Intel */}
                <div className="space-y-8 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)] md:p-8">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-6">
                        <InformationCircleIcon className="h-5 w-5 text-sky-700" />
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-foreground">Tournament details</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="md:col-span-2">
                            <Input
                                label="Tournament Title"
                                placeholder="e.g. Winter Masters Open 2025"
                                error={errors.name}
                                {...register('name', { required: 'Championship title is mandatory' })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Strategic Description</label>
                                <textarea
                                    className="w-full rounded-xl border border-input bg-background p-4 font-bold text-sm min-h-[120px] focus:ring-2 focus:ring-primary outline-none transition-all placeholder:font-normal"
                                    placeholder="Describe the event for players..."
                                    {...register('description', { required: 'Tournament description is required' })}
                                />
                                {errors.description && <p className="text-[10px] font-black text-destructive uppercase pl-1">{errors.description.message}</p>}
                            </div>
                        </div>

                        <div className="md:col-span-2 space-y-3">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1 flex items-center gap-2">
                                <PhotoIcon className="h-4 w-4" aria-hidden />
                                Tournament Image
                            </label>
                            {imagePreview ? (
                                <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
                                    <img
                                        src={imagePreview}
                                        alt="Tournament preview"
                                        className="h-56 w-full object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-950/75 text-white shadow-lg transition-colors hover:bg-rose-600"
                                        aria-label="Remove tournament image"
                                    >
                                        <XMarkIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex min-h-44 w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 text-center transition-all hover:border-sky-400 hover:bg-sky-50"
                                >
                                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 text-sky-200 shadow-lg shadow-slate-200">
                                        <PhotoIcon className="h-6 w-6" />
                                    </span>
                                    <span className="text-sm font-bold text-slate-800">Upload tournament image</span>
                                    <span className="text-xs font-medium text-slate-500">JPG, JPEG, PNG, or WEBP. Max 5MB.</span>
                                </button>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={handleImageChange}
                            />
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1 flex items-center gap-2">
                                <MapPinIcon className="h-4 w-4" aria-hidden />
                                Venue
                            </label>
                            <select
                                disabled={courtsLoading}
                                className="w-full h-11 px-4 rounded-xl border border-input bg-background font-bold text-sm focus:ring-2 focus:ring-primary outline-none transition-all disabled:opacity-60"
                                {...register('court', { required: 'Select the court that will host this tournament' })}
                            >
                                <option value="">{courtsLoading ? 'Loading your courts…' : 'Select your court…'}</option>
                                {myCourts.map((c) => (
                                    <option key={c._id} value={c._id}>
                                        {c.name} — {c.location?.area || 'Lahore'}
                                    </option>
                                ))}
                            </select>
                            {errors.court && (
                                <p className="text-[10px] font-black text-destructive uppercase pl-1">{errors.court.message}</p>
                            )}
                            {!courtsLoading && myCourts.length === 0 && (
                                <p className="text-sm text-muted-foreground mt-2">
                                    You do not have any courts yet.{' '}
                                    <Link to="/org/courts/create" className="text-primary font-bold underline-offset-2 hover:underline">
                                        Add a court listing
                                    </Link>{' '}
                                    first, then return here.
                                </p>
                            )}
                            {selectedCourt && (
                                <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-xs font-medium text-emerald-800">
                                    <p>
                                        Venue: <span className="font-bold">{selectedCourt.location?.address}, {selectedCourt.location?.area || 'Lahore'}, Lahore</span>
                                    </p>
                                    <p className="mt-1">This is your court. No court booking or venue payment is required to host the tournament.</p>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:col-span-2">
                            <Input
                                label="Start Date"
                                type="date"
                                error={errors.startDate}
                                {...register('startDate', { required: 'Operation start date is mandatory' })}
                            />
                            <Input
                                label="End Date"
                                type="date"
                                error={errors.endDate}
                                {...register('endDate', { required: 'Operation end date is mandatory' })}
                            />
                            <Input
                                label="Reg. Deadline"
                                type="date"
                                error={errors.registrationDeadline}
                                helperText="Final recruitment window"
                                {...register('registrationDeadline', { required: 'Deadline is required' })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Tournament Format</label>
                            <input type="hidden" {...register('format')} value={TOURNAMENT_FORMAT} />
                            <div className="flex h-11 items-center px-4 rounded-xl border border-input bg-muted/40 font-bold text-sm text-foreground">
                                {TOURNAMENT_FORMAT_LABEL}
                            </div>
                            <p className="text-xs text-muted-foreground pl-1">
                                All tournaments use knockout single elimination.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Categories */}
                <div className="space-y-8 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)] md:p-8">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                        <div className="flex items-center gap-3">
                            <Bars3CenterLeftIcon className="h-5 w-5 text-sky-700" />
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-foreground">Divisions & Categories</h3>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => append({
                                name: 'mens_singles',
                                maxParticipants: 16,
                                entryFee: 0,
                                skillLevel: 'division',
                                prizePool: { first: 0, second: 0, third: 0 }
                            })}
                            className="gap-2"
                        >
                            <PlusIcon className="h-4 w-4" />
                            Add Tier
                        </Button>
                    </div>

                    <div className="space-y-6">
                        <AnimatePresence mode="popLayout">
                            {fields.map((field, index) => (
                                <Motion.div
                                    key={field.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="group relative space-y-6 rounded-2xl border border-slate-200 bg-slate-50 p-6"
                                >
                                    {fields.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => remove(index)}
                                            className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-destructive transition-colors"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Division Type</label>
                                            <select
                                                className="w-full h-11 px-4 rounded-xl border border-input bg-background font-bold text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                                                {...register(`categories.${index}.name`)}
                                            >
                                                <option value="mens_singles">Men's Singles</option>
                                                <option value="womens_singles">Women's Singles</option>
                                                <option value="mens_doubles">Men's Doubles</option>
                                                <option value="womens_doubles">Women's Doubles</option>
                                                <option value="mixed_doubles">Mixed Doubles</option>
                                                <option value="junior_boys">Junior Boys</option>
                                                <option value="junior_girls">Junior Girls</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Max Capacity</label>
                                            <select
                                                className="w-full h-11 px-4 rounded-xl border border-input bg-background font-bold text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                                                {...register(`categories.${index}.maxParticipants`)}
                                            >
                                                {[4, 8, 16, 32, 64, 128].map(n => <option key={n} value={n}>{n} Units</option>)}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Skill Grade</label>
                                            <select
                                                className="w-full h-11 px-4 rounded-xl border border-input bg-background font-bold text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                                                {...register(`categories.${index}.skillLevel`, { required: 'Tactical grade is required' })}
                                            >
                                                {TOURNAMENT_GRADES.map((grade) => (
                                                    <option key={grade.value} value={grade.value}>
                                                        {grade.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <Input
                                            label="Player Entry Fee (Rs.)"
                                            type="number"
                                            {...register(`categories.${index}.entryFee`, { valueAsNumber: true })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-border/50">
                                        <Input
                                            label="1st Prize"
                                            type="number"
                                            placeholder="Winner bounty"
                                            {...register(`categories.${index}.prizePool.first`, { valueAsNumber: true })}
                                        />
                                        <Input
                                            label="2nd Prize"
                                            type="number"
                                            placeholder="Runner-up bounty"
                                            {...register(`categories.${index}.prizePool.second`, { valueAsNumber: true })}
                                        />
                                        <Input
                                            label="3rd Prize"
                                            type="number"
                                            placeholder="Semifinalist bounty"
                                            {...register(`categories.${index}.prizePool.third`, { valueAsNumber: true })}
                                        />
                                    </div>
                                </Motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Comms Intel */}
                <div className="space-y-8 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)] md:p-8">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-6">
                        <EnvelopeIcon className="h-5 w-5 text-sky-700" />
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-foreground">Contact & Rules</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Input
                            label="Contact Email"
                            type="email"
                            error={errors.contactEmail}
                            {...register('contactEmail', { required: 'Liaison email is mandatory' })}
                        />
                        <Input
                            label="Contact Phone"
                            placeholder="03XXXXXXXXX"
                            type="tel"
                            inputMode="numeric"
                            maxLength={11}
                            error={errors.contactPhone}
                            {...register('contactPhone', {
                                required: 'Mobile number is required',
                                validate: validateMobile11Digits
                            })}
                        />
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Tournament Rules</label>
                            <textarea
                                className="w-full rounded-xl border border-input bg-background p-4 font-bold text-sm min-h-[160px] focus:ring-2 focus:ring-primary outline-none transition-all placeholder:font-normal"
                                placeholder="Add rules and useful instructions for participants..."
                                {...register('rules')}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-6 pt-10">
                    <button
                        type="button"
                        onClick={() => navigate('/app/tournaments')}
                        className="text-sm font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
                    >
                        Cancel
                    </button>
                    <Button
                        type="submit"
                        size="lg"
                        isLoading={loading}
                        disabled={courtsLoading || myCourts.length === 0}
                        className="h-14 rounded-xl bg-slate-950 px-16 text-white shadow-lg shadow-slate-200 hover:bg-sky-900"
                    >
                        Create Tournament
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default CreateTournament;
