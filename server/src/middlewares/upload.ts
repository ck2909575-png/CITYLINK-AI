import multer from 'multer';

const storage = multer.memoryStorage();

const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'audio/webm',
  'audio/wav',
  'audio/mpeg',
  'audio/ogg',
  'audio/mp4',
  'video/mp4',
  'video/webm',
];

export const uploadMedia = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB maximum
  },
  fileFilter: (_req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: Images and Audio files.`));
    }
  },
});
