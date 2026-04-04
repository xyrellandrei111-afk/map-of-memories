const SUPABASE_URL = 'https://ysiminimhqyirufvlkvk.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_Pf2W5TClCGKBoFQKGOrW7Q_5rw_J0sP'; 
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY); 

const map = L.map('map', { zoomControl: false }).setView([16.15, 120.40], 13);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);

let selectedCoords = null;

// Search Setup
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('search-container');
    if (container) {
        const geocoder = L.Control.geocoder({ defaultMarkGeocode: false, placeholder: "Search a place..." })
            .on('markgeocode', e => { selectedCoords = e.geocode.center; map.setView(selectedCoords, 16); toggleModal('input-container', true); });
        container.appendChild(geocoder.onAdd(map));
    }
});

const toggleModal = (id, show) => {
    const el = document.getElementById(id);
    if(el) show ? el.classList.remove('hidden') : el.classList.add('hidden');
};

// --- CORE FUNCTIONS ---
window.addComment = async (id) => {
    const input = document.getElementById(`comment-in-${id}`);
    if (!input.value.trim()) return;
    const { error } = await supabaseClient.from('comments').insert([{ memory_id: id, content: input.value }]);
    if (!error) loadMemories();
};

window.reactToGlow = async (id, type, count) => {
    const update = {}; update[type] = count + 1;
    await supabaseClient.from('memories').update(update).eq('id', id);
    loadMemories();
};

window.deleteGlow = async (id) => {
    if (confirm("Delete this memory forever?")) {
        await supabaseClient.from('memories').delete().eq('id', id);
        let myGlows = JSON.parse(localStorage.getItem('my_glows') || "[]");
        localStorage.setItem('my_glows', JSON.stringify(myGlows.filter(g => g !== id)));
        location.reload();
    }
};

async function renderMemoryMarker(mem) {
    const glowIcon = L.divIcon({ className: 'custom-icon', html: `<div class="light-icon ${mem.color_class || 'glow-purple'}"></div>`, iconSize: [12, 12] });

    // Fetch Replies
    const { data: comments } = await supabaseClient.from('comments').select('content').eq('memory_id', mem.id);
    const commentHTML = (comments || []).map(c => `<div class="comment-item">✨ ${c.content}</div>`).join('');

    const isMine = JSON.parse(localStorage.getItem('my_glows') || "[]").includes(mem.id);

    const popupHTML = `
        <div style="min-width:200px; font-family:'Inter', sans-serif;">
            <div class="highlight-box">"${mem.message}"</div>
            <div class="comments-list">${commentHTML || '<span style="opacity:0.5">No whispers yet...</span>'}</div>
            <div class="comment-input-group">
                <input type="text" id="comment-in-${mem.id}" placeholder="Reply...">
                <button class="comment-btn" onclick="addComment('${mem.id}')">Add</button>
            </div>
            <div class="reaction-bar">
                <span onclick="reactToGlow('${mem.id}', 'hug_count', ${mem.hug_count || 0})">🫂 ${mem.hug_count || 0}</span>
                <span onclick="reactToGlow('${mem.id}', 'purpleheart_count', ${mem.purpleheart_count || 0})">💜 ${mem.purpleheart_count || 0}</span>
                <span onclick="reactToGlow('${mem.id}', 'like_count', ${mem.like_count || 0})">👍 ${mem.like_count || 0}</span>
            </div>
            ${isMine ? `<button class="delete-btn" onclick="deleteGlow('${mem.id}')">Remove my glow</button>` : ''}
        </div>`;

    L.marker([mem.lat, mem.lng], { icon: glowIcon }).addTo(map).bindPopup(popupHTML);
}

// User Actions
map.on('click', e => { selectedCoords = e.latlng; toggleModal('input-container', true); });

document.getElementById('send-btn').onclick = async () => {
    const msg = document.getElementById('memory-input').value;
    if (!msg || !selectedCoords) return;
    const { data, error } = await supabaseClient.from('memories').insert([{ 
        message: msg, lat: selectedCoords.lat, lng: selectedCoords.lng,
        color_class: Math.random() > 0.5 ? 'glow-purple' : 'glow-pink',
        hug_count: 0, purpleheart_count: 0, like_count: 0 
    }]).select();
    
    if(!error) { 
        let myGlows = JSON.parse(localStorage.getItem('my_glows') || "[]");
        myGlows.push(data[0].id);
        localStorage.setItem('my_glows', JSON.stringify(myGlows));
        location.reload(); 
    }
};

document.getElementById('how-btn').onclick = () => toggleModal('how-box', true);
document.getElementById('close-how').onclick = () => toggleModal('how-box', false);
document.getElementById('cancel-btn').onclick = () => toggleModal('input-container', false);

async function loadMemories() {
    map.eachLayer(l => { if (l instanceof L.Marker) map.removeLayer(l); });
    const { data } = await supabaseClient.from('memories').select('*');
    if (data) data.forEach(m => renderMemoryMarker(m));
}
loadMemories();
