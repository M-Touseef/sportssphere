import axiosInstance from './axiosInstance';

/**
 * Upload multiple files to the server/Cloudinary
 * @param {FileList|File[]} files 
 * @returns {Promise<string[]>} Array of image URLs
 */
export const uploadMultipleImages = async (files) => {
    const formData = new FormData();

    // If it's a FileList or Array, append each
    const fileArray = Array.from(files);
    fileArray.forEach(file => {
        formData.append('images', file);
    });

    const response = await axiosInstance.post('/images/upload-multiple', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });

    if (response.data.success) {
        return response.data.data; // Array of URLs
    } else {
        throw new Error(response.data.message || 'Upload failed');
    }
};

/**
 * Upload one image to the server/Cloudinary
 * @param {File} file
 * @returns {Promise<string>} Image URL
 */
export const uploadSingleImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await axiosInstance.post('/images/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });

    if (response.data.success) {
        const url = response.data.data?.url;
        if (url) return url;
    }

    throw new Error(response.data.message || 'Upload failed');
};

const uploadService = {
    uploadMultipleImages,
    uploadSingleImage
};

export default uploadService;
