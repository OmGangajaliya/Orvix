import { createContext, useContext, useRef } from 'react'
import gsap from 'gsap'

const AlertContext = createContext()

export const useAlert = () => useContext(AlertContext)

export const AlertProvider = ({ children }) => {
    const alertRef = useRef(null)

    function errorMsg(message) {
        const alertBox = alertRef.current
        if (!alertBox) return

        alertBox.innerHTML = `<h5>${message}</h5><div class="alert-timer"></div>`

        gsap.fromTo(alertBox,
            { scale: 0.6, opacity: 0, y: -80 },
            { scale: 1, opacity: 1, y: 0, duration: 1, ease: "power3.out" }
        )

        gsap.fromTo(alertBox,
            { boxShadow: "0 0 0px rgba(190,130,255,0)" },
            { boxShadow: "0 0 15px rgba(84, 131, 89, 0.83)", duration: 1, ease: "sine.inOut", yoyo: true, repeat: 3 }
        )

        alertBox.style.display = 'block'

        setTimeout(() => {
            gsap.fromTo(alertBox,
                { scale: 1, opacity: 1, y: 0 },
                {
                    scale: 0.6, opacity: 0, y: -80, duration: 0.8, ease: "power3.in", onComplete: () => {
                        alertBox.style.display = 'none'
                    }
                }
            )
        }, 5000)
    }

    return (
        <AlertContext.Provider value={{ errorMsg, successMsg: errorMsg }}>
            <div className="alert-box" ref={alertRef} style={{ display: 'none' }}></div>
            {children}
        </AlertContext.Provider>
    )
}