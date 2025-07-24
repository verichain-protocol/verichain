import OfferCard from "../../../components/card/offercard"
import { FaBrain, FaLink, FaHistory } from "react-icons/fa"

const OfferPage = () => {
  return (
    <section className="px-4 sm:px-6 pt-32 sm:pt-40 md:pt-48 lg:pt-56 pb-12 sm:pb-16 md:pb-20">
      <div className="max-w-7xl mx-auto">
        <div className="bg-lime-400/10 border border-lime-400 rounded-full w-full px-4 sm:px-6 py-2 sm:py-3 inline-flex items-center space-x-2  mb-8 sm:mb-10 md:mb-12  mx-auto sm:mx-0">
          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-lime-400 rounded-full flex items-center justify-center">
            <span className="text-gray-900 font-bold text-xs sm:text-sm">?</span>
          </div>
          <span className="text-lime-400 font-semibold text-sm sm:text-base">WHAT WE OFFER</span>
        </div>
        
        <div className="flex flex-col sm:flex-col md:flex-col lg:flex-row gap-6 sm:gap-8 md:gap-12 lg:gap-20 items-center justify-center">
          <OfferCard
            icon={FaBrain}
            title="DeepFake Detection"
            description="AI-powered tool to detect manipulated video and audio content with high precision."
          />
          <OfferCard
            icon={FaLink}
            title="Blockchain Logging"
            description="Verification is securely and reliably logged on the blockchain to ensure full transparency."
          />
          <OfferCard
            icon={FaHistory}
            title="Audit & History"
            description="Track verification history and user activities, publicly accessible and fully transparent."
          />
        </div>
      </div>
    </section>
  )
}

export default OfferPage
