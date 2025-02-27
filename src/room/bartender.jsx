import React from 'react';

export default function Bartender({ onBuyDrink }) {
  return (
    <div 
      className="bartender"
      onClick={onBuyDrink}
      style={{
        position: "absolute",
        width: "60px",
        height: "120px",
        backgroundColor: "blue",
        left: "calc(50% - 30px)",
        top: "calc(14% - 50px)", 
        cursor: "pointer",
        zIndex: 3,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontSize: "12px",
      }}
    >
      Buy Drink
    </div>
  );
}
