import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
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
                <Route path='/room' element={<Room />} />
                <Route path='*' element={<NotFound />} />
            </Routes>

            <footer>
                <span class="text-reset">Abram Aanderud github link: </span>
                <a href="https://github.com/AbramAanderud/startup">GitHub</a>
            </footer>   
        
        </div>
    </BrowserRouter>
  );
}

function NotFound() {
    return <main className='container-fluid bg-secondary text-center'>404: Return to sender. Address unknown.</main>;
}

