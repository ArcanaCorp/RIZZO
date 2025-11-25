// Detectar API_URL dinámicamente basado en el host actual
const API_URL = (() => {
    const protocol = window.location.protocol;
    const host = window.location.host;
    return `${protocol}//${host}/api`;
})();

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');

    if (tabName === 'dashboard') loadDashboard();
    if (tabName === 'clients') loadClients();
    if (tabName === 'bots') loadBots();
}

async function loadDashboard() {
    try {
        const clientsRes = await fetch(`${API_URL}/clients`);
        const clientsData = await clientsRes.json();
        const totalClients = clientsData.data ? clientsData.data.length : 0;

        const botsRes = await fetch(`${API_URL}/bots/status/all`);
        const botsData = await botsRes.json();
        const activeBots = botsData.data ? botsData.data.filter(b => b.isActive).length : 0;

        document.getElementById('totalClients').textContent = totalClients;
        document.getElementById('activeBots').textContent = activeBots;

        // Mostrar bots activos
        let html = '';
        if (botsData.data && botsData.data.length > 0) {
            botsData.data.forEach(bot => {
                const statusClass = bot.isActive ? 'status-active' : 'status-inactive';
                const statusText = bot.isActive ? 'Activo' : 'Inactivo';
                html += `
                    <div class="card">
                        <div class="card-header">
                            <h3>${bot.clientName}</h3>
                            <span class="status-badge ${statusClass}">${statusText}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">ID:</span>
                            <span class="info-value">${bot.clientId}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Flujo:</span>
                            <span class="info-value">${bot.flow || 'default'}</span>
                        </div>
                        ${bot.session && bot.session.qrCode && !bot.isActive ?
                            `<div style="margin-top:10px;text-align:center;">
                                <div id="dashboard-qr-${bot.clientId}"></div>
                                <small>Escanea este QR desde la app de WhatsApp</small>
                            </div>` : ''
                        }
                    </div>
                `;
            });
        } else {
            html = '<div class="empty-state"><p>No hay bots registrados</p></div>';
        }
        document.getElementById('botsStatus').innerHTML = html;

        // Renderizar QRs si existen
        try {
            if (botsData.data) {
                botsData.data.forEach(bot => {
                    if (bot.session && bot.session.qrCode && !bot.isActive) {
                        const elDashboard = document.getElementById(`dashboard-qr-${bot.clientId}`);
                        if (elDashboard && typeof QRCode === 'function') {
                            // limpiar contenido previo
                            elDashboard.innerHTML = '';
                            new QRCode(elDashboard, { 
                                text: bot.session.qrCode, 
                                width: 180, 
                                height: 180,
                                colorDark: "#000000",
                                colorLight: "#ffffff"
                            });
                            console.log(`✅ QR renderizado en dashboard para ${bot.clientId}`);
                        }
                    }
                });
            }
        } catch (e) { console.error('QR render error en dashboard:', e); }
    } catch (error) {
        console.error('Error cargando dashboard:', error);
    }
}

async function loadClients() {
    try {
        const res = await fetch(`${API_URL}/clients`);
        const data = await res.json();
        let html = '';

        if (data.data && data.data.length > 0) {
            data.data.forEach(client => {
                const statusClass = client.status === 'active' ? 'status-active' : 'status-inactive';
                html += `
                    <div class="card">
                        <div class="card-header">
                            <h3>${client.name}</h3>
                            <span class="status-badge ${statusClass}">${client.status === 'active' ? 'Activo' : 'Inactivo'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">ID:</span>
                            <span class="info-value">${client.id}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Email:</span>
                            <span class="info-value">${client.email}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Teléfono:</span>
                            <span class="info-value">${client.phone}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Flujo:</span>
                            <span class="info-value">${client.flow}</span>
                        </div>
                        <div class="action-buttons">
                            <button class="btn-warning" onclick="editClient('${client.id}')">Editar</button>
                            <button class="btn-danger" onclick="deleteClient('${client.id}')">Eliminar</button>
                        </div>
                    </div>
                `;
            });
        } else {
            html = '<div class="empty-state"><h3>Sin clientes</h3><p>Crea tu primer cliente para empezar</p></div>';
        }

        document.getElementById('clientsList').innerHTML = html;
    } catch (error) {
        console.error('Error cargando clientes:', error);
    }
}

