import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './login.css';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem("loginName", email);
    navigate('/room'); 
  };

  return (
    <div className="login-page">
      <main className="login-container">
        <h1>CHATTER PAD</h1>
        <h2>LOGIN TO JOIN CHAT ROOM</h2>

        <form onSubmit={handleSubmit}>
          <div>
            <input 
              type="text" 
              placeholder="your@email.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <input type="password" placeholder="password" />
          </div>
          <button type="submit">LOGIN</button>
          <button type="button" onClick={handleSubmit}>CREATE</button>
        </form>

        <nav>
          <menu>
            <h5>
              Can also join here: 
              <button onClick={() => navigate('/room')}>room</button>
            </h5>
          </menu>
        </nav>
      </main>
    </div>
  );
}
