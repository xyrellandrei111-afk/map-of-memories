const SUPABASE_URL = 'https://ysiminimhqyirufvlkvk.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_Pf2W5TClCGKBoFQKGOrW7Q_5rw_J0sP'; 
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY); 

const map = L.map('map', { zoomControl: false }).setView([16.15, 120.40], 13);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);

// Search Bar Setup
const geocoder = L.Control.geocoder({
    defaultMarkGeocode: false,
    placeholder: "Find a place...",
}).on('markgeocode', function(e) {
    selectedCoords = e.geocode.center;
    map.setView(selectedCoords, 16);
    toggleModal('input-container', true);
});
document.getElementById('search-container').appendChild(geocoder.onAdd(map));

let selectedCoords = null;

const toggleModal = (id, show) => {
    const el = document.getElementById(id);
    if(el) show ? el.classList.remove('hidden') : el.classList.add('hidden');
};

const getRandomColor = () => {
    const colors = ['glow-purple', 'glow-white', 'glow-yellow', 'glow-pink'];
    return colors[Math.floor(Math.random() * colors.length)];
};

// --- NEW: DELETE FUNCTION ---
window.deleteGlow = async (id) => {
    if (confirm("Delete this memory forever?")) {
        const { error } = await supabaseClient.from('memories').delete().eq('id', id);
        if (!error) {
            location.reload(); // Refresh to remove the marker
        } else {
            alert("Error deleting: " + error.message);
        }
    }
};

function renderMemoryMarker(mem) {
    const color = mem.color_class || 'glow-purple';
    const glowIcon = L.divIcon({ 
        className: 'custom-icon', 
        html: `<div class="light-icon ${color}"></div>`, 
        iconSize: [12, 12] 
    });

    // Check if this ID exists in user's local history to show Delete button
    const myGlows = JSON.parse(localStorage.getItem('my_glows') || "[]");
    const isMine = myGlows.includes(mem.id);

    const popupHTML = `
        <div style="color:#222; text-align:center; min-width:160px; padding:5px;">
            <p style="margin:0 0 10px 0; font-size:14px;"><b>"${mem.message}"</b></p>
            <div style="display:flex; justify-content:space-around; font-size:12px; border-top:1px solid #eee; padding-top:8px;">
                <span>🫂 ${mem.hug_count || 0}</span>
                <span>💜 ${mem.purpleheart_count || 0}</span>
                <span>👍 ${mem.like_count || 0}</span>
            </div>
            ${isMine ? `<button class="delete-btn" onclick="deleteGlow('${mem.id}')">Remove my glow</button>` : ''}
            <div class="popup-footer">Click to react or share warmth</div>
        </div>`;

    L.marker([mem.lat, mem.lng], { icon: glowIcon }).addTo(map).bindPopup(popupHTML);
}

// Map Click Logic
map.on('click', (e) => {
    selectedCoords = e.latlng;
    toggleModal('input-container', true);
});

document.getElementById('send-btn').onclick = async () => {
    const msg = document.getElementById('memory-input').value;
    if (msg && selectedCoords) {
        const { data, error } = await supabaseClient.from('memories').insert([{ 
            message: msg, 
            lat: selectedCoords.lat, 
            lng: selectedCoords.lng,
            color_class: getRandomColor(), 
            hug_count: 0, 
            purpleheart_count: 0, 
            like_count: 0 
        }]).select();
        
        if(!error) { 
            // Save ID to local storage so the user can delete it later
            const myGlows = JSON.parse(localStorage.getItem('my_glows') || "[]");
            myGlows.push(data[0].id);
            localStorage.setItem('my_glows', JSON.stringify(myGlows));

            renderMemoryMarker(data[0]); 
            toggleModal('input-container', false); 
            document.getElementById('memory-input').value = ""; 
        }
    }
};

// Modal Controls
document.getElementById('how-btn').onclick = () => toggleModal('how-box', true);
document.getElementById('close-how').onclick = () => toggleModal('how-box', false);
document.getElementById('suggestion-toggle').onclick = () => toggleModal('suggestion-box', true);
document.getElementById('close-suggestion').onclick = () => toggleModal('suggestion-box', false);
document.getElementById('cancel-btn').onclick = () => toggleModal('input-container', false);

async function loadMemories() {
    const { data, error } = await supabaseClient.from('memories').select('*');
    if (!error) data.forEach(mem => renderMemoryMarker(mem));
}

loadMemories();
