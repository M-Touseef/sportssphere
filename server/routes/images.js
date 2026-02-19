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

module.exports = router;
