import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Login } from './login/login';
import { Room } from './room/room';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';
import { AuthState } from './login/authState';

export default function App() {
  const [userName, setUserName] = useState(localStorage.getItem('userName') || '');
  const currentAuthState = userName ? AuthState.Authenticated : AuthState.Unauthenticated;
  const [authState, setAuthState] = useState(currentAuthState);

  return (
    <BrowserRouter>
      <div>
        <header>
        </header>
        <Routes>
          <Route
            path='/'
            element={
              <Login
                userName={userName}
                authState={authState}
                onAuthChange={(user, newState) => {
                  setUserName(user);
                  setAuthState(newState);
                }}
              />
            }
          />
          <Route path='/room' element={<Room userName={userName} />} />
          <Route path='*' element={<NotFound />} />
        </Routes>
        <footer>
          <span className="text-reset">
            Abram Aanderud github link:
          </span>
          <a href="https://github.com/AbramAanderud/startup">GitHub</a>
        </footer>
      </div>
    </BrowserRouter>
  );
}

function NotFound() {
  return (
    <main className="container-fluid bg-secondary text-center">
      404: Return to sender. Address unknown.
    </main>
  );
}
