// Room.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Player from './player';
import Chair from './chair';
import Table from './table';
import Bartender from './bartender';
import { Leaderboard } from './leaderboard';
import '../app.css';

export const RoomEvent = {
  Chat: 'chat',
  Move: 'move',
  GoldUpdate: 'goldUpdate',
  ColorChange: 'colorChange',
  System: 'system',
  Init: 'init',
  BuyDrink: 'buyDrink'
};

function extractHue(hslString) {
  const match = hslString.match(/hsl\(\s*([\d.]+),/);
  return match ? Number(match[1]) : 0;
}

export default function Room({ userName: propUserName }) {
  const navigate = useNavigate();

  // We'll store the username from persisted data here.
  const [username, setUsername] = useState(""); 

  // Loading flag until data is fetched.
  const [loaded, setLoaded] = useState(false);

  // Persisted room data from the database.
  const [roomData, setRoomData] = useState({
    gold: 0,
    color: 'hsl(0, 100%, 50%)',
    position: { x: 750, y: 500 },
    chat: []
  });
  const { gold, color, position } = roomData;
  const playerColor = color; // For consistency.
  
  // Local UI and position state.
  const [playerPos, setPlayerPos] = useState(position);
  const [chatMessages, setChatMessages] = useState([]);
  const [players, setPlayers] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
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

  // Refs.
  const heldKeys = useRef([]);
  const containerRef = useRef(null);
  const roomRef = useRef(null);
  const chatInputRef = useRef(null);
  const wsRef = useRef(null);
  const debounceTimeout = useRef(null);
  const speed = 6;

  // Predefined layout.
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

  // --- Logout on Page Hide ---
  useEffect(() => {
    const handlePageHide = () => {
      navigator.sendBeacon('/api/auth/logout');
    };
    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, []);

  // --- Initial Data Fetch for Persistence ---
  useEffect(() => {
    fetch('/api/user/data', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        console.log("Fetched persisted room data:", data);
        setRoomData(data);
        setPlayerPos(data.position || { x: 750, y: 500 });
        setPlayerColorHue(extractHue(data.color));
        setUsername(data.email || propUserName || "Player");
        setLoaded(true);
      })
      .catch(err => console.error("Failed to fetch room data:", err));
  }, [propUserName]);

  // --- Persist Chat History on Mount ---
  useEffect(() => {
    fetch('/api/chat', { credentials: 'include' })
      .then(res => res.json())
      .then(chats => {
        console.log("Fetched chat history:", chats);
        setChatMessages(chats);
      })
      .catch(err => console.error("Failed to fetch chat messages:", err));
  }, []);

  // --- WebSocket Helper ---
  const sendRoomEvent = (type, payload) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const event = { from: username, type, payload };
      wsRef.current.send(JSON.stringify(event));
    }
  };

  // --- Debounce for Immediate Movement Save ---
  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      fetch('/api/user/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ position: playerPos })
      })
        .then(res => res.json())
        .then(data => {
          console.log("Immediate DB update for position:", data.position);
        })
        .catch(err => console.error("Immediate update failed", err));
    }, 500);
    return () => clearTimeout(debounceTimeout.current);
  }, [playerPos]);

  // --- Establish WebSocket Connection ---
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:4000');
    ws.onopen = () => {
      console.log('WebSocket connected');
      sendRoomEvent(RoomEvent.Init, {});
    };
    ws.onmessage = (event) => {
      if (event.data instanceof Blob) {
        event.data.text().then((text) => {
          try {
            const message = JSON.parse(text);
            handleWSMessage(message);
          } catch (err) {
            console.error('Error parsing WS message from Blob:', err);
          }
        }).catch(err => {
          console.error('Error converting Blob to text:', err);
        });
      } else {
        try {
          const message = JSON.parse(event.data);
          handleWSMessage(message);
        } catch (err) {
          console.error('Error processing WS message:', err);
        }
      }
    };
    
    function handleWSMessage(message) {
      console.log('Received WS message:', message);
      switch (message.type) {
        case RoomEvent.Init:
          if (message.payload) {
            setRoomData(message.payload.roomData || {});
            setPlayers(message.payload.players || []);
            setChatMessages(message.payload.chatMessages || []);
            if (message.payload.roomData?.position) {
              setPlayerPos(message.payload.roomData.position);
            }
          }
          break;
        case RoomEvent.Chat:
          setChatMessages(prev => [...prev, message]);
          break;
        case RoomEvent.Move:
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
          // Process BuyDrink event if desired.
          break;
        default:
          console.warn('Unhandled WS message type:', message.type);
      }
    }
    
    ws.onerror = (err) => console.error('WebSocket error:', err);
    ws.onclose = () => console.log('WebSocket closed');
    wsRef.current = ws;
    return () => ws.close();
  }, [username]);

  // --- Dual Update: Color Change ---
  useEffect(() => {
    const newColor = `hsl(${playerColorHue}, 100%, 50%)`;
    if (newColor !== roomData.color) {
      sendRoomEvent(RoomEvent.ColorChange, newColor);
      fetch('/api/user/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ color: newColor })
      })
        .then(res => res.json())
        .then(data => {
          console.log("DB updated with new color:", data.color);
          setRoomData(prev => ({ ...prev, color: data.color }));
        })
        .catch(err => console.error("Failed to update color in DB", err));
    }
  }, [playerColorHue, roomData.color, username]);

  // --- Dual Update: Persist Movement Every 2 Seconds ---
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetch('/api/user/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ position: playerPos })
      })
        .then(res => res.json())
        .then(data => {
          console.log("DB updated with new position:", data.position);
        })
        .catch(err => console.error("Failed to update position in DB", err));
    }, 2000);
    return () => clearInterval(intervalId);
  }, [playerPos, username]);

  // --- Movement: Continuously update position and broadcast via WS ---
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
        newPos.x = Math.max(0, Math.min(newPos.x, 1500 - 40));
        newPos.y = Math.max(0, Math.min(newPos.y, 1200 - 40));
        if (newPos.x !== prev.x || newPos.y !== prev.y) {
          sendRoomEvent(RoomEvent.Move, newPos);
        }
        return newPos;
      });
      frameId = requestAnimationFrame(update);
    };
    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [username]);

  // --- Camera Panning Logic ---
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

  // --- Key Handling ---
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

  // --- Seating Logic ---
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

  const handleBuyDrink = () => {
    if (gold >= 5) {
      fetch('/api/user/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ gold: gold - 5 })
      })
        .then(res => res.json())
        .then(data => {
          console.log("DB updated with new gold:", data.gold);
          sendRoomEvent(RoomEvent.GoldUpdate, data.gold);
          setRoomData(prev => ({ ...prev, gold: data.gold }));
        })
        .catch(err => console.error("Failed to update gold in DB", err));
      
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

  const handleChatSubmit = (e) => {
    e.preventDefault();
    const trimmedMessage = chatInput.trim();
    if (trimmedMessage !== "") {
      const messageObject = {
        from: username,
        type: RoomEvent.Chat,
        payload: { text: trimmedMessage, color: playerColor },
        timestamp: new Date().toISOString()
      };
      // Immediately update local chat state.
      setChatMessages(prev => [...prev, messageObject]);
      sendRoomEvent(RoomEvent.Chat, messageObject.payload);
      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: username, text: trimmedMessage, color: playerColor })
      })
        .then(res => res.json())
        .then(data => console.log("Chat message persisted:", data))
        .catch(err => console.error("Failed to persist chat message", err));
      
      setChatInput("");
    }
  };

  return (
    <main>
      <header>
        <h1>CHATTER PAD</h1>
        <button
          id="home-button"
          onClick={handleExit}
          style={{
            background: "none",
            border: "none",
            color: "white",
            fontSize: "1.5em",
            cursor: "pointer",
            padding: "8px"
          }}
        >
          EXIT
        </button>
        <div id="gold-count">
          <img src="/images/final coin.png" alt="Coin" className="gold-icon" />
          <span>: {(gold || 0).toLocaleString()}</span>
        </div>
        <div id="settings-button" onClick={() => setShowSettings(true)} style={{ cursor: "pointer" }}></div>
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
            <p style={{ fontSize: "0.9em", margin: "10px 0", color: "white" }}>
              Arrow keys to move and click to interact.
            </p>
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
          <div id="username-display">{username}</div>
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
          <div onClick={() => sitAtTable("table1")} style={{ position: "absolute", left: "400px", top: "560px", cursor: "pointer" }}>
            <Table id="table1" occupancy={tableOccupancy.table1} maxOccupancy={4} />
          </div>
          <div onClick={() => sitAtTable("table2")} style={{ position: "absolute", left: "1000px", top: "560px", cursor: "pointer" }}>
            <Table id="table2" occupancy={tableOccupancy.table2} maxOccupancy={4} />
          </div>
          <div onClick={() => sitAtTable("table3")} style={{ position: "absolute", left: "400px", top: "900px", cursor: "pointer" }}>
            <Table id="table3" occupancy={tableOccupancy.table3} maxOccupancy={4} />
          </div>
          <div onClick={() => sitAtTable("table4")} style={{ position: "absolute", left: "1000px", top: "900px", cursor: "pointer" }}>
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
          <Player position={playerPos} loginName={username} color={playerColor} />
          {players.map(p => {
            if (p.email === username) return null;
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
      <div id="chat-box" style={{ height: chatCollapsed ? "50px" : "30%", minHeight: chatCollapsed ? "50px" : "200px", transition: "height 0.3s ease", display: "flex", flexDirection: "column" }}>
        <button onClick={() => setChatCollapsed(!chatCollapsed)} style={{ marginBottom: "0.5em", cursor: "pointer" }}>
          {chatCollapsed ? "Show Chat" : "Hide Chat"}
        </button>
        {!chatCollapsed && (
          <div id="chat-messages" style={{ flex: 1, overflowY: "auto", marginBottom: "0.5em" }}>
            {chatMessages.map((msg, idx) => (
              <div key={idx}>
                <strong style={{ color: msg.from === username ? playerColor : (msg.color || "white") }}>
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
