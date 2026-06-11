import { Cloudinary } from '@cloudinary/url-gen';

export const cld = new Cloudinary({
    cloud: {
        cloudName: 'dvmntivoe'
    }
});

/**
 * Extract public ID from a Cloudinary secure URL
 * Cloudinary URLs look like: https://res.cloudinary.com/dvmntivoe/image/upload/v123456789/folder/public_id.jpg
 * @param {string} url - The full Cloudinary secure URL
 * @returns {string|null} - The public ID (including folders), or null if not a Cloudinary URL
 */
export const getPublicIdFromUrl = (url) => {
    if (!url || !url.includes('cloudinary.com')) return null;

    try {
        // Split by '/upload/' and take the part after it
        const parts = url.split('/upload/');
        if (parts.length < 2) return null;

        // The part after contains the version (optional) and the public ID + extension
        // e.g., 'v1739626123/verification_docs/some_id.jpg'
        const afterUpload = parts[1];
        const pathParts = afterUpload.split('/');

        // If the first part starts with 'v' and is numeric, it's the version, skip it
        if (pathParts[0].startsWith('v') && /^\d+$/.test(pathParts[0].substring(1))) {
            pathParts.shift();
        }

        // Join back and remove the file extension
        const pathWithExtension = pathParts.join('/');
        const publicId = pathWithExtension.split('.').slice(0, -1).join('.');

        return publicId;
    } catch (err) {
        console.error('Error parsing Cloudinary URL:', err);
        return null;
    }
};

/**
 * Build a transformed Cloudinary delivery URL from an existing secure URL.
 * Uses auto format/quality and a fill crop so small UI avatars don't download
 * the full original asset.
 * @param {string} url
 * @param {Object} options
 * @param {number} options.width
 * @param {number} [options.height]
 * @returns {string|null}
 */
export const getOptimizedCloudinaryUrl = (url, { width, height } = {}) => {
    if (!url || !url.includes('cloudinary.com') || !width) return url || null;

    try {
        const uploadMarker = '/image/upload/';
        const markerIndex = url.indexOf(uploadMarker);
        if (markerIndex === -1) return url;

        const prefix = url.slice(0, markerIndex + uploadMarker.length);
        const suffix = url.slice(markerIndex + uploadMarker.length);
        const finalHeight = height || width;
        const transform = `f_auto,q_auto,c_fill,g_face,w_${width},h_${finalHeight}`;

        return `${prefix}${transform}/${suffix}`;
    } catch (err) {
        console.error('Error building optimized Cloudinary URL:', err);
        return url;
    }
};
