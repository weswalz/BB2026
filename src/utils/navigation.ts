// Navigation utilities for breadcrumbs and URL generation
import type { BreadcrumbItem } from '../types/content';

/**
 * Generate breadcrumb items based on the current URL path
 */
export function generateBreadcrumbs(pathname: string, customTitle?: string): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/' }
  ];

  // Clean up the pathname
  const cleanPath = pathname.replace(/^\/+|\/+$/g, '');
  
  if (!cleanPath) {
    return [{ label: 'Home', href: '/', current: true }];
  }

  const pathSegments = cleanPath.split('/').filter(Boolean);
  let currentPath = '';

  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === pathSegments.length - 1;
    
    // Convert segment to readable label
    const label = customTitle && isLast ? customTitle : formatSegmentLabel(segment);
    
    breadcrumbs.push({
      label,
      href: `${currentPath}/`,
      current: isLast
    });
  });

  return breadcrumbs;
}

/**
 * Convert URL segment to readable label
 */
function formatSegmentLabel(segment: string): string {
  // Handle special cases
  const specialCases: Record<string, string> = {
    'about-us': 'About Us',
    'our-fighters': 'Our Fighters',
    'box-for-us': 'Box for Us',
    'contact-us': 'Contact Us',
    'upcoming-events': 'Upcoming Events',
    'previous-events': 'Previous Events',
    'privacy-policy': 'Privacy Policy',
    'terms-of-service': 'Terms of Service'
  };

  if (specialCases[segment]) {
    return specialCases[segment];
  }

  // Convert kebab-case to title case
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generate SEO-friendly slug from title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')        // Replace spaces with hyphens
    .replace(/-+/g, '-')         // Replace multiple hyphens with single
    .replace(/^-|-$/g, '');      // Remove leading/trailing hyphens
}

/**
 * Generate content URLs based on type and slug
 */
export function generateContentUrl(type: 'news' | 'fighters' | 'events', slug: string): string {
  const basePaths = {
    news: '/news',
    fighters: '/our-fighters',
    events: '/events'
  };

  return `${basePaths[type]}/${slug}/`;
}

/**
 * Validate URL structure for consistency
 */
export function validateUrl(url: string): boolean {
  // Ensure URLs follow the pattern: /path/to/page/
  const urlPattern = /^\/[a-z0-9\-\/]*\/$/;
  return urlPattern.test(url);
}

/**
 * Get navigation item by URL
 */
export function getNavigationByUrl(url: string): { label: string; href: string } | null {
  const navigationMap: Record<string, string> = {
    '/': 'Home',
    '/about-us/': 'About Us',
    '/news/': 'News',
    '/upcoming-events/': 'Upcoming Events',
    '/previous-events/': 'Previous Events',
    '/our-fighters/': 'Our Fighters',
    '/box-for-us/': 'Box for Us',
    '/contact-us/': 'Contact Us'
  };

  const label = navigationMap[url];
  return label ? { label, href: url } : null;
}

/**
 * Check if current path matches navigation item
 */
export function isActiveNavItem(currentPath: string, navPath: string): boolean {
  if (navPath === '/') {
    return currentPath === '/';
  }
  return currentPath.startsWith(navPath);
}