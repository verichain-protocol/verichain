import { MdFileUpload } from "react-icons/md"
import { LuClipboardPenLine } from "react-icons/lu"
import { FaSearch } from "react-icons/fa"
import { FaRobot } from "react-icons/fa"
import Timeline from "../../../assets/Timeline.png";

const HowPage = () => {
  const steps = [
    {
      icon: MdFileUpload,
      title: "Upload Content",
      description: "Submit a video or image for verification",
      desktopPosition: "left-56 top-24",
    },
    {
      icon: FaRobot,
      title: "AI Runs the Analysis",
      description: "Our AI checks for DeepFakes via fingerprinting",
      desktopPosition: "left-[29rem] bottom-32",
    },
    {
      icon: LuClipboardPenLine,
      title: "On-Chain Record",
      description: "Immutable results are stored securely on the blockchain.",
      desktopPosition: "left-[46rem] top-36",
    },
    {
      icon: FaSearch,
      title: "Publicly Verifiable",
      description: "Anyone can verify the result anytime.",
      desktopPosition: "left-[62rem] bottom-36",
    },
  ]

  return (
    <section className="px-4 sm:px-6 py-12  sm:py-16">
      <div className="max-w-7xl mx-auto">
        <div className="bg-lime-400/10 border border-lime-400 rounded-full px-4 sm:px-6 py-2 sm:py-3 w-full  mx-auto lg:mx-0 inline-flex items-center space-x-2 mb-12 sm:mb-20 md:mb-32 lg:mb-40">
          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-lime-400 rounded-full flex items-center justify-center">
            <span className="text-gray-900 font-bold text-xs sm:text-sm">?</span>
          </div>
          <span className="text-lime-400 font-semibold text-sm sm:text-base">HOW IT WORKS?</span>
        </div>

        {/* Mobile & Tablet Layout */}
        <div className="block lg:hidden">
          <div className="space-y-8 sm:space-y-12">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">

                <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-lime-400 rounded-full flex items-center justify-center text-gray-900 font-bold text-sm sm:text-base">
                  {index + 1}
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <div className="px-4 sm:px-6 md:px-7 py-2 bg-lime-400/20 border border-lime-400 rounded-full mx-auto sm:mx-0 mb-3 inline-block">
                    <p className="flex items-center gap-1 sm:gap-2 text-sm sm:text-base">
                      <step.icon className="text-lg sm:text-xl" />
                      {step.title}
                    </p>
                  </div>
                  <p className="text-gray-500 text-sm sm:text-base max-w-xs sm:max-w-sm mx-auto sm:mx-0">
                    {step.description}
                  </p>
                </div>

                {index < steps.length - 1 && <div className="w-px h-8 sm:h-12 bg-lime-400/30 mx-auto sm:hidden"></div>}
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:block relative">
          <div className="relative lg:scale-90 xl:scale-100 2xl:scale-110 origin-center">
            <div className="absolute lg:left-40 xl:left-72 2xl:left-56 lg:top-16 xl:top-20  flex items-center justify-center flex-col gap-2 text-center">
              <div className="px-5 lg:px-6 xl:px-7 py-2 bg-lime-400/20 border border-lime-400 rounded-full mx-auto">
                <p className="flex items-center gap-1 text-sm lg:text-base">
                  <MdFileUpload className="lg:text-lg xl:text-xl" /> Upload Content
                </p>
              </div>
              <p className="lg:w-36 xl:w-44 2xl:w-48 text-gray-500 text-xs lg:text-sm xl:text-base">
                Submit a video or image for verification
              </p>
            </div>

            <div className="absolute lg:left-[22rem] xl:left-[30rem] 2xl:left-[29rem] lg:-top-20 xl:-top-20 flex items-center justify-center flex-col gap-2 text-center">
              <div className="px-5 lg:px-6 xl:px-7 py-2 bg-lime-400/20 border border-lime-400 rounded-full mx-auto">
                <p className="flex items-center gap-1 text-sm lg:text-base">
                  <FaRobot className="lg:text-lg xl:text-xl" /> AI Runs the Analysis
                </p>
              </div>
              <p className="lg:w-56 2xl:w-60 text-gray-500 text-xs lg:text-sm xl:text-base">
                Our AI checks for DeepFakes via fingerprinting
              </p>
            </div>

            <div className="absolute lg:left-[32rem] xl:left-[43rem] 2xl:left-[45rem] lg:top-24 xl:top-32 flex items-center justify-center flex-col gap-2 text-center">
              <div className="px-5 lg:px-6 xl:px-7 py-2 bg-lime-400/20 border border-lime-400 rounded-full mx-auto">
                <p className="flex items-center gap-1 text-sm lg:text-base">
                  <LuClipboardPenLine className="lg:text-lg xl:text-xl" /> On-Chain Record
                </p>
              </div>
              <p className="lg:w-44 xl:w-56 2xl:w-60 text-gray-500 text-xs lg:text-sm xl:text-base">
                Immutable results are stored securely on the blockchain.
              </p>
            </div>

            <div className="absolute lg:left-[40rem] xl:left-[55rem] 2xl:left-[62rem] lg:-top-24 xl:-top-24 flex items-center justify-center flex-col gap-2 text-center">
              <div className="px-5 lg:px-6 xl:px-7 py-2 bg-lime-400/20 border border-lime-400 rounded-full mx-auto">
                <p className="flex items-center gap-2 text-sm lg:text-base">
                  <FaSearch className="lg:text-sm xl:text-md" /> Publicly Verifiable
                </p>
              </div>
              <p className="lg:w-36 xl:w-44 2xl:w-48 text-gray-500 text-xs lg:text-sm xl:text-base">
                Anyone can verify the result anytime.
              </p>
            </div>

            <div className="flex justify-center items-center lg:mt-8 xl:mt-12 2xl:mt-16 xl:mb-40">
              <img
                src={Timeline}
                alt="Connecting Line"
                className="lg:w-[90%]  xl:w-full 2xl:w-[110%]  object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HowPage
