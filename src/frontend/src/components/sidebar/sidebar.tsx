import React from "react"
import { useLocation } from "react-router-dom"

const navigation = [
  { name: "Dashboard", href: "/Dashboard" },
  { name: "My Assets", href: "/Dashboard/MyAssests" },
  { name: "FAQ", href: "/Dashboard/Faq" },
]

export function Sidebar() {
  const location = useLocation()
  const pathname = location.pathname

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
