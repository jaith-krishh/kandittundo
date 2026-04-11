import React from 'react';

export default function LoadingScreen() {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#0f0f0f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999
    }}>
      <div className="loader">
        <p>loading</p>
        <div className="words">
          <span className="word">films</span>
          <span className="word">watchlist</span>
          <span className="word">series</span>
          <span className="word">rankings</span>
          <span className="word">memories</span>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500&display=swap');

        .loader {
          --bg-color: #0f0f0f;
          color: rgb(124, 124, 124);
          font-family: "Poppins", sans-serif;
          font-weight: 500;
          font-size: 25px;
          box-sizing: content-box;
          height: 40px;
          padding: 10px 10px;
          display: flex;
          border-radius: 8px;
        }

        .words {
          overflow: hidden;
          position: relative;
        }

        .words::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            var(--bg-color) 10%,
            transparent 30%,
            transparent 70%,
            var(--bg-color) 90%
          );
          z-index: 20;
        }

        .word {
          display: block;
          height: 100%;
          padding-left: 6px;
          color: #d61010ff;
          animation: spin_4991 4s infinite;
        }

        @keyframes spin_4991 {
          10%  { transform: translateY(-102%); }
          25%  { transform: translateY(-100%); }
          35%  { transform: translateY(-202%); }
          50%  { transform: translateY(-200%); }
          60%  { transform: translateY(-302%); }
          75%  { transform: translateY(-300%); }
          85%  { transform: translateY(-402%); }
          100% { transform: translateY(-400%); }
        }
      `}</style>
    </div>
  );
}
