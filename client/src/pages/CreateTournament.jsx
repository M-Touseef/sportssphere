import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import tournamentService from '../services/tournamentService';
import courtService from '../services/courtService';
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
    InformationCircleIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TOURNAMENT_GRADES,
    TOURNAMENT_FORMAT,
    TOURNAMENT_FORMAT_LABEL,
    validateMobile11Digits
} from '../shared/constants';

const CreateTournament = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { success, error: toastError } = useToast();
    const [loading, setLoading] = useState(false);
    const [myCourts, setMyCourts] = useState([]);
    const [courtsLoading, setCourtsLoading] = useState(true);

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
    }, []);

    const selectedCourt = myCourts.find((c) => String(c._id) === String(selectedCourtId));

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
            await tournamentService.createTournament(payload);
            success('Championship deployment successful! Redirecting to command center.');
            setTimeout(() => navigate('/app/tournaments'), 2000);
        } catch (error) {
            toastError(error.response?.data?.error || 'Intelligence failure during deployment.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-enter">
            <div className="mb-12">
                <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                        <TrophyIcon className="h-7 w-7" />
                    </div>
                    <h1 className="text-4xl font-black text-foreground uppercase tracking-widest leading-none">Championship Setup</h1>
                </div>
                <p className="text-lg text-muted-foreground font-medium">Choose one of your courts as the venue, then set dates and divisions.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-10 pb-20">
                {/* Basic Intel */}
                <div className="bg-card shadow-sm ring-1 ring-border rounded-3xl p-8 md:p-10 space-y-8">
                    <div className="flex items-center gap-3 border-b border-border pb-6">
                        <InformationCircleIcon className="h-5 w-5 text-primary" />
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-foreground">Tournament details</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="md:col-span-2">
                            <Input
                                label="Championship Title"
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
                                    placeholder="Brief the athletes on the event scope..."
                                    {...register('description', { required: 'Mission briefing is required' })}
                                />
                                {errors.description && <p className="text-[10px] font-black text-destructive uppercase pl-1">{errors.description.message}</p>}
                            </div>
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
                                        {c.name} — {c.location?.city || 'City'}
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
                                <p className="text-xs text-muted-foreground mt-2 font-medium">
                                    Public venue and city will be set from this court:{' '}
                                    <span className="text-foreground">{selectedCourt.location?.address}</span>
                                    {', '}
                                    <span className="text-foreground">{selectedCourt.location?.city}</span>.
                                </p>
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
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Combat Format</label>
                            <input type="hidden" {...register('format')} value={TOURNAMENT_FORMAT} />
                            <div className="flex h-11 items-center px-4 rounded-xl border border-input bg-muted/40 font-bold text-sm text-foreground">
                                {TOURNAMENT_FORMAT_LABEL}
                            </div>
                            <p className="text-xs text-muted-foreground pl-1">
                                All championships use knockout single elimination.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Categories */}
                <div className="bg-card shadow-sm ring-1 ring-border rounded-3xl p-8 md:p-10 space-y-8">
                    <div className="flex items-center justify-between border-b border-border pb-6">
                        <div className="flex items-center gap-3">
                            <Bars3CenterLeftIcon className="h-5 w-5 text-primary" />
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-foreground">Conflict Tiers (Categories)</h3>
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
                                <motion.div
                                    key={field.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="p-6 rounded-2xl bg-muted/50 border border-border space-y-6 relative group"
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
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Tactical Grade</label>
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
                                            label="Entry Fee (Rs.)"
                                            type="number"
                                            {...register(`categories.${index}.entryFee`, { valueAsNumber: true })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-border/50">
                                        <Input
                                            label="1st Prize Intelligence"
                                            type="number"
                                            placeholder="Winner bounty"
                                            {...register(`categories.${index}.prizePool.first`, { valueAsNumber: true })}
                                        />
                                        <Input
                                            label="2nd Prize Intelligence"
                                            type="number"
                                            placeholder="Runner-up bounty"
                                            {...register(`categories.${index}.prizePool.second`, { valueAsNumber: true })}
                                        />
                                        <Input
                                            label="3rd Prize Intelligence"
                                            type="number"
                                            placeholder="Semifinalist bounty"
                                            {...register(`categories.${index}.prizePool.third`, { valueAsNumber: true })}
                                        />
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Comms Intel */}
                <div className="bg-card shadow-sm ring-1 ring-border rounded-3xl p-8 md:p-10 space-y-8">
                    <div className="flex items-center gap-3 border-b border-border pb-6">
                        <EnvelopeIcon className="h-5 w-5 text-primary" />
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-foreground">Communication Protocols</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Input
                            label="Liaison Email"
                            type="email"
                            error={errors.contactEmail}
                            {...register('contactEmail', { required: 'Liaison email is mandatory' })}
                        />
                        <Input
                            label="Emergency Signal (Phone)"
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
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Championship Rules (Protocol)</label>
                            <textarea
                                className="w-full rounded-xl border border-input bg-background p-4 font-bold text-sm min-h-[160px] focus:ring-2 focus:ring-primary outline-none transition-all placeholder:font-normal"
                                placeholder="Formalized rules and regulations..."
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
                        Abort Mission
                    </button>
                    <Button
                        type="submit"
                        size="lg"
                        isLoading={loading}
                        disabled={courtsLoading || myCourts.length === 0}
                        className="px-16 h-14"
                    >
                        Deploy Championship
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default CreateTournament;
