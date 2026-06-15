import React, { useState } from 'react';
import { toggleAvailability } from '../../services/professionalService';

const AvailabilityToggle = ({ slot, onToggle }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isEnabled, setIsEnabled] = useState(slot.isEnabled);

    const handleToggle = async () => {
        setIsLoading(true);
        try {
            const response = await toggleAvailability(slot._id);
            if (response.success) {
                setIsEnabled(response.data.isEnabled);
                if (onToggle) onToggle(response.data);
            }
        } catch (error) {
            console.error('Error toggling availability:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleToggle}
            disabled={isLoading || slot.status === 'BOOKED'}
            className={`
                relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-600 focus:ring-offset-2
                ${isEnabled ? 'bg-sky-600' : 'bg-slate-200'}
                ${(isLoading || slot.status === 'BOOKED') ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            role="switch"
            aria-checked={isEnabled}
        >
            <span className="sr-only">Use setting</span>
            <span
                aria-hidden="true"
                className={`
                    pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
                    transition duration-200 ease-in-out
                    ${isEnabled ? 'translate-x-5' : 'translate-x-0'}
                `}
            />
        </button>
    );
};

export default AvailabilityToggle;
