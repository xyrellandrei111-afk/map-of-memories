const SUPABASE_URL = 'https://ysiminimhqyirufvlkvk.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_Pf2W5TClCGKBoFQKGOrW7Q_5rw_J0sP'; 
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY); 

const map = L.map('map', { zoomControl: false }).setView([16.15, 120.40], 13);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);

let selectedCoords = null;

const toggleModal = (id, show) => {
    const el = document.getElementById(id);
    if(el) show ? el.classList.remove('hidden') : el.classList.add('hidden');
};

document.getElementById('how-btn').onclick = () => toggleModal('how-box', true);
document.getElementById('close-how').onclick = () => toggleModal('how-box', false);
document.getElementById('suggestion-toggle').onclick = () => toggleModal('suggestion-box', true);
document.getElementById('close-suggestion').onclick = () => toggleModal('suggestion-box', false);

async function loadMemories() {
    const { data, error } = await supabaseClient.from('memories').select('*');
    if (!error) data.forEach(mem => renderMemoryMarker(mem));
}

function renderMemoryMarker(mem) {
    const glowIcon = L.divIcon({ 
        className: 'custom-icon', 
        html: `<div class="light-icon"></div>`, 
        iconSize: [14, 14] 
    });

    const popupHTML = `
        <div class="memory-card">
            <div class="memory-note">"${mem.message}"</div>
            <div class="reaction-row">
                <button class="reaction-btn" onclick="updateReact('${mem.id}', 'hug')">🫂 <span id="hug-${mem.id}">${mem.hug_count || 0}</span></button>
                <button class="reaction-btn" onclick="updateReact('${mem.id}', 'purpleheart')">💜 <span id="purpleheart-${mem.id}">${mem.purpleheart_count || 0}</span></button>
            </div>
        </div>`;

    L.marker([mem.lat, mem.lng], { icon: glowIcon }).addTo(map).bindPopup(popupHTML);
}

window.updateReact = async (id, type) => {
    const el = document.getElementById(`${type}-${id}`);
    const count = parseInt(el.innerText) || 0;
    const { error } = await supabaseClient.from('memories').update({ [`${type}_count`]: count + 1 }).eq('id', id);
    if (!error) el.innerText = count + 1;
};

map.on('click', (e) => {
    selectedCoords = e.latlng;
    toggleModal('input-container', true);
});

document.getElementById('send-btn').onclick = async () => {
    const message = document.getElementById('memory-input').value;
    if (message && selectedCoords) {
        // This object sends EVERYTHING your DB is asking for
        const { data, error } = await supabaseClient.from('memories').insert([{ 
            message: message, 
            lat: selectedCoords.lat, 
            lng: selectedCoords.lng,
            color_class: 'color-purple',
            hug_count: 0,
            purpleheart_count: 0,
            like_count: 0 
        }]).select();
        
        if (error) {
            console.error("Post Error:", error.message);
            alert("Database Error: " + error.message);
        } else { 
            renderMemoryMarker(data[0]); 
            toggleModal('input-container', false);
            document.getElementById('memory-input').value = "";
        }
    }
};

document.getElementById('cancel-btn').onclick = () => toggleModal('input-container', false);

loadMemories();
