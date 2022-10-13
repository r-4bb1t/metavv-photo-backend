import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
  region: process.env.AWS_REGION,
});

const storage = multerS3({
  s3: s3,
  bucket: 'metavv-photo',
  contentType: multerS3.AUTO_CONTENT_TYPE,
  acl: 'public-read-write',
  metadata: function (req, file, cb) {
    cb(null, { fieldName: file.fieldname });
  },
  key: function (req, file, cb) {
    cb(null, `contents/${Date.now()}_${file.originalname}`);
  },
});

export const upload = multer({
  storage: storage,
});
