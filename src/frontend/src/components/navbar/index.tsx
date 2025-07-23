"use client"

import { useState } from "react"
import { useLocation } from "react-router-dom"
import { IoMdMenu } from "react-icons/io";
import { MdCancel } from "react-icons/md";
import Logo from "../../assets/Logo.png"; 

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()
  const currentPath = location.pathname

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const isActive = (path: string) => {
    if (path === "/" && currentPath === "/") return true
    if (path !== "/" && currentPath.startsWith(path)) return true
    return false
  }

  return (
    <div className=" bg-black text-white">
      <header className="bg-black">
        <div className="flex items-center justify-between px-6 md:px-16 lg:px-28 py-6">
          <div className="flex items-center space-x-2">
            <div className="">
              <img src={Logo} alt="Logo" className="w-full h-full object-cover rounded" />
            </div>
            <span className="text-lime-400 font-bold text-xl">VERICHAIN</span>
          </div>

          <nav className="hidden lg:flex items-center text-lg space-x-28">
            <a href="/" className={`relative transition-colors ${
              isActive("/") ? "text-lime-400" : "text-gray-300 hover:text-white"
            }`}>
              Home
              {isActive("/") && (
                <div className="w-2 h-2 bg-lime-400 rounded-full absolute -bottom-2 left-1/2 transform -translate-x-1/2"></div>
              )}
            </a>
            <a href="/Dashboard" className={`relative transition-colors ${
              isActive("/Dashboard") ? "text-lime-400" : "text-gray-300 hover:text-white"
            }`}>
              Verify
              {isActive("/Dashboard") && (
                <div className="w-2 h-2 bg-lime-400 rounded-full absolute -bottom-2 left-1/2 transform -translate-x-1/2"></div>
              )}
            </a>
            <a href="/History" className={`relative transition-colors ${
              isActive("/History") ? "text-lime-400" : "text-gray-300 hover:text-white"
            }`}>
              History
              {isActive("/History") && (
                <div className="w-2 h-2 bg-lime-400 rounded-full absolute -bottom-2 left-1/2 transform -translate-x-1/2"></div>
              )}
            </a>
          </nav>

          <button className="hidden lg:block border-lime-400 border-[1px] px-7 py-1 rounded-full text-lime-400 hover:bg-lime-400 hover:text-gray-900 bg-transparent transition-all duration-300">
            Login
          </button>

          <button
            onClick={toggleMenu}
            className="lg:hidden p-2 text-lime-400 hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <MdCancel size={24} /> : <IoMdMenu size={24} />}
          </button>
        </div>

        <div
          className={`lg:hidden transition-all duration-300 ease-in-out ${
            isMenuOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0 overflow-hidden"
          }`}
        >
          <nav className="px-6 md:px-16 pb-6 space-y-4 bg-black border-t border-gray-800">
            <a href="/" className={`block py-2 text-lg font-medium ${
              isActive("/") ? "text-lime-400" : "text-gray-300 hover:text-white"
            } transition-colors`} onClick={() => setIsMenuOpen(false)}>
              Home
            </a>
            <a
              href="/Dashboard"
              className={`block py-2 text-lg ${
                isActive("/Dashboard") ? "text-lime-400 font-medium" : "text-gray-300 hover:text-white"
              } transition-colors`}
              onClick={() => setIsMenuOpen(false)}
            >
              verify
            </a>
            <a
              href="/History"
              className={`block py-2 text-lg ${
                isActive("/History") ? "text-lime-400 font-medium" : "text-gray-300 hover:text-white"
              } transition-colors`}
              onClick={() => setIsMenuOpen(false)}
            >
              History
            </a>
            <button
              className="w-full mt-4 border-lime-400 border-[1px] px-7 py-2 rounded-full text-lime-400 hover:bg-lime-400 hover:text-gray-900 bg-transparent transition-all duration-300"
              onClick={() => setIsMenuOpen(false)}
            >
              Login
            </button>
          </nav>
        </div>
      </header>

    </div>
  )
}

export default Navbar
