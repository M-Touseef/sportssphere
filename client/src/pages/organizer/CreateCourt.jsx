import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeftIcon, PhotoIcon, XMarkIcon, MapPinIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline';
import courtService from '../../services/courtService';
import uploadService from '../../services/uploadService';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import { LAHORE_AREAS, LAHORE_CITY } from '../../constants/lahoreAreas';

export default function CreateCourt() {
    const navigate = useNavigate();
    const { courtId } = useParams();
    const isEdit = Boolean(courtId);
    const { success, error } = useToast();
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();
    const [existingImageUrls, setExistingImageUrls] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [courtLoadError, setCourtLoadError] = useState(false);
    const [loadingCourt, setLoadingCourt] = useState(isEdit);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!courtId) {
            setLoadingCourt(false);
            return undefined;
        }
        let cancelled = false;
        (async () => {
            setLoadingCourt(true);
            setCourtLoadError(false);
            try {
                const res = await courtService.getCourt(courtId);
                const c = res.data;
                if (cancelled || !c) return;
                reset({
                    name: c.name,
                    address: c.location?.address || '',
                    area: c.location?.area || c.location?.city || '',
                    surfaceType: c.surfaceType,
                    pricePerHour: c.pricePerHour,
                    description: c.description || '',
                    amenities: Array.isArray(c.amenities) ? c.amenities.join(', ') : '',
                    openingTime: c.openingTime || '06:00',
                    closingTime: c.closingTime || '22:00'
                });
                setExistingImageUrls(Array.isArray(c.images) ? [...c.images] : []);
                setPreviews([]);
                setSelectedFiles([]);
            } catch (err) {
                console.error(err);
                if (!cancelled) {
                    setCourtLoadError(true);
                    error('Failed to load court for editing.');
                }
            } finally {
                if (!cancelled) setLoadingCourt(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [courtId, reset, error]);

    const onSubmit = async (data) => {
        try {
            let newUploaded = [];
            if (selectedFiles.length > 0) {
                newUploaded = await uploadService.uploadMultipleImages(selectedFiles);
            }

            const courtData = {
                ...data,
                location: {
                    address: data.address,
                    area: data.area,
                    city: LAHORE_CITY
                },
                amenities: data.amenities ? data.amenities.split(',').map((i) => i.trim()).filter(Boolean) : [],
                images: [...existingImageUrls, ...newUploaded]
            };

            if (isEdit) {
                await courtService.updateCourt(courtId, courtData);
                success('Court updated successfully');
            } else {
                await courtService.createCourt(courtData);
                success('Court listing created successfully');
            }
            navigate('/org/courts');
        } catch (err) {
            console.error(err);
            error(err.response?.data?.error || (isEdit ? 'Failed to update court' : 'Failed to create court'));
        }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const totalSlots = existingImageUrls.length + selectedFiles.length + files.length;
        if (totalSlots > 5) {
            error('Maximum 5 images allowed');
            return;
        }

        const newPreviews = files.map((file) => URL.createObjectURL(file));
        setPreviews([...previews, ...newPreviews]);
        setSelectedFiles([...selectedFiles, ...files]);
    };

    const removeNewImage = (index) => {
        const newPreviews = [...previews];
        const newFiles = [...selectedFiles];
        URL.revokeObjectURL(newPreviews[index]);
        newPreviews.splice(index, 1);
        newFiles.splice(index, 1);
        setPreviews(newPreviews);
        setSelectedFiles(newFiles);
    };

    const removeExistingImage = (index) => {
        setExistingImageUrls((prev) => prev.filter((_, i) => i !== index));
    };

    if (isEdit && loadingCourt) {
        return (
            <div className="max-w-3xl mx-auto py-20 text-center text-slate-500 animate-enter">
                Loading court…
            </div>
        );
    }

    if (isEdit && courtLoadError) {
        return (
            <div className="max-w-3xl mx-auto py-20 text-center animate-enter">
                <p className="text-slate-700 font-medium mb-4">Could not load this court.</p>
                <Link to="/org/courts" className="text-indigo-600 font-semibold hover:underline">
                    Back to My Courts
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto animate-enter space-y-8">
            <header className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-amber-500 p-6 sm:p-8 text-white shadow-lg">
                <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
                <div className="relative z-10">
                <Link to="/org/courts" className="mb-5 inline-flex items-center text-sm font-semibold text-white/85 transition-colors hover:text-white">
                    <ArrowLeftIcon className="h-4 w-4 mr-1" />
                    Back to My Courts
                </Link>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-100">Venue listing</p>
                <h1 className="mt-2 text-3xl font-extrabold">{isEdit ? 'Edit Court' : 'Add New Court'}</h1>
                <p className="mt-2 max-w-2xl text-sm text-white/90">
                    {isEdit ? 'Keep your venue details, pricing, and photos current for players.' : 'Create a polished listing for your facility and make it easier for players to book.'}
                </p>
                </div>
            </header>

            <div className="flex items-start gap-3 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-amber-50 p-4 text-sm text-indigo-950">
                <MapPinIcon className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
                <p className="font-medium leading-relaxed">Use clear venue details and bright, recent photos. Players will see this information before they book a court.</p>
            </div>

            <div className="overflow-hidden rounded-3xl border border-amber-100 bg-white shadow-[0_16px_48px_-24px_rgba(30,27,75,0.18)]">
                <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">

                    <div className="space-y-6 rounded-2xl bg-slate-50/70 p-5 sm:p-6">
                        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                            <BuildingOffice2Icon className="h-5 w-5 text-indigo-600" />
                            General Information
                        </h2>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-slate-700 mb-1">Court name</label>
                                <input
                                    type="text"
                                    {...register('name', { required: 'Name is required' })}
                                    className="block w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 transition-shadow py-3"
                                    placeholder="e.g. City Sports Center - Court 1"
                                />
                                {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Surface type</label>
                                <select
                                    {...register('surfaceType', { required: true })}
                                    className="block w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 py-3"
                                >
                                    <option value="synthetic">Synthetic</option>
                                    <option value="wooden">Wooden</option>
                                    <option value="cement">Cement</option>
                                    <option value="acrylic">Acrylic</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Price per hour (Rs.)</label>
                                <input
                                    type="number"
                                    {...register('pricePerHour', { required: 'Price is required', min: 0 })}
                                    className="block w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 py-3"
                                    placeholder="2000"
                                />
                                {errors.pricePerHour && <p className="mt-1 text-xs text-rose-500">{errors.pricePerHour.message}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 rounded-2xl border border-amber-100 bg-amber-50/40 p-5 sm:p-6">
                        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                            <MapPinIcon className="h-5 w-5 text-amber-600" />
                            Location
                        </h2>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-slate-700 mb-1">Address</label>
                                <input
                                    type="text"
                                    {...register('address', { required: 'Address is required' })}
                                    className="block w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 py-3"
                                    placeholder="Area, street name"
                                />
                                {errors.address && <p className="mt-1 text-xs text-rose-500">{errors.address.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Lahore area</label>
                                <select
                                    {...register('area', { required: 'Area is required' })}
                                    className="block w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 py-3"
                                >
                                    <option value="">Select area</option>
                                    {LAHORE_AREAS.map((area) => (
                                        <option key={area} value={area}>{area}</option>
                                    ))}
                                </select>
                                {errors.area && <p className="mt-1 text-xs text-rose-500">{errors.area.message}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 rounded-2xl bg-slate-50/70 p-5 sm:p-6">
                        <h2 className="text-lg font-bold text-slate-900">Details & Amenities</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                                <textarea
                                    {...register('description', { required: 'Description is required' })}
                                    rows={3}
                                    className="block w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                                    placeholder="Describe your court facilities..."
                                />
                                {errors.description && <p className="mt-1 text-xs text-rose-500">{errors.description.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Amenities (comma separated)</label>
                                <input
                                    type="text"
                                    {...register('amenities')}
                                    className="block w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 py-3"
                                    placeholder="Parking, changing room, water, lights"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5 sm:p-6">
                        <h2 className="text-lg font-bold text-slate-900">Operating Hours</h2>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Opening time</label>
                                <input
                                    type="time"
                                    {...register('openingTime', { required: true })}
                                    className="block w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 py-3"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Closing time</label>
                                <input
                                    type="time"
                                    {...register('closingTime', { required: true })}
                                    className="block w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 py-3"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 rounded-2xl bg-slate-50/70 p-5 sm:p-6">
                        <h2 className="text-lg font-bold text-slate-900">Court Photos</h2>
                        <p className="text-sm text-slate-500">Up to 5 photos total (existing + new).</p>
                        <div className="flex gap-4 flex-wrap">
                            {existingImageUrls.map((url, i) => (
                                <div key={`ex-${i}`} className="group relative h-28 w-28 flex-shrink-0">
                                    <img src={url} alt="" className="h-full w-full object-cover rounded-2xl border-2 border-slate-100 shadow-sm" />
                                    <button
                                        type="button"
                                        onClick={() => removeExistingImage(i)}
                                        className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <XMarkIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                            {previews.map((img, i) => (
                                <div key={`new-${i}`} className="group relative h-28 w-28 flex-shrink-0">
                                    <img src={img} alt="" className="h-full w-full object-cover rounded-2xl border-2 border-slate-100 shadow-sm" />
                                    <button
                                        type="button"
                                        onClick={() => removeNewImage(i)}
                                        className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <XMarkIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                            {existingImageUrls.length + previews.length < 5 && (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current.click()}
                                    className="h-28 w-28 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-amber-200 bg-white text-slate-400 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all gap-1"
                                >
                                    <PhotoIcon className="h-8 w-8" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Add photo</span>
                                </button>
                            )}
                        </div>
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />
                    </div>

                    <div className="pt-8 flex flex-col-reverse justify-end gap-3 border-t border-amber-100 sm:flex-row sm:gap-4">
                        <Link to="/org/courts">
                            <Button type="button" variant="outline" className="px-8 border-slate-200">Cancel</Button>
                        </Link>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-indigo-950 hover:bg-indigo-900 text-amber-50 px-10 rounded-xl shadow-lg shadow-indigo-950/15 min-w-[160px]"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Processing…
                                </span>
                            ) : isEdit ? (
                                'Save changes'
                            ) : (
                                'Add court listing'
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
