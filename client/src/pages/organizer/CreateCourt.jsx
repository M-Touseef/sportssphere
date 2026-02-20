import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeftIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import courtService from '../../services/courtService';
import uploadService from '../../services/uploadService';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';

export default function CreateCourt() {
    const navigate = useNavigate();
    const { success, error } = useToast();
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
    const [images, setImages] = useState([]); // Cloudinary URLs or files
    const [previews, setPreviews] = useState([]); // Object URLs for local preview
    const [selectedFiles, setSelectedFiles] = useState([]);
    const fileInputRef = useRef(null);

    const onSubmit = async (data) => {
        try {
            let imageUrls = [];

            // 1. Upload images if any
            if (selectedFiles.length > 0) {
                imageUrls = await uploadService.uploadMultipleImages(selectedFiles);
            }

            const courtData = {
                ...data,
                location: {
                    address: data.address,
                    city: data.city,
                },
                amenities: data.amenities ? data.amenities.split(',').map(i => i.trim()) : [],
                images: imageUrls
            };

            await courtService.createCourt(courtData);
            success('Court listing created successfully');
            navigate('/organizer/courts');
        } catch (err) {
            console.error(err);
            error(err.response?.data?.error || 'Failed to create court');
        }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + selectedFiles.length > 5) {
            error('Maximum 5 images allowed');
            return;
        }

        const newPreviews = files.map(file => URL.createObjectURL(file));
        setPreviews([...previews, ...newPreviews]);
        setSelectedFiles([...selectedFiles, ...files]);
    };

    const removeImage = (index) => {
        const newPreviews = [...previews];
        const newFiles = [...selectedFiles];

        // Revoke the object URL to free memory
        URL.revokeObjectURL(newPreviews[index]);

        newPreviews.splice(index, 1);
        newFiles.splice(index, 1);

        setPreviews(newPreviews);
        setSelectedFiles(newFiles);
    };

    return (
        <div className="max-w-3xl mx-auto py-10 animate-enter">
            <div className="mb-8 px-4 sm:px-0">
                <Link to="/organizer/courts" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 mb-4 transition-colors">
                    <ArrowLeftIcon className="h-4 w-4 mr-1" />
                    Back to My Courts
                </Link>
                <h1 className="text-3xl font-bold text-slate-900">Add New Court</h1>
                <p className="text-slate-500 mt-2">Create a new listing for your facility.</p>
            </div>

            <div className="bg-white rounded-3xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden mx-4 sm:mx-0">
                <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">

                    {/* Basic Info */}
                    <div className="space-y-6">
                        <h2 className="text-lg font-bold text-slate-900 border-l-4 border-indigo-500 pl-3">General Information</h2>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-slate-700 mb-1">Court Name</label>
                                <input
                                    type="text"
                                    {...register('name', { required: 'Name is required' })}
                                    className="block w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 transition-shadow py-3"
                                    placeholder="e.g. City Sports Center - Court 1"
                                />
                                {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Surface Type</label>
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
                                <label className="block text-sm font-bold text-slate-700 mb-1">Price per Hour (Rs.)</label>
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

                    {/* Location */}
                    <div className="space-y-6">
                        <h2 className="text-lg font-bold text-slate-900 border-l-4 border-indigo-500 pl-3">Location Detals</h2>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-slate-700 mb-1">Address</label>
                                <input
                                    type="text"
                                    {...register('address', { required: 'Address is required' })}
                                    className="block w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 py-3"
                                    placeholder="Area, Street Name"
                                />
                                {errors.address && <p className="mt-1 text-xs text-rose-500">{errors.address.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">City</label>
                                <input
                                    type="text"
                                    {...register('city', { required: 'City is required' })}
                                    className="block w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 py-3"
                                    placeholder="e.g. Islamabad"
                                />
                                {errors.city && <p className="mt-1 text-xs text-rose-500">{errors.city.message}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Description & Amenities */}
                    <div className="space-y-6">
                        <h2 className="text-lg font-bold text-slate-900 border-l-4 border-indigo-500 pl-3">Details & Amenities</h2>
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
                                    placeholder="Parking, Changing Room, Water, Lights"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Availability */}
                    <div className="space-y-6">
                        <h2 className="text-lg font-bold text-slate-900 border-l-4 border-indigo-500 pl-3">Operating Hours</h2>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Opening Time</label>
                                <input
                                    type="time"
                                    {...register('openingTime', { required: true })}
                                    className="block w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 py-3"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Closing Time</label>
                                <input
                                    type="time"
                                    {...register('closingTime', { required: true })}
                                    className="block w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 py-3"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Images Upload */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold text-slate-900 border-l-4 border-indigo-500 pl-3">Court Photos</h2>
                        <p className="text-sm text-slate-500">Upload up to 5 photos of your court.</p>
                        <div className="flex gap-4 flex-wrap">
                            {previews.map((img, i) => (
                                <div key={i} className="group relative h-28 w-28 flex-shrink-0">
                                    <img src={img} alt="" className="h-full w-full object-cover rounded-2xl border-2 border-slate-100 shadow-sm" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(i)}
                                        className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <XMarkIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                            {previews.length < 5 && (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current.click()}
                                    className="h-28 w-28 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-indigo-500 hover:text-indigo-500 hover:bg-slate-50 transition-all gap-1"
                                >
                                    <PhotoIcon className="h-8 w-8" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Add Photo</span>
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

                    <div className="pt-8 flex justify-end gap-4 border-t border-slate-50">
                        <Link to="/organizer/courts">
                            <Button type="button" variant="outline" className="px-8 border-slate-200">Cancel</Button>
                        </Link>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 rounded-xl shadow-lg shadow-indigo-100 min-w-[160px]"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Processing...
                                </span>
                            ) : 'Add Court Listing'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
