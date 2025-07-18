/// VeriChain Core AI Service
/// Main interface to AI canister for detection operations

import { HttpAgent } from '@dfinity/agent';
import { createActor } from '../../../declarations/ai_canister';
import { DetectionResult, ModelInfo } from '../types/ai.types';
import { authService } from './auth.service';

// Browser polyfill for global object
(globalThis as any).global = globalThis;
if (typeof window !== 'undefined') {
  (window as any).global = window;
}

export class CoreAIService {
  private actor: any = null;
  private agent: HttpAgent | null = null;
  private canisterId: string = process.env.CANISTER_ID_AI_CANISTER || 'rdmx6-jaaaa-aaaah-qcaaa-cai';

  constructor() {
    this.initializeAgent();
  }

  /**
   * Initialize HTTP agent and actor
   */
  private async initializeAgent(): Promise<void> {
    try {
      const host = process.env.DFX_NETWORK === 'local' 
        ? 'http://localhost:4943' 
        : 'https://ic0.app';

      this.agent = new HttpAgent({ host });

      // Fetch root key for local development
      if (process.env.DFX_NETWORK === 'local') {
        await this.agent.fetchRootKey();
      }

      this.actor = createActor(this.canisterId, {
        agent: this.agent,
      });

      console.log('✅ AI Canister connected successfully');
    } catch (error) {
      console.error('❌ Failed to initialize AI agent:', error);
      throw error;
    }
  }

  /**
   * Ensure actor is initialized
   */
  private async ensureActor(): Promise<void> {
    if (!this.actor) {
      await this.initializeAgent();
    }
  }

  /**
   * Analyze image for deepfake detection
   */
  async analyzeImage(imageData: Uint8Array): Promise<DetectionResult> {
    await this.ensureActor();
    
    // Check user quota before processing
    const quotaCheck = await authService.canPerformAnalysis();
    if (!quotaCheck.allowed) {
      throw new Error(quotaCheck.reason || 'Analysis not allowed');
    }
    
    try {
      // Include auth token if available
      const authToken = authService.getAuthToken();
      const result = await this.actor.analyze_image(
        Array.from(imageData),
        authToken ? { auth_token: authToken } : {}
      );
      
      // Record usage after successful analysis
      authService.recordAnalysisUsage();
      
      // Get updated quota info
      const quotaStatus = await authService.getQuotaStatus();
      
      return {
        is_deepfake: result.is_deepfake,
        confidence: result.confidence,
        media_type: 'image',
        processing_time_ms: result.processing_time_ms || 0,
        metadata: result.metadata || '{}',
        model_version: result.model_version,
        user_info: {
          tier: quotaStatus.tier,
          remaining_quota: quotaStatus.remaining,
          quota_resets_at: quotaStatus.resets_at,
          total_quota: quotaStatus.total
        },
        analysis_details: result.analysis_details ? {
          classification: result.analysis_details.classification,
          class_confidence: result.analysis_details.class_confidence,
          classes: {
            real_probability: result.analysis_details.classes.real_probability,
            ai_generated_probability: result.analysis_details.classes.ai_generated_probability,
            deepfake_probability: result.analysis_details.classes.deepfake_probability
          }
        } : undefined
      };
    } catch (error) {
      console.error('❌ Image analysis failed:', error);
      throw new Error(`Image analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze video for deepfake detection
   */
  async analyzeVideo(videoData: Uint8Array): Promise<DetectionResult> {
    await this.ensureActor();
    
    // Check user quota before processing
    const quotaCheck = await authService.canPerformAnalysis();
    if (!quotaCheck.allowed) {
      throw new Error(quotaCheck.reason || 'Analysis not allowed');
    }
    
    try {
      // Include auth token if available
      const authToken = authService.getAuthToken();
      const result = await this.actor.analyze_video(
        Array.from(videoData),
        authToken ? { auth_token: authToken } : {}
      );
      
      // Record usage after successful analysis
      authService.recordAnalysisUsage();
      
      // Get updated quota info
      const quotaStatus = await authService.getQuotaStatus();
      
      return {
        is_deepfake: result.is_deepfake,
        confidence: result.confidence,
        media_type: 'video',
        processing_time_ms: result.processing_time_ms || 0,
        metadata: result.metadata || '{}',
        model_version: result.model_version,
        user_info: {
          tier: quotaStatus.tier,
          remaining_quota: quotaStatus.remaining,
          quota_resets_at: quotaStatus.resets_at,
          total_quota: quotaStatus.total
        },
        analysis_details: result.analysis_details ? {
          classification: result.analysis_details.classification,
          class_confidence: result.analysis_details.class_confidence,
          classes: {
            real_probability: result.analysis_details.classes.real_probability,
            ai_generated_probability: result.analysis_details.classes.ai_generated_probability,
            deepfake_probability: result.analysis_details.classes.deepfake_probability
          }
        } : undefined
      };
    } catch (error) {
      console.error('❌ Video analysis failed:', error);
      throw new Error(`Video analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get model information
   */
  async getModelInfo(): Promise<ModelInfo> {
    await this.ensureActor();
    
    try {
      const info = await this.actor.get_model_info();
      
      return {
        version: info.version,
        accuracy: info.accuracy || 99.90,
        status: info.is_initialized ? 'ready' : 'loading',
        last_updated: info.last_updated || new Date().toISOString(),
        chunks_loaded: info.processed_chunks || 0,
        total_chunks: info.total_chunks || 1
      };
    } catch (error) {
      console.error('❌ Failed to get model info:', error);
      throw error;
    }
  }

  /**
   * Check if model is ready
   */
  async isModelReady(): Promise<boolean> {
    try {
      const info = await this.getModelInfo();
      return info.status === 'ready';
    } catch (error) {
      console.error('❌ Failed to check model status:', error);
      return false;
    }
  }

  /**
   * Get current user quota status
   */
  async getUserQuotaStatus() {
    return await authService.getQuotaStatus();
  }

  /**
   * Check if user can perform analysis
   */
  async canUserAnalyze() {
    return await authService.canPerformAnalysis();
  }

  /**
   * Validate file format using AI canister
   */
  async validateFileFormat(filename: string): Promise<boolean> {
    await this.ensureActor();
    
    try {
      return await this.actor.validate_file_format(filename);
    } catch (error) {
      console.error('❌ File format validation failed:', error);
      return false;
    }
  }

  /**
   * Validate media dimensions using AI canister
   */
  async validateMediaDimensions(width: number, height: number): Promise<boolean> {
    await this.ensureActor();
    
    try {
      return await this.actor.validate_media_dimensions(width, height);
    } catch (error) {
      console.error('Media dimensions validation failed:', error);
      return false;
    }
  }

  /**
   * Perform health check on AI canister
   * @returns Promise<boolean> - True if canister is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.ensureActor();
      
      // Try a simple call to check if canister is responsive
      const result = await this.actor.health_check();
      return Boolean(result);
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

// Singleton instance
export const coreAIService = new CoreAIService();
