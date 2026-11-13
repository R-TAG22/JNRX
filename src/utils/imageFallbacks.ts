/**
 * Fallback image assets and error handlers for JNRX.
 * Ensures zero broken image icons across all responsive viewports and routes.
 */
import type React from 'react';

export const DEFAULT_BRAND_LOGO = 'JNR-Logo.jpg';
export const JAMEZ_PROFILE_PHOTO = 'images/team/Jamez - Profile pic.jpg';

const LEGACY_LOGO_PATHS = new Set([
  '/LOGO.png',
  'LOGO.png',
  '/JNRX-Logo.jpeg',
  'JNRX-Logo.jpeg',
  '/JNRX - Logo.2.jpg',
  'JNRX - Logo.2.jpg',
  '/JNRX%20-%20Logo.2.jpg',
  'JNRX%20-%20Logo.2.jpg',
]);

const LEGACY_JAMEZ_PATTERNS = ['JAMEZ M.jpg', 'jamez-m.jpg'];

export const getBaseUrl = (): string => {
  const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/';
  return base.endsWith('/') ? base : `${base}/`;
};

/**
 * Safely prepends import.meta.env.BASE_URL to any asset path referencing the public directory.
 * Prevents double slashes and preserves external URLs (http/https/data:).
 */
export const assetUrl = (path: string): string => {
  if (!path) return '';
  if (/^(?:https?:)?\/\//i.test(path) || path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }
  const prefix = getBaseUrl();
  if (prefix !== '/' && path.startsWith(prefix)) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${prefix}${cleanPath}`;
};

export const isLegacyLogoPath = (logoUrl?: string): boolean => {
  if (!logoUrl) return true;
  const trimmed = logoUrl.trim();
  if (!trimmed || LEGACY_LOGO_PATHS.has(trimmed)) return true;
  return (
    trimmed.endsWith('/JNRX-Logo.jpeg') ||
    trimmed.endsWith('/LOGO.png') ||
    trimmed.endsWith('/JNRX - Logo.2.jpg') ||
    trimmed.endsWith('/JNRX%20-%20Logo.2.jpg')
  );
};

export const resolveBrandLogoUrl = (logoUrl?: string): string => {
  if (isLegacyLogoPath(logoUrl)) {
    return assetUrl(DEFAULT_BRAND_LOGO);
  }
  return assetUrl(logoUrl!);
};

export const isLegacyJamezImage = (imageUrl?: string): boolean => {
  if (!imageUrl) return true;
  return LEGACY_JAMEZ_PATTERNS.some((pattern) => imageUrl.includes(pattern));
};

export const resolveTeamMemberImage = (memberId: string, imageUrl?: string, memberName?: string): string => {
  const isJamez = memberId === 'jamez-m' || (memberName || '').toLowerCase().includes('jamez');
  if (isJamez && isLegacyJamezImage(imageUrl)) {
    return assetUrl(JAMEZ_PROFILE_PHOTO);
  }
  return imageUrl ? assetUrl(imageUrl) : '';
};

export const FALLBACK_STORE_IMAGE = 
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=80';

export const FALLBACK_MOBILE_IMAGE = 
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80';

export const FALLBACK_PROCESS_IMAGES: Record<string, string> = {
  '01': `${import.meta.env.BASE_URL}assets/process/process-01-audit.jpeg`,
  '02': `${import.meta.env.BASE_URL}assets/process/process-02-mobile-design.jpeg`,
  '03': `${import.meta.env.BASE_URL}assets/process/process-03-clean-code.jpeg`,
  '04': `${import.meta.env.BASE_URL}assets/process/process-04-qa-launch.jpeg`,
  '1': `${import.meta.env.BASE_URL}assets/process/process-01-audit.jpeg`,
  '2': `${import.meta.env.BASE_URL}assets/process/process-02-mobile-design.jpeg`,
  '3': `${import.meta.env.BASE_URL}assets/process/process-03-clean-code.jpeg`,
  '4': `${import.meta.env.BASE_URL}assets/process/process-04-qa-launch.jpeg`,
};

export const handleImageError = (
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackUrl: string = FALLBACK_STORE_IMAGE
) => {
  const target = e.currentTarget;
  if (!target.dataset.triedFallback) {
    target.dataset.triedFallback = 'true';
    target.src = fallbackUrl;
  } else if (!target.dataset.triedSecondFallback && fallbackUrl !== FALLBACK_STORE_IMAGE) {
    target.dataset.triedSecondFallback = 'true';
    target.src = FALLBACK_STORE_IMAGE;
  }
};

