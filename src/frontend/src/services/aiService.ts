/**
 * VeriChain AI Service
 * Handles communication with AI Canister for deepfake detection
 */

// Browser polyfill for global object - MUST be before imports
(globalThis as any).global = globalThis;
if (typeof window !== 'undefined') {
  (window as any).global = window;
}

import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { idlFactory, createActor } from '../../../declarations/ai_canister';

// Types for AI Model Integration
export interface DetectionResult {
  is_deepfake: boolean;
  confidence: number;
  media_type: 'Image' | 'Video';
  processing_time_ms: number;
  frames_analyzed?: number;
  metadata?: string;
}

export interface ModelInfo {
  version: string;
  input_size: [number, number];
  supported_formats: string[];
  max_file_size_mb: number;
  confidence_threshold: number;
}

export interface InitializationStatus {
  is_initialized: boolean;
  is_streaming: boolean;
  processed_chunks: number;
  total_chunks: number;
  current_size_mb: number;
  estimated_total_size_mb: number;
  initialization_started: boolean;
}

export interface UploadStatus {
  chunks_uploaded: number;
  total_chunks: number;
  upload_complete: boolean;
  last_chunk_uploaded?: number;
}

export class AIService {
  private actor: any;
  private agent: HttpAgent;

  constructor(canisterId?: string) {
    // Initialize agent for local development
    const isDevelopment = import.meta.env?.MODE === 'development' || import.meta.env?.DEV;
    
    this.agent = new HttpAgent({
      host: isDevelopment 
        ? 'http://localhost:4943' 
        : 'https://ic0.app'
    });

    // Fetch root key for local development
    if (isDevelopment) {
      this.agent.fetchRootKey().catch(err => {
        console.warn('Unable to fetch root key. Check to ensure that your local replica is running');
        console.error(err);
      });
    }

    // Create actor with proper canister ID - use the actual deployed canister ID
    const actualCanisterId = canisterId || 'uxrrr-q7777-77774-qaaaq-cai';
    
    console.log('🔗 Connecting to AI Canister:', actualCanisterId);
    
    try {
      this.actor = createActor(actualCanisterId, {
        agent: this.agent,
      });
      console.log('✅ AI Actor created successfully');
    } catch (error) {
      console.error('❌ Failed to create AI actor:', error);
      throw error;
    }
  }

  /**
   * Analyze single image for deepfake detection (Web3 Native)
   * Optimized for Internet Computer Protocol with chunking and compression
   * @param imageFile - File object containing image data
   * @returns Promise<DetectionResult>
   */
  async analyzeImage(imageFile: File): Promise<DetectionResult> {
    try {
      console.log(`🚀 [Web3] Starting native ICP analysis...`);
      console.log(`📁 File: ${imageFile.name} (${(imageFile.size / 1024 / 1024).toFixed(2)}MB)`);
      
      // Web3 Optimization: Check file size and compress if needed
      const MAX_SIZE_MB = 5; // ICP message limit
      let processedFile = imageFile;
      
      if (imageFile.size > MAX_SIZE_MB * 1024 * 1024) {
        console.log(`⚡ Compressing large file for ICP efficiency...`);
        processedFile = await this.compressImage(imageFile, MAX_SIZE_MB);
      }

      // Convert to Uint8Array for ICP canister call (Web3 native format)
      const arrayBuffer = await processedFile.arrayBuffer();
      const imageData = new Uint8Array(arrayBuffer);

      console.log(`� [ICP] Calling canister via Agent-JS...`);
      console.log(`📊 Data size: ${imageData.length} bytes`);
      
      // Native Web3 call to ICP canister (not HTTP POST!)
      const startTime = performance.now();
      const result = await this.actor.analyze_image(imageData);
      const callTime = performance.now() - startTime;
      
      console.log(`⚡ [Web3] Canister call completed in ${callTime.toFixed(0)}ms`);
      console.log('� Raw canister response:', result);
      
      // Handle Web3 Result<T, E> pattern from Rust canister
      let analysisResult: any;
      if (result && typeof result === 'object') {
        if ('Ok' in result) {
          console.log('✅ [Web3] Success result from canister');
          analysisResult = result.Ok;
        } else if ('Err' in result) {
          console.error('❌ [Web3] Error from canister:', result.Err);
          throw new Error(`Canister error: ${result.Err}`);
        } else {
          // Direct result (no Result wrapper)
          analysisResult = result;
        }
      } else {
        analysisResult = result;
      }
      
      // Parse ICP variant types (Web3 specific)
      let mediaType = 'Image';
      if (analysisResult.media_type) {
        if ('Image' in analysisResult.media_type) mediaType = 'Image';
        else if ('Video' in analysisResult.media_type) mediaType = 'Video';
        else if ('SocialMediaVideo' in analysisResult.media_type) mediaType = 'Video';
      }
      
      // Convert ICP types to frontend format
      const detectionResult: DetectionResult = {
        is_deepfake: Boolean(analysisResult.is_deepfake),
        confidence: Number(analysisResult.confidence),
        media_type: mediaType as 'Image' | 'Video',
        processing_time_ms: Number(analysisResult.processing_time_ms || 0),
        frames_analyzed: analysisResult.frames_analyzed ? Number(analysisResult.frames_analyzed[0]) : undefined,
        metadata: analysisResult.metadata ? analysisResult.metadata[0] : undefined
      };
      
      console.log(`🎯 [Web3] Analysis complete:`, {
        result: detectionResult.is_deepfake ? 'DEEPFAKE' : 'AUTHENTIC',
        confidence: `${(detectionResult.confidence * 100).toFixed(1)}%`,
        processing_time: `${detectionResult.processing_time_ms}ms`,
        canister_call_time: `${callTime.toFixed(0)}ms`,
        protocol: 'Internet Computer Protocol (Web3)'
      });
      
      return detectionResult;
    } catch (error) {
      console.error('❌ [Web3] Native ICP analysis failed:', error);
      throw new Error(`Web3 analysis failed: ${error}`);
    }
  }

