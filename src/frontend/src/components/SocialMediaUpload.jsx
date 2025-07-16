import React, { useState, useRef } from 'react';
import { validateSocialMediaUrl, extractVideoId, getSupportedPlatforms } from '../utils/socialMediaParser';
import { downloadVideo, extractFrames, checkBrowserSupport, testVideoCompatibility } from '../utils/videoProcessor';
import { ai_canister } from '../../../declarations/ai_canister';
import './SocialMediaUpload.scss';

const SocialMediaUpload = ({ onAnalysisComplete, onError }) => {
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [platform, setPlatform] = useState(null);
  const [videoId, setVideoId] = useState(null);
  const fileInputRef = useRef(null);

  const supportedPlatforms = getSupportedPlatforms();

  const handleUrlChange = (e) => {
    const inputUrl = e.target.value;
    setUrl(inputUrl);
    
    if (inputUrl) {
      const validation = validateSocialMediaUrl(inputUrl);
      if (validation.isValid) {
        setPlatform(validation.platform);
        setVideoId(validation.videoId);
        setStatus(`✓ Valid ${validation.platform} URL detected`);
      } else {
        setPlatform(null);
        setVideoId(null);
        setStatus('❌ Invalid or unsupported URL format');
      }
    } else {
      setPlatform(null);
      setVideoId(null);
      setStatus('');
    }
  };

  const handleAnalyze = async () => {
    if (!url || !platform || !videoId) {
      onError('Please enter a valid social media URL');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setStatus('Starting analysis...');

    try {
      // Step 1: Download video
      setStatus('Downloading video...');
      setProgress(20);
      const videoBlob = await downloadVideo(url, platform);
      
      // Step 2: Extract frames
      setStatus('Extracting frames...');
      setProgress(40);
      const frames = await extractFrames(videoBlob, {
        maxFrames: 10,
        interval: 1000, // Extract frame every second
        format: 'jpeg',
        quality: 0.8
      });

      if (frames.length === 0) {
        throw new Error('No frames could be extracted from the video');
      }

      // Step 3: Analyze with backend
      setStatus('Analyzing frames with AI model...');
      setProgress(60);

      const socialMediaInput = {
        url: url,
        platform: { [platform]: null }, // Convert to correct enum format
        frames: frames.map(frame => Array.from(new Uint8Array(frame))),
        metadata: [JSON.stringify({ video_id: videoId, extraction_method: 'frontend_preprocessing' })]
      };

      const result = await ai_canister.analyze_social_media(socialMediaInput);
      
      setProgress(100);
      setStatus('Analysis complete!');
      
      // Process results
      const analysisResult = {
        type: 'social_media',
        platform: platform,
        url: url,
        videoId: videoId,
        frameCount: frames.length,
        results: result,
        timestamp: new Date().toISOString()
      };

      onAnalysisComplete(analysisResult);
      
      // Reset form
      setUrl('');
      setPlatform(null);
      setVideoId(null);
      setStatus('');
      
    } catch (error) {
      console.error('Social media analysis error:', error);
      onError(`Analysis failed: ${error.message}`);
      setStatus('Analysis failed');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    console.log('=== VIDEO FILE UPLOAD DEBUG ===');
    console.log('File selected:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    });

    if (!file.type.startsWith('video/')) {
      onError('Please select a video file');
      return;
    }

    // Check browser support
    const browserSupport = checkBrowserSupport();
    console.log('Browser support check:', browserSupport);
    
    if (!browserSupport.isSupported()) {
      onError('Your browser does not support video processing features required for this application');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setStatus('Checking video compatibility...');

    try {
      // Step 0: Test video compatibility
      console.log('Testing video compatibility...');
      const compatibilityResult = await testVideoCompatibility(file);
      console.log('Video compatibility test result:', compatibilityResult);
      
      if (!compatibilityResult.isCompatible) {
        console.warn('Video compatibility test failed, but attempting to proceed anyway');
        console.warn('Compatibility error:', compatibilityResult.error);
        console.warn('Browser canPlayType result:', compatibilityResult.canPlayType);
        
        // Check if it's just a codec issue but the browser claims to support MP4
        const browserSupport = checkBrowserSupport();
        console.log('Detailed browser support:', browserSupport);
        
        if (file.type === 'video/mp4' && browserSupport.videoFormats.mp4) {
          console.log('Browser supports MP4 generally, proceeding despite compatibility test failure');
          setStatus('Video codec may be unsupported, but attempting to process...');
        } else {
          console.log('Fundamental compatibility issue detected');
          setStatus('Video may have compatibility issues, attempting to process...');
        }
      } else {
        console.log('Video compatibility confirmed:', {
          duration: compatibilityResult.duration,
          dimensions: `${compatibilityResult.videoWidth}x${compatibilityResult.videoHeight}`,
          canPlayType: compatibilityResult.canPlayType
        });
      }

      // Step 1: Extract frames from uploaded video - ALWAYS TRY THIS
      setStatus('Extracting frames...');
      setProgress(30);
      
      console.log('Starting frame extraction...');
      const frames = await extractFrames(file, {
        maxFrames: 10,
        interval: 1000,
        format: 'jpeg',
        quality: 0.8
      });

      console.log('Frame extraction completed:', frames.length, 'frames');

      if (frames.length === 0) {
        throw new Error('No frames could be extracted from the video');
      }

      // Step 2: Analyze with backend
      setStatus('Analyzing frames with AI model...');
      setProgress(70);

      const socialMediaInput = {
        url: `file://${file.name}`,
        platform: { Other: 'uploaded' }, // Use 'Other' platform for uploaded files
        frames: frames.map(frame => Array.from(new Uint8Array(frame))),
        metadata: [JSON.stringify({ video_id: file.name, extraction_method: 'frontend_preprocessing' })]
      };

      console.log('Calling AI canister with input:', {
        url: socialMediaInput.url,
        platform: socialMediaInput.platform,
        frameCount: socialMediaInput.frames.length,
        metadataCount: socialMediaInput.metadata.length
      });

      const result = await ai_canister.analyze_social_media(socialMediaInput);
      
      setProgress(100);
      setStatus('Analysis complete!');
      
      const analysisResult = {
        type: 'social_media',
        platform: 'uploaded',
        url: `file://${file.name}`,
        videoId: file.name,
        frameCount: frames.length,
        results: result,
        timestamp: new Date().toISOString()
      };

      onAnalysisComplete(analysisResult);
      
    } catch (error) {
      console.error('=== VIDEO UPLOAD ERROR ===');
      console.error('Error details:', error);
      console.error('Error stack:', error.stack);
      
      onError(`Analysis failed: ${error.message}`);
      setStatus('Analysis failed');
    } finally {
      setIsProcessing(false);
      setProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="social-media-upload">
      <div className="upload-section">
        <div className="url-input-section">
          <div className="input-group">
            <label htmlFor="social-url">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              Social Media URL
            </label>
            <input
              id="social-url"
              type="url"
              value={url}
              onChange={handleUrlChange}
              placeholder="Paste YouTube, Instagram, TikTok, or other social media URL..."
              disabled={isProcessing}
              className="url-input"
            />
            
            {status && (
              <div className={`status-indicator ${platform ? 'valid' : 'invalid'}`}>
                <div className="status-icon">
                  {platform ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="m9 12 2 2 4-4"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="15" y1="9" x2="9" y2="15"/>
                      <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                  )}
                </div>
                <span>{status}</span>
              </div>
            )}
            
            <div className="supported-platforms">
              <div className="platforms-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Supported Platforms
              </div>
              <div className="platforms-list">
                {supportedPlatforms.map(platform => (
                  <span key={platform} className="platform-tag">{platform}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="divider">
          <span>OR</span>
        </div>

        <div className="file-upload-section">
          <div className="input-group">
            <label htmlFor="video-file">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polygon points="23 7 16 12 23 17 23 7"/>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              </svg>
              Upload Video File
            </label>
            <div className="file-input-wrapper">
              <input
                ref={fileInputRef}
                id="video-file"
                type="file"
                accept="video/*"
                onChange={handleFileUpload}
                disabled={isProcessing}
                className="file-input"
              />
              <div className="file-input-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7,10 12,15 17,10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <span>Choose video file or drag & drop</span>
                <small>MP4, WebM, MOV supported</small>
              </div>
            </div>
          </div>
        </div>

        {isProcessing && (
          <div className="progress-section">
            <div className="progress-header">
              <span className="progress-label">Processing</span>
              <span className="progress-percentage">{progress}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="progress-status">{status}</div>
          </div>
        )}

        <div className="action-section">
          <button
            onClick={handleAnalyze}
            disabled={!url || !platform || isProcessing}
            className="analyze-button"
          >
            {isProcessing ? (
              <>
                <div className="button-spinner"/>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 12l2 2 4-4"/>
                  <circle cx="12" cy="12" r="10"/>
                </svg>
                <span>Analyze Video</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="info-section">
        <div className="info-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <h4>How Social Media Analysis Works</h4>
        </div>
        
        <div className="process-steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h5>URL or File Input</h5>
              <p>Paste a social media URL or upload a video file directly</p>
            </div>
          </div>
          
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h5>Frame Extraction</h5>
              <p>Video is processed and key frames are extracted for analysis</p>
            </div>
          </div>
          
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h5>AI Analysis</h5>
              <p>Advanced AI model analyzes each frame for deepfake detection</p>
            </div>
          </div>
          
          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h5>Results</h5>
              <p>Receive authenticity score and detailed analysis report</p>
            </div>
          </div>
        </div>
        
        <div className="privacy-note">
          <div className="privacy-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <circle cx="12" cy="16" r="1"/>
              <path d="m7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <strong>Privacy & Security</strong>
          </div>
          <p>
            Videos are processed locally in your browser when possible. 
            Only extracted frames are sent to the blockchain analysis service, ensuring your privacy and data security.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SocialMediaUpload;
