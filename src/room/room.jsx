import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Player from './player';
import Chair from './chair';
import '../app.css'; 

export function Room() {
  const loginName = localStorage.getItem("loginName") || "Player";

  // Track player position in the room (in pixels)
  const [playerPos, setPlayerPos] = useState({ x: 100, y: 100 });
  const heldKeys = useRef([]);
  const speed = 4; // pixels per frame

  // Refs for container (viewport) and room (world)
  const containerRef = useRef(null);
  const roomRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        if (!heldKeys.current.includes(e.key)) {
          heldKeys.current.push(e.key);
        }
      }
    };
    const handleKeyUp = (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        heldKeys.current = heldKeys.current.filter(key => key !== e.key);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Game loop: update player position and adjust camera
  useEffect(() => {
    let frameId;
    const update = () => {
      setPlayerPos(prev => {
        let { x, y } = prev;
        const key = heldKeys.current[0];
        if (key === "ArrowUp") y -= speed;
        if (key === "ArrowDown") y += speed;
        if (key === "ArrowLeft") x -= speed;
        if (key === "ArrowRight") x += speed;
        return { x, y };
      });

      // Clamp player position within the room (room size: 1500 x 1200)
      setPlayerPos(prev => ({
        x: Math.max(0, Math.min(prev.x, 1500 - 40)), // 40 = player width
        y: Math.max(0, Math.min(prev.y, 1200 - 40))    // 40 = player height
      }));

      // Adjust camera: center the viewport relative to the player
      if (containerRef.current && roomRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        const centerX = containerWidth / 2 - 20; // half player width
        const centerY = containerHeight / 2 - 20; // half player height

        let offsetX = centerX - playerPos.x;
        let offsetY = centerY - playerPos.y;

        // Clamp offset so we don't show outside the room boundaries
        offsetX = Math.min(0, Math.max(offsetX, containerWidth - 1500));
        offsetY = Math.min(0, Math.max(offsetY, containerHeight - 1200));

        roomRef.current.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
      }
      frameId = requestAnimationFrame(update);
    };
    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [playerPos]);

  return (
    <main>
      <header>
        <h1>CHATTER PAD</h1>
        <Link to="/" id="home-button">EXIT</Link>
        <div id="gold-count">
          <img src="images/final coin.png" alt="Coin" className="gold-icon" />
          <span>: 1,000,000</span>
        </div>
        <div id="settings-button"></div>
      </header>

      {/* Responsive viewport container; scale can be adjusted to affect zoom */}
      <div id="room-container" ref={containerRef} style={{ transform: "scale(1.08)" }}>
        {/* Fixed-size room (world) that is larger than the viewport */}
        <div id="room" ref={roomRef}>
          <div id="wall-back"></div>
          <div id="username-display">{loginName}</div>
          <div id="bar">Bar area</div>
          <div id="bar-lower"></div>
          <div className="picture-frame" id="frame-1">
            <img src="/images/blob.webp" alt="Picture 1" />
          </div>
          <div className="picture-frame" id="frame-2">
            <img src="/images/michalagnelo.jpg" alt="Picture 2" />
          </div>

          {/* All tables */}
          <div className="table" id="table-1">0/4</div>
          <div className="table" id="table-2">0/4</div>
          <div className="table" id="table-3">0/4</div>
          <div className="table" id="table-4">0/4</div>

          {/* All 16 chairs as plain divs (their positions will be set via CSS) */}
          <div className="chair" id="chair-1"></div>
          <div className="chair" id="chair-2"></div>
          <div className="chair" id="chair-3"></div>
          <div className="chair" id="chair-4"></div>
          <div className="chair" id="chair-5"></div>
          <div className="chair" id="chair-6"></div>
          <div className="chair" id="chair-7"></div>
          <div className="chair" id="chair-8"></div>
          <div className="chair" id="chair-9"></div>
          <div className="chair" id="chair-10"></div>
          <div className="chair" id="chair-11"></div>
          <div className="chair" id="chair-12"></div>
          <div className="chair" id="chair-13"></div>
          <div className="chair" id="chair-14"></div>
          <div className="chair" id="chair-15"></div>
          <div className="chair" id="chair-16"></div>

          {/* Optionally, render a clickable Chair for interactive seating */}
          <Chair 
            id="chair-interactive" 
            position={{ x: 400, y: 300 }} 
            onSit={() => setPlayerPos({ x: 400, y: 300 })}
          />

          {/* Render the Player (ensure it has a high z-index in its own styling) */}
          <Player position={playerPos} loginName={loginName} />
        </div>
      </div>

      {/* Chat box remains fixed */}
      <div id="chat-box">
        <div id="chat-messages">
          {/* Render chat messages here */}
        </div>
        <form id="chat-form">
          <input type="text" id="chat-input" placeholder="Type here" />
          <button type="submit">Chat</button>
        </form>
      </div>
    </main>
  );
}
