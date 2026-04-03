const SUPABASE_URL = 'https://ysiminimhqyirufvlkvk.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_Pf2W5TClCGKBoFQKGOrW7Q_5rw_J0sP'; 
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY); 

const map = L.map('map', { zoomControl: false }).setView([16.15, 120.40], 13);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);

let selectedCoords = null;

// --- LOAD DATA ---
async function loadMemories() {
    const { data, error } = await supabaseClient.from('memories').select('*');
    if (!error) data.forEach(mem => renderMemoryMarker(mem));
}

function renderMemoryMarker(mem) {
    const glowIcon = L.divIcon({ 
        className: 'custom-icon', 
        html: `<div class="light-icon color-purple"></div>`, 
        iconSize: [12, 12] 
    });

    const popupHTML = `
        <div class="memory-card">
            <div class="memory-note">"${mem.message}"</div>
            <div class="reaction-row">
                <button class="reaction-btn" onclick="updateReact('${mem.id}', 'hug')">🫂 <span id="hug-${mem.id}">${mem.hug_count || 0}</span></button>
                <button class="reaction-btn" onclick="updateReact('${mem.id}', 'purpleheart')">💜 <span id="purpleheart-${mem.id}">${mem.purpleheart_count || 0}</span></button>
                <button class="reaction-btn" onclick="updateReact('${mem.id}', 'like')">👍 <span id="like-${mem.id}">${mem.like_count || 0}</span></button>
            </div>
            <div style="font-size: 10px; opacity: 0.4; text-align: center;">Click to react to this memory</div>
        </div>`;

    L.marker([mem.lat, mem.lng], { icon: glowIcon }).addTo(map).bindPopup(popupHTML);
}

// --- REACTIONS ---
window.updateReact = async (id, type) => {
    const el = document.getElementById(`${type}-${id}`);
    const count = parseInt(el.innerText) || 0;
    const { error } = await supabaseClient
        .from('memories')
        .update({ [`${type}_count`]: count + 1 })
        .eq('id', id);
    
    if (!error) el.innerText = count + 1;
};

// --- INTERACTION ---
map.on('click', (e) => {
    selectedCoords = e.latlng;
    document.getElementById('input-container').classList.remove('hidden');
});

document.getElementById('send-btn').addEventListener('click', async () => {
    const message = document.getElementById('memory-input').value;
    if (message && selectedCoords) {
        const { data, error } = await supabaseClient.from('memories').insert([{ 
            message, 
            lat: selectedCoords.lat, 
            lng: selectedCoords.lng, 
            color_class: 'color-purple' 
        }]).select();

        if (!error) { 
            renderMemoryMarker(data[0]); 
            document.getElementById('input-container').classList.add('hidden'); 
            document.getElementById('memory-input').value = "";
        }
    }
});

document.getElementById('cancel-btn').onclick = () => document.getElementById('input-container').classList.add('hidden');

loadMemories();
