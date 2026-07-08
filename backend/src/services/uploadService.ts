import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary';
import { AppError } from '../middleware/errorHandler';

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'tif', 'svg']);

function extensionOf(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Cloudinary treats "raw" resource types (PDFs, CAD files, Office docs)
 * differently from images for storage/transform purposes. We pick the
 * right one based on the file extension since MIME types for CAD formats
 * (.dwg/.dxf/.dgn) are unreliable across browsers/OSes.
 */
function resourceTypeFor(filename: string): 'image' | 'raw' {
  return IMAGE_EXTENSIONS.has(extensionOf(filename)) ? 'image' : 'raw';
}

export interface CloudUploadResult {
  url: string;
  publicId: string;
  format: string;
  resourceType: 'image' | 'raw';
  bytes: number;
}

export async function uploadBufferToCloud(
  buffer: Buffer,
  originalName: string,
  folder: string
): Promise<CloudUploadResult> {
  if (!isCloudinaryConfigured) {
    throw new AppError(
      'File storage is not configured on the server. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
      503
    );
  }

  const resourceType = resourceTypeFor(originalName);

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `civil-engineer/${folder}`,
        resource_type: resourceType,
        // Keep the original filename recognizable in the Cloudinary
        // dashboard, but let Cloudinary generate a unique public_id so
        // concurrent uploads never collide.
        filename_override: originalName,
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error || !result) {
          return reject(new AppError(`Upload failed: ${error?.message || 'unknown error'}`, 502));
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format || extensionOf(originalName),
          resourceType,
          bytes: result.bytes,
        });
      }
    );
    stream.end(buffer);
  });
}

export async function deleteFromCloud(publicId: string, resourceType: 'image' | 'raw'): Promise<void> {
  if (!isCloudinaryConfigured) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err: any) {
    // Non-fatal: we still want the DB row removed even if the remote file
    // was already gone or Cloudinary hiccups. Log so it can be cleaned up.
    console.error(`[upload] Failed to delete Cloudinary asset ${publicId}: ${err.message}`);
  }
}
