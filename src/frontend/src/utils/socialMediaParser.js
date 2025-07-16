/**
 * Social Media URL Parser and Validator
 * Supports YouTube, Instagram, TikTok, Twitter/X, Facebook, and more
 */

// Supported platform configurations
const PLATFORM_CONFIGS = {
  youtube: {
    name: 'YouTube',
    patterns: [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
    ],
    videoIdIndex: 1
  },
  instagram: {
    name: 'Instagram',
    patterns: [
      /instagram\.com\/p\/([a-zA-Z0-9_-]+)/,
      /instagram\.com\/reel\/([a-zA-Z0-9_-]+)/,
      /instagram\.com\/tv\/([a-zA-Z0-9_-]+)/
    ],
    videoIdIndex: 1
  },
  tiktok: {
    name: 'TikTok',
    patterns: [
      /tiktok\.com\/@[^\/]+\/video\/(\d+)/,
      /vm\.tiktok\.com\/([a-zA-Z0-9]+)/,
      /tiktok\.com\/t\/([a-zA-Z0-9]+)/
    ],
    videoIdIndex: 1
  },
  twitter: {
    name: 'Twitter/X',
    patterns: [
      /(?:twitter\.com|x\.com)\/[^\/]+\/status\/(\d+)/
    ],
    videoIdIndex: 1
  },
  facebook: {
    name: 'Facebook',
    patterns: [
      /facebook\.com\/[^\/]+\/videos\/(\d+)/,
      /fb\.watch\/([a-zA-Z0-9_-]+)/
    ],
    videoIdIndex: 1
  },
  vimeo: {
    name: 'Vimeo',
    patterns: [
      /vimeo\.com\/(\d+)/
    ],
    videoIdIndex: 1
  },
  dailymotion: {
    name: 'Dailymotion',
    patterns: [
      /dailymotion\.com\/video\/([a-zA-Z0-9]+)/
    ],
    videoIdIndex: 1
  }
};

/**
 * Validates if a URL is from a supported social media platform
 * @param {string} url - The URL to validate
 * @returns {Object} - Validation result with isValid, platform, videoId
 */
