import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Player from './player';
import Chair from './chair';
import Table from './table';
import Bartender from './bartender';
import '../app.css';

export function Room() {
  const navigate = useNavigate();
  const loginName = localStorage.getItem("loginName") || "Player";

  const [playerPos, setPlayerPos] = useState(() => {
    const savedPos = localStorage.getItem("playerPos");
    return savedPos ? JSON.parse(savedPos) : { x: 750, y: 500 };
  });
  const heldKeys = useRef([]);
  const speed = 6;
  const [gold, setGold] = useState(0);
  const [tableOccupancy, setTableOccupancy] = useState({
    table1: 0,
    table2: 0,
    table3: 0,
    table4: 0,
  });
  const [barOccupancy, setBarOccupancy] = useState(0);
  const [currentSeat, setCurrentSeat] = useState(null);
  const [playerColorHue, setPlayerColorHue] = useState(0);
  const playerColor = `hsl(${playerColorHue}, 100%, 50%)`;
  const [showSettings, setShowSettings] = useState(false);
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
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [drinkPopups, setDrinkPopups] = useState([]);
  const [chatPopups, setChatPopups] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem("chatMessages");
    if (stored) setChatMessages(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    localStorage.setItem("playerPos", JSON.stringify(playerPos));
  }, [playerPos]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setGold(prev => prev + 10);
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const chatInputRef = useRef(null);

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (chatInput.trim() !== "") {
      const newMsg = { from: loginName, text: chatInput.trim() };
      setChatMessages(prev => [...prev, newMsg]);
      const id = Date.now();
      const popup = { id, text: chatInput.trim(), pos: { x: playerPos.x, y: playerPos.y - 20 } };
      setChatPopups(prev => [...prev, popup]);
      setTimeout(() => {
        setChatPopups(prev => prev.filter(p => p.id !== id));
      }, 5000);
      setChatInput("");
  
      chatInputRef.current && chatInputRef.current.blur();
    }
  };


  const containerRef = useRef(null);
  const roomRef = useRef(null);

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

  const sitAtTable = (tableId) => {
    if (currentSeat && currentSeat.type === "table" && currentSeat.id === tableId) return;
    if (tableOccupancy[tableId] < 4) {
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

  const sitAtBar = () => {
    if (currentSeat && currentSeat.type === "bar") return;
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

  const handleBuyDrink = () => {
    if (gold >= 5) {
      setGold(prev => prev - 5);
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
