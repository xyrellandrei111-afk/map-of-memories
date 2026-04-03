const SUPABASE_URL = 'https://ysiminimhqyirufvlkvk.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_Pf2W5TClCGKBoFQKGOrW7Q_5rw_J0sP'; 
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY); 

const map = L.map('map', { zoomControl: false }).setView([16.15, 120.40], 13);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);

let selectedCoords = null;

// Initialize Search Bar
document.addEventListener('DOMContentLoaded', () => {
    const searchContainer = document.getElementById('search-container');
    if (searchContainer) {
        const geocoder = L.Control.geocoder({
            defaultMarkGeocode: false,
            placeholder: "Search..."
        }).on('markgeocode', function(e) {
            selectedCoords = e.geocode.center;
            map.setView(selectedCoords, 16);
            toggleModal('input-container', true);
        });
        searchContainer.appendChild(geocoder.onAdd(map));
    }
});

const toggleModal = (id, show) => {
    const el = document.getElementById(id);
    if(el) show ? el.classList.remove('hidden') : el.classList.add('hidden');
};

const getRandomColor = () => {
    const colors = ['glow-purple', 'glow-white', 'glow-yellow', 'glow-pink'];
    return colors[Math.floor(Math.random() * colors.length)];
};

// Global Delete Function
window.deleteGlow = async (id) => {
    if (confirm("Delete this memory forever?")) {
        const { error } = await supabaseClient.from('memories').delete().eq('id', id);
        if (!error) location.reload();
    }
};

function renderMemoryMarker(mem) {
    const color = mem.color_class || 'glow-purple';
    const glowIcon = L.divIcon({ 
        className: 'custom-icon', 
        html: `<div class="light-icon ${color}"></div>`, 
        iconSize: [12, 12] 
    });

    const myGlows = JSON.parse(localStorage.getItem('my_glows') || "[]");
    const isMine = myGlows.includes(mem.id);

    const popupHTML = `
        <div style="color:#222; text-align:center; min-width:140px;">
            <p style="margin:0 0 10px 0;"><b>"${mem.message}"</b></p>
            <div style="display:flex; justify-content:space-around; font-size:12px; border-top:1px solid #eee; padding-top:8px;">
                <span>🫂 ${mem.hug_count || 0}</span>
                <span>💜 ${mem.purpleheart_count || 0}</span>
                <span>👍 ${mem.like_count || 0}</span>
            </div>
            ${isMine ? `<button class="delete-btn" onclick="deleteGlow('${mem.id}')">Delete my glow</button>` : ''}
        </div>`;

    L.marker([mem.lat, mem.lng], { icon: glowIcon }).addTo(map).bindPopup(popupHTML);
}

map.on('click', (e) => {
    selectedCoords = e.latlng;
    toggleModal('input-container', true);
});

// Post Glow (Fixes null column errors)
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
            const myGlows = JSON.parse(localStorage.getItem('my_glows') || "[]");
            myGlows.push(data[0].id);
            localStorage.setItem('my_glows', JSON.stringify(myGlows));

            renderMemoryMarker(data[0]); 
            toggleModal('input-container', false); 
            document.getElementById('memory-input').value = ""; 
        } else {
            alert("Error: " + error.message);
        }
    }
};

// UI Handlers
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
