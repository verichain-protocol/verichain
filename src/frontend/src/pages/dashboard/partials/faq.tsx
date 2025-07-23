"use client"
import { useState } from "react"
import { FaPlus } from "react-icons/fa"
import { FaMinus } from "react-icons/fa6"

const faqs = [
  {
    id: 1,
    question: "What can I use VeriChain for?",
    answer:
      "VeriChain helps people check if a photo or video is real or fake. It uses smart technology (AI) to spot DeepFakes, and saves proof on the blockchain so you can trust what you see and share.",
    isOpen: true,
  },
  {
    id: 2,
    question: "How does the verification process work?",
    answer:
      "Our AI analyzes your media files using advanced deepfake detection algorithms, then stores the verification results on the blockchain for permanent proof of authenticity.",
    isOpen: false,
  },
  {
    id: 3,
    question: "Can I share the results with others?",
    answer:
      "Yes, you can share verification results with others. The blockchain-based proof ensures that anyone can verify the authenticity of your content.",
    isOpen: false,
  },
  {
    id: 4,
    question: "What types of content does VeriChain support?",
    answer:
      "VeriChain supports various media formats including images (JPG, PNG) and videos (MP4, MOV) for comprehensive deepfake detection and verification.",
    isOpen: false,
  },
]

export default function FAQ() {
  const [openItems, setOpenItems] = useState<number[]>([1])

  const toggleItem = (id: number) => {
    setOpenItems((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  return (
    <div className="flex-1 p-1.5 xs:p-2 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Badge - Ultra-optimized for 320px */}
        <div className="bg-lime-950 rounded-full p-1.5 xs:p-2 sm:p-3 border border-lime-500 mb-3 xs:mb-4 sm:mb-6 md:mb-8">
          <div className="flex items-center space-x-1 xs:space-x-1.5 sm:space-x-2">
            <div className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 bg-lime-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-black text-xs xs:text-xs sm:text-sm font-bold">?</span>
            </div>
            <h1 className="text-lime-500 font-medium text-xs xs:text-xs sm:text-sm md:text-base">
              <span className="hidden sm:inline">FREQUENTLY ASKED QUESTIONS</span>
              <span className="sm:hidden">FAQ</span>
            </h1>
          </div>
        </div>

        {/* FAQ Container - Ultra-compact for 320px */}
        <div className="space-y-1.5 xs:space-y-2 sm:space-y-3 md:space-y-4 border-[1px] border-lime-400 p-1.5 xs:p-2 sm:p-3 md:p-4 bg-[#141D0F] rounded-xl">
          {faqs.map((faq) => (
            <div
              key={faq.id}
              className={`rounded-lg border-[1px] transition-colors ${
                openItems.includes(faq.id)
                  ? "bg-lime-500 text-black border-lime-500"
                  : "bg-stone-950 text-white border-lime-500"
              }`}
            >
              {/* FAQ Button - Ultra-optimized for 320px */}
              <button
                onClick={() => toggleItem(faq.id)}
                className="w-full p-2 xs:p-3 sm:p-4 md:p-5 lg:p-6 text-left flex items-start justify-between gap-1.5 xs:gap-2 sm:gap-3 md:gap-4"
              >
                {/* Left side - Number and Question */}
                <div className="flex items-start space-x-1.5 xs:space-x-2 sm:space-x-3 md:space-x-4 min-w-0 flex-1">
                  <span
                    className={`w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs xs:text-xs sm:text-sm font-medium flex-shrink-0 mt-0.5 ${
                      openItems.includes(faq.id) ? "bg-lime-600 text-lime-500" : "bg-lime-950 text-white"
                    }`}
                  >
                    {faq.id}
                  </span>
                  <span className="font-medium text-xs xs:text-xs sm:text-sm md:text-base leading-tight min-w-0 break-words">
                    {faq.question}
                  </span>
                </div>

                {/* Right side - Toggle Icon */}
                <div
                  className={`w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    openItems.includes(faq.id) ? "bg-lime-600 text-black-500" : "bg-lime-500 text-black"
                  }`}
                >
                  {openItems.includes(faq.id) ? (
                    <FaMinus className="w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4" />
                  ) : (
                    <FaPlus className="w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3 sm:h-3" />
                  )}
                </div>
              </button>

              {/* FAQ Answer - Ultra-optimized for 320px */}
              {openItems.includes(faq.id) && (
                <div className="px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 pb-2 xs:pb-3 sm:pb-4 md:pb-5 lg:pb-6">
                  <div className="ml-6 xs:ml-8 sm:ml-10 md:ml-12">
                    <p className="text-xs xs:text-xs sm:text-sm md:text-base leading-relaxed text-justify break-words">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
