import React from 'react'

const companyLogin = () => {
  return (
    <div className='admin-wrapper'>
      <div className="login-container">
        <div className="login-content">
          <div className="top">
            <img src="../src/assets/stockify-full-logo.png" alt="Stockify Logo" className='logo-image'/>
            <h2>Admin Panel Login</h2>
          </div>
          <div className="bottom">
            <form action="" onSubmit={submitHandler}>
              <div className="input-group">
                <label htmlFor="userid">
                  <i className="fa-solid fa-user-shield"></i>
                  Admin Id
                </label>
                <input 
                type="text" 
                required
                id='userid' 
                placeholder='Your admin id' 
                value={adminId}
                onChange={(e)=>{
                  setadminId(e.target.value)
                }}/>
              </div>
              <div className="input-group">
                <label htmlFor="password">
                  <i className="fa-solid fa-unlock-keyhole"></i>
                  Password
                  </label>
                <input 
                type="password" 
                id='password' 
                required
                placeholder='Your password' 
                value={password} 
                onChange={(e)=>setPassword(e.target.value)}/>
              </div>
              <button type='submit' className='login-btn'>Login</button>
              <p className='alt-login-text'>
                Are you a store manager? <Link to='/storeLogin'>Login here</Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default companyLogin
