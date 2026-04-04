const SUPABASE_URL = 'https://ysiminimhqyirufvlkvk.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_Pf2W5TClCGKBoFQKGOrW7Q_5rw_J0sP'; 
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY); 

const map = L.map('map', { zoomControl: false }).setView([16.15, 120.40], 13);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);

let selectedCoords = null;

// --- ADD COMMENT LOGIC ---
window.addComment = async (memoryId) => {
    const input = document.getElementById(`comment-in-${memoryId}`);
    const text = input.value.trim();
    if (!text) return;

    const { error } = await supabaseClient
        .from('comments')
        .insert([{ memory_id: memoryId, content: text }]);

    if (!error) {
        loadMemories(); // Refresh to show the new comment
    } else {
        alert("Could not add comment. Check if you created the 'comments' table!");
    }
};

// --- REACTION LOGIC ---
window.reactToGlow = async (id, type, currentCount) => {
    const updateData = {};
    updateData[type] = currentCount + 1;
    await supabaseClient.from('memories').update(updateData).eq('id', id);
    loadMemories(); 
};

async function renderMemoryMarker(mem) {
    const color = mem.color_class || 'glow-purple';
    const glowIcon = L.divIcon({ 
        className: 'custom-icon', 
        html: `<div class="light-icon ${color}"></div>`, 
        iconSize: [12, 12] 
    });

    // Fetch comments for this specific memory
    const { data: comments } = await supabaseClient
        .from('comments')
        .select('content')
        .eq('memory_id', mem.id);

    const commentHTML = (comments || []).map(c => `<div class="comment-item">• ${c.content}</div>`).join('');

    const myGlows = JSON.parse(localStorage.getItem('my_glows') || "[]");
    const isMine = myGlows.includes(mem.id);

    const popupHTML = `
        <div style="color:#222; text-align:center; min-width:180px; font-family: sans-serif;">
            <div class="popup-comment"><b>"${mem.message}"</b></div>
            
            <div class="comments-list">
                ${commentHTML || '<span style="color:#999">No comments yet...</span>'}
            </div>

            <div class="comment-input-group">
                <input type="text" id="comment-in-${mem.id}" placeholder="Reply...">
                <button class="comment-btn" onclick="addComment('${mem.id}')">Add</button>
            </div>
            
            <div style="display:flex; justify-content:space-around; font-size:13px; border-top:1px solid #eee; padding-top:8px; margin-top:8px;">
                <span style="cursor:pointer" onclick="reactToGlow('${mem.id}', 'hug_count', ${mem.hug_count || 0})">🫂 ${mem.hug_count || 0}</span>
                <span style="cursor:pointer" onclick="reactToGlow('${mem.id}', 'purpleheart_count', ${mem.purpleheart_count || 0})">💜 ${mem.purpleheart_count || 0}</span>
                <span style="cursor:pointer" onclick="reactToGlow('${mem.id}', 'like_count', ${mem.like_count || 0})">👍 ${mem.like_count || 0}</span>
            </div>
            
            ${isMine ? `<button class="delete-btn" onclick="deleteGlow('${mem.id}')">Delete my glow</button>` : ''}
        </div>`;

    L.marker([mem.lat, mem.lng], { icon: glowIcon }).addTo(map).bindPopup(popupHTML);
}

// ... (Keep your existing search, delete, and loadMemories functions here) ...

async function loadMemories() {
    map.eachLayer((layer) => { if (layer instanceof L.Marker) map.removeLayer(layer); });
    const { data, error } = await supabaseClient.from('memories').select('*');
    if (!error) {
        for (const mem of data) {
            await renderMemoryMarker(mem);
        }
    }
}
loadMemories();
