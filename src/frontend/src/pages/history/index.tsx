import React from 'react'
import Navbar from '../../components/navbar'
import Footer from '../../components/footer'

const HistoryPage = () => {
  return (
    <div className='bg-black min-h-screen text-white'>
      <Navbar/> 
      
      <div className="max-w-7xl mx-auto px-6 py-16">
        <h1 className="text-lime-500 text-2xl font-bold mb-8">Verification History</h1>
        
        <div className="bg-gray-800 rounded-lg p-8 mb-8 border-l-4 border-lime-500">
          <h3 className="text-white text-lg font-medium mb-4">Recent Verifications</h3>
          <p className="text-gray-400 mb-6">Track all your media verification history and results</p>
          
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-white text-lg font-medium mb-2">No verification history yet</h3>
            <p className="text-gray-400">Start verifying media files to see your history here</p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-lime-500">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-lime-500 rounded-full flex items-center justify-center">
              <span className="text-black text-sm">!</span>
            </div>
            <h3 className="text-lime-500 font-medium">ABOUT VERIFICATION HISTORY</h3>
          </div>
          
          <div className="text-gray-300 text-sm leading-relaxed">
            <p>
              Your verification history shows all media files you've analyzed, including their authenticity status, 
              blockchain transaction hashes, and timestamps. This creates a permanent record of your verification activities.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default HistoryPage
