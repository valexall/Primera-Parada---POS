import { Router } from 'express';
import { transcriptionController, uploadMiddleware } from './transcription.controller';

const router = Router();


router.post('/audio', uploadMiddleware, (req, res) => {
  transcriptionController.transcribeAudio(req, res);
});

export default router;
