"use client"
import type React from "react"
import { useState } from "react"
import { LuUpload } from "react-icons/lu"
import { MdCancel } from "react-icons/md"

export default function Dashboard() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
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
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        setUploadedFile(file)
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
      } else {
        alert("Please upload only image or video files")
      }
    }
  }

  const removeFile = () => {
    setUploadedFile(null)
    setPreviewUrl(null)
  }

  const triggerFileInput = () => {
    const fileInput = document.getElementById("file-upload") as HTMLInputElement
    fileInput?.click()
  }

  return (
    <div className="flex-1 px-2 xs:px-3 sm:px-4 md:px-5 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Title - Optimized for 320px and 375px */}
        <h1 className="text-lime-500 text-base xs:text-lg sm:text-xl md:text-2xl font-bold mb-3 xs:mb-4 sm:mb-6 md:mb-8 px-1">
          Media Verification
        </h1>

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
                </div>
              </>
            )}
          </div>
        </div>

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
                    {(uploadedFile.size / 1024).toFixed(1)} KB |{" "}
                    {uploadedFile.type.startsWith("image/") ? "IMG" : "VID"}
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
          <input type="file" accept="image/*,video/*" onChange={handleFileUpload} className="hidden" id="file-upload" />
          <button
            onClick={triggerFileInput}
            className="border-2 border-lime-500 text-lime-500 hover:bg-lime-500 hover:text-black px-4 xs:px-5 sm:px-6 md:px-8 lg:px-10 py-2 xs:py-2 rounded-full transition-all duration-300 cursor-pointer bg-transparent text-xs xs:text-xs sm:text-sm md:text-base w-full max-w-[200px] xs:max-w-[240px] sm:w-auto sm:max-w-none touch-manipulation"
          >
            Browse File
          </button>
        </div>

        {/* Start AI Analysis Button - Optimized for small screens */}
        {uploadedFile && (
          <div className="mb-3 xs:mb-4 sm:mb-6 md:mb-8">
            <button className="w-full bg-lime-500 text-black hover:bg-lime-600 px-3 xs:px-4 py-2 xs:py-2.5 sm:py-3 rounded-lg font-medium transition-all duration-300 text-xs xs:text-xs sm:text-sm md:text-base touch-manipulation">
              Start AI Analysis
            </button>
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
