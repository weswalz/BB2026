import path from 'path';
import fs from 'fs/promises';
import { createMedia } from '../../../lib/media.js';
import { validateMediaUpload } from '../../../lib/mediaValidator.js';
import { getClientIP, checkRateLimit } from '../../../lib/security.js';
import { Buffer } from 'buffer';

export const POST = async ({ request }) => {
  try {
    // Check rate limit for uploads (10 per minute)
    const ipAddress = getClientIP(request);
    const rateCheck = checkRateLimit(ipAddress, 'upload');

    if (!rateCheck.allowed) {
      return new Response(
        JSON.stringify({ message: rateCheck.message }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': rateCheck.retryAfter.toString()
          }
        }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return new Response(
        JSON.stringify({ message: 'No file uploaded or invalid file type.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Convert file to buffer for validation
    const buffer = Buffer.from(await file.arrayBuffer());

    // Validate the upload
    const validation = await validateMediaUpload(file, buffer);

    if (!validation.valid) {
      console.error('[MEDIA UPLOAD] Validation failed:', validation.error);
      return new Response(
        JSON.stringify({ message: validation.error }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[MEDIA UPLOAD] Validation passed:', validation.metadata);

    // Create upload directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'media');
    await fs.mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = `${uniqueSuffix}${path.extname(file.name)}`;
    const filePath = path.join(uploadDir, filename);

    // Write the file to disk
    await fs.writeFile(filePath, buffer);
    console.log('[MEDIA UPLOAD] File written:', filePath);

    // Create media record in database
    const mediaItem = await createMedia({
      filename: filename,
      originalName: file.name,
      url: `/uploads/media/${filename}`,
      mimetype: file.type,
      size: file.size,
      alt: path.parse(file.name).name,
    });

    if (!mediaItem) {
      // Cleanup file if database insert failed
      await fs.unlink(filePath).catch(err => console.error('Cleanup error:', err));
      return new Response(
        JSON.stringify({ message: 'Failed to save media record to database' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[MEDIA UPLOAD] Success:', mediaItem.id);

    return new Response(
      JSON.stringify({
        message: 'File uploaded successfully',
        media: mediaItem,
        validation: validation.metadata
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[MEDIA UPLOAD] Error:', error);
    return new Response(
      JSON.stringify({
        message: 'File upload failed',
        error: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
