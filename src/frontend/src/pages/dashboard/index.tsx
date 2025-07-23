import React from 'react'
import Navbar from '../../components/navbar'
import Footer from '../../components/footer'
import Verify from "../../pages/dashboard/partials/verify"
import MyAssests from './partials/myassests'
import Faq from "../../pages/dashboard/partials/myassests"
import {Sidebar} from '../../components/sidebar/sidebar'

const Dashboard = () => {
  return (
    <div className='bg-black min-h-screen text-white'>
        <Navbar/> 
        <div className="flex">
          <Sidebar />
          <main className="flex-1">
            <Verify />
            <MyAssests />
            <Faq />
          </main>
        </div>
          <Footer />
    </div>
  )
}

export default Dashboard
