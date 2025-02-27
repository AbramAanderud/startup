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

  // Initialize player position from localStorage (if available) or default to middle of room below the bar.
  const [playerPos, setPlayerPos] = useState(() => {
    const savedPos = localStorage.getItem("playerPos");
    // Default position: centered horizontally (750) and 500px down vertically.
    return savedPos ? JSON.parse(savedPos) : { x: 750, y: 500 };
  });
  const heldKeys = useRef([]);
  const speed = 4;

  // Occupancy state for tables (each table can seat up to 4)
  const [tableOccupancy, setTableOccupancy] = useState({
    table1: 0,
    table2: 0,
    table3: 0,
    table4: 0,
  });
  // Occupancy for bar (up to 10 seats)
  const [barOccupancy, setBarOccupancy] = useState(0);
  // Track the seat where the player is currently sitting.
  // It is either null or an object like { type: "table", id: "table1", seatIndex: 1 }
  // or { type: "bar", seatIndex: 3 }.
  const [currentSeat, setCurrentSeat] = useState(null);

  // Table centers for 4 tables.
  // Upper two tables are shifted up by 40px (from 600px to 560px).
  const tableCenters = {
    table1: { x: 400 + 112.5, y: 560 + 112.5 },
    table2: { x: 1000 + 112.5, y: 560 + 112.5 },
    table3: { x: 400 + 112.5, y: 900 + 112.5 },
    table4: { x: 1000 + 112.5, y: 900 + 112.5 },
  };

  // Seat offsets – using 130px so chairs appear closer.
  // We'll use the occupancy count as the seat index.
  const tableSeatOffsets = [
    { x: -130, y: 0 },   // seat index 0
    { x: 130, y: 0 },    // seat index 1
    { x: 0, y: -130 },   // seat index 2
    { x: 0, y: 130 }     // seat index 3
  ];

  // Bar chairs positions (relative to #bar-lower)
  const barChairCount = 10;
  const barLowerWidth = 1350;  // 90% of 1500px room width
  const barLowerHeight = 72;   // 6% of 1200px room height
  const barChairPositions = Array.from({ length: barChairCount }, (_, i) => {
    const x = ((i + 1) * barLowerWidth) / (barChairCount + 1) - (75 / 2);
    const y = (barLowerHeight - 75) / 2;
    return { x, y };
  });

  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatCollapsed, setChatCollapsed] = useState(false);

  // Load stored chat messages on mount.
  useEffect(() => {
    const stored = localStorage.getItem("chatMessages");
    if (stored) {
      setChatMessages(JSON.parse(stored));
    }
  }, []);

  // Persist chat messages whenever they change.
  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(chatMessages));
  }, [chatMessages]);

  // Save player position to localStorage whenever it changes.
  useEffect(() => {
    localStorage.setItem("playerPos", JSON.stringify(playerPos));
  }, [playerPos]);

  // Chat form handler.
  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (chatInput.trim() !== "") {
      const newMessage = { from: loginName, text: chatInput.trim() };
      setChatMessages(prev => [...prev, newMessage]);
      setChatInput("");
    }
  };

  // Refs for viewport container and room (world)
  const containerRef = useRef(null);
  const roomRef = useRef(null);

  // When the player moves (via arrow keys) and is seated, free the seat.
  useEffect(() => {
    if (heldKeys.current.length > 0 && currentSeat !== null) {
      if (currentSeat.type === "table") {
        setTableOccupancy(prev => ({
          ...prev,
          [currentSeat.id]: Math.max(prev[currentSeat.id] - 1, 0)
        }));
      } else if (currentSeat.type === "bar") {
        setBarOccupancy(prev => Math.max(prev - 1, 0));
      }
      setCurrentSeat(null);
    }
  }, [heldKeys.current.length, currentSeat]);

  // Keyboard event listeners
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

  // Game loop: update player position and adjust camera.
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

      // Clamp player position within the room (1500 x 1200).
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

  // Function to seat at a table.
  const sitAtTable = (tableId) => {
    // If already seated at the same table, do nothing.
    if (currentSeat && currentSeat.type === "table" && currentSeat.id === tableId) {
      return;
    }
    // Only seat if there's an available seat.
    if (tableOccupancy[tableId] < 4) {
      // Free previous seat if necessary.
      if (currentSeat) {
        if (currentSeat.type === "table" && currentSeat.id !== tableId) {
          setTableOccupancy(prev => ({
            ...prev,
            [currentSeat.id]: Math.max(prev[currentSeat.id] - 1, 0)
          }));
        } else if (currentSeat.type === "bar") {
          setBarOccupancy(prev => Math.max(prev - 1, 0));
        }
      }
      const seatIndex = tableOccupancy[tableId];
      const tableCenter = tableCenters[tableId];
      const offset = tableSeatOffsets[seatIndex];
      const newPos = {
        x: tableCenter.x + offset.x - 37.5,
        y: tableCenter.y + offset.y - 37.5
      };
      setTableOccupancy(prev => ({ ...prev, [tableId]: prev[tableId] + 1 }));
      setCurrentSeat({ type: "table", id: tableId, seatIndex });
      setPlayerPos(newPos);
    } else {
      alert("This table is full!");
    }
  };

  // Function to seat at the bar.
  const sitAtBar = () => {
    // If already seated at the bar, do nothing.
    if (currentSeat && currentSeat.type === "bar") {
      return;
    }
    if (barOccupancy < 10) {
      if (currentSeat) {
        if (currentSeat.type === "table") {
          setTableOccupancy(prev => ({
            ...prev,
            [currentSeat.id]: Math.max(prev[currentSeat.id] - 1, 0)
          }));
        }
      }
      const seatIndex = barOccupancy;
      const seatPos = barChairPositions[seatIndex];
      const barLowerOffset = { x: 75, y: 324 };
      setBarOccupancy(prev => prev + 1);
      setCurrentSeat({ type: "bar", seatIndex });
      setPlayerPos({
        x: barLowerOffset.x + seatPos.x,
        y: barLowerOffset.y + seatPos.y
      });
    } else {
      alert("The bar is full!");
    }
  };

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

          {/* Four tables arranged in a centered square formation.
              Upper two tables moved up by 40px (top now 560px). */}
          <div 
            onClick={() => sitAtTable("table1")}
            style={{ position: "absolute", left: "400px", top: "560px", cursor: "pointer" }}>
            <Table id="table1" occupancy={tableOccupancy.table1} maxOccupancy={4} />
          </div>
          <div 
            onClick={() => sitAtTable("table2")}
            style={{ position: "absolute", left: "1000px", top: "560px", cursor: "pointer" }}>
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

          {/* Render table chairs around each table */}
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

          {/* Render the Bartender */}
          <Bartender onBuyDrink={() => alert("You bought a drink!")} />

          {/* Render the Player */}
          <Player position={playerPos} loginName={loginName} />
        </div>
      </div>

      {/* Collapsible Chat Box */}
      <div 
        id="chat-box"
        style={{
          height: chatCollapsed ? "50px" : "30%",
          minHeight: chatCollapsed ? "50px" : "200px",
          transition: "height 0.3s ease"
        }}
      >
        <button 
          onClick={() => setChatCollapsed(!chatCollapsed)}
          style={{ marginBottom: "0.5em", cursor: "pointer" }}>
          {chatCollapsed ? "Show Chat" : "Hide Chat"}
        </button>
        {!chatCollapsed && (
          <div id="chat-messages">
            {chatMessages.map((msg, idx) => (
              <div key={idx}>
                <strong>{msg.from}:</strong> {msg.text}
              </div>
            ))}
          </div>
        )}
        <form id="chat-form" onSubmit={handleChatSubmit}>
          <input 
            type="text" 
            id="chat-input" 
            placeholder="Type here" 
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
          />
          <button type="submit">Chat</button>
        </form>
      </div>
    </main>
  );
}
