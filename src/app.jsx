import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { Login } from './login/login';
import { Room } from './room/room';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';

export default function App() {
    return (
        <BrowserRouter>
            <div>
                <header>
                </header>

                <Routes>
                    <Route path='/' element={<Login />} />
                    <Route path='/room' element={<ProtectedRoute><Room /></ProtectedRoute>} />
                    <Route path='*' element={<NotFound />} />
                </Routes>

                <footer>
                    <span className="text-reset">Abram Aanderud github link: </span>
                    <a href="https://github.com/AbramAanderud/startup">GitHub</a>
                </footer>
            </div>
        </BrowserRouter>
    );
}

function NotFound() {
    return <main className='container-fluid bg-secondary text-center'>404: Return to sender. Address unknown.</main>;
}

function ProtectedRoute({ children }) {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch('/api/user/data');
                if (response.ok) {
                    setIsAuthenticated(true);
                } else {
                    setIsAuthenticated(false);
                    navigate('/'); 
                }
            } catch (error) {
                setIsAuthenticated(false);
                navigate('/');
            }
        };
        checkAuth();
    }, [navigate]);

    if (isAuthenticated === null) {
        return <div>Loading...</div>; 
    }

    return isAuthenticated ? children : null;
}