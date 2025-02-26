// src/components/Chair.jsx
import React from 'react';

export default function Chair({ position, onSit, id }) {
  return (
    <div 
      className="chair"
      id={id}
      onClick={onSit}
      style={{
        position: "absolute",
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: "50px",
        height: "50px",
        backgroundColor: "#8B4513",
        border: "2px solid #654321",
        borderRadius: "50%",
        transform: "perspective(500px) rotateX(30deg)",
        cursor: "pointer"
      }}
    >
      <div style={{
        fontSize: "10px",
        color: "white",
        textAlign: "center",
        paddingTop: "55px"
      }}>Sit</div>
    </div>
  );
}
