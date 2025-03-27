// uploadImages.js
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary'); // Import CloudinaryStorage directly
const { cloudinary } = require('../config/cloudinary'); // Import cloudinary instance

// Existing configuration for profile picture uploads (images only)
const profileUpload = multer({
  storage: new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'profiles', // Store in 'profiles' folder in Cloudinary
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'], // Supported formats
      transformation: [{ width: 200, height: 200, crop: 'fill' }], // Resize if needed
    },
  }),
  limits: { fileSize: 2000000 }, // Limit file size to 2MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
      cb(null, true); // Accept only image files
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
});

// New configuration for PDF uploads
const pdfUpload = multer({
  storage: new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'order_pdfs', // Store PDFs in 'order_pdfs' folder
      allowed_formats: ['pdf'], // Only allow PDFs
      resource_type: 'raw', // Use 'raw' for non-image files like PDFs
    },
  }),
  limits: { fileSize: 5000000 }, // Limit file size to 5MB for PDFs
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true); // Accept only PDF files
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  },
});

module.exports = {
  profileUpload,
  pdfUpload, // Export the new PDF upload middleware
};