import { createElement, useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    BuildingOffice2Icon,
    ChartBarIcon,
    CurrencyDollarIcon,
    MapPinIcon,
    PencilSquareIcon,
    PlusIcon,
    TrashIcon
} from '@heroicons/react/24/outline';
import courtService from '../../services/courtService';
import { useToast } from '../../context/ToastContext';
import OrganizerPageHeader from '../../components/organizer/OrganizerPageHeader';

export default function OrganizerCourts() {
    const [courts, setCourts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { success, error } = useToast();

    const fetchCourts = useCallback(async () => {
        try {
            const data = await courtService.getMyCourts();
            setCourts(data.data || []);
        } catch (err) {
            console.error(err);
            error('Failed to load courts');
        } finally {
            setLoading(false);
        }
    }, [error]);

    useEffect(() => { fetchCourts(); }, [fetchCourts]);

    const portfolio = useMemo(() => ({
        averageRate: courts.length ? Math.round(courts.reduce((sum, court) => sum + Number(court.pricePerHour || 0), 0) / courts.length) : 0,
        withPhotos: courts.filter(court => court.images?.length).length
    }), [courts]);

    const handleDelete = async (event, id) => {
        event.preventDefault();
        event.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this court? This cannot be undone.')) return;
        try {
            await courtService.deleteCourt(id);
            success('Court deleted successfully');
            setCourts(current => current.filter(court => court._id !== id));
        } catch {
            error('Failed to delete court');
        }
    };

    if (loading) return <div className="flex justify-center py-24"><div className="h-10 w-10 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" aria-label="Loading courts" /></div>;

    return (
        <div className="mx-auto max-w-[1280px] space-y-6 pb-10">
            <OrganizerPageHeader
                eyebrow="Venue portfolio"
                title="My courts"
                description="Keep pricing, photos, operating details, and booking readiness accurate across every published venue."
                icon={BuildingOffice2Icon}
                actions={<Link to="/org/courts/create" className="inline-flex items-center gap-2 rounded-xl bg-lime-300 px-5 py-3 text-sm font-extrabold text-slate-950 hover:bg-lime-200"><PlusIcon className="h-5 w-5" /> Add new court</Link>}
            >
                <div className="flex flex-wrap gap-2"><span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-sky-100">{courts.length} published</span><span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-200">{portfolio.withPhotos} with photos</span></div>
            </OrganizerPageHeader>

            <section className="grid gap-4 sm:grid-cols-3">
                <Summary label="Published venues" value={courts.length} icon={BuildingOffice2Icon} tone="sky" />
                <Summary label="Average hourly rate" value={`Rs. ${portfolio.averageRate.toLocaleString()}`} icon={CurrencyDollarIcon} tone="lime" />
                <Summary label="Photo-ready listings" value={`${portfolio.withPhotos}/${courts.length}`} icon={MapPinIcon} tone="violet" />
            </section>

            {courts.length === 0 ? (
                <div className="flex min-h-80 flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50/70 px-6 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-sky-700 shadow-sm ring-1 ring-slate-200"><MapPinIcon className="h-7 w-7" /></div>
                    <h2 className="mt-4 text-lg font-black text-slate-950">No courts listed</h2><p className="mt-2 text-sm text-slate-500">Add your first venue so players can discover and book it.</p>
                    <Link to="/org/courts/create" className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-sky-900">Create listing</Link>
                </div>
            ) : (
                <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)] sm:p-7">
                    <div className="border-b border-slate-100 pb-5"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-700">Published inventory</p><h2 className="mt-1 text-xl font-black text-slate-950">Venue listings</h2><p className="mt-1 text-sm text-slate-500">Open a listing to review activity or update the public details.</p></div>
                    <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {courts.map(court => (
                            <article key={court._id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
                                <div className="relative aspect-[16/9] bg-slate-100">{court.images?.[0] ? <img src={court.images[0]} alt={court.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-slate-300"><BuildingOffice2Icon className="h-12 w-12" /></div>}<span className="absolute left-3 top-3 rounded-full bg-lime-300 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-950">Published</span></div>
                                <div className="p-5"><h3 className="text-lg font-black text-slate-950 group-hover:text-sky-800">{court.name}</h3><p className="mt-2 flex items-start gap-1.5 text-sm leading-5 text-slate-500"><MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />{court.location?.address}, {court.location?.area || court.location?.city || 'Lahore'}</p>
                                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4"><span className="font-black text-slate-950">Rs. {Number(court.pricePerHour || 0).toLocaleString()}<span className="text-xs font-medium text-slate-400">/hr</span></span><span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{court.surfaceType}</span></div>
                                    <div className="mt-4 grid grid-cols-[1fr_1fr_auto] gap-2"><Link to={`/org/courts/${court._id}/details`} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-3 py-2.5 text-xs font-bold text-white hover:bg-sky-900"><ChartBarIcon className="h-4 w-4" /> Details</Link><Link to={`/org/courts/${court._id}/edit`} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-sky-50 px-3 py-2.5 text-xs font-bold text-sky-800 hover:bg-sky-100"><PencilSquareIcon className="h-4 w-4" /> Edit</Link><button type="button" onClick={event => handleDelete(event, court._id)} className="rounded-xl border border-rose-100 p-2.5 text-rose-600 hover:bg-rose-50" aria-label="Delete court"><TrashIcon className="h-4 w-4" /></button></div>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

const Summary = ({ label, value, icon, tone }) => {
    const tones = { sky: 'bg-sky-50 text-sky-700', lime: 'bg-lime-50 text-lime-700', violet: 'bg-violet-50 text-violet-700' };
    return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)]"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p><p className="mt-2 text-3xl font-black text-slate-950">{value}</p></div><div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tones[tone]}`}>{createElement(icon, { className: 'h-5 w-5' })}</div></div></div>;
};
