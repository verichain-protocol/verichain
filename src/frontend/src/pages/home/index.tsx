import React from 'react'
import Jumbotron from './partials/jumbotron'
import How from './partials/how'
import Offer from './partials/offer'
import Powers from './partials/powers'
import Navbar from '../../components/navbar'
import Footer from '../../components/footer'


const HomePage = () => {
  return (
    <div className='bg-black min-h-screen text-white'>
        <Navbar/> 
        <Jumbotron />
        <How />
        <Offer />
        <Powers />
        {/* <Footer /> */}
    </div>
  )
}

export default HomePage
