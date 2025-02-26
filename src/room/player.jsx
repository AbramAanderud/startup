// src/components/Player.jsx
import React from 'react';

export default function Player({ position, loginName }) {
  return (
    <div 
      className="player"
      style={{
        position: "absolute",
        width: "40px",
        height: "40px",
        backgroundColor: "red",
        transform: `translate(${position.x}px, ${position.y}px)`,
        zIndex: 999
      }}
    >
      <div style={{
        position: "absolute",
        top: "-18px",
        width: "100%",
        textAlign: "center",
        fontSize: "12px",
        color: "white",
        textShadow: "1px 1px 2px black"
      }}>
        {loginName}
      </div>
    </div>
  );
}
