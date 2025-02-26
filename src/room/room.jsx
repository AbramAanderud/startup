import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

export function Room() {
  // Retrieve login name from localStorage (set by your login page)
  const loginName = localStorage.getItem("loginName") || "Player";
  
  // We'll use state to track the player's position (in pixels)
  // These values represent the player’s coordinates on the map.
  const [position, setPosition] = useState({ x: 100, y: 100 });
  
  // A ref to hold the currently pressed arrow keys (so we don’t re-render every key event)
  const heldDirections = useRef([]);
  const speed = 2; // pixels per frame

  // Refs for the map element (to move the camera) and the container (for dimensions)
  const mapRef = useRef(null);
  const containerRef = useRef(null);

  // Set up key event listeners for arrow keys
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        if (!heldDirections.current.includes(e.key)) {
          heldDirections.current.push(e.key);
        }
      }
    };

    const handleKeyUp = (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        heldDirections.current = heldDirections.current.filter(dir => dir !== e.key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Game loop: update position and camera based on held keys
  useEffect(() => {
    let animationFrameId;

    const update = () => {
      setPosition(prevPos => {
        let { x, y } = prevPos;
        // Use the first held direction (if any)
        const currentDir = heldDirections.current[0];
        if (currentDir) {
          if (currentDir === "ArrowUp") y -= speed;
          if (currentDir === "ArrowDown") y += speed;
          if (currentDir === "ArrowLeft") x -= speed;
          if (currentDir === "ArrowRight") x += speed;
        }
        return { x, y };
      });

      // Update the camera: center the map so that the player appears centered in the container
      if (mapRef.current && containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        // We subtract the player's position so that when x increases, the map shifts left.
        const translateX = containerWidth / 2 - position.x;
        const translateY = containerHeight / 2 - position.y;
        mapRef.current.style.transform = `translate(${translateX}px, ${translateY}px)`;
      }

      animationFrameId = requestAnimationFrame(update);
    };

    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, [position]); // We depend on position so that camera updates when it changes

  return (
    <main>
      <header>
        <h1>CHATTER PAD</h1>
        <Link to="/" id="home-button">EXIT</Link>
        <div id="gold-count">
          {/* Keep your coin image if desired */}
          <img src="images/final coin.png" alt="Coin" className="gold-icon" />
          <span>: 1,000,000</span>
        </div>
        <div id="settings-button"></div>
      </header>

      {/* The room container is scaled to simulate “zoom in” */}
      <div id="room-container" ref={containerRef} style={{ transform: "scale(1.1)", overflow: "hidden" }}>
        {/* The map is larger than the container; its position is updated by our game loop */}
        <div
          id="room"
          ref={mapRef}
          style={{
            position: "absolute",
            width: "2000px",
            height: "2000px",
            backgroundColor: "#555", // simple background color for the map
          }}
        >
          {/* You can add additional elements to the map here */}
          
          {/* Player square */}
          <div
            className="player"
            style={{
              position: "absolute",
              width: "40px",
              height: "40px",
              backgroundColor: "red",
              transform: `translate(${position.x}px, ${position.y}px)`,
              transition: "transform 0.05s linear",
            }}
          >
            {/* Login name label above the square */}
            <div
              style={{
                position: "absolute",
                top: "-20px",
                width: "100%",
                textAlign: "center",
                color: "white",
                fontSize: "12px",
                textShadow: "1px 1px 2px black"
              }}
            >
              {loginName}
            </div>
          </div>
        </div>
      </div>

      {/* Chat box remains at fixed position */}
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