export const validateSocialMediaUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'Invalid URL' };
  }

  // Normalize URL
  const normalizedUrl = url.trim().toLowerCase();
  
  // Add protocol if missing
  const urlToTest = normalizedUrl.startsWith('http') ? normalizedUrl : `https://${normalizedUrl}`;

  try {
    const urlObj = new URL(urlToTest);
    const fullUrl = urlObj.href;

    // Test against each platform
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
 * Extracts video ID from a social media URL
 * @param {string} url - The URL to extract video ID from
 * @returns {string|null} - The extracted video ID or null
 */
export const extractVideoId = (url) => {
  const validation = validateSocialMediaUrl(url);
  return validation.isValid ? validation.videoId : null;
};

/**
 * Gets the platform type from a URL
 * @param {string} url - The URL to check
 * @returns {string|null} - The platform key or null
 */
export const getPlatformFromUrl = (url) => {
  const validation = validateSocialMediaUrl(url);
  return validation.isValid ? validation.platform : null;
};

/**
 * Gets list of supported platform names
 * @returns {Array<string>} - Array of supported platform names
 */
export const getSupportedPlatforms = () => {
  return Object.values(PLATFORM_CONFIGS).map(config => config.name);
};

/**
 * Gets platform configuration
 * @param {string} platform - Platform key
 * @returns {Object|null} - Platform configuration or null
 */
export const getPlatformConfig = (platform) => {
  return PLATFORM_CONFIGS[platform] || null;
};

/**
 * Converts platform-specific URL to a standardized format for processing
 * @param {string} url - Original URL
 * @param {string} platform - Platform key
 * @param {string} videoId - Video ID
 * @returns {Object} - Standardized URL info
 */
export const getStandardizedUrlInfo = (url, platform, videoId) => {
  const config = getPlatformConfig(platform);
  if (!config) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  const standardized = {
    platform,
    platformName: config.name,
    videoId,
    originalUrl: url,
    // Generate a standard embed URL if needed
    embedUrl: generateEmbedUrl(platform, videoId),
    downloadUrl: generateDownloadUrl(platform, videoId)
  };

  return standardized;
};

/**
 * Generates embed URL for supported platforms
 * @param {string} platform - Platform key
 * @param {string} videoId - Video ID
 * @returns {string|null} - Embed URL or null if not supported
 */
const generateEmbedUrl = (platform, videoId) => {
  const embedUrls = {
    youtube: `https://www.youtube.com/embed/${videoId}`,
    vimeo: `https://player.vimeo.com/video/${videoId}`,
    dailymotion: `https://www.dailymotion.com/embed/video/${videoId}`,
    // Note: Instagram, TikTok, Twitter don't have standard embed URLs
  };

  return embedUrls[platform] || null;
};

/**
 * Generates download URL hint for video processing
 * @param {string} platform - Platform key
 * @param {string} videoId - Video ID
 * @returns {string} - URL for download processing
 */
const generateDownloadUrl = (platform, videoId) => {
  const baseUrls = {
    youtube: `https://www.youtube.com/watch?v=${videoId}`,
    instagram: `https://www.instagram.com/p/${videoId}/`,
    tiktok: `https://www.tiktok.com/@user/video/${videoId}`,
    twitter: `https://twitter.com/user/status/${videoId}`,
    facebook: `https://www.facebook.com/user/videos/${videoId}`,
    vimeo: `https://vimeo.com/${videoId}`,
    dailymotion: `https://www.dailymotion.com/video/${videoId}`
  };

  return baseUrls[platform] || '';
};

/**
 * Validates multiple URLs and returns results for each
 * @param {Array<string>} urls - Array of URLs to validate
 * @returns {Array<Object>} - Array of validation results
 */
export const validateMultipleUrls = (urls) => {
  return urls.map((url, index) => ({
    index,
    url,
    ...validateSocialMediaUrl(url)
  }));
};

/**
 * Gets platform-specific metadata that might be useful for processing
 * @param {string} platform - Platform key
 * @returns {Object} - Platform metadata
 */
export const getPlatformMetadata = (platform) => {
  const metadata = {
    youtube: {
      maxDuration: '12:00:00', // 12 hours for most users
      typicalResolutions: ['1080p', '720p', '480p', '360p'],
      supportsShorts: true,
      requiresAuth: false
    },
    instagram: {
      maxDuration: '00:01:00', // 1 minute for posts, 15 minutes for IGTV
      typicalResolutions: ['1080p', '720p'],
      supportsStories: true,
      requiresAuth: true // May require auth for private accounts
    },
    tiktok: {
      maxDuration: '00:10:00', // 10 minutes max
      typicalResolutions: ['1080p', '720p'],
      verticalVideo: true,
      requiresAuth: false
    },
    twitter: {
      maxDuration: '00:02:20', // 2 minutes 20 seconds
      typicalResolutions: ['1080p', '720p'],
      requiresAuth: false
    },
    facebook: {
      maxDuration: '04:00:00', // 4 hours
      typicalResolutions: ['1080p', '720p', '480p'],
      requiresAuth: true // May require auth
    },
    vimeo: {
      maxDuration: '24:00:00', // 24 hours for Pro users
      typicalResolutions: ['4K', '1080p', '720p'],
      highQuality: true,
      requiresAuth: false
    },
    dailymotion: {
      maxDuration: '02:00:00', // 2 hours
      typicalResolutions: ['1080p', '720p', '480p'],
      requiresAuth: false
    }
  };

  return metadata[platform] || {
    maxDuration: 'unknown',
    typicalResolutions: ['1080p', '720p'],
    requiresAuth: false
  };
};
