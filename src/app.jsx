import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Login } from './login/login';
import { Room } from './room/room';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';
import { AuthState } from './login/authState';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return <div>Error: {this.state.error && this.state.error.toString()}</div>;
    }
    return this.props.children;
  }
}

export default function App() {
  const [userName, setUserName] = useState(localStorage.getItem('loginName') || '');
  const currentAuthState = userName ? AuthState.Authenticated : AuthState.Unauthenticated;
  const [authState, setAuthState] = useState(currentAuthState);

  console.log("App rendering. userName =", userName, "authState =", authState.name);

  return (
    <BrowserRouter>
      <div>
        <header>
        </header>
        <ErrorBoundary>
          <Routes>
            <Route
              path="/"
              element={
                <Login
                  userName={userName}
                  authState={authState}
                  onAuthChange={(user, newState) => {
                    console.log("onAuthChange called with", user, newState);
                    setUserName(user);
                    setAuthState(newState);
                  }}
                />
              }
            />
            <Route path="/room" element={<Room userName={userName} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
        <footer>
          <span className="text-reset">Abram Aanderud github link:</span>
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
