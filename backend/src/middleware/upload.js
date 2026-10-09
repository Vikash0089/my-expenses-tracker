const multer = require('multer');
const ApiError = require('../utils/ApiError');

module.exports = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) =>
    /^(image\/|application\/pdf)/.test(file.mimetype)
      ? cb(null, true)
      : cb(new ApiError(400, 'Only images or PDF files are allowed')),
});
