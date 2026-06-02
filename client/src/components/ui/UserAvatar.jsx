import { UserIcon } from '@heroicons/react/24/outline';
import { twMerge } from 'tailwind-merge';

const UserAvatar = ({ user, className, imageClassName, fallbackClassName, showAdminIcon = true }) => {
    const canShowImage = user?.role !== 'admin' && user?.profilePicture;
    const fallback = user?.name?.[0]?.toUpperCase() || 'U';

    return (
        <div
            className={twMerge(
                'relative flex shrink-0 items-center justify-center overflow-hidden bg-indigo-950 text-amber-100 font-black',
                className
            )}
        >
            {canShowImage ? (
                <img
                    src={user.profilePicture}
                    alt={user?.name ? `${user.name} profile` : 'Profile'}
                    className={twMerge('h-full w-full object-cover', imageClassName)}
                />
            ) : user?.role === 'admin' && showAdminIcon ? (
                <UserIcon className={twMerge('h-1/2 w-1/2', fallbackClassName)} />
            ) : (
                <span className={fallbackClassName}>{fallback}</span>
            )}
        </div>
    );
};

export default UserAvatar;
