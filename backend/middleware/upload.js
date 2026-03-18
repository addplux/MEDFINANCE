const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = 'uploads/patients';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'patient-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Check both mimetype and file extension to prevent spoofing
    const allowedExtensions = /jpeg|jpg|png|gif|webp/i;
    const extname = allowedExtensions.test(path.extname(file.originalname));
    const mimetype = file.mimetype.startsWith('image/');

    if (mimetype && extname) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type! Only images (JPEG, PNG, GIF, WEBP) are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

module.exports = upload;
