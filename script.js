body, html, #map { margin: 0; padding: 0; height: 100%; width: 100%; font-family: 'Inter', sans-serif; background: #000; }

/* --- UI Elements --- */
.top-bar { position: absolute; top: 20px; left: 50%; transform: translateX(-50%); z-index: 1000; text-align: center; width: 90%; pointer-events: none; }
.logo { color: #ff00ff; text-shadow: 0 0 15px #ff00ff; margin: 0; font-weight: 600; pointer-events: auto; }
#user-controls { pointer-events: auto; margin-top: 10px; }

/* --- Glassmorphism Modals --- */
.modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 2000; display: flex; align-items: center; justify-content: center; }
.hidden { display: none; }
.glass-card { background: rgba(25, 25, 25, 0.85); backdrop-filter: blur(15px); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 30px; width: 320px; color: white; text-align: center; }

/* --- High-End Wide Popups --- */
.leaflet-popup-content-wrapper {
    background: rgba(15, 15, 15, 0.9) !important;
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 24px !important;
    width: 320px !important; /* WIDER */
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
}
.leaflet-popup-content { margin: 20px !important; width: 280px !important; color: white !important; }
.memory-note { font-size: 18px; font-weight: 600; color: #fff300; line-height: 1.4; margin-bottom: 15px; }

/* --- Reactions & Comments --- */
.reaction-row { display: flex; gap: 10px; margin-bottom: 15px; }
.reaction-btn { background: rgba(255,255,255,0.1); border: none; color: white; padding: 8px 12px; border-radius: 12px; cursor: pointer; transition: 0.3s; }
.reaction-btn:hover { background: rgba(255,255,255,0.2); }

.comment-item { font-size: 12px; background: rgba(255,255,255,0.05); padding: 8px; border-radius: 8px; margin-bottom: 5px; border-left: 3px solid #ff00ff; text-align: left; }

/* --- Buttons --- */
button { background: #ff00ff; color: white; border: none; padding: 10px 20px; border-radius: 12px; cursor: pointer; font-weight: 600; }
.secondary-btn { background: rgba(255,255,255,0.1); margin-left: 10px; }
input, textarea { width: 100%; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 10px; color: white; padding: 10px; margin: 10px 0; box-sizing: border-box; }
