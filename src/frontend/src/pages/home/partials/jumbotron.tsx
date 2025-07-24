import { FaChevronDown } from "react-icons/fa"
import { Typewriter } from "../../../components/typewriter/typewriter"
import JumbotronImg from "../../../assets/JumbotronImg.png"; 

const JumbotronPage = () => {
  return (
    <section className="px-4 sm:px-6 py-12 sm:py-16 md:py-20 lg:py-24">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 md:gap-16 lg:gap-20 items-center">
        {/* Text Content */}
        <div className="space-y-4 sm:space-y-5 md:space-y-6 order-2 md:order-1">
          {/* Title with Typewriter */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold whitespace-nowrap">Welcome to</h1>
            <div className="bg-lime-400/20 border border-lime-400 rounded px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 min-h-[40px] sm:min-h-[50px] md:min-h-[60px] flex items-center w-full sm:w-auto">
              <Typewriter
                text="VERICHAIN"
                speed={200}
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-lime-400"
              />
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-300 text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed max-w-full sm:max-w-lg md:max-w-xl text-left sm:text-justify">
            Build digital trust with dual verification, detect manipulated content and prove video ownership through
            tamper-proof on-chain systems
          </p>

          {/* CTA Button */}
          <button className="bg-lime-400 text-gray-900 hover:bg-lime-500 px-6 sm:px-7 md:px-8 py-2.5 sm:py-3 rounded-full font-semibold flex items-center text-sm sm:text-base transition-colors duration-200 w-full sm:w-auto justify-center sm:justify-start">
            Get Started
            <FaChevronDown className="ml-2 w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Image */}
        <div className="flex justify-center order-1 md:order-2">
          <div className="relative w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-none">
            <img
              src={JumbotronImg}
              alt="Jumbotron"
              className="md:block hidden"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default JumbotronPage
