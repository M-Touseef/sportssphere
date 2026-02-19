import React, { forwardRef } from 'react';
import clsx from 'clsx';

const Select = forwardRef(({ label, error, options = [], className, placeholder, ...props }, ref) => {
    return (
        <div className={className}>
            <label htmlFor={props.id || props.name} className="block text-sm font-medium leading-6 text-gray-900">
                {label}
            </label>
            <div className="mt-2">
                <select
                    ref={ref}
                    className={clsx(
                        "block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6",
                        error
                            ? "ring-red-300 focus:ring-red-500"
                            : "ring-gray-300 focus:ring-indigo-600"
                    )}
                    {...props}
                >
                    {placeholder && <option value="">{placeholder}</option>}
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                {error && (
                    <p className="mt-2 text-sm text-red-600">
                        {error.message}
                    </p>
                )}
            </div>
        </div>
    );
});

Select.displayName = 'Select';

export default Select;
