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

  // Refs for container and room (the fixed "map")
  const containerRef = useRef(null);
  const roomRef = useRef(null);

  // Keyboard event listeners for arrow keys
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

      // Clamp player position so that the player stays inside the room (1000x700)
      setPlayerPos(prev => ({
        x: Math.max(0, Math.min(prev.x, 1000 - 40)), // 40 = player width
        y: Math.max(0, Math.min(prev.y, 700 - 40))    // 40 = player height
      }));

      // Adjust camera: center the room relative to the player
      if (containerRef.current && roomRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        const centerX = containerWidth / 2 - 20; // 20 = half player width
        const centerY = containerHeight / 2 - 20; // 20 = half player height

        let offsetX = centerX - playerPos.x;
        let offsetY = centerY - playerPos.y;

        // Clamp offset so that the room's boundaries are respected:
        offsetX = Math.min(0, Math.max(offsetX, containerWidth - 1000));
        offsetY = Math.min(0, Math.max(offsetY, containerHeight - 700));

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

      {/* Fixed-size container acting as the viewport */}
      <div id="room-container" ref={containerRef}>
        {/* The room is fixed size (1000x700px) and represents the complete "world" */}
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
          <div className="table" id="table-1">0/4</div>
          {/* Render a Chair component – you can add more chairs/tables as needed */}
          <Chair 
            id="chair-1" 
            position={{ x: 400, y: 300 }} 
            onSit={() => setPlayerPos({ x: 400, y: 300 })}
          />
          {/* Render the Player */}
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
