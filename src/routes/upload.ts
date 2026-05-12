import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import logger from '../utils/logger';
import { requireAuth } from '../middleware/authSession';

const router = Router();

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer - lưu tạm trong memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh'));
    }
  },
});

/**
 * POST /api/upload
 * Upload 1 ảnh lên Cloudinary, trả về URL
 */
router.post(
  '/',
  requireAuth,
  upload.single('image'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Không có file ảnh' });
        return;
      }

      // Kiểm tra nếu chưa cấu hình Cloudinary thì trả về URL mock
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
        logger.warn('Cloudinary chưa được cấu hình. Sử dụng URL ảnh mock.');
        res.json({
          url: 'https://via.placeholder.com/600x400?text=Mock+Image+Upload',
          publicId: `mock_${Date.now()}`,
        });
        return;
      }

      // Upload buffer lên Cloudinary
      const result = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'truliva-ktv',
            resource_type: 'image',
            transformation: [
              { width: 1200, height: 1200, crop: 'limit' }, // Resize tối đa 1200px
              { quality: 'auto:good' },
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file!.buffer);
      });

      res.json({
        url: result.secure_url,
        publicId: result.public_id,
      });
    } catch (error: any) {
      logger.error('Upload error', { error: error.message });
      res.status(500).json({ error: 'Lỗi upload ảnh' });
    }
  }
);

/**
 * POST /api/upload/multiple
 * Upload nhiều ảnh cùng lúc (tối đa 5)
 */
router.post(
  '/multiple',
  requireAuth,
  upload.array('images', 5),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        res.status(400).json({ error: 'Không có file ảnh' });
        return;
      }

      // Kiểm tra nếu chưa cấu hình Cloudinary thì trả về URL mock
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
        logger.warn('Cloudinary chưa được cấu hình. Sử dụng URL ảnh mock (multiple).');
        const urls = files.map((_, idx) => `https://via.placeholder.com/600x400?text=Mock+Image+${idx + 1}`);
        res.json({ urls });
        return;
      }

      const uploadPromises = files.map(
        (file) =>
          new Promise<any>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: 'truliva-ktv',
                resource_type: 'image',
                transformation: [
                  { width: 1200, height: 1200, crop: 'limit' },
                  { quality: 'auto:good' },
                ],
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );
            uploadStream.end(file.buffer);
          })
      );

      const results = await Promise.all(uploadPromises);
      const urls = results.map((r) => r.secure_url);

      res.json({ urls });
    } catch (error: any) {
      logger.error('Multiple upload error', { error: error.message });
      res.status(500).json({ error: 'Lỗi upload ảnh' });
    }
  }
);

export default router;
