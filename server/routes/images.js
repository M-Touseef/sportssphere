const express = require('express');
const multer = require('multer');
const { uploadToCloudinary } = require('../utils/cloudinary');
const ImageModel = require('../models/Image');

const router = express.Router();

// Multer// Configure storage to use memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

/**
 * @route POST /api/images/upload
 * @desc Upload an image to Cloudinary and save to MongoDB
 */
router.post('/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const result = await uploadToCloudinary(req.file.buffer, 'general_uploads');

        const image = await ImageModel.create({
            name: req.file.originalname,
            url: result.secure_url,
            uploadedAt: new Date()
        });

        res.json({ success: true, data: image });
    } catch (err) {
        console.error('[ImageUpload] Error:', err);

        res.status(500).json({
            success: false,
            message: 'Upload failed',
            error: err.message
        });
    }
});

/**
 * @route POST /api/images/upload-multiple
 * @desc Upload multiple images to Cloudinary
 */
router.post('/upload-multiple', upload.array('images', 5), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: 'No files uploaded' });
        }

        const uploadPromises = req.files.map(file => uploadToCloudinary(file.buffer, 'court_images'));
        const results = await Promise.all(uploadPromises);

        const imageUrls = results.map(result => result.secure_url);

        res.json({ success: true, data: imageUrls });
    } catch (err) {
        console.error('[MultiImageUpload] Error:', err);
        res.status(500).json({
            success: false,
            message: 'Multi-upload failed',
            error: err.message
        });
    }
});

module.exports = router;
