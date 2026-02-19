import React from 'react';
import { Link } from 'react-router-dom';

const EmptyState = ({
    title = 'No data found',
    message = 'There is nothing to display here yet.',
    icon,
    actionLabel,
    actionLink,
    onAction
}) => {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            {icon ? (
                <div className="text-6xl mb-4 text-gray-400">{icon}</div>
            ) : (
                <div className="text-6xl mb-4 text-gray-300">📂</div>
            )}
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-500 max-w-sm mb-6">{message}</p>

            {actionLabel && (actionLink || onAction) && (
                <div>
                    {actionLink ? (
                        <Link
                            to={actionLink}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            {actionLabel}
                        </Link>
                    ) : (
                        <button
                            onClick={onAction}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            {actionLabel}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default EmptyState;
