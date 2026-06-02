import { useState, useEffect } from 'react';
import coachService from '../services/coachService';
import { useAuth } from '../context/AuthContext';
import UserAvatar from './ui/UserAvatar';
import { CameraIcon } from '@heroicons/react/24/outline';
import { LAHORE_AREAS, LAHORE_CITY } from '../constants/lahoreAreas';

const CoachProfileForm = ({ existingProfile, onSuccess }) => {
    const { user, updateProfilePicture } = useAuth();
    const [formData, setFormData] = useState({
        specialization: [],
        experience: '',
        hourlyRate: '',
        bio: '',
        certifications: [],
        availability: [],
        location: {
            city: '',
            areas: []
        }
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [newCert, setNewCert] = useState({ name: '', issuedBy: '', year: '' });
    const [newAvailability, setNewAvailability] = useState({ day: 'monday', startTime: '09:00', endTime: '17:00' });
    const [newArea, setNewArea] = useState('');
    const [imageUploading, setImageUploading] = useState(false);

    useEffect(() => {
        if (existingProfile) {
            setFormData({
                specialization: existingProfile.specialization || [],
                experience: existingProfile.experience || '',
                hourlyRate: existingProfile.hourlyRate || '',
                bio: existingProfile.bio || '',
                certifications: existingProfile.certifications || [],
                availability: existingProfile.availability || [],
                location: existingProfile.location || { city: LAHORE_CITY, areas: [] }
            });
        }
    }, [existingProfile]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleLocationChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            location: {
                ...prev.location,
                city: LAHORE_CITY,
                [name]: value
            }
        }));
    };

    const handleSpecializationToggle = (spec) => {
        setFormData(prev => ({
            ...prev,
            specialization: prev.specialization.includes(spec)
                ? prev.specialization.filter(s => s !== spec)
                : [...prev.specialization, spec]
        }));
    };

    const addCertification = () => {
        if (newCert.name && newCert.issuedBy && newCert.year) {
            setFormData(prev => ({
                ...prev,
                certifications: [...prev.certifications, { ...newCert }]
            }));
            setNewCert({ name: '', issuedBy: '', year: '' });
        }
    };

    const removeCertification = (index) => {
        setFormData(prev => ({
            ...prev,
            certifications: prev.certifications.filter((_, i) => i !== index)
        }));
    };

    const addAvailability = () => {
        if (newAvailability.day && newAvailability.startTime && newAvailability.endTime) {
            setFormData(prev => ({
                ...prev,
                availability: [...prev.availability, { ...newAvailability }]
            }));
            setNewAvailability({ day: 'monday', startTime: '09:00', endTime: '17:00' });
        }
    };

    const removeAvailability = (index) => {
        setFormData(prev => ({
            ...prev,
            availability: prev.availability.filter((_, i) => i !== index)
        }));
    };

    const addArea = () => {
        if (newArea && !formData.location.areas.includes(newArea)) {
            setFormData(prev => ({
                ...prev,
                location: {
                    ...prev.location,
                    areas: [...prev.location.areas, newArea]
                }
            }));
            setNewArea('');
        }
    };

    const removeArea = (area) => {
        setFormData(prev => ({
            ...prev,
            location: {
                ...prev.location,
                areas: prev.location.areas.filter(a => a !== area)
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            await coachService.createOrUpdateProfile(formData);
            setMessage({ type: 'success', text: 'Profile saved successfully!' });
            if (onSuccess) onSuccess();
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to save profile' });
        } finally {
            setLoading(false);
        }
    };

    const handleProfilePictureChange = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        setMessage({ type: '', text: '' });

        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setMessage({ type: 'error', text: 'Please choose an image file.' });
            return;
        }
        if (file.size > 3 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'Profile image must be 3MB or smaller.' });
            return;
        }

        setImageUploading(true);
        try {
            await updateProfilePicture(file);
            setMessage({ type: 'success', text: 'Profile picture updated successfully!' });
            if (onSuccess) onSuccess();
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to upload profile picture' });
        } finally {
            setImageUploading(false);
        }
    };

    const specializationOptions = [
        { value: 'singles', label: 'Singles' },
        { value: 'doubles', label: 'Doubles' },
        { value: 'mixed_doubles', label: 'Mixed Doubles' },
        { value: 'junior_coaching', label: 'Junior Coaching' },
        { value: 'fitness', label: 'Fitness' },
        { value: 'technique', label: 'Technique' }
    ];

    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {message.text && (
                <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                    <UserAvatar
                        user={user}
                        className="h-20 w-20 rounded-2xl bg-indigo-950 text-amber-100 text-2xl shadow-md"
                        fallbackClassName="text-2xl"
                    />
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">Profile Photo</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Add a clear coach photo for your public profile. JPG, PNG, or WebP up to 3MB.
                        </p>
                    </div>
                    <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-indigo-950 px-5 text-sm font-bold text-amber-50 transition hover:bg-indigo-900">
                        <CameraIcon className="h-4 w-4" />
                        {imageUploading ? 'Uploading...' : user?.profilePicture ? 'Change Photo' : 'Upload Photo'}
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="sr-only"
                            onChange={handleProfilePictureChange}
                            disabled={imageUploading}
                        />
                    </label>
                </div>
            </div>

            {/* Basic Information */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Experience (years) *
                        </label>
                        <input
                            type="number"
                            name="experience"
                            value={formData.experience}
                            onChange={handleInputChange}
                            required
                            min="0"
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Hourly Rate (Rs.) *
                        </label>
                        <input
                            type="number"
                            name="hourlyRate"
                            value={formData.hourlyRate}
                            onChange={handleInputChange}
                            required
                            min="0"
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bio *
                    </label>
                    <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        required
                        rows="4"
                        placeholder="Tell students about yourself, your coaching philosophy, and achievements..."
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Specializations */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Specializations</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {specializationOptions.map(option => (
                        <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.specialization.includes(option.value)}
                                onChange={() => handleSpecializationToggle(option.value)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{option.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Location */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Lahore Service Areas</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Primary Area
                        </label>
                        <select
                            value={formData.location.areas[0] || ''}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (!value) return;
                                setFormData((prev) => ({
                                    ...prev,
                                    location: {
                                        ...prev.location,
                                        city: LAHORE_CITY,
                                        areas: [value, ...prev.location.areas.filter((area) => area !== value)]
                                    }
                                }));
                            }}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                            <option value="">Select primary Lahore area</option>
                            {LAHORE_AREAS.map((area) => (
                                <option key={area} value={area}>{area}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Service Areas
                        </label>
                        <div className="flex gap-2 mb-2">
                            <select
                                value={newArea}
                                onChange={(e) => setNewArea(e.target.value)}
                                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                                <option value="">Add another Lahore area...</option>
                                {LAHORE_AREAS.map((area) => (
                                    <option key={area} value={area}>{area}</option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={addArea}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Add
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.location.areas.map((area, index) => (
                                <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                                    {area}
                                    <button
                                        type="button"
                                        onClick={() => removeArea(area)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Certifications */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Certifications</h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        <input
                            type="text"
                            placeholder="Certification name"
                            value={newCert.name}
                            onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
                            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        <input
                            type="text"
                            placeholder="Issued by"
                            value={newCert.issuedBy}
                            onChange={(e) => setNewCert({ ...newCert, issuedBy: e.target.value })}
                            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        <input
                            type="number"
                            placeholder="Year"
                            value={newCert.year}
                            onChange={(e) => setNewCert({ ...newCert, year: e.target.value })}
                            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        <button
                            type="button"
                            onClick={addCertification}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Add
                        </button>
                    </div>
                    <div className="space-y-2">
                        {formData.certifications.map((cert, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                                <div>
                                    <span className="font-medium">{cert.name}</span>
                                    <span className="text-gray-600 text-sm"> - {cert.issuedBy} ({cert.year})</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeCertification(index)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Availability */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Availability</h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        <select
                            value={newAvailability.day}
                            onChange={(e) => setNewAvailability({ ...newAvailability, day: e.target.value })}
                            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                            {daysOfWeek.map(day => (
                                <option key={day} value={day} className="capitalize">{day}</option>
                            ))}
                        </select>
                        <input
                            type="time"
                            value={newAvailability.startTime}
                            onChange={(e) => setNewAvailability({ ...newAvailability, startTime: e.target.value })}
                            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        <input
                            type="time"
                            value={newAvailability.endTime}
                            onChange={(e) => setNewAvailability({ ...newAvailability, endTime: e.target.value })}
                            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        <button
                            type="button"
                            onClick={addAvailability}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Add
                        </button>
                    </div>
                    <div className="space-y-2">
                        {formData.availability.map((slot, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                                <div className="capitalize">
                                    <span className="font-medium">{slot.day}:</span>
                                    <span className="text-gray-600"> {slot.startTime} - {slot.endTime}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeAvailability(index)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={loading}
                    className={`px-6 py-3 rounded-md text-white font-medium ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                >
                    {loading ? 'Saving...' : 'Save Profile'}
                </button>
            </div>
        </form>
    );
};

export default CoachProfileForm;
