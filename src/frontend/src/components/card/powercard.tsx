import type React from "react"
import type { IconType } from "react-icons"

interface PowerCardProps {
  icon: IconType 
  title: string
  description: string
  className?: string
}

export const PowerCard: React.FC<PowerCardProps> = ({
  icon: IconComponent,
  title,
  description,
  className = "",
}) => {
  return (
    <div
      className={`group relative min-w-[280px] w-[280px] h-[200px] bg-[#BAFC020D] rounded-2xl p-6 transition-all duration-300 hover:bg-lime-600 cursor-pointer ${className}`}
    >
      <div className="flex justify-center mb-4 mt-2">
        <div className="w-12 h-12 bg-lime-500 rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-lime-600 transition-colors duration-300">
          <IconComponent className="w-6 h-6 text-white group-hover:text-lime-600" />
        </div>
      </div>

      {/* Content */}
      <div className="text-center">
        <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-white">{title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed group-hover:text-white/90">{description}</p>
      </div>
    </div>
  )
}
