// Room.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Player from './player';
import Chair from './chair';
import Table from './table';
import Bartender from './bartender';
import '../app.css';

// Define room event types for consistency.
export const RoomEvent = {
  Chat: 'chat',
  Move: 'move',
  GoldUpdate: 'goldUpdate',
  ColorChange: 'colorChange',
  System: 'system',
  Init: 'init'
};

function Room({ userName: propUserName }) {
  const loginName = propUserName || "Player";
  console.log("Room component rendering for:", loginName);

  // Room data state (gold, color, etc.)
  const [roomData, setRoomData] = useState({
    gold: 0,
    color: 'hsl(0, 100%, 50%)',
    position: { x: 750, y: 500 },
  });
  const { gold, color } = roomData;

  // Local player position state.
  const [playerPos, setPlayerPos] = useState(roomData.position);
  
  // Chat messages and other players’ data.
  const [chatMessages, setChatMessages] = useState([]);
  const [players, setPlayers] = useState([]);
  
  // Local UI states.
  const [playerColorHue, setPlayerColorHue] = useState(0);
  const [chatInput, setChatInput] = useState("");

  // Refs: to handle key events and to store WebSocket instance.
  const heldKeys = useRef([]);
  const containerRef = useRef(null);
  const roomRef = useRef(null);
  const chatInputRef = useRef(null);
  const wsRef = useRef(null);
  
  const speed = 6; // Movement speed

  // Optional: table/seat constants (customize as needed)
  const tableCenters = {
    table1: { x: 512.5, y: 672.5 },
    table2: { x: 1112.5, y: 672.5 },
    table3: { x: 512.5, y: 1012.5 },
    table4: { x: 1112.5, y: 1012.5 },
  };
  const tableSeatOffsets = [
    { x: -130, y: 0 },
    { x: 130, y: 0 },
    { x: 0, y: -115 },
    { x: 0, y: 130 }
  ];
  
  // --- WebSocket Helper Function ---  
  const sendRoomEvent = (type, payload) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const event = { from: loginName, type, payload };
      wsRef.current.send(JSON.stringify(event));
    }
  };

  // --- Establish the WebSocket Connection ---
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:4000');
    ws.onopen = () => {
      console.log('WebSocket connected');
      // Send an initialization event if needed.
      sendRoomEvent(RoomEvent.Init, { position: playerPos, color });
    };
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Received WS message:', message);
        // Process WS events based on their type.
        switch (message.type) {
          case RoomEvent.Chat:
            setChatMessages(prev => [...prev, message]);
            break;
          case RoomEvent.Move:
            // Update other players' positions.
            setPlayers(prev => {
              // Filter out existing data for this sender.
              const others = prev.filter(p => p.email !== message.from);
              // Append/update the sender's data.
              return [...others, { email: message.from, position: message.payload, color: message.color || "hsl(0, 100%, 50%)" }];
            });
            break;
          case RoomEvent.ColorChange:
            setPlayers(prev =>
              prev.map(p => p.email === message.from ? { ...p, color: message.payload } : p)
            );
            break;
          case RoomEvent.GoldUpdate:
            setRoomData(prev => ({ ...prev, gold: message.payload }));
            break;
          // Extend additional event types as needed.
          default:
            console.warn('Unhandled WS message type:', message.type);
        }
      } catch (err) {
        console.error('Error processing WS message:', err);
      }
    };
    ws.onerror = (err) => console.error('WebSocket error:', err);
    ws.onclose = () => console.log('WebSocket closed');

    wsRef.current = ws;
    return () => ws.close();
  }, []);

  // --- Movement: Update player position continuously ---
  useEffect(() => {
    let frameId;
    const update = () => {
      setPlayerPos(prev => {
        let newPos = { ...prev };
        const key = heldKeys.current[0];
        if (key === "ArrowUp") newPos.y -= speed;
        if (key === "ArrowDown") newPos.y += speed;
        if (key === "ArrowLeft") newPos.x -= speed;
        if (key === "ArrowRight") newPos.x += speed;

        // Enforce boundaries for the room (example limits: 0 to (width - size))
        newPos.x = Math.max(0, Math.min(newPos.x, 1500 - 40));
        newPos.y = Math.max(0, Math.min(newPos.y, 1200 - 40));

        // If movement occurred, broadcast the new position.
        if (newPos.x !== prev.x || newPos.y !== prev.y) {
          sendRoomEvent(RoomEvent.Move, newPos);
        }
        return newPos;
      });
      frameId = requestAnimationFrame(update);
    };
    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // --- Key Handling: Listen for arrow key events ---
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
        heldKeys.current = heldKeys.current.filter(k => k !== e.key);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // --- Chat Submission: Send chat messages via WS ---
  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (chatInput.trim() !== "") {
      sendRoomEvent(RoomEvent.Chat, { text: chatInput.trim() });
      setChatInput("");
    }
  };

  // --- Render the UI ---
  return (
    <main>
      <header>
        <h1>CHATTER PAD</h1>
        <Link to="/" id="home-button">EXIT</Link>
        <div id="gold-count">
          <img src="/images/final coin.png" alt="Coin" className="gold-icon" />
          <span>: {(gold || 0).toLocaleString()}</span>
        </div>
      </header>
      
      <div id="room-container" ref={containerRef}>
        <div id="room" ref={roomRef}>
          {/* Render your own player */}
          <Player position={playerPos} loginName={loginName} color={color} />
          
          {/* Render other players (received via WebSocket) */}
          {players.map(p => {
            if (p.email === loginName) return null;
            return (
              <Player 
                key={p.email}
                position={p.position || { x: 750, y: 500 }}
                loginName={p.email}
                color={p.color || "hsl(0, 100%, 50%)"}
              />
            );
          })}
          
          {/* Render additional room elements (tables, chairs, bartender, etc.) */}
          {/* You can insert your seating logic and other static elements here */}
        </div>
      </div>
      
      {/* Chat Box */}
      <div id="chat-box">
        <div id="chat-messages">
          {chatMessages.map((msg, idx) => (
            <div key={idx}>
              <strong style={{ color: msg.from === loginName ? color : "white" }}>
                {msg.from}:
              </strong>{" "}
              <span>{msg.payload?.text || msg.text}</span>
            </div>
          ))}
        </div>
        <form id="chat-form" onSubmit={handleChatSubmit}>
          <input
            type="text"
            id="chat-input"
            placeholder="Type here and press Enter"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            ref={chatInputRef}
          />
        </form>
      </div>
    </main>
  );
}

export default Room;
