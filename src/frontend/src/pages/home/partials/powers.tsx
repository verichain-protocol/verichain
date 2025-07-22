import React from 'react'
import { PowerCard } from '../../../components/card/powercard'
import { FaBrain } from "react-icons/fa6";
import { FaDropbox } from "react-icons/fa";
import { CiSearch } from "react-icons/ci";
import { HiOutlineCubeTransparent } from "react-icons/hi2";

const featuresData = [
  {
    icon: FaBrain,
    title: "Smart AI Detection",
    description: "Smart detection for fake videos and voices",
  },
  {
    icon: HiOutlineCubeTransparent,
    title: "Blockchain via ICP",
    description: "Permanently saved on a secure digital ledger.",
  },
  {
    icon: FaDropbox,
    title: "Decentralized Storage",
    description: "Files are saved across a network.",
  },
  {
    icon: CiSearch,
    title: "Smart File Tracing",
    description: "Traces each file back to its true origin.",
  },
]


const PowersPage = () => {
  return (
     <section className="px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="bg-lime-400/10 border border-lime-400 rounded-full px-6 py-3 inline-flex items-center space-x-2 mb-12 w-full">
            <div className="w-6 h-6 bg-lime-400 rounded-full flex items-center justify-center">
              <span className="text-gray-900 font-bold text-sm">?</span>
            </div>
            <span className="text-lime-400 font-semibold">WHAT POWERS VERICHAIN</span>
          </div>


          <div className="w-full py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Desktop and Tablet View */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 justify-items-center">
          {featuresData.map((feature, index) => (
            <PowerCard key={index} icon={feature.icon} title={feature.title} description={feature.description} />
          ))}
        </div>

        {/* Mobile View - Horizontal Scroll */}
        <div className="md:hidden">
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            <div className="flex gap-4 px-2">
              {featuresData.map((feature, index) => (
                <PowerCard key={index} icon={feature.icon} title={feature.title} description={feature.description} />
              ))}
            </div>
          </div>
        </div>

        {/* Tablet Horizontal Scroll Alternative */}
        <div className="hidden sm:block md:hidden">
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
            <div className="flex gap-6 px-4">
              {featuresData.map((feature, index) => (
                <PowerCard key={index} icon={feature.icon} title={feature.title} description={feature.description} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
        </div>
      </section>
  )
}

export default PowersPage