async function createClient() {
    const clientId = document.getElementById('clientId').value;
    const name = document.getElementById('clientName').value;
    const email = document.getElementById('clientEmail').value;
    const phone = document.getElementById('clientPhone').value;
    const flow = document.getElementById('clientFlow').value;

    if (!clientId || !name || !email || !phone) {
        showAlert('clientAlert', 'Por favor completa todos los campos', 'error');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/clients`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId, name, email, phone, flow })
        });

        const data = await res.json();

        if (data.success) {
            showAlert('clientAlert', '✅ Cliente creado exitosamente', 'success');
            document.getElementById('clientForm').reset();
            setTimeout(loadClients, 1500);
        } else {
            showAlert('clientAlert', `❌ Error: ${data.error}`, 'error');
        }
    } catch (error) {
        showAlert('clientAlert', `❌ Error: ${error.message}`, 'error');
    }
}

async function deleteClient(clientId) {
    if (!confirm(`¿Estás seguro de que quieres eliminar el cliente ${clientId}?`)) return;

    try {
        const res = await fetch(`${API_URL}/clients/${clientId}`, { method: 'DELETE' });
        const data = await res.json();

        if (data.success) {
            showAlert('clientAlert', '✅ Cliente eliminado exitosamente', 'success');
            setTimeout(loadClients, 1500);
        } else {
            showAlert('clientAlert', `❌ Error: ${data.error}`, 'error');
        }
    } catch (error) {
        showAlert('clientAlert', `❌ Error: ${error.message}`, 'error');
    }
}

async function loadBots() {
    try {
        // Cargar clientes para el selector
        const clientsRes = await fetch(`${API_URL}/clients`);
        const clientsData = await clientsRes.json();
        let selectHtml = '<option value="">-- Seleccionar cliente --</option>';
        if (clientsData.data) {
            clientsData.data.forEach(client => {
                selectHtml += `<option value="${client.id}">${client.name} (${client.id})</option>`;
            });
        }
        document.getElementById('botClientSelect').innerHTML = selectHtml;

        // Cargar bots activos
        const botsRes = await fetch(`${API_URL}/bots/status/all`);
        const botsData = await botsRes.json();
        let html = '';

        if (botsData.data && botsData.data.length > 0) {
            botsData.data.forEach(bot => {
                const statusClass = bot.isActive ? 'status-active' : 'status-inactive';
                const statusText = bot.isActive ? 'Activo' : 'Inactivo';
                html += `
                    <div class="card">
                        <div class="card-header">
                            <h3>${bot.clientName}</h3>
                            <span class="status-badge ${statusClass}">${statusText}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Cliente ID:</span>
                            <span class="info-value">${bot.clientId}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Flujo:</span>
                            <span class="info-value">${bot.flow}</span>
                        </div>
                        ${bot.session && bot.session.qrCode && !bot.isActive ?
                            `<div style="margin-top:10px;text-align:center;">
                                <div id="bots-qr-${bot.clientId}"></div>
                                <small>Escanea este QR desde la app de WhatsApp</small>
                            </div>` : ''
                        }
                        <div class="action-buttons">
                            ${bot.isActive ? 
                                `<button class="btn-danger" onclick="stopBot('${bot.clientId}')">Detener Bot</button>` :
                                `<button class="btn-success" onclick="startBotFromList('${bot.clientId}')">Iniciar Bot</button>`
                            }
                        </div>
                    </div>
                `;
            });
        } else {
            html = '<div class="empty-state"><p>No hay bots</p></div>';
        }

        document.getElementById('botsControl').innerHTML = html;

        // Render QR areas for bots view
        try {
            if (botsData.data) {
                botsData.data.forEach(bot => {
                    if (bot.session && bot.session.qrCode && !bot.isActive) {
                        const el = document.getElementById(`bots-qr-${bot.clientId}`);
                        if (el && typeof QRCode === 'function') {
                            el.innerHTML = '';
                            new QRCode(el, { 
                                text: bot.session.qrCode, 
                                width: 200, 
                                height: 200,
                                colorDark: "#000000",
                                colorLight: "#ffffff"
                            });
                            console.log(`✅ QR renderizado en bots para ${bot.clientId}`);
                        }
                    }
                });
            }
        } catch (e) { console.error('QR render error en bots:', e); }
    } catch (error) {
        console.error('Error cargando bots:', error);
    }
}

// Refrescar bots periódicamente para capturar QR si se genera
let botsRefreshInterval = null;
function startBotsAutoRefresh() {
    if (botsRefreshInterval) return;
    botsRefreshInterval = setInterval(() => {
        const activeTab = document.querySelector('.tab-button.active')?.textContent || '';
        if (activeTab.includes('Bots') || activeTab.includes('Dashboard')) {
            loadDashboard();
            loadBots();
        }
    }, 1000); // Refrescar cada 1 segundo para capturar QR rápidamente
}
startBotsAutoRefresh();

// Función para refrescar inmediatamente cuando se inicia un bot
async function refreshBotsImmediate() {
    // Refrescar 5 veces en 5 segundos (cada 1 segundo) para capturar QR
    for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const activeTab = document.querySelector('.tab-button.active')?.textContent || '';
        if (activeTab.includes('Bots') || activeTab.includes('Dashboard')) {
            loadDashboard();
            loadBots();
        }
    }
}

async function startBot() {
    const clientId = document.getElementById('botClientSelect').value;
    if (!clientId) {
        showAlert('botAlert', 'Por favor selecciona un cliente', 'error');
        return;
    }
    await startBotFromList(clientId);
}

async function startBotFromList(clientId) {
    try {
        const res = await fetch(`${API_URL}/bots/${clientId}/start`, { method: 'POST' });
        const data = await res.json();

        if (data.success) {
            showAlert('botAlert', `✅ ${data.message}. El QR aparecerá en la pantalla...`, 'success');
            // Refrescar inmediatamente para capturar el QR
            await refreshBotsImmediate();
        } else {
            showAlert('botAlert', `❌ Error: ${data.error}`, 'error');
        }
    } catch (error) {
        showAlert('botAlert', `❌ Error: ${error.message}`, 'error');
    }
}

async function stopBot(clientId) {
    try {
        const res = await fetch(`${API_URL}/bots/${clientId}/stop`, { method: 'POST' });
        const data = await res.json();

        if (data.success) {
            showAlert('botAlert', `✅ ${data.message}`, 'success');
            setTimeout(loadBots, 1500);
        } else {
            showAlert('botAlert', `❌ Error: ${data.error}`, 'error');
        }
    } catch (error) {
        showAlert('botAlert', `❌ Error: ${error.message}`, 'error');
    }
}

function showAlert(elementId, message, type) {
    const alert = document.getElementById(elementId);
    alert.textContent = message;
    alert.className = `alert alert-${type}`;
    alert.style.display = 'block';
    setTimeout(() => { alert.style.display = 'none'; }, 5000);
}

// Cargar dashboard al iniciar
loadDashboard();
