/**
 * Video Processing and Frame Extraction Utilities
 * Handles video download, processing, and frame extraction for social media content
 */

/**
 * Downloads video from social media URL using browser-based approach
 * Note: In a production environment, this would typically use a backend service
 * with yt-dlp or similar tools due to CORS and API limitations
 * @param {string} url - Social media URL
 * @param {string} platform - Platform type
 * @returns {Promise<Blob>} - Video blob
 */
export const downloadVideo = async (url, platform) => {
  // For demo purposes, we'll simulate video download
  // In production, this would call a backend service that uses yt-dlp
  
  try {
    // Check if it's a direct video URL (for testing)
    if (url.startsWith('blob:') || url.startsWith('data:') || url.includes('mp4')) {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch video: ${response.statusText}`);
      }
      return await response.blob();
    }

    // For social media URLs, we need a backend service
    // This is a placeholder that would call your backend API
    const backendUrl = '/api/download-video'; // This would be your backend endpoint
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        platform: platform,
        format: 'mp4',
        quality: 'best[height<=720]' // Limit quality for faster processing
      })
    });

    if (!response.ok) {
      // Fallback: return a demo error or placeholder
      throw new Error('Video download service unavailable. Please upload a video file instead.');
    }

    return await response.blob();

  } catch (error) {
    console.error('Video download error:', error);
    throw new Error(`Failed to download video: ${error.message}`);
  }
};

/**
 * Extracts frames from a video file using HTML5 Canvas
 * @param {Blob|File} videoBlob - Video blob or file
 * @param {Object} options - Extraction options
 * @returns {Promise<Array<ArrayBuffer>>} - Array of frame data as ArrayBuffers
 */
export const extractFrames = async (videoBlob, options = {}) => {
  const {
    maxFrames = 10,
    interval = 1000, // milliseconds
    format = 'jpeg',
    quality = 0.8,
    width = 224,  // Standard input size for many AI models
    height = 224
  } = options;

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = width;
    canvas.height = height;

    const frames = [];
    let currentTime = 0;
    let frameCount = 0;

    video.addEventListener('loadedmetadata', () => {
      const duration = video.duration * 1000; // Convert to milliseconds
      const actualInterval = Math.min(interval, duration / maxFrames);
      
      console.log(`Video duration: ${duration}ms, extracting ${maxFrames} frames at ${actualInterval}ms intervals`);
      
      extractNextFrame();
    });

    video.addEventListener('error', (e) => {
      reject(new Error(`Video loading error: ${e.message || 'Unknown error'}`));
    });

    const extractNextFrame = () => {
      if (frameCount >= maxFrames || currentTime >= video.duration) {
        resolve(frames);
        return;
      }

      video.currentTime = currentTime / 1000; // Convert back to seconds
    };

    video.addEventListener('seeked', () => {
      try {
        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, width, height);
        
        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (blob) {
            const reader = new FileReader();
            reader.onload = () => {
              frames.push(reader.result);
              frameCount++;
              currentTime += interval;
              
              // Extract next frame
              setTimeout(extractNextFrame, 10); // Small delay to prevent blocking
            };
            reader.onerror = () => {
              reject(new Error('Failed to read frame data'));
            };
            reader.readAsArrayBuffer(blob);
          } else {
            reject(new Error('Failed to extract frame'));
          }
        }, `image/${format}`, quality);

      } catch (error) {
        reject(new Error(`Frame extraction error: ${error.message}`));
      }
    });

    // Load video
    const videoUrl = URL.createObjectURL(videoBlob);
    video.src = videoUrl;
    video.load();

    // Cleanup URL when done
    video.addEventListener('loadeddata', () => {
      URL.revokeObjectURL(videoUrl);
    });
  });
};

/**
 * Validates video file before processing
 * @param {File|Blob} videoFile - Video file to validate
 * @returns {Promise<Object>} - Validation result
 */
export const validateVideoFile = async (videoFile) => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    
    video.addEventListener('loadedmetadata', () => {
      const validation = {
        isValid: true,
        duration: video.duration,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        fileSize: videoFile.size,
        fileType: videoFile.type,
        isSupported: video.canPlayType(videoFile.type) !== ''
      };
      
      // Check constraints
      if (video.duration > 600) { // 10 minutes max
        validation.warnings = validation.warnings || [];
        validation.warnings.push('Video is longer than 10 minutes, processing may take time');
      }
      
      if (videoFile.size > 100 * 1024 * 1024) { // 100MB max
        validation.warnings = validation.warnings || [];
        validation.warnings.push('Video file is very large, processing may be slow');
      }
      
      resolve(validation);
    });

    video.addEventListener('error', () => {
      resolve({
        isValid: false,
        error: 'Invalid or corrupted video file',
        fileType: videoFile.type,
        fileSize: videoFile.size
      });
    });

    const videoUrl = URL.createObjectURL(videoFile);
    video.src = videoUrl;
    video.load();

    // Cleanup
    setTimeout(() => {
      URL.revokeObjectURL(videoUrl);
    }, 5000);
  });
};

/**
 * Gets optimal frame extraction settings based on video properties
 * @param {Object} videoInfo - Video metadata
 * @param {Object} analysisRequirements - Analysis requirements
 * @returns {Object} - Optimal extraction settings
 */
export const getOptimalExtractionSettings = (videoInfo, analysisRequirements = {}) => {
  const {
    maxFrames = 10,
    minFrames = 3,
    preferredQuality = 'medium'
  } = analysisRequirements;

  const duration = videoInfo.duration;
  const width = videoInfo.videoWidth;
  const height = videoInfo.videoHeight;

  // Calculate optimal frame count based on duration
  let optimalFrames = maxFrames;
  if (duration < 10) {
    optimalFrames = Math.max(minFrames, Math.min(maxFrames, Math.ceil(duration / 2)));
  } else if (duration > 60) {
    optimalFrames = maxFrames;
  }

  // Calculate interval
  const interval = Math.max(1000, (duration * 1000) / optimalFrames);

  // Determine output resolution
  let outputWidth = 224;
  let outputHeight = 224;

  if (preferredQuality === 'high') {
    outputWidth = 512;
    outputHeight = 512;
  } else if (preferredQuality === 'low') {
    outputWidth = 128;
    outputHeight = 128;
  }

  // Maintain aspect ratio if needed
  const aspectRatio = width / height;
  if (aspectRatio > 1) {
    outputHeight = Math.round(outputWidth / aspectRatio);
  } else {
    outputWidth = Math.round(outputHeight * aspectRatio);
  }

  return {
    maxFrames: optimalFrames,
    interval,
    width: outputWidth,
    height: outputHeight,
    quality: preferredQuality === 'high' ? 0.9 : 0.8,
    format: 'jpeg'
  };
};

/**
 * Creates a thumbnail from video for preview
 * @param {Blob|File} videoBlob - Video blob
 * @param {number} timeOffset - Time offset in seconds for thumbnail
 * @returns {Promise<string>} - Data URL of thumbnail
 */
export const createVideoThumbnail = async (videoBlob, timeOffset = 1) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = 320;
    canvas.height = 240;

    video.addEventListener('loadedmetadata', () => {
      video.currentTime = Math.min(timeOffset, video.duration * 0.1); // 10% into video or 1 second
    });

    video.addEventListener('seeked', () => {
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(thumbnailUrl);
      } catch (error) {
        reject(new Error(`Thumbnail creation error: ${error.message}`));
      }
    });

    video.addEventListener('error', () => {
      reject(new Error('Failed to load video for thumbnail'));
    });

    const videoUrl = URL.createObjectURL(videoBlob);
    video.src = videoUrl;
    video.load();

    // Cleanup
    setTimeout(() => {
      URL.revokeObjectURL(videoUrl);
    }, 5000);
  });
};

/**
 * Estimates processing time based on video properties
 * @param {Object} videoInfo - Video metadata
 * @param {Object} extractionSettings - Frame extraction settings
 * @returns {Object} - Time estimates
 */
export const estimateProcessingTime = (videoInfo, extractionSettings) => {
  const { duration, fileSize } = videoInfo;
  const { maxFrames } = extractionSettings;

  // Rough estimates based on typical performance
  const downloadTime = Math.max(2, fileSize / (1024 * 1024) * 0.5); // 0.5 seconds per MB
  const extractionTime = maxFrames * 0.5; // 0.5 seconds per frame
  const analysisTime = maxFrames * 2; // 2 seconds per frame for AI analysis

  const totalTime = downloadTime + extractionTime + analysisTime;

  return {
    download: Math.round(downloadTime),
    extraction: Math.round(extractionTime),
    analysis: Math.round(analysisTime),
    total: Math.round(totalTime),
    unit: 'seconds'
  };
};

/**
 * Utility to check browser support for video processing
 * @returns {Object} - Browser capability info
 */
export const checkBrowserSupport = () => {
  const video = document.createElement('video');
  const canvas = document.createElement('canvas');
  
  return {
    videoElement: !!video,
    canvasElement: !!canvas,
    canvas2d: !!(canvas.getContext && canvas.getContext('2d')),
    webgl: !!(canvas.getContext && canvas.getContext('webgl')),
    fileReader: !!window.FileReader,
    fetch: !!window.fetch,
    videoFormats: {
      mp4: video.canPlayType('video/mp4') !== '',
      webm: video.canPlayType('video/webm') !== '',
      ogg: video.canPlayType('video/ogg') !== ''
    },
    isSupported: function() {
      return this.videoElement && this.canvasElement && this.canvas2d && this.fileReader && this.fetch;
    }
  };
};
