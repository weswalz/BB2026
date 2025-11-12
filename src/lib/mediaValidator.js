/**
 * BiYu Boxing - Media Upload Validator
 * Validates image uploads with size and dimension restrictions
 */

import sharp from 'sharp';
import path from 'path';

// Allowed image MIME types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml'
];

// File extensions mapped to MIME types
const MIME_TO_EXT = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
  'image/svg+xml': ['.svg']
};

// Max file size: 1MB for web-optimized images
const MAX_FILE_SIZE = 1 * 1024 * 1024;

/**
 * Get file extension from MIME type
 */
function getExtensionsForMime(mimeType) {
  return MIME_TO_EXT[mimeType] || [];
}


/**
 * Validate uploaded media file
 * @param {File} file - The uploaded file
 * @param {Buffer} buffer - File buffer for dimension checking
 * @returns {Promise<{valid: boolean, error?: string, metadata?: object}>}
 */
export async function validateMediaUpload(file, buffer) {
  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
    };
  }

  // Validate file extension matches MIME type
  const fileExt = path.extname(file.name).toLowerCase();
  const allowedExts = getExtensionsForMime(file.type);

  if (!allowedExts.includes(fileExt)) {
    return {
      valid: false,
      error: `File extension ${fileExt} doesn't match MIME type ${file.type}`
    };
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${sizeMB}MB`
    };
  }

  // Get image metadata (dimensions for logging only)
  let metadata;
  try {
    metadata = await sharp(buffer).metadata();
    console.log(`[MEDIA] Upload dimensions: ${metadata.width}x${metadata.height}`);
  } catch (error) {
    console.warn(`[MEDIA] Could not read image metadata:`, error.message);
  }

  // All validations passed
  return {
    valid: true,
    metadata: {
      width: metadata?.width || 0,
      height: metadata?.height || 0,
      format: metadata?.format || 'unknown',
      size: file.size
    }
  };
}

/**
 * Get human-readable validation rules
 */
export function getValidationRules() {
  return {
    allowedTypes: ALLOWED_MIME_TYPES,
    maxFileSize: MAX_FILE_SIZE,
    maxFileSizeMB: Math.floor(MAX_FILE_SIZE / (1024 * 1024))
  };
}
