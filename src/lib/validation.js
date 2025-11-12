/**
 * BiYu Boxing - Input Validation Schemas
 * Using Zod for type-safe validation across all content types
 */

import { z } from 'zod';

// ============================================================================
// FIGHTER VALIDATION
// ============================================================================

export const fighterSchema = z.object({
  // Required fields
  name: z.string()
    .min(1, 'Fighter name is required')
    .max(100, 'Name must be less than 100 characters'),

  // Optional text fields
  record: z.string().max(50).optional().nullable(),
  nationality: z.string().max(100).optional().nullable(),
  weightClass: z.string().max(50).optional().nullable(),
  image: z.string()
    .refine(val => !val || val === '' || val.startsWith('/') || val.startsWith('http'), 'Invalid image path or URL')
    .optional().nullable(),
  flag: z.string()
    .refine(val => !val || val === '' || val.startsWith('/') || val.startsWith('http'), 'Invalid flag path or URL')
    .optional().nullable(),
  nickname: z.string().max(100).optional().nullable(),
  height: z.string().max(20).optional().nullable(),
  weight: z.string().max(20).optional().nullable(),
  reach: z.string().max(20).optional().nullable(),
  stance: z.string().max(50).optional().nullable(),
  hometown: z.string().max(100).optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),

  // Numeric fields
  wins: z.number().int().min(0).default(0),
  losses: z.number().int().min(0).default(0),
  draws: z.number().int().min(0).default(0),
  kos: z.number().int().min(0).default(0),
  displayOrder: z.number().int().min(0).default(0),

  // Status field
  status: z.enum(['active', 'inactive', 'retired']).default('active'),
});

export const fighterUpdateSchema = fighterSchema.partial();

// ============================================================================
// EVENT VALIDATION
// ============================================================================

const fightSchema = z.object({
  id: z.string().optional(),
  fighter1: z.string().min(1, 'Fighter 1 name required'),
  fighter2: z.string().min(1, 'Fighter 2 name required'),
  weightClass: z.string().optional(),
  rounds: z.number().int().min(1).max(12).optional(),
  isMainEvent: z.boolean().default(false),
  result: z.string().optional(),
});

export const eventSchema = z.object({
  // Required fields
  title: z.string()
    .min(1, 'Event title is required')
    .max(200, 'Title must be less than 200 characters'),
  date: z.string()
    .min(1, 'Event date is required')
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid date format'),

  // Optional text fields
  venue: z.string().max(200).optional().nullable(),
  description: z.string().max(500).optional().nullable(), // Short description for listings
  detailedDescription: z.string().max(5000).optional().nullable(), // Detailed description for single event page
  image: z.string()
    .refine(val => !val || val === '' || val.startsWith('/') || val.startsWith('http'), 'Invalid image path or URL')
    .optional().nullable(),
  ticketUrl: z.string().url('Invalid ticket URL').or(z.literal('')).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),

  // Arrays and booleans
  fights: z.array(fightSchema).default([]),
  featured: z.boolean().default(false),

  // Status field
  status: z.enum(['upcoming', 'past', 'cancelled']).default('upcoming'),
});

export const eventUpdateSchema = eventSchema.partial();

// ============================================================================
// NEWS VALIDATION
// ============================================================================

export const newsSchema = z.object({
  // Required fields
  title: z.string()
    .min(1, 'News title is required')
    .max(200, 'Title must be less than 200 characters'),
  content: z.string()
    .min(1, 'News content is required')
    .max(50000, 'Content too long'),

  // Optional text fields
  excerpt: z.string().max(500).optional().nullable(),
  featuredImage: z.string()
    .refine(val => !val || val === '' || val.startsWith('/') || val.startsWith('http'), 'Invalid image path or URL')
    .optional().nullable(),
  author: z.string().max(100).default('BiYu Promotions'),
  category: z.string().max(100).default('General'),

  // Booleans
  featured: z.boolean().default(false),
  published: z.boolean().default(false),

  // SEO fields
  seo: z.object({
    metaTitle: z.string().max(60).optional().nullable(),
    metaDescription: z.string().max(160).optional().nullable(),
  }).optional().nullable(),

  // Tags (can be array or comma-separated string)
  tags: z.union([
    z.array(z.string()),
    z.string().transform(val => val.split(',').map(t => t.trim()).filter(Boolean))
  ]).default([]),
});

export const newsUpdateSchema = newsSchema.partial();

// ============================================================================
// PAGE VALIDATION
// ============================================================================

export const pageSchema = z.object({
  id: z.string()
    .min(1, 'Page ID is required')
    .regex(/^[a-z0-9-]+$/, 'Page ID must be lowercase alphanumeric with hyphens'),

  // Content is flexible JSON
  content: z.record(z.any()).optional().default({}),
});

export const pageUpdateSchema = z.object({
  content: z.record(z.any()),
});

// ============================================================================
// GLOBAL SETTINGS VALIDATION
// ============================================================================

export const globalSchema = z.object({
  key: z.string()
    .min(1, 'Setting key is required')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Key must be alphanumeric with underscores/hyphens'),

  value: z.string().min(0), // Allow empty strings

  type: z.enum(['text', 'boolean', 'number', 'url', 'email']).default('text'),

  label: z.string().max(100).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
});

export const globalUpdateSchema = z.object({
  value: z.string().min(0),
});

// ============================================================================
// MEDIA VALIDATION
// ============================================================================

export const mediaSchema = z.object({
  filename: z.string()
    .min(1, 'Filename is required')
    .max(255),

  originalName: z.string()
    .min(1, 'Original filename is required')
    .max(255),

  url: z.string()
    .min(1, 'URL is required')
    .max(500),

  mimetype: z.string()
    .regex(/^[a-z]+\/[a-z0-9\-\+\.]+$/i, 'Invalid MIME type'),

  size: z.number()
    .int()
    .min(0)
    .max(50 * 1024 * 1024, 'File size must be less than 50MB'),

  alt: z.string().max(200).optional().nullable(),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate data against schema and return formatted errors
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @param {any} data - Data to validate
 * @returns {Object} - { success: boolean, data?: any, errors?: array }
 */
export function validate(schema, data) {
  const result = schema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  } else {
    return {
      success: false,
      errors: result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      })),
    };
  }
}

/**
 * Format validation errors for user display
 * @param {Array} errors - Array of validation errors
 * @returns {string} - Formatted error message
 */
export function formatValidationErrors(errors) {
  if (!errors || errors.length === 0) return 'Validation failed';

  return errors
    .map(err => `${err.field}: ${err.message}`)
    .join(', ');
}

/**
 * Validate fighter data
 */
export function validateFighter(data, isUpdate = false) {
  return validate(isUpdate ? fighterUpdateSchema : fighterSchema, data);
}

/**
 * Validate event data
 */
export function validateEvent(data, isUpdate = false) {
  return validate(isUpdate ? eventUpdateSchema : eventSchema, data);
}

/**
 * Validate news data
 */
export function validateNews(data, isUpdate = false) {
  return validate(isUpdate ? newsUpdateSchema : newsSchema, data);
}

/**
 * Validate page data
 */
export function validatePage(data, isUpdate = false) {
  return validate(isUpdate ? pageUpdateSchema : pageSchema, data);
}

/**
 * Validate global setting
 */
export function validateGlobal(data, isUpdate = false) {
  return validate(isUpdate ? globalUpdateSchema : globalSchema, data);
}

/**
 * Validate media data
 */
export function validateMedia(data) {
  return validate(mediaSchema, data);
}
