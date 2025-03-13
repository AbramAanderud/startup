import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Player from './player';
import Chair from './chair';
import Table from './table';
import Bartender from './bartender';
import '../app.css';

export function Room({ userName: propUserName }) {
  const loginName = propUserName || "Player";
  console.log("Room component rendering for:", loginName);

  const [roomData, setRoomData] = useState({
    gold: 0,
    color: 'hsl(0, 100%, 50%)',
    position: { x: 750, y: 500 },
    chat: []
  });
  const { gold, color, position } = roomData;

  const [playerPos, setPlayerPos] = useState(position);
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

  const [playerColorHue, setPlayerColorHue] = useState(0);
  const playerColor = color;
  const [showSettings, setShowSettings] = useState(false);

  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [drinkPopups, setDrinkPopups] = useState([]);
  const [chatPopups, setChatPopups] = useState([]);

  const [players, setPlayers] = useState([]);

  const containerRef = useRef(null);
  const roomRef = useRef(null);
  const chatInputRef = useRef(null);

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

  // --------------------
  // On mount, fetch current user data.
  useEffect(() => {
    fetch('/api/user/data')
      .then(res => res.json())
      .then(data => {
        console.log("Fetched room data:", data);
        setRoomData(data);
        setPlayerPos(data.position || { x: 750, y: 500 });
      })
      .catch(err => console.error("Failed to fetch room data:", err));
  }, []);

  // --------------------
  // Poll global chat messages every 5 seconds.
  useEffect(() => {
    const chatInterval = setInterval(() => {
      fetch('/api/chat')
        .then(res => res.json())
        .then(globalChat => {
          console.log("Fetched global chat:", globalChat);
          setChatMessages(globalChat);
        })
        .catch(err => console.error("Failed to fetch global chat:", err));
    }, 5000);
    return () => clearInterval(chatInterval);
  }, []);

  // --------------------
  // Poll global players list every 3 seconds.
  useEffect(() => {
    const playersInterval = setInterval(() => {
      fetch('/api/room/players')
        .then(res => res.json())
        .then(allPlayers => {
          console.log("Fetched all players:", allPlayers);
          setPlayers(allPlayers);
        })
        .catch(err => console.error("Failed to fetch players:", err));
    }, 3000);
    return () => clearInterval(playersInterval);
  }, []);

  // --------------------
  // Poll user data every 10 seconds.
  useEffect(() => {
    const dataInterval = setInterval(() => {
      fetch('/api/user/data')
        .then(res => res.json())
        .then(data => {
          console.log("Polled user data:", data);
          setRoomData(data);
          // Do not update playerPos here; let the 2-second updater handle it.
        })
        .catch(err => console.error("Failed to poll user data:", err));
    }, 10000);
    return () => clearInterval(dataInterval);
  }, []);
   
  

  // --------------------
  // Update backend color when playerColorHue changes.
  useEffect(() => {
    const newColor = `hsl(${playerColorHue}, 100%, 50%)`;
    if (newColor !== roomData.color) {
      // Only update the color field so other fields remain intact.
      const updatedData = { color: newColor };
      fetch('/api/user/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      })
        .then(res => res.json())
        .then(data => {
          console.log("Color updated:", data.color);
          setRoomData(prev => ({ ...prev, color: data.color }));
        })
        .catch(err => console.error("Failed to update color:", err));
    }
  }, [playerColorHue, roomData.color]);

  // --------------------
  // New: Update backend with current player position periodically.
  useEffect(() => {
    const updatePosition = () => {
      const updatedData = { position: playerPos };
      fetch('/api/user/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      })
        .then(res => res.json())
        .then(data => {
          console.log("Position updated:", data.position);
        })
        .catch(err => console.error("Failed to update position:", err));
    };

    const intervalId = setInterval(updatePosition, 2000); // update every 2 seconds
    return () => clearInterval(intervalId);
  }, [playerPos]);

  // --------------------
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
        console.log("Camera offsets:", offsetX, offsetY);
        roomRef.current.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
      }
      frameId = requestAnimationFrame(update);
    };
    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [playerPos]);

  // --------------------
  // Key handling.
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

  // --------------------
  // Seating logic.
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

  // --------------------
  // Handle buying a drink: deduct 5 gold and update backend.
  const handleBuyDrink = () => {
    if (gold >= 5) {
      const updatedGold = gold - 5;
      const updatedData = { 
        gold: updatedGold,
        position: playerPos 
      };
      fetch('/api/user/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      })
        .then(res => res.json())
        .then(data => {
          console.log("Gold after buying drink:", data.gold);
          setRoomData(prev => ({ ...prev, gold: data.gold }));
        })
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

  // --------------------
  // Handle sending a chat message.
  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (chatInput.trim() !== "") {
      const newMsg = { from: loginName, text: chatInput.trim() };
      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMsg)
      })
        .then(res => res.json())
        .then(() => setChatInput(""))
        .catch(err => console.error("Failed to post chat message:", err));
      const id = Date.now();
      const popup = { id, text: chatInput.trim(), pos: { x: playerPos.x, y: playerPos.y - 20 } };
      setChatPopups(prev => [...prev, popup]);
      setTimeout(() => {
        setChatPopups(prev => prev.filter(p => p.id !== id));
      }, 5000);
      chatInputRef.current && chatInputRef.current.blur();
    }
  };

  return (
    <main>
      <header>
        <h1>CHATTER PAD</h1>
        <Link to="/" id="home-button">EXIT</Link>
        <div id="gold-count">
          <img src="/images/final coin.png" alt="Coin" className="gold-icon" />
          <span>: {(gold || 0).toLocaleString()}</span>
        </div>
        <div id="settings-button" onClick={() => setShowSettings(true)} style={{ cursor: "pointer" }}></div>
      </header>
      {showSettings && (
        <div id="settings-modal" style={{
          position:"fixed", top:0, left:0, width:"100vw", height:"100vh",
          backgroundColor:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center",
          justifyContent:"center", zIndex:1000
        }} onClick={() => setShowSettings(false)}>
          <div style={{
            backgroundColor:"rgba(0,0,0,0.8)", padding:"20px", borderRadius:"8px",
            color:"white", textAlign:"center"
          }} onClick={(e) => e.stopPropagation()}>
            <h2>Change Your Color</h2>
            <input type="range" min="0" max="360" value={playerColorHue} onChange={(e) => setPlayerColorHue(e.target.value)} />
            <div style={{ marginTop:"10px" }}>
              Current Color: <span style={{ color: playerColor }}>{playerColor}</span>
            </div>
            <button onClick={() => setShowSettings(false)} style={{
              marginTop:"10px", padding:"5px 10px", cursor:"pointer"
            }}>Close</button>
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
