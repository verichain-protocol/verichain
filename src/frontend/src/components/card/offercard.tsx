import type { IconType } from "react-icons"

interface FeatureCardProps {
  icon: IconType
  title: string
  description: string
  iconBgColor?: string
  iconColor?: string
}

export default function FeatureCard({
  icon: Icon,
  title,
  description,
  iconBgColor = "bg-lime-400",
  iconColor = "text-white",
}: FeatureCardProps) {
  return (
    <div className="group relative flex flex-col items-center bg-[#BAFC020D] rounded-xl w-full max-w-xs sm:max-w-sm md:max-w-md lg:w-80 p-4 sm:p-5 md:p-6 h-auto min-h-[280px] sm:min-h-[300px] md:h-80 transition-all duration-300 hover:bg-gray-800 hover:border-gray-600 hover:shadow-lg hover:shadow-green-500/10 cursor-pointer">
      {/* Icon */}
      <div
        className={`w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 ${iconBgColor} rounded-full flex items-center justify-center mb-3 sm:mb-4 transition-transform duration-300 group-hover:scale-110`}
      >
        <Icon className={`w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6 ${iconColor}`} />
      </div>

      {/* Title */}
      <h3 className="text-white text-base sm:text-lg font-semibold mb-2 sm:mb-3 transition-colors duration-300 text-center">
        {title}
      </h3>

      {/* Description */}
      <p className="text-gray-400 text-sm sm:text-md text-center leading-relaxed transition-colors duration-300 group-hover:text-gray-300 px-2 sm:px-4 md:px-10">
        {description}
      </p>

      {/* Hover glow effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/5 to-blue-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />
    </div>
  )
}