  /**
   * Compress image for ICP efficiency (Web3 optimization)
   * @param file - Original image file
   * @param maxSizeMB - Maximum size in MB
   * @returns Promise<File> - Compressed file
   */
  private async compressImage(file: File, maxSizeMB: number): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Calculate optimal dimensions for ICP
        const maxDimension = 1024; // Optimal for VeriChain model
        const ratio = Math.min(maxDimension / img.width, maxDimension / img.height);
        
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        // High quality compression for AI model
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          const compressedFile = new File([blob!], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          console.log(`⚡ Compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
          resolve(compressedFile);
        }, 'image/jpeg', 0.85); // High quality for AI analysis
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Analyze video for deepfake detection (Web3 Native with Chunking)
   * Optimized for ICP with frame extraction and batch processing
   * @param videoFile - File object containing video data
   * @returns Promise<DetectionResult>
   */
  async analyzeVideo(videoFile: File): Promise<DetectionResult> {
    try {
      console.log(`🎬 [Web3] Starting native ICP video analysis...`);
      console.log(`📁 Video: ${videoFile.name} (${(videoFile.size / 1024 / 1024).toFixed(2)}MB)`);
      
      // Web3 Optimization: Extract key frames for efficient analysis
      const MAX_VIDEO_SIZE_MB = 10; // ICP limit for video
      
      if (videoFile.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
        console.log(`⚡ Large video detected, using frame extraction for ICP efficiency...`);
        return await this.analyzeVideoFrames(videoFile);
      }

      // Convert video to Uint8Array for ICP canister call
      const arrayBuffer = await videoFile.arrayBuffer();
      const videoData = new Uint8Array(arrayBuffer);

      console.log(`🔗 [ICP] Calling video analysis canister...`);
      console.log(`📊 Video data size: ${videoData.length} bytes`);
      
      // Native Web3 call to ICP canister
      const startTime = performance.now();
      const result = await this.actor.analyze_video(videoData);
      const callTime = performance.now() - startTime;
      
      console.log(`⚡ [Web3] Video canister call completed in ${callTime.toFixed(0)}ms`);
      console.log('📋 Raw video analysis result:', result);
      
      // Handle Web3 Result<T, E> pattern
      let analysisResult: any;
      if (result && typeof result === 'object') {
        if ('Ok' in result) {
          analysisResult = result.Ok;
        } else if ('Err' in result) {
          throw new Error(`Video analysis error: ${result.Err}`);
        } else {
          analysisResult = result;
        }
      } else {
        analysisResult = result;
      }
      
      // Parse ICP variant types
      let mediaType = 'Video';
      if (analysisResult.media_type) {
        if ('Image' in analysisResult.media_type) mediaType = 'Image';
        else if ('Video' in analysisResult.media_type) mediaType = 'Video';
        else if ('SocialMediaVideo' in analysisResult.media_type) mediaType = 'Video';
      }
      
      const detectionResult: DetectionResult = {
        is_deepfake: Boolean(analysisResult.is_deepfake),
        confidence: Number(analysisResult.confidence),
        media_type: mediaType as 'Image' | 'Video',
        processing_time_ms: Number(analysisResult.processing_time_ms || 0),
        frames_analyzed: analysisResult.frames_analyzed ? Number(analysisResult.frames_analyzed[0]) : undefined,
        metadata: analysisResult.metadata ? analysisResult.metadata[0] : undefined
      };
      
      console.log(`🎯 [Web3] Video analysis complete:`, {
        result: detectionResult.is_deepfake ? 'DEEPFAKE' : 'AUTHENTIC',
        confidence: `${(detectionResult.confidence * 100).toFixed(1)}%`,
        frames_analyzed: detectionResult.frames_analyzed || 'N/A',
        processing_time: `${detectionResult.processing_time_ms}ms`,
        canister_call_time: `${callTime.toFixed(0)}ms`,
        protocol: 'Internet Computer Protocol (Web3)'
      });
      
      return detectionResult;
    } catch (error) {
      console.error('❌ [Web3] Video analysis failed:', error);
      throw new Error(`Web3 video analysis failed: ${error}`);
    }
  }

  /**
   * Analyze video using frame extraction (Web3 optimization for large videos)
   * @param videoFile - Video file to analyze
   * @returns Promise<DetectionResult>
   */
  private async analyzeVideoFrames(videoFile: File): Promise<DetectionResult> {
    return new Promise(async (resolve, reject) => {
      try {
        console.log(`🎞️ [Web3] Extracting frames for ICP analysis...`);
        
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        video.onloadedmetadata = async () => {
          const duration = video.duration;
          const frameCount = Math.min(10, Math.floor(duration)); // Extract 10 key frames max
          const frames: Uint8Array[] = [];
          
          console.log(`⚡ Extracting ${frameCount} key frames from ${duration.toFixed(1)}s video`);
          
          canvas.width = Math.min(512, video.videoWidth); // Optimal for ICP
          canvas.height = Math.min(512, video.videoHeight);
          
          for (let i = 0; i < frameCount; i++) {
            const timeOffset = (duration / frameCount) * i;
            video.currentTime = timeOffset;
            
            await new Promise(resolve => {
              video.onseeked = () => {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                canvas.toBlob(async (blob) => {
                  if (blob) {
                    const arrayBuffer = await blob.arrayBuffer();
                    frames.push(new Uint8Array(arrayBuffer));
                  }
                  resolve(null);
                }, 'image/jpeg', 0.8);
              };
            });
          }
          
          console.log(`🔗 [ICP] Calling frame analysis canister with ${frames.length} frames...`);
          
          // Native Web3 call with extracted frames
          const startTime = performance.now();
          const result = await this.actor.analyze_frames(frames);
          const callTime = performance.now() - startTime;
          
          console.log(`⚡ [Web3] Frame analysis completed in ${callTime.toFixed(0)}ms`);
          
          // Handle result similar to video analysis
          let analysisResult: any;
          if (result && typeof result === 'object') {
            if ('Ok' in result) {
              analysisResult = result.Ok;
            } else if ('Err' in result) {
              throw new Error(`Frame analysis error: ${result.Err}`);
            } else {
              analysisResult = result;
            }
          } else {
            analysisResult = result;
          }
          
          const detectionResult: DetectionResult = {
            is_deepfake: Boolean(analysisResult.is_deepfake),
            confidence: Number(analysisResult.confidence),
            media_type: 'Video',
            processing_time_ms: Number(analysisResult.processing_time_ms || 0),
            frames_analyzed: frames.length,
            metadata: analysisResult.metadata ? analysisResult.metadata[0] : undefined
          };
          
          console.log(`🎯 [Web3] Frame-based analysis complete:`, {
            result: detectionResult.is_deepfake ? 'DEEPFAKE' : 'AUTHENTIC',
            confidence: `${(detectionResult.confidence * 100).toFixed(1)}%`,
            frames_analyzed: detectionResult.frames_analyzed,
            method: 'Frame Extraction + ICP Analysis'
          });
          
          resolve(detectionResult);
        };
        
        video.onerror = () => reject(new Error('Failed to load video for frame extraction'));
        video.src = URL.createObjectURL(videoFile);
        video.load();
        
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Analyze preprocessed frames from frontend (for video processing)
   * @param framesData - Array of frame data as Uint8Array
   * @returns Promise<DetectionResult>
   */
  async analyzeFrames(framesData: Uint8Array[]): Promise<DetectionResult> {
    try {
      console.log(`🎞️ Analyzing ${framesData.length} extracted frames`);
      
      const result = await this.actor.analyze_frames(framesData);
      
      console.log('✅ Frame analysis complete:', result);
      return result;
    } catch (error) {
      console.error('❌ Frame analysis failed:', error);
      throw new Error(`Frame analysis failed: ${error}`);
    }
  }

  /**
   * Get AI model information and capabilities
   * @returns Promise<ModelInfo>
   */
  async getModelInfo(): Promise<ModelInfo> {
    try {
      const info = await this.actor.get_model_info();
      console.log('📋 Model info retrieved:', info);
      return info;
    } catch (error) {
      console.error('❌ Failed to get model info:', error);
      throw new Error(`Failed to get model info: ${error}`);
    }
  }

  /**
   * Check AI canister health status
   * @returns Promise<boolean>
   */
  async healthCheck(): Promise<boolean> {
    try {
      const isHealthy = await this.actor.health_check();
      console.log('🏥 Health check result:', isHealthy);
      return isHealthy;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return false;
    }
  }

  /**
   * Get model initialization status
   * @returns Promise<InitializationStatus>
   */
  async getInitializationStatus(): Promise<InitializationStatus> {
    try {
      console.log('🔄 Fetching initialization status...');
      const status = await this.actor.get_model_initialization_status();
      console.log('🔄 Raw initialization status:', status);
      
      // Handle the response format from the canister
      if (status && status.Ok) {
        console.log('✅ Status OK:', status.Ok);
        return status.Ok;
      } else if (status && status.Err) {
        console.error('❌ Status Error:', status.Err);
        throw new Error(status.Err);
      }
      
      // If status is direct object, return it
      console.log('📄 Direct status:', status);
      return status;
    } catch (error) {
      console.error('❌ Failed to get initialization status:', error);
      throw new Error(`Failed to get initialization status: ${error}`);
    }
  }

  /**
   * Start model streaming initialization
   * @returns Promise<void>
   */
  async startStreamingInitialization(): Promise<void> {
    try {
      await this.actor.initialize_model_from_chunks();
      console.log('🚀 Streaming initialization started');
    } catch (error) {
      console.error('❌ Failed to start streaming initialization:', error);
      throw new Error(`Failed to start streaming initialization: ${error}`);
    }
  }

  /**
   * Continue model initialization with batch processing
   * @param batchSize - Number of chunks to process in this batch
   * @returns Promise<[number, number]> - [processed_chunks, total_chunks]
   */
  async continueInitialization(batchSize: number = 10): Promise<[number, number]> {
    try {
      const result = await this.actor.continue_model_initialization([batchSize]);
      console.log(`⏭️ Processed batch: ${result[0]}/${result[1]} chunks`);
      return result;
    } catch (error) {
      console.error('❌ Failed to continue initialization:', error);
      throw new Error(`Failed to continue initialization: ${error}`);
    }
  }

  /**
   * Get model upload status
   * @returns Promise<UploadStatus>
   */
  async getUploadStatus(): Promise<UploadStatus> {
    try {
      const status = await this.actor.get_upload_status();
      console.log('📊 Upload status:', status);
      return status;
    } catch (error) {
      console.error('❌ Failed to get upload status:', error);
      throw new Error(`Failed to get upload status: ${error}`);
    }
  }

  /**
   * Verify model integrity
   * @returns Promise<boolean>
   */
  async verifyModelIntegrity(): Promise<boolean> {
    try {
      const isValid = await this.actor.verify_model_integrity();
      console.log('🔒 Model integrity verification:', isValid);
      return isValid;
    } catch (error) {
      console.error('❌ Model integrity verification failed:', error);
      return false;
    }
  }

  /**
   * Get model loading statistics
   * @returns Promise<any>
   */
  async getLoadingStats(): Promise<any> {
    try {
      const stats = await this.actor.get_loading_stats();
      console.log('📈 Loading statistics:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Failed to get loading stats:', error);
      throw new Error(`Failed to get loading stats: ${error}`);
    }
  }

  /**
   * Validate file format before processing
   * @param filename - Name of the file to validate
   * @returns Promise<boolean>
   */
  async validateFileFormat(filename: string): Promise<boolean> {
    try {
      console.log('🔍 Validating file format for:', filename);
      const result = await this.actor.validate_file_format(filename);
      console.log('✅ File format validation result:', result);
      return result;
    } catch (error) {
      console.error('❌ File format validation error:', error);
      // Return true for common image formats as fallback
      const supportedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
      const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
      const isSupported = supportedExtensions.includes(extension);
      console.log(`🔧 Fallback validation for ${extension}:`, isSupported);
      return isSupported;
    }
  }
}

// Export singleton instance
export const aiService = new AIService();

// Utility functions for frontend integration
export const formatConfidence = (confidence: number): string => {
  return `${(confidence * 100).toFixed(1)}%`;
};

export const formatProcessingTime = (timeMs: number): string => {
  if (timeMs < 1000) {
    return `${timeMs}ms`;
  }
  return `${(timeMs / 1000).toFixed(1)}s`;
};

export const getConfidenceColor = (confidence: number, isDeepfake: boolean): string => {
  if (isDeepfake) {
    return confidence > 0.8 ? '#dc2626' : confidence > 0.6 ? '#ea580c' : '#f59e0b';
  }
  return confidence > 0.8 ? '#059669' : confidence > 0.6 ? '#0891b2' : '#6366f1';
};

export const formatFileSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};
