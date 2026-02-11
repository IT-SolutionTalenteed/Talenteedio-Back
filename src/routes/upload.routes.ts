import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';

const router = Router();

router.post('/upload', async (req: Request, res: Response) => {
    try {
        console.log('Upload request received');
        console.log('Body:', req.body);
        
        if (!req.body || !req.body.file) {
            console.error('No file in request body');
            return res.status(400).json({ error: 'No file provided' });
        }

        const { file } = req.body;
        const { name, data, type } = file;

        console.log('File info:', { name, type, dataLength: data?.length });

        // Validate file type (images and videos)
        const isImage = type && type.startsWith('image/');
        const isVideo = type && type.startsWith('video/');
        
        if (!isImage && !isVideo) {
            console.error('Invalid file type:', type);
            return res.status(400).json({ error: 'Only image and video files are allowed' });
        }

        // Validate file size (5MB for images, 50MB for videos)
        const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
        const buffer = Buffer.from(data, 'base64');
        console.log('Buffer size:', buffer.length, 'Max size:', maxSize);
        
        if (buffer.length > maxSize) {
            const maxSizeMB = isVideo ? '50MB' : '5MB';
            console.error('File too large:', buffer.length);
            return res.status(400).json({ error: `File size exceeds ${maxSizeMB} limit` });
        }

        // Generate unique filename
        const id = uuidv4();
        const ext = path.extname(name);
        const filename = `${id}${ext}`;
        
        console.log('Generated filename:', filename);
        
        // Save file
        const directoryPath = path.join(__dirname, '..', '..', 'public', 'uploads');
        if (!fs.existsSync(directoryPath)) {
            console.log('Creating directory:', directoryPath);
            fs.mkdirSync(directoryPath, { recursive: true });
        }

        const filepath = path.join(directoryPath, filename);
        console.log('Saving to:', filepath);
        fs.writeFileSync(filepath, buffer);

        // Return URL
        const host = (process.env.HOST as string).replace(/\/$/, '');
        const url = `${host}/public/uploads/${filename}`;
        
        console.log('Upload successful, URL:', url);
        return res.json({ url });
    } catch (error) {
        console.error('Upload error:', error);
        return res.status(500).json({ error: 'Upload failed' });
    }
});

export default router;
