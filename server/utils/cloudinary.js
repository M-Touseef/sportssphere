const cloudinary = require('cloudinary').v2;

// Configuration is automatically picked up from process.env.CLOUDINARY_URL
// if it's set in the environment, but we can also set it explicitly if needed.
// cloudinary.config({ 
//   cloud_name: 'dvmntivoe', 
//   api_key: '944748431933817', 
//   api_secret: 'UitB5xcZcJ681ek_gLXXhv9H6eY' 
// });

/**
 * Upload a file buffer to Cloudinary
 * @param {Buffer} buffer - The file buffer from multer
 * @param {string} folder - Optional folder in Cloudinary
 * @returns {Promise<Object>} - The Cloudinary upload result
 */
const uploadToCloudinary = (buffer, folder = 'sportssphere') => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                resource_type: 'auto',
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );

        uploadStream.end(buffer);
    });
};

module.exports = {
    cloudinary,
    uploadToCloudinary
};
