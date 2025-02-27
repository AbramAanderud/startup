// src/components/table.jsx
import React from 'react';

export default function Table({ id, occupancy, maxOccupancy }) {
  return (
    <div 
      className="table"
      id={id}
      style={{
        position: "absolute",
        width: "225px",    
        height: "225px",
        backgroundColor: "rgb(157,76,0)",
        borderRadius: "50%",
        border: "2px solid black",
        transform: "perspective(500px) rotateX(30deg)",
        boxShadow: "0 5px 10px rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontSize: "18px",
        zIndex: 10,
        position: "relative"
      }}
    >
      {occupancy}/{maxOccupancy}
    </div>
  );
}

