"use client"
import type { ReactElement } from "react"
import React from "react"

import { useState, useCallback, useRef } from "react"
import { LuUpload, LuEye, LuPlay, LuTriangle, LuCheck } from "react-icons/lu"
import { MdCancel } from "react-icons/md"
import { coreAIService } from "../../../services/coreAI.service"
import { internetIdentityService } from "../../../services/internetIdentity.service"
import { logicService } from "../../../services/logic.service"
import type { DetectionResult, MediaType } from "../../../types/ai.types"
import type { AnalysisProgress } from "../../../types/component.types"
import { FileValidator } from "../../../utils/validation"
import { formatConfidence, formatProcessingTime, formatFileSize } from "../../../utils/uiHelpers"
import { PerformanceMonitor } from "../../../utils/performance"

export default function Dashboard(): ReactElement {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [mediaType, setMediaType] = useState<MediaType>("image")
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress>({
    state: "idle",
    progress: 0,
    message: "",
  })
  const [result, setResult] = useState<DetectionResult | null>(null)
  const [error, setError] = useState<string>("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [quotaStatus, setQuotaStatus] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Check authentication status on component mount
  const checkAuth = async () => {
    const authStatus = await internetIdentityService.isAuthenticated()
    setIsAuthenticated(authStatus)

    // Get quota status
    try {
      const quota = await logicService.getQuotaStatus()
      setQuotaStatus(quota)
    } catch (err) {
      console.error("Failed to get quota status:", err)
    }
  }

  React.useEffect(() => {
    checkAuth()
  }, [])

  // Process selected file with comprehensive validation
  const processSelectedFile = useCallback(async (file: File) => {
    const performanceMonitor = new PerformanceMonitor()
    performanceMonitor.checkpoint("File validation start")

    // Reset previous states
    setError("")
    setResult(null)
    setAnalysisProgress({ state: "idle", progress: 0, message: "" })

    try {
      // Validate file using the real validation service
      const validation = await FileValidator.validateFile(file, {
        maxSize: 2 * 1024 * 1024, // 2MB for canister limit
        allowedTypes: [
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/gif",
          "video/mp4",
          "video/webm",
          "video/avi",
          "video/mov",
        ],
        requireSignature: true,
      })

      if (!validation.isValid) {
        const errorMessages = validation.errors.map((err) => err.message).join(", ")
        setError(`File validation failed: ${errorMessages}`)
        return
      }

      performanceMonitor.checkpoint("File validation complete")

      // Determine media type
      const isImage = file.type.startsWith("image/")
      const isVideo = file.type.startsWith("video/")

      if (!isImage && !isVideo) {
        setError("Please select a valid image or video file")
        return
      }

      // Set file and generate preview
      setUploadedFile(file)
      setMediaType(isImage ? "image" : "video")

      // Create preview URL
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)

      performanceMonitor.checkpoint("File processing complete")
      console.log("File processing performance:", performanceMonitor.getReport())
    } catch (err) {
      console.error("File processing error:", err)
      setError(`File processing failed: ${err instanceof Error ? err.message : "Unknown error"}`)
    }
  }, [])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      processSelectedFile(file)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)
    const files = event.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      processSelectedFile(file)
    }
  }

  const removeFile = () => {
    setUploadedFile(null)
    setPreviewUrl(null)
    setResult(null)
    setError("")
    setAnalysisProgress({ state: "idle", progress: 0, message: "" })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  // Start AI analysis with real canister integration
  const startAnalysis = useCallback(async () => {
    if (!uploadedFile) return

    const performanceMonitor = new PerformanceMonitor()
    performanceMonitor.checkpoint("Analysis start")

    try {
      setError("")
      setResult(null)
      setAnalysisProgress({
        state: "processing",
        progress: 10,
        message: "Checking model status...",
      })

      // Check if model is ready before analysis
      const modelInfo = await coreAIService.getModelInfo()
      const initStatus = await coreAIService.getInitializationStatus()

      if (modelInfo.status !== "ready" || !initStatus.is_initialized) {
        throw new Error("AI Model is not ready for analysis. Please ensure the model is uploaded and initialized.")
      }

      performanceMonitor.checkpoint("Model status checked")

      setAnalysisProgress({
        state: "processing",
        progress: 20,
        message: "Checking quota and permissions...",
      })

      // Check quota before analysis
      const canAnalyze = await coreAIService.canUserAnalyze()
      if (!canAnalyze.allowed) {
        throw new Error(canAnalyze.reason || "Analysis not allowed")
      }

      setAnalysisProgress({
        state: "processing",
        progress: 30,
        message: "Preparing file for analysis...",
      })

      // Convert file to array buffer
      const arrayBuffer = await uploadedFile.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)

      performanceMonitor.checkpoint("File conversion complete")

      setAnalysisProgress({
        state: "analyzing",
        progress: 50,
        message: "Uploading to AI canister...",
      })

      // Call AI service with real implementation
      let detectionResult: DetectionResult
      if (mediaType === "image") {
        detectionResult = await coreAIService.analyzeImage(uint8Array)
      } else {
        detectionResult = await coreAIService.analyzeVideo(uint8Array)
      }

      performanceMonitor.checkpoint("AI analysis complete")

      setAnalysisProgress({
        state: "complete",
        progress: 100,
        message: "Analysis completed!",
      })

      setResult(detectionResult)

      // Update quota status after analysis
      try {
        const updatedQuota = await logicService.getQuotaStatus()
        setQuotaStatus(updatedQuota)
      } catch (err) {
        console.error("Failed to update quota status:", err)
      }

      console.log("Analysis performance:", performanceMonitor.getReport())
    } catch (err) {
      console.error("Analysis failed:", err)
      setError(`Analysis failed: ${err instanceof Error ? err.message : "Unknown error"}`)
      setAnalysisProgress({
        state: "error",
        progress: 0,
        message: "Analysis failed",
      })
    }
  }, [uploadedFile, mediaType])

  // Handle authentication
  const handleLogin = async () => {
    try {
      const loginResult = await internetIdentityService.login()
      if (loginResult.success) {
        setIsAuthenticated(true)
        // Refresh quota status after login
        const quota = await logicService.getQuotaStatus()
        setQuotaStatus(quota)
      } else {
        setError(`Login failed: ${loginResult.error}`)
      }
    } catch (err) {
      setError(`Login error: ${err instanceof Error ? err.message : "Unknown error"}`)
    }
  }

  const handleLogout = async () => {
    try {
      await internetIdentityService.logout()
      setIsAuthenticated(false)
      setQuotaStatus(null)
    } catch (err) {
      console.error("Logout error:", err)
    }
  }

  return (
    <div className="flex-1 px-2 xs:px-3 sm:px-4 md:px-5 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Title and Auth Status */}
        <div className="flex justify-between items-center mb-3 xs:mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-lime-500 text-base xs:text-lg sm:text-xl md:text-2xl font-bold px-1">
            Media Verification
          </h1>

          {/* Authentication Status */}
          <div className="flex items-center space-x-2">
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <span className="text-green-500 text-xs xs:text-sm">
                  {quotaStatus ? `${quotaStatus.remaining}/${quotaStatus.total} left` : "Authenticated"}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-xs xs:text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="text-xs xs:text-sm text-lime-500 hover:text-lime-400 transition-colors"
              >
                Login for More Quota
              </button>
            )}
          </div>
        </div>

        {/* Quota Warning */}
        {quotaStatus && quotaStatus.remaining <= 0 && (
          <div className="mb-3 xs:mb-4 sm:mb-6 md:mb-8 bg-orange-950 border border-orange-500 rounded-lg p-3 xs:p-4">
            <div className="flex items-center space-x-2">
              <LuTriangle className="text-orange-500 w-4 h-4 xs:w-5 xs:h-5 flex-shrink-0" />
              <span className="text-orange-200 text-xs xs:text-sm">
                Analysis quota exceeded. {isAuthenticated ? "Please wait for quota reset." : "Login for more quota."}
              </span>
            </div>
          </div>
        )}

        {/* Upload Area - Heavily optimized for small screens */}
        <div
          className={`bg-lime-950 p-2 xs:p-3 sm:p-6 md:p-8 lg:p-12 xl:p-16 mb-3 xs:mb-4 sm:mb-6 md:mb-8 border-l-2 xs:border-l-4 sm:border-l-6 md:border-l-8 border-lime-400 transition-all duration-300 ${
            isDragOver ? "border-lime-300 bg-lime-900" : ""
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="text-center">
            {/* Preview Image/Video - Optimized for very small screens */}
            {uploadedFile && previewUrl && (
              <div className="relative mb-2 xs:mb-3 sm:mb-4 md:mb-6">
                {uploadedFile?.type.startsWith("image/") ? (
                  <img
                    src={previewUrl || "/placeholder.svg"}
                    alt="Uploaded file"
                    className="w-full max-w-[200px] xs:max-w-[240px] sm:max-w-xs md:max-w-sm lg:max-w-md mx-auto rounded-lg"
                  />
                ) : uploadedFile?.type.startsWith("video/") ? (
                  <video
                    src={previewUrl}
                    controls
                    className="w-full max-w-[200px] xs:max-w-[240px] sm:max-w-xs md:max-w-sm lg:max-w-md mx-auto rounded-lg"
                  />
                ) : null}
              </div>
            )}

            {/* Upload Instructions - Heavily optimized for small screens */}
            {!uploadedFile && (
              <>
                <LuUpload className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 text-gray-400 mx-auto mb-1.5 xs:mb-2 sm:mb-3 md:mb-4" />
                <h3 className="text-white text-xs xs:text-sm sm:text-base md:text-lg font-semibold mb-1.5 xs:mb-2 px-1">
                  Upload Media for Analysis
                </h3>
                <p className="text-gray-400 mb-2 xs:mb-3 sm:mb-4 md:mb-6 text-xs xs:text-xs sm:text-sm md:text-base px-1 max-w-[280px] xs:max-w-sm mx-auto leading-tight">
                  {isDragOver ? "Drop your file here" : "Drag and drop your image or video here"}
                </p>

                {/* File Type Tags - Optimized for very small screens */}
                <div className="flex flex-wrap justify-center gap-1 xs:gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 mb-2 xs:mb-3 sm:mb-4 md:mb-6">
                  <span className="px-1.5 xs:px-2 sm:px-2.5 md:px-3 py-0.5 xs:py-1 bg-gray-700 text-lime-500 rounded text-xs xs:text-xs sm:text-xs md:text-sm">
                    JPG
                  </span>
                  <span className="px-1.5 xs:px-2 sm:px-2.5 md:px-3 py-0.5 xs:py-1 bg-gray-700 text-lime-500 rounded text-xs xs:text-xs sm:text-xs md:text-sm">
                    PNG
                  </span>
                  <span className="px-1.5 xs:px-2 sm:px-2.5 md:px-3 py-0.5 xs:py-1 bg-gray-700 text-lime-500 rounded text-xs xs:text-xs sm:text-xs md:text-sm">
                    MP4
                  </span>
                  <span className="px-1.5 xs:px-2 sm:px-2.5 md:px-3 py-0.5 xs:py-1 bg-gray-700 text-lime-500 rounded text-xs xs:text-xs sm:text-xs md:text-sm">
                    MOV
                  </span>
                  <span className="px-1.5 xs:px-2 sm:px-2.5 md:px-3 py-0.5 xs:py-1 bg-gray-700 text-lime-500 rounded text-xs xs:text-xs sm:text-xs md:text-sm">
                    WEBM
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-3 xs:mb-4 sm:mb-6 md:mb-8 bg-red-950 border border-red-500 rounded-lg p-3 xs:p-4">
            <div className="flex items-center space-x-2">
              <LuTriangle className="text-red-500 w-4 h-4 xs:w-5 xs:h-5 flex-shrink-0" />
              <span className="text-red-200 text-xs xs:text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* File Info Bar - Heavily optimized for small screens */}
        {uploadedFile && (
          <div className="mb-2 xs:mb-3 sm:mb-4">
            <div className="flex items-center justify-between bg-gray-700 rounded-lg p-2 xs:p-2.5 sm:p-3 md:p-4">
              <div className="flex items-center space-x-1.5 xs:space-x-2 sm:space-x-2.5 md:space-x-3 min-w-0 flex-1">
                <div className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-lime-500 rounded flex items-center justify-center flex-shrink-0">
                  <LuUpload className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-black" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white font-medium text-xs xs:text-xs sm:text-sm md:text-base truncate pr-1">
                    {uploadedFile.name.length > 20 ? `${uploadedFile.name.substring(0, 20)}...` : uploadedFile.name}
                  </p>
                  <p className="text-gray-400 text-xs xs:text-xs sm:text-xs md:text-sm">
                    {formatFileSize(uploadedFile.size)} • {mediaType.toUpperCase()}
                  </p>
                </div>
              </div>
              <button
                onClick={removeFile}
                className="text-gray-400 hover:text-white transition-colors flex-shrink-0 ml-1 xs:ml-2 p-1 touch-manipulation"
              >
                <MdCancel className="w-4 h-4 xs:w-4 xs:h-4 sm:w-4 sm:h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Browse File Button - Optimized for small screens */}
        <div className="pb-6 xs:pb-8 sm:pb-12 md:pb-16 lg:pb-20 flex justify-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <button
            onClick={triggerFileInput}
            className="border-2 border-lime-500 text-lime-500 hover:bg-lime-500 hover:text-black px-4 xs:px-5 sm:px-6 md:px-8 lg:px-10 py-2 xs:py-2 rounded-full transition-all duration-300 cursor-pointer bg-transparent text-xs xs:text-xs sm:text-sm md:text-base w-full max-w-[200px] xs:max-w-[240px] sm:w-auto sm:max-w-none touch-manipulation"
          >
            Browse File
          </button>
        </div>

        {/* Analysis Progress */}
        {uploadedFile && analysisProgress.state !== "idle" && analysisProgress.state !== "error" && (
          <div className="mb-3 xs:mb-4 sm:mb-6 md:mb-8 bg-lime-950 border border-lime-500 rounded-lg p-3 xs:p-4">
            <div className="flex items-center space-x-2 mb-3">
              <LuEye className="text-lime-500 w-4 h-4 xs:w-5 xs:h-5 flex-shrink-0" />
              <div>
                <h4 className="text-white font-medium text-xs xs:text-sm">AI Analysis in Progress</h4>
                <p className="text-gray-400 text-xs">{analysisProgress.message}</p>
              </div>
            </div>
            <div className="bg-gray-700 rounded-full h-2 mb-2">
              <div
                className="bg-lime-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${analysisProgress.progress}%` }}
              />
            </div>
            <div className="text-lime-500 text-xs text-right">{Math.round(analysisProgress.progress)}%</div>
          </div>
        )}

        {/* Start AI Analysis Button - Optimized for small screens */}
        {uploadedFile && analysisProgress.state === "idle" && (
          <div className="mb-3 xs:mb-4 sm:mb-6 md:mb-8">
            <button
              onClick={startAnalysis}
              disabled={!uploadedFile || (quotaStatus && quotaStatus.remaining <= 0)}
              className="w-full bg-lime-500 text-black hover:bg-lime-600 disabled:bg-gray-600 disabled:text-gray-400 px-3 xs:px-4 py-2 xs:py-2.5 sm:py-3 rounded-lg font-medium transition-all duration-300 text-xs xs:text-xs sm:text-sm md:text-base touch-manipulation flex items-center justify-center space-x-2"
            >
              <LuPlay className="w-4 h-4" />
              <span>Start AI Analysis</span>
            </button>
          </div>
        )}

        {/* Results Section */}
        {result && (
          <div className="mb-3 xs:mb-4 sm:mb-6 md:mb-8">
            <div
              className={`rounded-lg p-4 xs:p-5 sm:p-6 border-2 ${
                result.is_deepfake ? "bg-red-950 border-red-500" : "bg-green-950 border-green-500"
              }`}
            >
              <div className="flex items-center space-x-3 mb-4">
                <div
                  className={`w-8 h-8 xs:w-10 xs:h-10 rounded-full flex items-center justify-center ${
                    result.is_deepfake ? "bg-red-500" : "bg-green-500"
                  }`}
                >
                  {result.is_deepfake ? (
                    <LuTriangle className="w-4 h-4 xs:w-5 xs:h-5 text-white" />
                  ) : (
                    <LuCheck className="w-4 h-4 xs:w-5 xs:h-5 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <h3
                    className={`font-bold text-sm xs:text-base sm:text-lg ${
                      result.is_deepfake ? "text-red-200" : "text-green-200"
                    }`}
                  >
                    {(() => {
                      try {
                        const metadata = JSON.parse(result.metadata || "{}")
                        return (
                          metadata.prediction_label || (result.is_deepfake ? "Deepfake Detected" : "Authentic Content")
                        )
                      } catch {
                        return result.is_deepfake ? "Deepfake Detected" : "Authentic Content"
                      }
                    })()}
                  </h3>
                  <p className="text-gray-400 text-xs xs:text-sm">Confidence: {formatConfidence(result.confidence)}</p>
                </div>
                <div
                  className={`px-2 xs:px-3 py-1 rounded-full text-xs font-medium ${
                    result.is_deepfake ? "bg-red-500 text-white" : "bg-green-500 text-white"
                  }`}
                >
                  {(() => {
                    try {
                      const metadata = JSON.parse(result.metadata || "{}")
                      const label = metadata.prediction_label || (result.is_deepfake ? "Deepfake" : "Real")
                      if (label === "Real") return "ORIGINAL"
                      if (label === "AI Generated") return "AI GENERATED"
                      if (label === "Deepfake") return "DEEPFAKE"
                      return result.is_deepfake ? "MANIPULATED" : "ORIGINAL"
                    } catch {
                      return result.is_deepfake ? "MANIPULATED" : "ORIGINAL"
                    }
                  })()}
                </div>
              </div>

              {/* Result Details */}
              <div className="grid grid-cols-2 xs:grid-cols-4 gap-3 xs:gap-4 mb-4">
                <div className="text-center">
                  <div className="text-white font-bold text-sm xs:text-base">{formatConfidence(result.confidence)}</div>
                  <div className="text-gray-400 text-xs">Confidence</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-bold text-sm xs:text-base">
                    {result.processing_time_ms === 0 ? "Error" : formatProcessingTime(result.processing_time_ms)}
                  </div>
                  <div className="text-gray-400 text-xs">Processing</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-bold text-sm xs:text-base">{result.media_type.toUpperCase()}</div>
                  <div className="text-gray-400 text-xs">Media Type</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-bold text-sm xs:text-base">{result.model_version || "v2.1.0"}</div>
                  <div className="text-gray-400 text-xs">Model</div>
                </div>
              </div>

              {/* User Info */}
              {result.user_info && (
                <div className="mb-4 p-3 bg-black bg-opacity-30 rounded-lg">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Tier: {result.user_info.tier}</span>
                    <span className="text-gray-400">
                      Remaining: {result.user_info.remaining_quota}/{result.user_info.total_quota}
                    </span>
                  </div>
                </div>
              )}

              {/* Confidence Bar */}
              <div className="bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    result.is_deepfake ? "bg-red-500" : "bg-green-500"
                  }`}
                  style={{ width: `${result.confidence * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* How Upload Works Section - Heavily optimized for small screens */}
        <div className="min-h-[200px] xs:min-h-[240px] sm:min-h-[320px] md:min-h-[360px] lg:h-[400px] bg-gradient-to-tr from-lime-950 from-0% to-black to-70% px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 py-3 xs:py-4 sm:py-6 md:py-8 rounded-lg">
          {/* Header Badge - Optimized for very small screens */}
          <div className="flex items-center space-x-1 xs:space-x-1.5 sm:space-x-2 mb-2 xs:mb-3 sm:mb-4 md:mb-6 border-[1px] p-1.5 xs:p-2 sm:p-2.5 md:p-3 rounded-full border-lime-500 bg-lime-950 w-fit">
            <div className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-lime-500 rounded-full flex items-center justify-center">
              <span className="text-black text-xs xs:text-xs sm:text-xs md:text-sm font-bold">?</span>
            </div>
            <h3 className="text-white font-medium text-xs xs:text-xs sm:text-sm md:text-base">
              <span className="hidden xs:inline">HOW THE UPLOAD WORKS?</span>
              <span className="xs:hidden">HOW IT WORKS?</span>
            </h3>
          </div>

          {/* Content - Optimized text for very small screens */}
          <div className="space-y-2 xs:space-y-2.5 sm:space-y-3 md:space-y-4 text-gray-500 text-xs xs:text-xs sm:text-sm md:text-base leading-relaxed">
            <p className="text-justify">
              Files are uploaded to decentralized storage on the Internet Computer (ICP), with tamper-proof provenance
              recorded on-chain via smart contracts. Upon successful verification and upload, users can download the
              C2PA-embedded version of the content, ready for distribution across social media or other platforms.
            </p>
            <p className="text-justify">
              VeriChain ensures the integrity and authenticity of every file by recording its verification result and
              provenance hash on the ICP blockchain. This system aligns with open standards such as ERC-7053 for
              blockchain-based content history, enabling public traceability and comparison of media versions over time.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
