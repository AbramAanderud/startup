// src/components/room.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Player from './player';
import Chair from './chair';
import Table from './table';
import Bartender from './bartender';
import '../app.css';

export function Room() {
  const loginName = localStorage.getItem("loginName") || "Player";

  // Player position in room (in pixels)
  const [playerPos, setPlayerPos] = useState({ x: 100, y: 100 });
  const heldKeys = useRef([]);
  const speed = 4;

  // Occupancy state for 4 tables (max 4 seats each)
  const [tableOccupancy, setTableOccupancy] = useState({
    table1: 0,
    table2: 0,
    table3: 0,
    table4: 0,
  });
  // Bar occupancy for 10 seats
  const [barOccupancy, setBarOccupancy] = useState(0);

  // Define table center positions (for 4 tables)
  const tableCenters = {
    table1: { x: 400 + 112.5, y: 700 + 112.5 },
    table2: { x: 1000 + 112.5, y: 700 + 112.5 },
    table3: { x: 400 + 112.5, y: 1000 + 112.5 },
    table4: { x: 1000 + 112.5, y: 1000 + 112.5 },
  };
  

  // For a table of 225px diameter (radius ≈112.5) and a chair of 75px (half =37.5),
  // the ideal offset is 112.5 + 37.5 = 150. Use these for the four seats.
  const tableSeatOffsets = [
    { x: -150, y: 0 },   // left seat
    { x: 150, y: 0 },    // right seat
    { x: 0, y: -150 },   // top seat (appears above table)
    { x: 0, y: 150 }     // bottom seat (appears below table)
  ];

  const barChairCount = 10;
  // These values are based on your room dimensions:
  const barLowerWidth = 1350;  // 90% of 1500px room width
  const barLowerHeight = 72;   // 6% of 1200px room height
  // Compute positions relative to the bar lower container
  const barChairPositions = Array.from({ length: barChairCount }, (_, i) => {
    // Evenly space the chairs across the width. Adjust for the chair's width (75px).
    const x = ((i + 1) * barLowerWidth) / (barChairCount + 1) - (75 / 2);
    // Align vertically. You might choose to center them or align at the bottom.
    const y = (barLowerHeight - 75) / 2;  // centers the 75px chair vertically in a 72px tall container; tweak if needed.
    return { x, y };
  });


  // Refs for viewport container and room (world)
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
        x: Math.max(0, Math.min(prev.x, 1500 - 40)),
        y: Math.max(0, Math.min(prev.y, 1200 - 40))
      }));

      if (containerRef.current && roomRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        const centerX = containerWidth / 2 - 20;
        const centerY = containerHeight / 2 - 20;
        let offsetX = centerX - playerPos.x;
        let offsetY = centerY - playerPos.y;
        offsetX = Math.min(0, Math.max(offsetX, containerWidth - 1500));
        offsetY = Math.min(0, Math.max(offsetY, containerHeight - 1200));
        roomRef.current.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
      }
      frameId = requestAnimationFrame(update);
    };
    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [playerPos]);

  // When clicking a table, seat the player at the next available seat.
  // Chairs are now positioned immediately adjacent to the table.
  const sitAtTable = (tableId) => {
    setTableOccupancy(prev => {
      const current = prev[tableId];
      if (current < 4) {
        const seatOffset = tableSeatOffsets[current];
        const tableCenter = tableCenters[tableId];
        // Calculate the top-left position for the chair:
        const newPos = {
          x: tableCenter.x + seatOffset.x - 37.5,
          y: tableCenter.y + seatOffset.y - 37.5
        };
        setPlayerPos(newPos);
        return { ...prev, [tableId]: current + 1 };
      }
      return prev;
    });
  };

  // When clicking a bar chair, seat the player at that bar position.
  const sitAtBar = () => {
    setBarOccupancy(prev => {
      const index = prev % barChairPositions.length;
      const seatPos = barChairPositions[index];
      // Place the player exactly at the chair position (or adjust slightly if needed)
      const barLowerOffset = { x: 75, y: 324 }; // Adjust if your room dimensions change.
      setPlayerPos({
        x: barLowerOffset.x + seatPos.x,
        y: barLowerOffset.y + seatPos.y
      });
      return prev + 1;
    });
  };

  // Chat collapse state
  const [chatCollapsed, setChatCollapsed] = useState(false);

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

      {/* Viewport container */}
      <div id="room-container" ref={containerRef} style={{ transform: "scale(1.08)" }}>
        <div id="room" ref={roomRef}>
          <div id="wall-back"></div>
          <div id="username-display">{loginName}</div>
          {/* Bar area is clickable for seating */}
          <div id="bar" onClick={sitAtBar}>Bar area</div>
          <div id="bar-lower">
            {/* Render 10 bar chairs positioned on top of the lower bar */}
            {barChairPositions.map((pos, idx) => (
              <Chair 
                key={`bar-chair-${idx}`}
                id={`bar-chair-${idx}`}
                position={pos}
                onSit={sitAtBar}
              />
            ))}
          </div>
          <div className="picture-frame" id="frame-1">
            <img src="/images/blob.webp" alt="Picture 1" />
          </div>
          <div className="picture-frame" id="frame-2">
            <img src="/images/michalagnelo.jpg" alt="Picture 2" />
          </div>

          {/* Four tables arranged in a centered square formation */}
          <div 
            onClick={() => sitAtTable("table1")}
            style={{ position: "absolute", left: "400px", top: "700px", cursor: "pointer" }}>
            <Table id="table1" occupancy={tableOccupancy.table1} maxOccupancy={4} />
          </div>
          <div 
            onClick={() => sitAtTable("table2")}
            style={{ position: "absolute", left: "1000px", top: "700px", cursor: "pointer" }}>
            <Table id="table2" occupancy={tableOccupancy.table2} maxOccupancy={4} />
          </div>
          <div 
            onClick={() => sitAtTable("table3")}
            style={{ position: "absolute", left: "400px", top: "1000px", cursor: "pointer" }}>
            <Table id="table3" occupancy={tableOccupancy.table3} maxOccupancy={4} />
          </div>
          <div 
            onClick={() => sitAtTable("table4")}
            style={{ position: "absolute", left: "1000px", top: "1000px", cursor: "pointer" }}>
            <Table id="table4" occupancy={tableOccupancy.table4} maxOccupancy={4} />
          </div>

          {/* Render table chairs around each table (adjacent to the table) */}
          {Object.entries(tableCenters).map(([tableId, center]) =>
            tableSeatOffsets.map((offset, seatIndex) => {
              const chairPos = {
                x: center.x + offset.x - 37.5,
                y: center.y + offset.y - 37.5
              };
              return (
                <Chair
                  key={`${tableId}-chair-${seatIndex}`}
                  id={`${tableId}-chair-${seatIndex}`}
                  position={chairPos}
                  onSit={() => sitAtTable(tableId)}
                />
              );
            })
          )}

          {/* Render the Bartender (assumed to be behind the bar) */}
          <Bartender onBuyDrink={() => alert("You bought a drink!")} />

          {/* Render the Player */}
          <Player position={playerPos} loginName={loginName} />
        </div>
      </div>

      <div 
        id="chat-box"
        style={{
          height: chatCollapsed ? "50px" : "30%",       // When collapsed, use a smaller height (e.g., 50px)
          minHeight: chatCollapsed ? "50px" : "200px",    // Adjust the minimum height accordingly
          transition: "height 0.3s ease"                 // Optional: add a smooth transition
        }}
      >
        <button 
          onClick={() => setChatCollapsed(!chatCollapsed)}
          style={{ marginBottom: "0.5em", cursor: "pointer" }}>
          {chatCollapsed ? "Show Chat" : "Hide Chat"}
        </button>
        {!chatCollapsed && (
          <div id="chat-messages">
            {/* Chat messages go here */}
          </div>
        )}
        <form id="chat-form">
          <input type="text" id="chat-input" placeholder="Type here" />
          <button type="submit">Chat</button>
        </form>
      </div>

    </main>
  );
}
