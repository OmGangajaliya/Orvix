import { Routes, Route } from 'react-router-dom'
import CandidateAuth from './cadidateAuth'
import Home from './Home'

const App = () => {
  return (
    <Routes>
      <Route path="/CandidateLogin" element={<CandidateAuth />} />
      <Route path="/" element={<Home />} />
      <Route path="/CompanyLogin" element={<CandidateAuth />} />
    </Routes>

  )
}

export default App