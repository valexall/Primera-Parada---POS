import { supabase } from '../../config/supabase';
import { ValidationError } from '../../middleware/errorHandler';

const BUCKET_NAME = 'menu-images';
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

/**
 * Valida que el archivo cumpla los requisitos de formato y tamaño (RF12)
 */
const validateImageFile = (file: Express.Multer.File): void => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new ValidationError(
      `Formato no permitido. Solo se aceptan: ${ALLOWED_EXTENSIONS.join(', ').toUpperCase()}`
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    throw new ValidationError(
      `La imagen pesa ${sizeMB} MB. El tamaño máximo permitido es 2 MB`
    );
  }
};

/**
 * Extrae el path del Storage a partir de la URL pública
 */
const extractStoragePath = (imageUrl: string): string | null => {
  try {
    const url = new URL(imageUrl);
    // La URL tiene la forma: .../storage/v1/object/public/menu-images/<path>
    const marker = `/storage/v1/object/public/${BUCKET_NAME}/`;
    const idx = url.pathname.indexOf(marker);
    if (idx === -1) return null;
    return url.pathname.slice(idx + marker.length);
  } catch {
    return null;
  }
};

/**
 * Sube una imagen al bucket de Supabase Storage y retorna la URL pública
 */
export const uploadMenuImage = async (
  file: Express.Multer.File,
  menuItemId: string
): Promise<string> => {
  validateImageFile(file);

  const ext = file.originalname.split('.').pop()?.toLowerCase() || 'jpg';
  // Nombre único para evitar colisiones: <id>_<timestamp>.<ext>
  const fileName = `${menuItemId}_${Date.now()}.${ext}`;
  const filePath = `items/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: true, // reemplaza si ya existe un archivo con el mismo path
    });

  if (uploadError) {
    throw new Error(`Error al subir imagen: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

  if (!data?.publicUrl) {
    throw new Error('No se pudo obtener la URL pública de la imagen');
  }

  return data.publicUrl;
};

/**
 * Elimina una imagen del bucket de Supabase Storage dado su URL pública
 */
export const deleteMenuImage = async (imageUrl: string): Promise<void> => {
  const filePath = extractStoragePath(imageUrl);

  if (!filePath) {
    // Si no se puede extraer el path, no es un error crítico
    console.warn(`[menu-images] No se pudo extraer path de la URL: ${imageUrl}`);
    return;
  }

  const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);

  if (error) {
    throw new Error(`Error al eliminar imagen del Storage: ${error.message}`);
  }
};
