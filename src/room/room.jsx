import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Player from './player';
import Chair from './chair';
import Table from './table';
import Bartender from './bartender';
import '../app.css'; 

export function Room() {
  const loginName = localStorage.getItem("loginName") || "Player";

  // Player position in room (pixels)
  const [playerPos, setPlayerPos] = useState({ x: 100, y: 100 });
  const heldKeys = useRef([]);
  const speed = 4;

  // Table occupancy state for 4 tables (max 4 seats per table)
  const [tableOccupancy, setTableOccupancy] = useState({
    table1: 0,
    table2: 0,
    table3: 0,
    table4: 0,
  });
  const [barOccupancy, setBarOccupancy] = useState(0);

  const tableCenters = {
    table1: { x: 600, y: 500 },
    table2: { x: 900, y: 500 },
    table3: { x: 600, y: 700 },
    table4: { x: 900, y: 700 },
  };
  
  // Update seat offsets accordingly (adjust these as desired)
  const tableSeatOffsets = [
    { x: -60, y: 0 },  // left seat
    { x: 60, y: 0 },   // right seat
    { x: 0, y: -40 },  // top seat
    { x: 0, y: 40 }    // bottom seat
  ];

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

  // When clicking a table, seat the player at the next open seat
  const sitAtTable = (tableId) => {
    setTableOccupancy(prev => {
      const current = prev[tableId];
      if (current < 4) {
        const seatOffset = tableSeatOffsets[current];
        const tableCenter = tableCenters[tableId];
        const newPos = {
          x: tableCenter.x + seatOffset.x,
          y: tableCenter.y + seatOffset.y,
        };
        // Update occupancy
        setPlayerPos(newPos);
        return { ...prev, [tableId]: current + 1 };
      }
      return prev;
    });
  };

  // When clicking the bar area, seat the player at a default bar seat
  const sitAtBar = () => {
    const barSeatPos = { x: 750, y: 150 };
    setBarOccupancy(prev => prev + 1);
    setPlayerPos(barSeatPos);
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

      {/* Room viewport container */}
      <div id="room-container" ref={containerRef} style={{ transform: "scale(1.08)" }}>
        {/* Fixed-size room (world) */}
        <div id="room" ref={roomRef}>
          <div id="wall-back"></div>
          <div id="username-display">{loginName}</div>
          {/* Bar area is clickable */}
          <div id="bar" onClick={sitAtBar}>Bar area</div>
          <div id="bar-lower"></div>
          <div className="picture-frame" id="frame-1">
            <img src="/images/blob.webp" alt="Picture 1" />
          </div>
          <div className="picture-frame" id="frame-2">
            <img src="/images/michalagnelo.jpg" alt="Picture 2" />
          </div>

          {/* Four tables arranged in a centered square formation */}
          <div 
            onClick={() => sitAtTable("table1")}
            style={{ position: "absolute", left: "400px", top: "600px", cursor: "pointer" }}>
            <Table id="table1" occupancy={tableOccupancy.table1} maxOccupancy={4} />
          </div>
          <div 
            onClick={() => sitAtTable("table2")}
            style={{ position: "absolute", left: "1000px", top: "600px", cursor: "pointer" }}>
            <Table id="table2" occupancy={tableOccupancy.table2} maxOccupancy={4} />
          </div>
          <div 
            onClick={() => sitAtTable("table3")}
            style={{ position: "absolute", left: "400px", top: "900px", cursor: "pointer" }}>
            <Table id="table3" occupancy={tableOccupancy.table3} maxOccupancy={4} />
          </div>
          <div 
            onClick={() => sitAtTable("table4")}
            style={{ position: "absolute", left: "1000px", top: "900px", cursor: "pointer" }}>
            <Table id="table4" occupancy={tableOccupancy.table4} maxOccupancy={4} />
          </div>

          <Bartender onBuyDrink={() => alert("You bought a drink")} />

          {/* Render static chairs if desired (their positions come from CSS) */}
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

          {/* Render the Player */}
          <Player position={playerPos} loginName={loginName} />
        </div>
      </div>

      {/* Collapsible Chat Box */}
      <div id="chat-box">
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