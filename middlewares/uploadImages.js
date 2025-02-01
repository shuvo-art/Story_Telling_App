const multer = require('multer');
const { cloudinaryStorage } = require('../config/cloudinary');

// Configure multer with Cloudinary storage
const profileUpload = multer({
  storage: cloudinaryStorage,
  limits: { fileSize: 2000000 }, // Limit file size to 2MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
      cb(null, true); // Accept only image files
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
});

module.exports = {
  profileUpload,
};