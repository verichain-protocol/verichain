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
    if (url.startsWith('blob:') || url.startsWith('data:') || url.includes('.mp4') || url.includes('.webm') || url.includes('.mov')) {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch video: ${response.statusText}`);
      }
      return await response.blob();
    }

    // For social media URLs, we don't have a backend video download service yet
    // This feature requires implementing a backend service with yt-dlp or similar
    throw new Error('Social media URL download is not yet implemented. Please download the video file manually and use the "Upload Video File" option instead.');

  } catch (error) {
    console.error('Video download error:', error);
    throw new Error(`Video loading error: ${error.message}`);
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

  console.log('=== FRAME EXTRACTION DEBUG START ===');
  console.log('Starting frame extraction with options:', options);
  console.log('Video blob info:', {
    size: videoBlob.size,
    type: videoBlob.type,
    constructor: videoBlob.constructor.name
  });

  // Check browser support first
  const support = checkBrowserSupport();
  console.log('Browser support check:', support);
  
  if (!support.isSupported()) {
    throw new Error('Browser does not support required video processing features');
  }

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = width;
    canvas.height = height;

    const frames = [];
    let currentTime = 0;
    let frameCount = 0;
    let timeoutId = null;
    let hasTimedOut = false;

    // Set up timeout to prevent hanging
    const timeout = setTimeout(() => {
      hasTimedOut = true;
      console.error('Frame extraction timed out after 30 seconds');
      reject(new Error('Frame extraction timed out - video may be corrupted or unsupported'));
    }, 30000);

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      clearTimeout(timeout);
      if (video.src && video.src.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(video.src);
        } catch (e) {
          console.warn('Error revoking video URL:', e);
        }
      }
    };

    video.addEventListener('loadstart', () => {
      console.log('Video load started');
    });

    video.addEventListener('loadeddata', () => {
      console.log('Video data loaded');
    });

    video.addEventListener('loadedmetadata', () => {
      if (hasTimedOut) return;
      
      console.log('Video metadata loaded:', {
        duration: video.duration,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState,
        networkState: video.networkState
      });

      // Validate video - be more lenient
      if (!video.duration || isNaN(video.duration)) {
        console.warn('Video has invalid duration, but attempting to extract frames anyway');
        // Don't fail here, try to proceed
      }

      if (video.duration === Infinity) {
        console.warn('Video has infinite duration (possibly live stream), using default interval');
        // Set a reasonable default for infinite duration
        currentTime = 0;
        extractNextFrame();
        return;
      }

      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.warn('Video has zero dimensions, but attempting to proceed with default canvas size');
      }

      const duration = video.duration * 1000; // Convert to milliseconds
      const actualInterval = Math.min(interval, duration / maxFrames);
      
      console.log(`Video validated. Duration: ${duration}ms, extracting ${maxFrames} frames at ${actualInterval}ms intervals`);
      
      // Start extraction
      extractNextFrame();
    });

    video.addEventListener('error', (e) => {
      if (hasTimedOut) return;
      
      console.error('Video error event:', e);
      console.error('Video error details:', {
        error: video.error,
        code: video.error?.code,
        message: video.error?.message,
        networkState: video.networkState,
        readyState: video.readyState
      });
      
      cleanup();
      
      let errorMessage = 'Unknown video error';
      if (video.error) {
        switch (video.error.code) {
          case video.error.MEDIA_ERR_ABORTED:
            errorMessage = 'Video loading was aborted';
            break;
          case video.error.MEDIA_ERR_NETWORK:
            errorMessage = 'Network error while loading video';
            break;
          case video.error.MEDIA_ERR_DECODE:
            errorMessage = 'Video format not supported or corrupted';
            break;
          case video.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'Video format not supported by browser';
            break;
          default:
            errorMessage = video.error.message || 'Unknown video error';
        }
      }
      
      reject(new Error(`Video loading error: ${errorMessage}`));
    });

    const extractNextFrame = () => {
      if (hasTimedOut) return;
      
      if (frameCount >= maxFrames || currentTime >= video.duration * 1000) {
        console.log(`Frame extraction completed. Extracted ${frames.length} frames.`);
        
        // If we didn't get any frames, try to extract one frame from the beginning
        if (frames.length === 0) {
          console.warn('No frames extracted, attempting to get a single frame from start of video');
          video.currentTime = 0;
          frameCount = 0;
          currentTime = 0;
          return; // This will trigger seeked event
        }
        
        cleanup();
        resolve(frames);
        return;
      }

      console.log(`Extracting frame ${frameCount + 1} at time ${currentTime/1000}s`);
      video.currentTime = currentTime / 1000; // Convert back to seconds
    };

    video.addEventListener('seeked', () => {
      if (hasTimedOut) return;
      
      try {
        console.log('Video seeked to:', video.currentTime, 'readyState:', video.readyState);
        
        // Ensure video is ready for drawing
        if (video.readyState < 2) {
          console.warn('Video not ready for drawing, skipping frame');
          frameCount++;
          currentTime += interval;
          timeoutId = setTimeout(extractNextFrame, 100);
          return;
        }
        
        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, width, height);
        
        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (hasTimedOut) return;
          
          if (blob) {
            console.log('Frame blob created, size:', blob.size);
            const reader = new FileReader();
            reader.onload = () => {
              if (hasTimedOut) return;
              
              frames.push(reader.result);
              frameCount++;
              currentTime += interval;
              
              console.log(`Frame ${frameCount} extracted successfully, total frames: ${frames.length}`);
              
              // Extract next frame
              timeoutId = setTimeout(extractNextFrame, 150); // Small delay for stability
            };
            reader.onerror = (err) => {
              console.error('FileReader error:', err);
              cleanup();
              reject(new Error('Failed to read frame data'));
            };
            reader.readAsArrayBuffer(blob);
          } else {
            console.error('Failed to create blob from canvas');
            cleanup();
            reject(new Error('Failed to extract frame'));
          }
        }, `image/${format}`, quality);

      } catch (error) {
        console.error('Frame extraction error:', error);
        cleanup();
        reject(new Error(`Frame extraction error: ${error.message}`));
      }
    });

    // Load video
    try {
      console.log('Creating video URL from blob...');
      console.log('Blob details:', {
        size: videoBlob.size,
        type: videoBlob.type,
        lastModified: videoBlob.lastModified || 'N/A'
      });
      
      const videoUrl = URL.createObjectURL(videoBlob);
      console.log('Video URL created:', videoUrl);
      
      // Set video properties for better compatibility
      video.crossOrigin = 'anonymous';
      video.preload = 'metadata';
      video.muted = true; // Required for autoplay in some browsers
      
      video.src = videoUrl;
      console.log('Video src set, calling load()...');
      video.load();
      
    } catch (error) {
      console.error('Error creating video URL:', error);
      cleanup();
      reject(new Error(`Failed to create video URL: ${error.message}`));
    }
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
      mp4_h264: video.canPlayType('video/mp4; codecs="avc1.42E01E"') !== '',
      mp4_h265: video.canPlayType('video/mp4; codecs="hev1.1.6.L93.B0"') !== '',
      webm: video.canPlayType('video/webm') !== '',
      webm_vp8: video.canPlayType('video/webm; codecs="vp8"') !== '',
      webm_vp9: video.canPlayType('video/webm; codecs="vp9"') !== '',
      ogg: video.canPlayType('video/ogg') !== '',
      avi: video.canPlayType('video/avi') !== '',
      mov: video.canPlayType('video/quicktime') !== ''
    },
    isSupported: function() {
      return this.videoElement && this.canvasElement && this.canvas2d && this.fileReader && this.fetch;
    }
  };
};

/**
 * Quick test to check if a video file can be played by the browser
 * @param {File} videoFile - Video file to test
 * @returns {Promise<Object>} - Detailed compatibility result
 */
export const testVideoCompatibility = async (videoFile) => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    let hasResolved = false;
    
    const cleanup = () => {
      if (video.src && video.src.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(video.src);
        } catch (e) {
          console.warn('Error revoking URL:', e);
        }
      }
    };
    
    const resolveOnce = (result) => {
      if (!hasResolved) {
        hasResolved = true;
        cleanup();
        resolve(result);
      }
    };
    
    // Increased timeout for slower files
    const timeout = setTimeout(() => {
      console.warn('Video compatibility test timed out');
      resolveOnce({
        isCompatible: false,
        error: 'Timeout - file may be too large or corrupted',
        canPlayType: video.canPlayType(videoFile.type)
      });
    }, 10000);
    
    video.addEventListener('loadedmetadata', () => {
      console.log('Video compatibility test: metadata loaded successfully');
      clearTimeout(timeout);
      resolveOnce({
        isCompatible: true,
        duration: video.duration,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        canPlayType: video.canPlayType(videoFile.type)
      });
    });
    
    video.addEventListener('loadeddata', () => {
      console.log('Video compatibility test: data loaded successfully');
      // Don't resolve here, wait for metadata
    });
    
    video.addEventListener('error', (e) => {
      console.error('Video compatibility test error:', e);
      console.error('Video error details:', {
        error: video.error,
        code: video.error?.code,
        message: video.error?.message
      });
      
      clearTimeout(timeout);
      
      let errorMessage = 'Unknown video error';
      if (video.error) {
        switch (video.error.code) {
          case video.error.MEDIA_ERR_ABORTED:
            errorMessage = 'Video loading was aborted';
            break;
          case video.error.MEDIA_ERR_NETWORK:
            errorMessage = 'Network error while loading video';
            break;
          case video.error.MEDIA_ERR_DECODE:
            errorMessage = 'Video codec not supported or file corrupted';
            break;
          case video.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'Video format not supported by browser';
            break;
          default:
            errorMessage = video.error.message || 'Unknown video error';
        }
      }
      
      resolveOnce({
        isCompatible: false,
        error: errorMessage,
        errorCode: video.error?.code,
        canPlayType: video.canPlayType(videoFile.type)
      });
    });
    
    try {
      console.log('Creating video URL for compatibility test...');
      const videoUrl = URL.createObjectURL(videoFile);
      
      // Set video properties for better compatibility
      video.crossOrigin = 'anonymous';
      video.preload = 'metadata';
      video.muted = true;
      
      video.src = videoUrl;
      console.log('Loading video for compatibility test...');
      video.load();
      
    } catch (error) {
      console.error('Error creating video URL for compatibility test:', error);
      clearTimeout(timeout);
      resolveOnce({
        isCompatible: false,
        error: `Failed to create video URL: ${error.message}`,
        canPlayType: video.canPlayType(videoFile.type)
      });
    }
  });
};
