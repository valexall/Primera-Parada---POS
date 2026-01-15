import { Request, Response } from 'express';
import { transcriptionService } from './transcription.service';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {

    if (file.mimetype.startsWith('audio/') || file.mimetype === 'application/octet-stream') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de audio'));
    }
  },
});

export const uploadMiddleware = upload.single('audio');

export class TranscriptionController {

  async transcribeAudio(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No se proporcionó archivo de audio',
        });
      }

      const audioBuffer = req.file.buffer;
      const filename = req.file.originalname || 'audio.webm';

      const text = await transcriptionService.transcribeAudio(audioBuffer, filename);

      res.json({
        success: true,
        data: {
          text,
          language: 'es',
        },
      });
    } catch (error: any) {
      console.error('Error en transcripción:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al transcribir audio',
      });
    }
  }
}

export const transcriptionController = new TranscriptionController();
