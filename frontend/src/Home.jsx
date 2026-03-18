import React from 'react'
import { Link } from 'react-router-dom'

const Home = () => {
  return (
    <div className="home-container">
        <div className="home-container-top">
            <Link to="/CompanyLogin" className="home-link">Company</Link>
            <img src="../assets/orvix-black-logo.png" alt="Orvix Logo" />
            <Link to="/CandidateLogin" className="home-link">Candidate</Link>
        </div>
        <div className="home-container-bottom">

        </div>
    </div>
  )
}

export default Home
