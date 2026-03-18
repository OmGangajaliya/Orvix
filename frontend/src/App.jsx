import { Routes } from 'react-router-dom'

const App = () => {
  return (
    <Routes>
      <Route path="/adminLogin" element={<CompanyLogin />} />
        <Route path="/" element={<Home />} />
      <Route path="/storeLogin" element={<Candidatelogin />} />
      
    </Routes>

  )
}

export default App