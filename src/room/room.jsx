import React from 'react';
import { Link } from 'react-router-dom';

export function Room() {
  return (
    <main> 
        <h1>CHATTER PAD</h1>
        <Link to="/" id="home-button">EXIT</Link>

        <div id="gold-count">
          <img src="images/final coin.png" alt="Coin" className="gold-icon" />
          <span>: 1,000,000</span>
        </div>

        <div id="settings-button"></div>

        <div id="room-container">
          <div id="room">
            <div id="wall-back"></div>
            <div id="username-display">Username</div>

            <div id="bar">Bar, will have drinks and a bar tender somehow will open menu on click</div>
            <div id="bar-lower"></div>

            <div className="picture-frame" id="frame-1">
              <img src="/images/blob.webp" alt="Picture 1" />
            </div>
            <div className="picture-frame" id="frame-2">
              <img src="/images/michalagnelo.jpg" alt="Picture 2" />
            </div>

            <div className="table" id="table-1">0/4</div>
            <div className="chair" id="chair-1"></div>
            <div className="chair" id="chair-2"></div>
            <div className="chair" id="chair-3"></div>
            <div className="chair" id="chair-4"></div>

            <div className="table" id="table-2">0/4</div>
            <div className="chair" id="chair-5"></div>
            <div className="chair" id="chair-6"></div>
            <div className="chair" id="chair-7"></div>
            <div className="chair" id="chair-8"></div>

            <div className="table" id="table-3">0/4</div>
            <div className="chair" id="chair-9"></div>
            <div className="chair" id="chair-10"></div>
            <div className="chair" id="chair-11"></div>
            <div className="chair" id="chair-12"></div>

            <div className="table" id="table-4">0/4</div>
            <div className="chair" id="chair-13"></div>
            <div className="chair" id="chair-14"></div>
            <div className="chair" id="chair-15"></div>
            <div className="chair" id="chair-16"></div>
          </div>
        </div>

        <div id="chat-box">
          <div id="chat-messages">Will be collapsible</div>
          <form id="chat-form">
            <input type="text" id="chat-input" placeholder="Type here" />
            <button type="submit">Chat</button>
          </form>
        </div>

    </main>
  );
}
