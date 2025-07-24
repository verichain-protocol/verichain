import React from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '../components/navbar'
import Footer from '../components/footer'
import { Sidebar } from '../components/sidebar/sidebar'

const DashboardLayout = () => {
  return (
    <div className='bg-black min-h-screen text-white'>
      <Navbar/> 
      <div className="flex">
        <Sidebar />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  )
}

export default DashboardLayout
