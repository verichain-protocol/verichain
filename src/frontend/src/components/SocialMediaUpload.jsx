import React, { useState, useRef } from 'react';
import { validateSocialMediaUrl, extractVideoId, getSupportedPlatforms } from '../utils/socialMediaParser';
import { downloadVideo, extractFrames } from '../utils/videoProcessor';
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
        platform: platform,
        video_id: videoId,
        frames: frames.map(frame => Array.from(new Uint8Array(frame)))
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

    if (!file.type.startsWith('video/')) {
      onError('Please select a video file');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setStatus('Processing uploaded video...');

    try {
      // Step 1: Extract frames from uploaded video
      setStatus('Extracting frames...');
      setProgress(30);
      const frames = await extractFrames(file, {
        maxFrames: 10,
        interval: 1000,
        format: 'jpeg',
        quality: 0.8
      });

      if (frames.length === 0) {
        throw new Error('No frames could be extracted from the video');
      }

      // Step 2: Analyze with backend
      setStatus('Analyzing frames with AI model...');
      setProgress(70);

      const socialMediaInput = {
        url: `file://${file.name}`,
        platform: 'uploaded',
        video_id: file.name,
        frames: frames.map(frame => Array.from(new Uint8Array(frame)))
      };

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
      console.error('Video upload analysis error:', error);
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
        <h3>Social Media Analysis</h3>
        <p>Analyze videos from social media platforms or upload your own video file</p>
        
        <div className="url-input-section">
          <label htmlFor="social-url">Social Media URL:</label>
          <input
            id="social-url"
            type="url"
            value={url}
            onChange={handleUrlChange}
            placeholder="Paste YouTube, Instagram, TikTok, or other social media URL..."
            disabled={isProcessing}
            className="url-input"
          />
          
          <div className="supported-platforms">
            <small>Supported platforms: {supportedPlatforms.join(', ')}</small>
          </div>
        </div>

        <div className="divider">
          <span>OR</span>
        </div>

        <div className="file-upload-section">
          <label htmlFor="video-file">Upload Video File:</label>
          <input
            ref={fileInputRef}
            id="video-file"
            type="file"
            accept="video/*"
            onChange={handleFileUpload}
            disabled={isProcessing}
            className="file-input"
          />
        </div>

        {status && (
          <div className={`status-message ${platform ? 'valid' : 'invalid'}`}>
            {status}
          </div>
        )}

        {isProcessing && (
          <div className="progress-section">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="progress-text">{progress}%</div>
          </div>
        )}

        <div className="action-buttons">
          <button
            onClick={handleAnalyze}
            disabled={!url || !platform || isProcessing}
            className="analyze-button primary"
          >
            {isProcessing ? 'Processing...' : 'Analyze Video'}
          </button>
        </div>
      </div>

      <div className="info-section">
        <h4>How it works:</h4>
        <ol>
          <li>Paste a social media URL or upload a video file</li>
          <li>Video is downloaded/processed and frames are extracted</li>
          <li>AI model analyzes each frame for deepfake detection</li>
          <li>Results show authenticity score and analysis details</li>
        </ol>
        
        <div className="privacy-note">
          <small>
            <strong>Privacy:</strong> Videos are processed locally in your browser when possible. 
            Only extracted frames are sent to the analysis service.
          </small>
        </div>
      </div>
    </div>
  );
};

export default SocialMediaUpload;
