import React, { useContext, useState } from 'react'
import { useAlert } from './context/AlertContext'

const cadidateAuth = () => {

    const [candidateId, setCandidateId] = useState('')
    const [password, setPassword] = useState('')

    const [candidateName, setCandidateName] = useState('')
    const [candidateEmail, setCandidateEmail] = useState('')
    const [candidatePassword, setCandidatePassword] = useState('')

    const { errorMsg } = useAlert

    const initUserRegistrationHandler = (e) => {
        e.preventDefault()

    }

    const loginSubmitHandler = async (e) => {
        e.preventDefault()
        try {
            const response = await API.post('/candidate/login', {
                candidateId,
                password,
            });

            if (response.data.success) {
                navigate('/candidate/dashboard', {
                    state: { loginSuccess: true }
                });
            }
        } catch (err) {
            errorMsg("Invalid credentials or store not found.")
        }
    }
    return (
        <div className="auth-wrapper">
            <div className="login-container">
                <div className="login-content">
                    <div className="top">
                        <img src="../src/assets/stockify-full-logo.png" alt="Stockify Logo" className='logo-image' />
                        <h2>Candidate Login</h2>
                    </div>
                    <div className="bottom">
                        <form action="" onSubmit={loginSubmitHandler}>
                            <div className="input-group">
                                <label htmlFor="userid">
                                    <i className="fa-solid fa-user-shield"></i>
                                    Candidate Id
                                </label>
                                <input
                                    type="text"
                                    required
                                    id='userid'
                                    placeholder='Your candidate id'
                                    value={candidateId}
                                    onChange={(e) => {
                                        setCandidateId(e.target.value)
                                    }} />
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
                                    onChange={(e) => setPassword(e.target.value)} />
                            </div>
                            <button type='submit' className='login-btn'>Login</button>
                            <p className='alt-login-text'>
                                Dont Have a Account ? <Button onClick={() => { }}>Register here</Button>
                            </p>
                        </form>
                    </div>
                </div>
            </div>
            <div className="registerContainer">
                <div className="init-user-registration-container">
                    <div className="login-content">
                        <div className="top">
                            <img src="../src/assets/stockify-full-logo.png" alt="Stockify Logo" className='logo-image' />
                            <h2>Candidate Registration</h2>
                        </div>
                        <div className="bottom">
                            <form action="" onSubmit={initUserRegistrationHandler}>
                                <div className="input-group">
                                    <label htmlFor="userid">
                                        <i className="fa-solid fa-user-shield"></i>
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        id='userid'
                                        placeholder='Your name'
                                        value={candidateName}
                                        onChange={(e) => {
                                            setCandidateName(e.target.value)
                                        }} />
                                </div>
                                <div className="input-group">
                                    <label htmlFor="userid">
                                        <i className="fa-solid fa-user-shield"></i>
                                        Email
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        id='userid'
                                        placeholder='Your email'
                                        value={candidateEmail}
                                        onChange={(e) => {
                                            setCandidateEmail(e.target.value)
                                        }} />
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
                                        value={candidatePassword}
                                        onChange={(e) => setCandidatePassword(e.target.value)} />
                                </div>
                                <button type='submit' className='login-btn' id='init-user-registration-btn'>Register</button>
                            </form>
                        </div>
                    </div>
                </div>
                <div className="onboard-user-container">

                </div>
            </div>
        </div>
    )
}

export default cadidateAuth
