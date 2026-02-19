import clsx from 'clsx';

const StatCard = ({ title, value, icon: Icon, trend, color = 'indigo' }) => {
    const colorClasses = {
        indigo: 'bg-indigo-50 text-indigo-600',
        green: 'bg-green-50 text-green-600',
        blue: 'bg-blue-50 text-blue-600',
        yellow: 'bg-yellow-50 text-yellow-600',
        red: 'bg-red-50 text-red-600',
        purple: 'bg-purple-50 text-purple-600',
    };

    return (
        <div className="overflow-hidden rounded-xl sm:rounded-2xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-gray-900/5 transition-all hover:shadow-md">
            <div className="flex items-center">
                <div className={clsx("flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl", colorClasses[color] || colorClasses.indigo)}>
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                </div>
                <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                    <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest leading-tight mb-1 break-words">{title}</p>
                    <div className="flex items-baseline mt-0.5 sm:mt-1">
                        <p className="text-xl sm:text-2xl font-bold text-gray-900 whitespace-nowrap">{value}</p>
                        {trend && (
                            <p className={clsx(
                                "ml-2 flex items-baseline text-sm font-semibold",
                                trend.type === 'increase' ? 'text-green-600' : 'text-red-600'
                            )}>
                                {trend.type === 'increase' ? '↑' : '↓'} {trend.value}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatCard;
