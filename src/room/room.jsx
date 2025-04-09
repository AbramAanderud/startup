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
  Init: 'init',
  BuyDrink: 'buyDrink'
};

export function Room({ userName: propUserName }) {
  const loginName = propUserName || "Player";
  console.log("Room component rendering for:", loginName);

  // Room data state – these values will be updated via WS events.
  const [roomData, setRoomData] = useState({
    gold: 0,
    color: 'hsl(0, 100%, 50%)',
    position: { x: 750, y: 500 },
    chat: []
  });
  const { gold, color, position } = roomData;

  // Local player position state.
  const [playerPos, setPlayerPos] = useState(position);

  // Chat messages and other players’ data.
  const [chatMessages, setChatMessages] = useState([]);
  const [players, setPlayers] = useState([]);
  const [showSettings, setShowSettings] = useState(false);


  // Local UI states.
  const [playerColorHue, setPlayerColorHue] = useState(0);
  const [chatInput, setChatInput] = useState("");
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [drinkPopups, setDrinkPopups] = useState([]);
  const [chatPopups, setChatPopups] = useState([]);

  // Seating state.
  const [tableOccupancy, setTableOccupancy] = useState({
    table1: 0,
    table2: 0,
    table3: 0,
    table4: 0,
  });
  const [barOccupancy, setBarOccupancy] = useState(0);
  const [currentSeat, setCurrentSeat] = useState(null);

  // Refs for key handling, container elements, and the WebSocket instance.
  const heldKeys = useRef([]);
  const containerRef = useRef(null);
  const roomRef = useRef(null);
  const chatInputRef = useRef(null);
  const wsRef = useRef(null);

  const speed = 6; // Movement speed

  // Predefined room layout constants.
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
  const barChairCount = 10;
  const barLowerWidth = 1350;
  const barLowerHeight = 72;
  const barChairPositions = Array.from({ length: barChairCount }, (_, i) => {
    const x = ((i + 1) * barLowerWidth) / (barChairCount + 1) - (75 / 2);
    const y = (barLowerHeight - 75) / 2;
    return { x, y };
  });

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
      // Send an initialization event to request initial state.
      sendRoomEvent(RoomEvent.Init, {});
    };
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Received WS message:', message);
        switch (message.type) {
          case RoomEvent.Init:
            // Assuming the server sends initial state in message.payload:
            // { roomData: {...}, players: [...], chatMessages: [...] }
            if (message.payload) {
              setRoomData(message.payload.roomData || {});
              setPlayers(message.payload.players || []);
              setChatMessages(message.payload.chatMessages || []);
              // Also update playerPos if provided.
              if (message.payload.roomData?.position) {
                setPlayerPos(message.payload.roomData.position);
              }
            }
            break;
          case RoomEvent.Chat:
            setChatMessages(prev => [...prev, message]);
            break;
          case RoomEvent.Move:
            // Update the data for a particular player.
            setPlayers(prev => {
              const filtered = prev.filter(p => p.email !== message.from);
              return [...filtered, { email: message.from, position: message.payload, color: message.color || "hsl(0, 100%, 50%)" }];
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
          case RoomEvent.BuyDrink:
            // For buy drink events, let the server send a gold update.
            break;
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
  }, [loginName]);

  // --- Handle color changes by sending a WS event ---
  useEffect(() => {
    const newColor = `hsl(${playerColorHue}, 100%, 50%)`;
    if (newColor !== roomData.color) {
      sendRoomEvent(RoomEvent.ColorChange, newColor);
      setRoomData(prev => ({ ...prev, color: newColor }));
    }
  }, [playerColorHue, roomData.color, loginName]);

  // --- Movement: Continuously update player position and broadcast via WS ---
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
        // Enforce room boundaries.
        newPos.x = Math.max(0, Math.min(newPos.x, 1500 - 40));
        newPos.y = Math.max(0, Math.min(newPos.y, 1200 - 40));
        // Broadcast new position if it changed.
        if (newPos.x !== prev.x || newPos.y !== prev.y) {
          sendRoomEvent(RoomEvent.Move, newPos);
        }
        return newPos;
      });
      frameId = requestAnimationFrame(update);
    };
    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [loginName]);

  // --- Camera panning logic: Adjust the room's translation based on player position ---
  useEffect(() => {
    if (containerRef.current && roomRef.current) {
      const cw = containerRef.current.clientWidth;
      const ch = containerRef.current.clientHeight;
      const centerX = cw / 2 - 20;
      const centerY = ch / 2 - 20;
      let offsetX = centerX - playerPos.x;
      let offsetY = centerY - playerPos.y;
      offsetX = Math.min(0, Math.max(offsetX, cw - 1500));
      offsetY = Math.min(0, Math.max(offsetY, ch - 1200));
      roomRef.current.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    }
  }, [playerPos]);

  // --- Key handling: Listen for arrow key events ---
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

  // --- Seating logic ---
  const sitAtTable = (tableId) => {
    if (currentSeat && currentSeat.type === "table" && currentSeat.id === tableId) return;
    if (tableOccupancy[tableId] < 4) {
      if (currentSeat && currentSeat.type === "table" && currentSeat.id !== tableId) {
        setTableOccupancy(prev => ({
          ...prev,
          [currentSeat.id]: Math.max(prev[currentSeat.id] - 1, 0)
        }));
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
      // The movement effect will broadcast the new position via WS.
    } else {
      alert("This table is full!");
    }
  };

  const sitAtBar = () => {
    if (currentSeat && currentSeat.type === "bar") return;
    if (barOccupancy < 10) {
      if (currentSeat && currentSeat.type === "table") {
        setTableOccupancy(prev => ({ ...prev, [currentSeat.id]: Math.max(prev[currentSeat.id] - 1, 0) }));
      }
      const seatIndex = barOccupancy;
      const barChairPositionsLocal = Array.from({ length: barChairCount }, (_, i) => {
        const x = ((i + 1) * barLowerWidth) / (barChairCount + 1) - 75 / 2;
        const y = (barLowerHeight - 75) / 2;
        return { x, y };
      });
      const seatPos = barChairPositionsLocal[seatIndex];
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

  // --- Handle buying a drink: Deduct gold and notify via WS ---
  const handleBuyDrink = () => {
    if (gold >= 5) {
      sendRoomEvent(RoomEvent.BuyDrink, {}); // Server should process this and broadcast a GoldUpdate.
      // Show local popup for feedback.
      const id = Date.now();
      const popup = { id, text: "Bought drink for $5", pos: { x: playerPos.x, y: playerPos.y - 10 } };
      setDrinkPopups(prev => [...prev, popup]);
      setTimeout(() => {
        setDrinkPopups(prev => prev.filter(p => p.id !== id));
      }, 2000);
    } else {
      alert("Not enough gold!");
    }
  };

  // --- Handle sending a chat message via WS ---
  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (chatInput.trim() !== "") {
      sendRoomEvent(RoomEvent.Chat, { text: chatInput.trim() });
      setChatInput("");
      const id = Date.now();
      const popup = { id, text: chatInput.trim(), pos: { x: playerPos.x, y: playerPos.y - 20 } };
      setChatPopups(prev => [...prev, popup]);
      setTimeout(() => {
        setChatPopups(prev => prev.filter(p => p.id !== id));
      }, 5000);
      chatInputRef.current && chatInputRef.current.blur();
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
        <div
          id="settings-button"
          onClick={() => setShowSettings(true)}
          style={{ cursor: "pointer" }}
        ></div>
      </header>
      {showSettings && (
        <div
          id="settings-modal"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}
          onClick={() => setShowSettings(false)}
        >
          <div
            style={{
              backgroundColor: "rgba(0,0,0,0.8)",
              padding: "20px",
              borderRadius: "8px",
              color: "white",
              textAlign: "center"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Change Your Color</h2>
            <input
              type="range"
              min="0"
              max="360"
              value={playerColorHue}
              onChange={(e) => setPlayerColorHue(e.target.value)}
            />
            <div style={{ marginTop: "10px" }}>
              Current Color: <span style={{ color: playerColor }}>{playerColor}</span>
            </div>
            <button
              onClick={() => setShowSettings(false)}
              style={{ marginTop: "10px", padding: "5px 10px", cursor: "pointer" }}
            >
              Close
            </button>
          </div>
        </div>
      )}
      <div id="room-container" ref={containerRef} style={{ transform: "scale(1.08)" }}>
        <div id="room" ref={roomRef}>
          {drinkPopups.map(popup => (
            <div
              key={popup.id}
              style={{
                position: "absolute",
                left: popup.pos.x,
                top: popup.pos.y,
                background: "gold",
                color: "black",
                padding: "5px 10px",
                border: "1px solid black",
                borderRadius: "20px",
                fontWeight: "bold",
                zIndex: 9999,
                animation: "fadeOut 2s forwards",
                pointerEvents: "none"
              }}
            >
              {popup.text}
            </div>
          ))}
          {chatPopups.map(popup => (
            <div
              key={popup.id}
              style={{
                position: "absolute",
                left: popup.pos.x,
                top: popup.pos.y,
                background: "white",
                color: "black",
                padding: "5px 10px",
                border: "1px solid black",
                borderRadius: "20px",
                fontWeight: "bold",
                zIndex: 9999,
                animation: "fadeOut 5s forwards",
                pointerEvents: "none"
              }}
            >
              {popup.text}
            </div>
          ))}
          <div id="wall-back"></div>
          <div id="username-display">{loginName}</div>
          <div id="bar" onClick={sitAtBar}>Bar area</div>
          <div id="bar-lower">
            {barChairPositions.map((pos, idx) => (
              <Chair key={`bar-chair-${idx}`} id={`bar-chair-${idx}`} position={pos} onSit={sitAtBar} />
            ))}
          </div>
          <div className="picture-frame" id="frame-1">
            <img src="/images/blob.webp" alt="Picture 1" />
          </div>
          <div className="picture-frame" id="frame-2">
            <img src="/images/michalagnelo.jpg" alt="Picture 2" />
          </div>
          <div
            onClick={() => sitAtTable("table1")}
            style={{ position: "absolute", left: "400px", top: "560px", cursor: "pointer" }}
          >
            <Table id="table1" occupancy={tableOccupancy.table1} maxOccupancy={4} />
          </div>
          <div
            onClick={() => sitAtTable("table2")}
            style={{ position: "absolute", left: "1000px", top: "560px", cursor: "pointer" }}
          >
            <Table id="table2" occupancy={tableOccupancy.table2} maxOccupancy={4} />
          </div>
          <div
            onClick={() => sitAtTable("table3")}
            style={{ position: "absolute", left: "400px", top: "900px", cursor: "pointer" }}
          >
            <Table id="table3" occupancy={tableOccupancy.table3} maxOccupancy={4} />
          </div>
          <div
            onClick={() => sitAtTable("table4")}
            style={{ position: "absolute", left: "1000px", top: "900px", cursor: "pointer" }}
          >
            <Table id="table4" occupancy={tableOccupancy.table4} maxOccupancy={4} />
          </div>
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
          <Bartender onBuyDrink={handleBuyDrink} />
          {/* Render current user */}
          <Player position={playerPos} loginName={loginName} color={playerColor} />
          {/* Render other players */}
          {players.map(p => {
            if (p.email === loginName) return null;
            return (
              <Player
                key={p.email}
                position={p.position || { x: 750, y: 500 }}
                loginName={p.email}
                color={p.color}
              />
            );
          })}
        </div>
      </div>
      <div
        id="chat-box"
        style={{
          height: chatCollapsed ? "50px" : "30%",
          minHeight: chatCollapsed ? "50px" : "200px",
          transition: "height 0.3s ease",
          display: "flex",
          flexDirection: "column"
        }}
      >
        <button onClick={() => setChatCollapsed(!chatCollapsed)} style={{ marginBottom: "0.5em", cursor: "pointer" }}>
          {chatCollapsed ? "Show Chat" : "Hide Chat"}
        </button>
        {!chatCollapsed && (
          <div id="chat-messages" style={{ flex: 1, overflowY: "auto", marginBottom: "0.5em" }}>
            {chatMessages.map((msg, idx) => (
              <div key={idx}>
                <strong style={{ color: msg.from === loginName ? playerColor : (msg.color || "white") }}>
                  {msg.from}:
                </strong>{" "}
                <span style={{ color:"white" }}>{msg.payload?.text || msg.text}</span>
              </div>
            ))}
 
          </div>
        )}
        <form id="chat-form" onSubmit={handleChatSubmit} style={{ display: "flex" }}>
          <input
            type="text"
            id="chat-input"
            placeholder="Type here and press Enter"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            ref={chatInputRef}
            style={{ flex: 1, marginRight: "0.5em" }}
          />
        </form>
      </div>
    </main>
  );
}

export default Room;
