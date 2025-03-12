import React from 'react';
import { Unauthenticated } from './unauthenticated';
import { Authenticated } from './authenticated';
import { AuthState } from './authState';
import './login.css';

export function Login({ userName, authState, onAuthChange }) {
  return (
    <div className="login-page">
      <main className="login-container">
        <h1>CHATTER PAD</h1>
        <h2>LOGIN TO JOIN CHAT ROOM</h2>
        {authState === AuthState.Authenticated ? (
          <Authenticated 
            userName={userName} 
            onLogout={() => onAuthChange("", AuthState.Unauthenticated)}
          />
        ) : (
          <Unauthenticated 
            userName={userName} 
            onLogin={(loginUserName) => onAuthChange(loginUserName, AuthState.Authenticated)}
          />
        )}
      </main>
    </div>
  );
}
