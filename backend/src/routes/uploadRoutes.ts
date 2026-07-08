import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';
import * as uploadController from '../controllers/uploadController';

const router = Router();

// Uploads hit an external API (Cloudinary) and cost bandwidth/storage, so
// they get a tighter rate limit than ordinary CRUD endpoints.
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { success: false, message: 'Too many uploads. Please slow down and try again shortly.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(authenticate);

router.post('/', uploadLimiter, upload.single('file'), uploadController.uploadFile);
router.post('/avatar', uploadLimiter, upload.single('file'), uploadController.uploadAvatar);
router.get('/', uploadController.listFiles);
router.put('/:id', uploadController.updateFileMeta);
router.delete('/:id', uploadController.deleteFile);

export default router;
