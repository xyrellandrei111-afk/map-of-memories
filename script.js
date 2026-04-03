const SUPABASE_URL = 'https://ysiminimhqyirufvlkvk.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_Pf2W5TClCGKBoFQKGOrW7Q_5rw_J0sP'; 
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY); 

const map = L.map('map', { zoomControl: false }).setView([16.15, 120.40], 13);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);

// INITIALIZE SEARCH BAR
L.Control.geocoder({
    defaultMarkGeocode: false,
    placeholder: "Search for a memory place...",
}).on('markgeocode', function(e) {
    selectedCoords = e.geocode.center;
    map.setView(selectedCoords, 16);
    toggleModal('input-container', true);
}).addTo(map);

let selectedCoords = null;

const toggleModal = (id, show) => {
    const el = document.getElementById(id);
    if(el) show ? el.classList.remove('hidden') : el.classList.add('hidden');
};

const getRandomColor = () => {
    const colors = ['glow-purple', 'glow-white', 'glow-yellow', 'glow-pink'];
    return colors[Math.floor(Math.random() * colors.length)];
};

// UI BUTTONS
document.getElementById('how-btn').onclick = () => toggleModal('how-box', true);
document.getElementById('close-how').onclick = () => toggleModal('how-box', false);
document.getElementById('suggestion-toggle').onclick = () => toggleModal('suggestion-box', true);
document.getElementById('close-suggestion').onclick = () => toggleModal('suggestion-box', false);

// FEEDBACK
document.getElementById('send-suggestion').onclick = async () => {
    const text = document.getElementById('suggestion-input').value;
    if(text) {
        const { error } = await supabaseClient.from('suggestions').insert([{ content: text }]);
        if(!error) {
            alert("Sent! Thank you for the feedback.");
            document.getElementById('suggestion-input').value = "";
            toggleModal('suggestion-box', false);
        }
    }
};

// LOADING MEMORIES
async function loadMemories() {
    const { data, error } = await supabaseClient.from('memories').select('*');
    if (!error) data.forEach(mem => renderMemoryMarker(mem));
}

function renderMemoryMarker(mem) {
    const color = mem.color_class || 'glow-purple';
    const glowIcon = L.divIcon({ 
        className: 'custom-icon', 
        html: `<div class="light-icon ${color}"></div>`, 
        iconSize: [12, 12] 
    });

    const popupHTML = `
        <div style="color:#222; text-align:center; min-width:140px; padding:5px;">
            <p style="margin:0 0 10px 0; font-size:14px;"><b>"${mem.message}"</b></p>
            <div style="display:flex; justify-content:space-around; font-size:12px; border-top:1px solid #eee; padding-top:8px;">
                <span>🫂 ${mem.hug_count || 0}</span>
                <span>💜 ${mem.purpleheart_count || 0}</span>
                <span>👍 ${mem.like_count || 0}</span>
            </div>
        </div>`;

    L.marker([mem.lat, mem.lng], { icon: glowIcon }).addTo(map).bindPopup(popupHTML);
}

// MAP CLICK -> OPEN MESSAGE BOX
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
            renderMemoryMarker(data[0]); 
            toggleModal('input-container', false); 
            document.getElementById('memory-input').value = ""; 
        }
    }
};

document.getElementById('cancel-btn').onclick = () => toggleModal('input-container', false);

loadMemories();
