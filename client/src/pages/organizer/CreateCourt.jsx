import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeftIcon, PhotoIcon } from '@heroicons/react/24/outline';
import courtService from '../../services/courtService';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';

export default function CreateCourt() {
    const navigate = useNavigate();
    const { success, error } = useToast();
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
    const [images, setImages] = useState([]);

    const onSubmit = async (data) => {
        try {
            const courtData = {
                ...data,
                location: {
                    address: data.address,
                    city: data.city,
                },
                amenities: data.amenities.split(',').map(i => i.trim()),
                images: images.length > 0 ? images : undefined // Handle images properly in real implementation (upload service)
            };

            await courtService.createCourt(courtData);
            success('Court listing created successfully');
            navigate('/organizer/courts');
        } catch (err) {
            console.error(err);
            error(err.response?.data?.error || 'Failed to create court');
        }
    };

    // Placeholder for simple image URL input for now (or file upload logic later)
    const handleAddImage = () => {
        const url = prompt("Enter image URL");
        if (url) setImages([...images, url]);
    };

    return (
        <div className="max-w-3xl mx-auto py-10 animate-enter">
            <div className="mb-8">
                <Link to="/organizer/courts" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 mb-4">
                    <ArrowLeftIcon className="h-4 w-4 mr-1" />
                    Back to My Courts
                </Link>
                <h1 className="text-3xl font-bold text-slate-900">Add New Court</h1>
                <p className="text-slate-500 mt-2">Create a new listing for your facility.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">

                    {/* Basic Info */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700">Court Name</label>
                            <input
                                type="text"
                                {...register('name', { required: 'Name is required' })}
                                className="mt-1 block w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                                placeholder="e.g. City Sports Center - Court 1"
                            />
                            {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700">Surface Type</label>
                            <select
                                {...register('surfaceType', { required: true })}
                                className="mt-1 block w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                <option value="synthetic">Synthetic</option>
                                <option value="wooden">Wooden</option>
                                <option value="cement">Cement</option>
                                <option value="acrylic">Acrylic</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700">Price per Hour (Rs.)</label>
                            <input
                                type="number"
                                {...register('pricePerHour', { required: 'Price is required', min: 0 })}
                                className="mt-1 block w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Location */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700">Address</label>
                            <input
                                type="text"
                                {...register('address', { required: 'Address is required' })}
                                className="mt-1 block w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">City</label>
                            <input
                                type="text"
                                {...register('city', { required: 'City is required' })}
                                className="mt-1 block w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Description & Amenities */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Description</label>
                        <textarea
                            {...register('description', { required: 'Description is required' })}
                            rows={3}
                            className="mt-1 block w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">Amenities (comma separated)</label>
                        <input
                            type="text"
                            {...register('amenities')}
                            className="mt-1 block w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="Parking, Changing Room, Water, Lights"
                        />
                    </div>

                    {/* Availability */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Opening Time</label>
                            <input
                                type="time"
                                {...register('openingTime', { required: true })}
                                className="mt-1 block w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Closing Time</label>
                            <input
                                type="time"
                                {...register('closingTime', { required: true })}
                                className="mt-1 block w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Images Placeholder */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Images</label>
                        <div className="flex gap-4 flex-wrap">
                            {images.map((img, i) => (
                                <img key={i} src={img} alt="" className="h-20 w-20 object-cover rounded-lg border border-slate-200" />
                            ))}
                            <button
                                type="button"
                                onClick={handleAddImage}
                                className="h-20 w-20 flex items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-slate-400 hover:border-indigo-500 hover:text-indigo-500 transition-colors"
                            >
                                <PhotoIcon className="h-6 w-6" />
                            </button>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Link to="/organizer/courts">
                            <Button type="button" variant="outline">Cancel</Button>
                        </Link>
                        <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px]">
                            {isSubmitting ? 'Creating...' : 'Create Court'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
