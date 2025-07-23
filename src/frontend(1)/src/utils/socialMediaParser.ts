/// VeriChain Social Media Parser
/// TypeScript utilities for parsing and validating social media URLs

import { SocialMediaPost } from '../types/utility.types';

export interface PlatformConfig {
  name: string;
  patterns: RegExp[];
  videoIdIndex: number;
  metadata: PlatformMetadata;
}

export interface PlatformMetadata {
  maxDuration: string;
  typicalResolutions: string[];
  requiresAuth: boolean;
  supportsVertical?: boolean;
  supportsShorts?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  platform?: string;
  platformName?: string;
  videoId?: string;
  originalUrl?: string;
  normalizedUrl?: string;
  error?: string;
  supportedPlatforms?: string[];
}

// Platform configurations
const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  youtube: {
    name: 'YouTube',
    patterns: [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
    ],
    videoIdIndex: 1,
    metadata: {
      maxDuration: '12:00:00',
      typicalResolutions: ['1080p', '720p', '480p', '360p'],
      requiresAuth: false,
      supportsShorts: true
    }
  },
  instagram: {
    name: 'Instagram',
    patterns: [
      /instagram\.com\/p\/([a-zA-Z0-9_-]+)/,
      /instagram\.com\/reel\/([a-zA-Z0-9_-]+)/,
      /instagram\.com\/tv\/([a-zA-Z0-9_-]+)/
    ],
    videoIdIndex: 1,
    metadata: {
      maxDuration: '00:01:00',
      typicalResolutions: ['1080p', '720p'],
      requiresAuth: true,
      supportsVertical: true
    }
  },
  tiktok: {
    name: 'TikTok',
    patterns: [
      /tiktok\.com\/@[^\/]+\/video\/(\d+)/,
      /vm\.tiktok\.com\/([a-zA-Z0-9]+)/,
      /tiktok\.com\/t\/([a-zA-Z0-9]+)/
    ],
    videoIdIndex: 1,
    metadata: {
      maxDuration: '00:10:00',
      typicalResolutions: ['1080p', '720p'],
      requiresAuth: false,
      supportsVertical: true
    }
  },
  twitter: {
    name: 'Twitter/X',
    patterns: [
      /(?:twitter\.com|x\.com)\/[^\/]+\/status\/(\d+)/
    ],
    videoIdIndex: 1,
    metadata: {
      maxDuration: '00:02:20',
      typicalResolutions: ['1080p', '720p'],
      requiresAuth: false
    }
  }
};

/**
 * Main URL validation function
 */
export const validateSocialMediaUrl = (url: string): ValidationResult => {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'Invalid URL' };
  }

  const normalizedUrl = url.trim().toLowerCase();
  const urlToTest = normalizedUrl.startsWith('http') ? normalizedUrl : `https://${normalizedUrl}`;

  try {
    const urlObj = new URL(urlToTest);
    const fullUrl = urlObj.href;

    for (const [platformKey, config] of Object.entries(PLATFORM_CONFIGS)) {
      for (const pattern of config.patterns) {
        const match = fullUrl.match(pattern);
        if (match) {
          const videoId = match[config.videoIdIndex];
          return {
            isValid: true,
            platform: platformKey,
            platformName: config.name,
            videoId,
            originalUrl: url,
            normalizedUrl: fullUrl
          };
        }
      }
    }

    return {
      isValid: false,
      error: 'Unsupported platform or invalid URL format',
      supportedPlatforms: Object.values(PLATFORM_CONFIGS).map(c => c.name)
    };

  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid URL format'
    };
  }
};

/**
 * Extract video ID from URL
 */
export const extractVideoId = (url: string): string | null => {
  const validation = validateSocialMediaUrl(url);
  return validation.isValid ? validation.videoId || null : null;
};

/**
 * Get platform from URL
 */
export const getPlatformFromUrl = (url: string): string | null => {
  const validation = validateSocialMediaUrl(url);
  return validation.isValid ? validation.platform || null : null;
};

/**
 * Get supported platforms
 */
export const getSupportedPlatforms = (): string[] => {
  return Object.values(PLATFORM_CONFIGS).map(config => config.name);
};

/**
 * Get platform configuration
 */
export const getPlatformConfig = (platform: string): PlatformConfig | null => {
  return PLATFORM_CONFIGS[platform] || null;
};

/**
 * Convert to SocialMediaPost format
 */
export const parseToSocialMediaPost = (url: string): SocialMediaPost | null => {
  const validation = validateSocialMediaUrl(url);
  
  if (!validation.isValid || !validation.platform || !validation.videoId) {
    return null;
  }

  const config = getPlatformConfig(validation.platform);
  
  return {
    platform: validation.platform,
    url: validation.originalUrl || url,
    title: `${validation.platformName} Video`,
    description: `Video from ${validation.platformName}`,
    thumbnail: generateThumbnailUrl(validation.platform, validation.videoId),
    format: 'video'
  };
};

/**
 * Generate thumbnail URL for platforms that support it
 */
const generateThumbnailUrl = (platform: string, videoId: string): string | undefined => {
  const thumbnailUrls: Record<string, string> = {
    youtube: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    vimeo: `https://vumbnail.com/${videoId}.jpg`
  };

  return thumbnailUrls[platform];
};
