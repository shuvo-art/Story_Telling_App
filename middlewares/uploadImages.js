const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Define storage for profile pictures
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../public/images/profiles');
    fs.mkdirSync(uploadDir, { recursive: true }); // Ensure the directory exists
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const profileUpload = multer({
  storage: profileStorage,
  limits: { fileSize: 2000000 },
  fileFilter: (req, file, cb) => {
    file.mimetype.startsWith('image') ? cb(null, true) : cb(new Error('Only images are allowed!'), false);
  }
});

const profileImgResize = async (req, res, next) => {
    if (!req.file) return next();
  
    const filename = req.file.filename;
    const filePath = path.join(__dirname, `../public/images/profiles/${filename}`);
    const resizedPath = path.join(__dirname, `../public/images/profiles/resized-${filename}`);
  
    try {
      await sharp(filePath)
        .resize(200, 200)
        .jpeg({ quality: 80 })
        .toFile(resizedPath);
      fs.unlinkSync(filePath); // delete the original image after resizing
  
      // Set `req.resizedImagePath` with `/uploads` prefix for the correct URL
      req.resizedImagePath = `uploads/resized-${filename}`;
      next();
    } catch (error) {
      next(error);
    }
  };

  const bookImageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, "../public/images/books");
      fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    },
  });
  
  const bookImageUpload = multer({ storage: bookImageStorage });

module.exports = {
  profileUpload,
  profileImgResize,
  bookImageUpload,
};
