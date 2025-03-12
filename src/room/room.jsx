import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Player from './player';
import Chair from './chair';
import Table from './table';
import Bartender from './bartender';
import '../app.css';

export function Room({ userName: propUserName }) {
  const navigate = useNavigate();
  // Use the userName passed in (or from localStorage as fallback)
  const loginName = propUserName || localStorage.getItem("loginName") || "Player";

  // Dynamic backend data: gold, color, chat.
  const [roomData, setRoomData] = useState({
    gold: 0,
    color: 'hsl(0, 100%, 50%)',
    chat: [],
  });
  const { gold, color, chat } = roomData;

  // Local UI state (for movement, seating, etc.)
  const [playerPos, setPlayerPos] = useState(() => {
    const saved = localStorage.getItem("playerPos");
    return saved ? JSON.parse(saved) : { x: 750, y: 500 };
  });
  const heldKeys = useRef([]);
  const speed = 6;
  const [tableOccupancy, setTableOccupancy] = useState({
    table1: 0,
    table2: 0,
    table3: 0,
    table4: 0,
  });
  const [barOccupancy, setBarOccupancy] = useState(0);
  const [currentSeat, setCurrentSeat] = useState(null);
  // For settings, we allow the user to change their color locally;
  // changes will be sent to the backend via an effect.
  const [playerColorHue, setPlayerColorHue] = useState(0);
  // Displayed color comes from backend data.
  const playerColor = color;
  const [showSettings, setShowSettings] = useState(false);

  // Chat-related local state (for UI, then synced globally)
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [drinkPopups, setDrinkPopups] = useState([]);
  const [chatPopups, setChatPopups] = useState([]);

  // Refs for container panning and chat input.
  const containerRef = useRef(null);
  const roomRef = useRef(null);
  const chatInputRef = useRef(null);

  // On mount, fetch the current user's room data from the backend.
  useEffect(() => {
    fetch('/api/user/data')
      .then(res => res.json())
      .then(data => {
        // Expect data: { gold, color, chat } – if missing, backend should initialize defaults.
        setRoomData(data);
      })
      .catch(err => console.error("Failed to fetch room data:", err));
  }, []);

  // Poll backend to update gold every 5 seconds.
  // Use an empty dependency array so this effect runs once.
  useEffect(() => {
    const intervalId = setInterval(() => {
      // Use the updater function so we reference previous state.
      setRoomData(prev => {
        const updated = { ...prev, gold: prev.gold + 10 };
        // Update backend.
        fetch('/api/user/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
        })
          .then(res => res.json())
          .then(data => {
            // Use the backend response to update state.
            setRoomData(data);
          })
          .catch(err => console.error("Failed to update gold:", err));
        return updated;
      });
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  // When playerColorHue changes, update backend color.
  useEffect(() => {
    const newColor = `hsl(${playerColorHue}, 100%, 50%)`;
    if (newColor !== roomData.color) {
      const updated = { ...roomData, color: newColor };
      fetch('/api/user/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      })
        .then(res => res.json())
        .then(data => setRoomData(data))
        .catch(err => console.error("Failed to update color:", err));
    }
  }, [playerColorHue]); // only depends on playerColorHue

  // Poll global chat messages every 5 seconds.
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetch('/api/chat')
        .then(res => res.json())
        .then(globalChat => {
          setChatMessages(globalChat);
        })
        .catch(err => console.error("Failed to fetch global chat:", err));
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  // Save playerPos to localStorage.
  useEffect(() => {
    localStorage.setItem("playerPos", JSON.stringify(playerPos));
  }, [playerPos]);

  // Movement and camera panning logic.
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
      setPlayerPos(prev => ({
        x: Math.max(0, Math.min(prev.x, 1500 - 40)),
        y: Math.max(0, Math.min(prev.y, 1200 - 40))
      }));
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
      frameId = requestAnimationFrame(update);
    };
    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [playerPos]);

  // Key handling for movement.
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

  // Seating logic (unchanged from before).
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
  const sitAtTable = (tableId) => {
    if (currentSeat && currentSeat.type === "table" && currentSeat.id === tableId) return;
    if (tableOccupancy[tableId] < 4) {
      if (currentSeat) {
        if (currentSeat.type === "table" && currentSeat.id !== tableId) {
          setTableOccupancy(prev => ({
            ...prev,
            [currentSeat.id]: Math.max(prev[currentSeat.id] - 1, 0)
          }));
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

  const sitAtBar = () => {
    if (currentSeat && currentSeat.type === "bar") return;
    if (barOccupancy < 10) {
      if (currentSeat && currentSeat.type === "table") {
        setTableOccupancy(prev => ({ ...prev, [currentSeat.id]: Math.max(prev[currentSeat.id] - 1, 0) }));
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

  // For buying a drink, update gold locally and then update the backend.
  const handleBuyDrink = () => {
    if (gold >= 5) {
      const updatedGold = gold - 5;
      setGold(updatedGold);
      const updatedData = { ...roomData, gold: updatedGold };
      fetch('/api/user/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      })
        .then(res => res.json())
        .then(data => setRoomData(data))
        .catch(err => console.error("Failed to update gold after drink:", err));
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

  return (
    <main>
      <header>
        <h1>CHATTER PAD</h1>
        <Link to="/" id="home-button">EXIT</Link>
        <div id="gold-count">
          <img src="images/final coin.png" alt="Coin" className="gold-icon" />
          <span>: {gold.toLocaleString()}</span>
        </div>
        <div id="settings-button" onClick={() => setShowSettings(true)} style={{ cursor: "pointer" }}></div>
      </header>
      {showSettings && (
        <div id="settings-modal" style={{ position:"fixed", top:0, left:0, width:"100vw", height:"100vh", backgroundColor:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }} onClick={() => setShowSettings(false)}>
          <div style={{ backgroundColor:"rgba(0,0,0,0.8)", padding:"20px", borderRadius:"8px", color:"white", textAlign:"center" }} onClick={(e) => e.stopPropagation()}>
            <h2>Change Your Color</h2>
            <input type="range" min="0" max="360" value={playerColorHue} onChange={(e) => setPlayerColorHue(e.target.value)} />
            <div style={{ marginTop:"10px" }}>
              Current Color: <span style={{ color: playerColor }}>{playerColor}</span>
            </div>
            <button onClick={() => setShowSettings(false)} style={{ marginTop:"10px", padding:"5px 10px", cursor:"pointer" }}>Close</button>
          </div>
        </div>
      )}
      <div id="room-container" ref={containerRef} style={{ transform: "scale(1.08)" }}>
        <div id="room" ref={roomRef}>
          {drinkPopups.map(popup => (
            <div key={popup.id} style={{
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
            }}>
              {popup.text}
            </div>
          ))}
          {chatPopups.map(popup => (
            <div key={popup.id} style={{
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
            }}>
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
          <div onClick={() => sitAtTable("table1")} style={{ position:"absolute", left:"400px", top:"560px", cursor:"pointer" }}>
            <Table id="table1" occupancy={tableOccupancy.table1} maxOccupancy={4} />
          </div>
          <div onClick={() => sitAtTable("table2")} style={{ position:"absolute", left:"1000px", top:"560px", cursor:"pointer" }}>
            <Table id="table2" occupancy={tableOccupancy.table2} maxOccupancy={4} />
          </div>
          <div onClick={() => sitAtTable("table3")} style={{ position:"absolute", left:"400px", top:"900px", cursor:"pointer" }}>
            <Table id="table3" occupancy={tableOccupancy.table3} maxOccupancy={4} />
          </div>
          <div onClick={() => sitAtTable("table4")} style={{ position:"absolute", left:"1000px", top:"900px", cursor:"pointer" }}>
            <Table id="table4" occupancy={tableOccupancy.table4} maxOccupancy={4} />
          </div>
          {Object.entries(tableCenters).map(([tableId, center]) =>
            tableSeatOffsets.map((offset, seatIndex) => {
              const chairPos = {
                x: center.x + offset.x - 37.5,
                y: center.y + offset.y - 37.5
              };
              return (
                <Chair key={`${tableId}-chair-${seatIndex}`} id={`${tableId}-chair-${seatIndex}`} position={chairPos} onSit={() => sitAtTable(tableId)} />
              );
            })
          )}
          <Bartender onBuyDrink={handleBuyDrink} />
          <Player position={playerPos} loginName={loginName} color={playerColor} />
        </div>
      </div>
      <div id="chat-box" style={{ height: chatCollapsed ? "50px" : "30%", minHeight: chatCollapsed ? "50px" : "200px", transition:"height 0.3s ease", display:"flex", flexDirection:"column" }}>
        <button onClick={() => setChatCollapsed(!chatCollapsed)} style={{ marginBottom:"0.5em", cursor:"pointer" }}>
          {chatCollapsed ? "Show Chat" : "Hide Chat"}
        </button>
        {!chatCollapsed && (
          <div id="chat-messages" style={{ flex:1, overflowY:"auto", marginBottom:"0.5em" }}>
            {chatMessages.map((msg, idx) => (
              <div key={idx}>
                {msg.from === loginName ? (
                  <strong style={{ color: playerColor }}>{msg.from}:</strong>
                ) : (
                  <strong>{msg.from}:</strong>
                )}{" "}
                <span style={{ color:"white" }}>{msg.text}</span>
              </div>
            ))}
          </div>
        )}
        <form id="chat-form" onSubmit={handleChatSubmit} style={{ display:"flex" }}>
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
