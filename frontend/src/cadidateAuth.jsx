import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAlert } from './context/AlertContext'
import API from './api/axios.js'
import './style/auth.css'

const cadidateAuth = () => {
    const navigate = useNavigate()
    
    const [candidateId, setCandidateId] = useState('')
    const [password, setPassword] = useState('')

    const [candidateName, setCandidateName] = useState('')
    const [candidateEmail, setCandidateEmail] = useState('')
    const [candidatePassword, setCandidatePassword] = useState('')

    const alertContext = useAlert()
    const errorMsg = alertContext?.errorMsg || (() => {})

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
            <div className="candidate-login-container">
                <div className="login-content-card">
                    <div className="top">
                        <h3>fghnje</h3>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default cadidateAuth
