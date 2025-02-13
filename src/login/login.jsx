import React from 'react';
import './login.css';

export function Login() {
  return (
    <div className="login-wrapper">
      <main className="login-container">
        <h1>CHATTER PAD</h1>
        <h2>LOGIN TO JOIN CHAT ROOM</h2>

        <form method="get" action="/room">
            <div>
                <input type="text" placeholder="your@email.com" />
            </div>
            <div>
                <input type="password" placeholder="password" />
            </div>
            <button type="submit">LOGIN</button>
            <button type="submit">CREATE</button>
        </form>

        <nav>
            <menu>
                <h5>Can also join here: <a href="/room">room</a></h5>
            </menu>
        </nav>
      </main>
    </div>
  );
}
