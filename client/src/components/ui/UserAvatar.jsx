import { UserIcon } from '@heroicons/react/24/outline';
import { twMerge } from 'tailwind-merge';
import { getOptimizedCloudinaryUrl } from '../../utils/cloudinary';

const UserAvatar = ({
    user,
    className,
    imageClassName,
    fallbackClassName,
    showAdminIcon = true,
    size = 64,
}) => {
    const canShowImage = user?.role !== 'admin' && user?.profilePicture;
    const fallback = user?.name?.[0]?.toUpperCase() || 'U';
    const avatarSrc = canShowImage
        ? getOptimizedCloudinaryUrl(user.profilePicture, { width: size, height: size })
        : null;
    const avatarSrcSet = canShowImage
        ? [
            `${getOptimizedCloudinaryUrl(user.profilePicture, { width: size, height: size })} 1x`,
            `${getOptimizedCloudinaryUrl(user.profilePicture, { width: size * 2, height: size * 2 })} 2x`,
        ].join(', ')
        : undefined;

    return (
        <div
            className={twMerge(
                'relative flex shrink-0 items-center justify-center overflow-hidden bg-indigo-950 text-amber-100 font-black',
                className
            )}
        >
            {canShowImage ? (
                <img
                    src={avatarSrc}
                    srcSet={avatarSrcSet}
                    sizes={`${size}px`}
                    alt={user?.name ? `${user.name} profile` : 'Profile'}
                    className={twMerge('h-full w-full object-cover', imageClassName)}
                    loading="eager"
                    decoding="async"
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
