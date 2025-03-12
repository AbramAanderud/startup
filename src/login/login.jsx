import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './login.css';

export function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState(""); // Add password state

    const handleSubmit = async (e, isCreate) => {
        e.preventDefault();
        const method = isCreate ? 'POST' : 'POST';
        const endpoint = isCreate ? '/api/auth/create' : '/api/auth/login';

        const response = await fetch(endpoint, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (response.ok) {
            localStorage.setItem("loginName", email);
            navigate('/room');
        } else {
            alert('Authentication failed');
        }
    };

    return (
        <div className="login-page">
            <main className="login-container">
                <h1>CHATTER PAD</h1>
                <h2>LOGIN TO JOIN CHAT ROOM</h2>

                <form onSubmit={(e) => handleSubmit(e, false)}>
                    <div>
                        <input
                            type="text"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            placeholder="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button type="submit">LOGIN</button>
                    <button type="button" onClick={(e) => handleSubmit(e, true)}>CREATE</button>
                </form>
            </main>
        </div>
    );
}