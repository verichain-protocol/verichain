import React from 'react'
import { FiAlertTriangle } from "react-icons/fi";
import { FaInstagram } from "react-icons/fa";
import { FaYoutube } from "react-icons/fa";
import { IoMdMail } from "react-icons/io";
import { FaXTwitter } from "react-icons/fa6";
import FooterLogo from "../../assets/FooterLogo.svg"


const Footer = () => {
  return (
    <div className="bg-lime-400 text-gray-900 px-6 py-12">
      <div className="max-w-7xl mx-auto">
        {/* Main content grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Left section - Logo and description */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className=" flex items-center justify-center">
                  <img
                  src={FooterLogo}
                  />
              </div>
              <span className="font-bold text-2xl text-[#383838]">VERICHAIN</span>
            </div>
            <p className="text-sm leading-relaxed">
              Trusted API for deepfake detection and digital content verification, powered by Artificial Intelligence
              and blockchain. Protecting media, legal, and creator platforms with real-time detection and verifiable
              proof of authenticity.
            </p>
          </div>

          {/* Center section - Information links */}
          <div className="space-y-4 lg:ml-20 2xl:ml-36">
            <h4 className="font-bold text-xl">INFORMATION</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-sm hover:opacity-80 underline decoration-gray-900 underline-offset-2">
                  DoraHacks ICP WCHL 2025
                </a>
              </li>
              <li>
                <a href="#" className="text-sm hover:opacity-80 underline decoration-gray-900 underline-offset-2">
                  Build link
                </a>
              </li>
              <li>
                <a href="#" className="text-sm hover:opacity-80 underline decoration-gray-900 underline-offset-2">
                  GitHub VeriChain
                </a>
              </li>
            </ul>
          </div>

          {/* Right section - Contact information */}
          <div className="space-y-4 lg:ml-20 2xl:ml-36">
            <div className="flex items-center space-x-3">
              <IoMdMail  className="text-2xl flex-shrink-0" />
              <span className="text-sm">verichain.app@gmail.com</span>
            </div>
            <div className="flex items-center space-x-3">
              < FaYoutube  className="text-2xl flex-shrink-0" />
              <span className="text-sm">VeriChainOfficial</span>
            </div>
            <div className="flex items-center space-x-3">
              <FaInstagram className="text-2xl flex-shrink-0" />
              <span className="text-sm">verichain.app</span>
            </div>
            <div className="flex items-center space-x-3">
              <FaXTwitter className="text-2xl flex-shrink-0" />
              <span className="text-sm">verichain_app</span>
            </div>
          </div>
        </div>

        {/* Separator line */}
        <div className="mt-12 pt-8 border-t border-gray-700">
          <p className="text-center text-sm">Copyright © 2025 | BCC NonceSense</p>
        </div>
      </div>
    </div>
  )
}

export default Footer
