// --- CONFIGURATION ---
// Replace these with your actual credentials from Supabase Settings > API
const SUPABASE_URL = 'https://ysiminimhqyirufvlkvk.supabase.co'; //
const SUPABASE_KEY = 'sb_publishable_Pf2W5TClCGKBoFQKGOrW7Q_5rw_J0sP'; // From your dashboard
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY); //

const map = L.map('map', { zoomControl: false }).setView([16.15, 120.40], 13);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);

// --- SEARCH CONTROL ---
L.Control.geocoder({
    geocoder: L.Control.Geocoder.nominatim(),
    defaultMarkGeocode: false,
    placeholder: "Search for a place..."
})
.on('markgeocode', (e) => map.setView(e.geocode.center, 14))
.addTo(map);

let selectedCoords = null;

// --- LOAD DATA FROM SUPABASE ---
async function loadMemories() {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabaseClient
        .from('memories')
        .select('*')
        .gt('created_at', yesterday);

    if (!error) data.forEach(mem => renderMemoryMarker(mem));
}

function renderMemoryMarker(mem) {
    const glowIcon = L.divIcon({ 
        className: 'custom-icon', 
        html: `<div class="light-icon ${mem.color_class}"></div>`, 
        iconSize: [12, 12] 
    });

    const interactionHTML = `
        <div class="reaction-row">
            <button class="reaction-btn" onclick="updateReact('${mem.id}', 'hug')">🫂 <span id="hug-${mem.id}">${mem.hug_count}</span></button>
            <button class="reaction-btn" onclick="updateReact('${mem.id}', 'purpleheart')">💜 <span id="purpleheart-${mem.id}">${mem.purpleheart_count}</span></button>
            <button class="reaction-btn" onclick="updateReact('${mem.id}', 'like')">👍 <span id="like-${mem.id}">${mem.like_count}</span></button>
        </div>`;

    const popupHTML = `<div class="popup-container"><div class="memory-note">"${mem.message}"</div>${interactionHTML}</div>`;
    L.marker([mem.lat, mem.lng], { icon: glowIcon }).addTo(map).bindPopup(popupHTML);
}

// --- SAVE TO SUPABASE (Requires INSERT policy) ---
document.getElementById('send-btn').addEventListener('click', async () => {
    const message = document.getElementById('memory-input').value;
    if (message && selectedCoords) {
        const colors = ['color-yellow', 'color-pink', 'color-purple', 'color-white', 'color-blue'];
        const color_class = colors[Math.floor(Math.random() * colors.length)];

        const { data, error } = await supabaseClient
            .from('memories')
            .insert([{ message, lat: selectedCoords.lat, lng: selectedCoords.lng, color_class }])
            .select();

        if (!error) {
            renderMemoryMarker(data[0]);
            document.getElementById('input-container').classList.add('hidden');
            document.getElementById('memory-input').value = "";
        }
    }
});

// --- UPDATE REACTIONS (Requires UPDATE policy) ---
window.updateReact = async (id, type) => {
    const el = document.getElementById(`${type}-${id}`);
    const currentCount = parseInt(el.innerText);
    const columnName = `${type}_count`; 

    const { error } = await supabaseClient
        .from('memories')
        .update({ [columnName]: currentCount + 1 })
        .eq('id', id);

    if (!error) el.innerText = currentCount + 1;
};

// --- UI LOGIC ---
map.on('click', (e) => {
    selectedCoords = e.latlng;
    document.getElementById('input-container').classList.remove('hidden');
});

document.getElementById('cancel-btn').addEventListener('click', () => document.getElementById('input-container').classList.add('hidden'));
document.getElementById('how-btn').addEventListener('click', () => document.getElementById('how-box').classList.toggle('hidden'));
document.getElementById('close-how').addEventListener('click', () => document.getElementById('how-box').classList.add('hidden'));
document.getElementById('suggestion-toggle').addEventListener('click', () => document.getElementById('suggestion-box').classList.toggle('hidden'));
document.getElementById('close-suggestion').addEventListener('click', () => document.getElementById('suggestion-box').classList.add('hidden'));

loadMemories();