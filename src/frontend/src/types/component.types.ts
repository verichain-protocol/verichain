/// VeriChain Component Types
/// TypeScript definitions for React components

import { MediaType, AnalysisState, DetectionResult } from './ai.types';

export interface AnalysisProgress {
  state: AnalysisState;
  progress: number;
  message: string;
}

export interface AIDetectionProps {
  className?: string;
  onResult?: (result: DetectionResult) => void | Promise<void>;
  allowedTypes?: MediaType[];
  maxFileSize?: number;
}

export interface ModelStatusProps {
  className?: string;
  showDetails?: boolean;
  autoRefresh?: boolean;
}

export interface DiagnosticPanelProps {
  className?: string;
  showPerformance?: boolean;
  showValidation?: boolean;
  showHash?: boolean;
}

export interface SocialMediaUploadProps {
  className?: string;
  platforms?: string[];
  onUpload?: (platform: string, url: string) => void;
}

export interface FileUploadState {
  file: File | null;
  preview: string;
  status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
  progress: number;
  error?: string;
}

export interface DropZoneProps {
  onDrop: (files: FileList) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

export interface ProgressBarProps {
  progress: number;
  status: AnalysisState;
  message?: string;
  showPercentage?: boolean;
}

export interface ResultDisplayProps {
  result: DetectionResult;
  showDetails?: boolean;
  showMetadata?: boolean;
  onReset?: () => void;
}
