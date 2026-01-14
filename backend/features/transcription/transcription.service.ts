import Groq from 'groq-sdk';
import { createReadStream } from 'fs';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

export class TranscriptionService {
  private groq: Groq | null = null;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY || '';
    if (!apiKey) {
      console.warn('⚠️ GROQ_API_KEY no configurada. La transcripción no funcionará.');
    } else {
      this.groq = new Groq({ apiKey });
    }
  }

  /**
   * Transcribe audio usando Groq Whisper
   */
  async transcribeAudio(audioBuffer: Buffer, filename: string = 'audio.webm'): Promise<string> {
    if (!this.groq) {
      throw new Error('Groq API no está configurada');
    }

    let tempFilePath: string | null = null;

    try {
      // Crear archivo temporal
      tempFilePath = join(tmpdir(), `audio-${Date.now()}-${filename}`);
      await writeFile(tempFilePath, audioBuffer);

      // Transcribir con Whisper de Groq
      const transcription = await this.groq.audio.transcriptions.create({
        file: createReadStream(tempFilePath),
        model: 'whisper-large-v3-turbo', // Modelo más rápido de Groq
        language: 'es', // Español
        response_format: 'json',
        temperature: 0.0,
      });

      const text = transcription.text.trim();

      return text;
    } catch (error: any) {
      throw new Error(`Error al transcribir audio: ${error.message}`);
    } finally {
      // Limpiar archivo temporal
      if (tempFilePath) {
        try {
          await unlink(tempFilePath);
        } catch (e) {
          console.warn('⚠️ No se pudo eliminar archivo temporal:', tempFilePath);
        }
      }
    }
  }
}

export const transcriptionService = new TranscriptionService();
