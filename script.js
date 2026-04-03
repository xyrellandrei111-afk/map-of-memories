const SUPABASE_URL = 'https://ysiminimhqyirufvlkvk.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_Pf2W5TClCGKBoFQKGOrW7Q_5rw_J0sP'; 
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY); 

const map = L.map('map', { zoomControl: false }).setView([16.15, 120.40], 13);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);

let selectedCoords = null;
let currentUser = null;

// --- AUTH LOGIC ---
async function checkUser() {
    const { data } = await supabaseClient.auth.getUser();
    if (data.user) {
        currentUser = data.user;
        document.getElementById('auth-btn').innerText = "Sign Out";
        document.getElementById('auth-btn').onclick = handleSignOut;
    }
}

window.openAuth = () => document.getElementById('auth-container').classList.remove('hidden');
window.closeAuth = () => document.getElementById('auth-container').classList.add('hidden');

async function handleAuth(type) {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    
    const { data, error } = (type === 'signup') 
        ? await supabaseClient.auth.signUp({ email, password })
        : await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) alert(error.message);
    else {
        alert(type === 'signup' ? "Check email!" : "Welcome back!");
        location.reload();
    }
}

async function handleSignOut() {
    await supabaseClient.auth.signOut();
    location.reload();
}

// --- MEMORY LOGIC ---
async function loadMemories() {
    const { data, error } = await supabaseClient.from('memories').select('*');
    if (!error) data.forEach(mem => renderMemoryMarker(mem));
}

function renderMemoryMarker(mem) {
    const glowIcon = L.divIcon({ className: 'custom-icon', html: `<div class="light-icon ${mem.color_class}"></div>`, iconSize: [12, 12] });

    const popupHTML = `
        <div class="memory-card">
            <div class="memory-note">"${mem.message}"</div>
            <div class="reaction-row">
                <button class="reaction-btn" onclick="updateReact('${mem.id}', 'hug')">🫂 <span id="hug-${mem.id}">${mem.hug_count || 0}</span></button>
                <button class="reaction-btn" onclick="updateReact('${mem.id}', 'purpleheart')">💜 <span id="purpleheart-${mem.id}">${mem.purpleheart_count || 0}</span></button>
            </div>
            <div id="comments-${mem.id}"></div>
            <input type="text" placeholder="Add a thought..." onkeydown="if(event.key==='Enter') submitComment('${mem.id}', this.value)" style="font-size:12px;">
        </div>`;

    L.marker([mem.lat, mem.lng], { icon: glowIcon }).addTo(map).bindPopup(popupHTML);
}

// --- REACTIONS ---
window.updateReact = async (id, type) => {
    const el = document.getElementById(`${type}-${id}`);
    const count = parseInt(el.innerText) || 0;
    const { error } = await supabaseClient.from('memories').update({ [`${type}_count`]: count + 1 }).eq('id', id);
    if (!error) el.innerText = count + 1;
};

// --- POSTING ---
map.on('click', (e) => {
    if (!currentUser) return openAuth();
    selectedCoords = e.latlng;
    document.getElementById('input-container').classList.remove('hidden');
});

document.getElementById('send-btn').addEventListener('click', async () => {
    const message = document.getElementById('memory-input').value;
    if (message && selectedCoords) {
        const { data, error } = await supabaseClient.from('memories').insert([{ 
            message, lat: selectedCoords.lat, lng: selectedCoords.lng, color_class: 'color-purple' 
        }]).select();
        if (!error) { renderMemoryMarker(data[0]); document.getElementById('input-container').classList.add('hidden'); }
    }
});

document.getElementById('cancel-btn').onclick = () => document.getElementById('input-container').classList.add('hidden');

checkUser();
loadMemories();
