"use client"

import { useState } from "react"
// import { Folder, Video } from "lucide-react"
import { FaFolderOpen } from "react-icons/fa6";
import { FaVideo } from "react-icons/fa";


type FolderType = "main" | "verified" | "collected" | "flagged"

const folders = [
  { id: "verified", name: "Verified", count: 5, color: "lime" },
  { id: "collected", name: "Collected", count: 3, color: "lime" },
  { id: "flagged", name: "Flagged", count: 7, color: "lime" },
]

const mockFiles = [
  { id: 1, name: "Vid-1292.mov", type: "video" },
  { id: 2, name: "Vid-1292.mov", type: "video" },
  { id: 3, name: "Vid-1292.mov", type: "video" },
  { id: 4, name: "Vid-1292.mov", type: "video" },
  { id: 5, name: "Vid-1292.mov", type: "video" },
]

export default function MyAssets() {
  const [currentView, setCurrentView] = useState<FolderType>("main")
  const [selectedFolder, setSelectedFolder] = useState<string>("")

  const handleFolderClick = (folderId: string) => {
    setSelectedFolder(folderId)
    setCurrentView(folderId as FolderType)
  }

  const handleBackToMain = () => {
    setCurrentView("main")
    setSelectedFolder("")
  }

  return (
    <div className="flex-1 p-8">
      <div className="max-w-6xl mx-auto">
        {currentView === "main" ? (
          <>
            <h1 className="text-lime-500 text-2xl font-bold mb-8">My Assets</h1>

            <div className="mb-6">
              <h2 className="text-gray-400 text-lg mb-6">Folder</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {folders.map((folder) => (
                  <div
                    key={folder.id}
                    onClick={() => handleFolderClick(folder.id)}
                    className="bg-lime-950 rounded-lg p-6 border-l-4 border-lime-500 cursor-pointer hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex flex-col items-center text-center">
                      <FaFolderOpen className="w-16 h-16 text-gray-400 mb-4" />
                      <h3 className="text-white font-medium text-lg mb-1">{folder.name}</h3>
                      <p className="text-gray-400 text-sm">{folder.count} File</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center space-x-2 mb-6">
              <button onClick={handleBackToMain} className="text-gray-400 hover:text-white">
                My Assets
              </button>
              <span className="text-gray-400">{">"}</span>
              <span className="text-lime-500 capitalize">{selectedFolder}</span>
            </div>

            <h1 className="text-lime-500 text-2xl font-bold mb-8 capitalize">{selectedFolder}</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {mockFiles.map((file) => (
                <div key={file.id} className="bg-lime-950 rounded-lg p-4 border-l-4 border-lime-500">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-full h-32 bg-lime-950 rounded-lg flex items-center justify-center mb-4">
                      <FaVideo className="w-24 h-24 text-gray-400" />
                    </div>
                    <p className="text-white text-sm">{file.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
