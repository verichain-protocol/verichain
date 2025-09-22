import React from "react"
import { useLocation } from "react-router-dom"
import { useQuota } from "../../hooks/useQuota"
import Gantungan from "../../assets/Gantungan.svg"
import Tali from "../../assets/Tali.svg"

const navigation = [
  { name: "Dashboard", href: "/Dashboard" },
  { name: "My Assets", href: "/Dashboard/MyAssests" },
  { name: "FAQ", href: "/Dashboard/Faq" },
]

export function Sidebar() {
  const location = useLocation()
  const pathname = location.pathname
  const { quota, loading, error } = useQuota()

  return (
    <div className="w-96 bg-black min-h-screen flex flex-col">
      {/* Navigation Section */}
      <div className="flex-1 p-6">
        <nav className="space-y-2">
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className={`block px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                pathname === item.href
                  ? "bg-lime-500 text-black shadow-lg"
                  : "text-gray-300 hover:text-white hover:bg-gray-800"
              }`}
            >
              {item.name}
            </a>
          ))}
        </nav>
      <div className="pt-56"> 
        <img src={Gantungan} alt="Gantungan" className="" />
        <img src={Tali} alt="Tali" className="" />
        <div className="border-2 border-lime-400 rounded-lg px-4 pt-4 pb-12 flex flex-col items-center text-center "> 
          <p>CREDIT</p>
          <div className="w-72 p-[1px] bg-lime-500 mt-3" />
          <div className="mt-5"> 
            {loading ? (
              <p>Loading quota...</p>
            ) : error ? (
              <p className="text-red-400">Failed to load quota</p>
            ) : (
              <p>You have <span className="text-lime-500 font-bold">{quota.remaining}/{quota.total}</span> upload left</p>
            )}
          </div>
        </div>
      </div>
      </div>


      {/* Footer Section */}
      <div className="p-6 border-t border-gray-800">
        <div className="text-gray-400 text-xs">
          <p>&copy; 2025 VeriChain</p>
          <p className="mt-1">Version 1.0.0</p>
        </div>
      </div>
    </div>
  )
}
