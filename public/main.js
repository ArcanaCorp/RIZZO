// Detectar API_URL dinámicamente basado en el host actual
const API_URL = (() => {
    const protocol = window.location.protocol;
    const host = window.location.host;
    return `${protocol}//${host}/api`;
})();

function generateClientId() {
    const timestamp = Date.now(); // milisegundos
    const random = Math.random().toString(16).substring(2, 8); // 6 chars hex
    return `client_${timestamp}_${random}`;
}

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
                const hasQR = bot.session && bot.session.qrCode && !bot.isActive;
                
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
                        ${hasQR ? `
                            <div style="margin-top:15px; text-align:center; padding:15px; background:#f9f9f9; border-radius:6px;">
                                <div id="dashboard-qr-${bot.clientId}" style="display:inline-block;"></div>
                                <small style="display:block; margin-top:10px; color:#666;">Escanea este QR desde la app de WhatsApp</small>
                            </div>
                        ` : ''}
                    </div>
                `;
            });
        } else {
            html = '<div style="grid-column:1/-1; text-align:center; padding:40px; color:#999;"><p>No hay bots registrados</p></div>';
        }
        document.getElementById('botsStatus').innerHTML = html;

        // Renderizar QRs
        if (botsData.data && typeof QRCode !== 'undefined') {
            botsData.data.forEach(bot => {
                if (bot.session && bot.session.qrCode && !bot.isActive) {
                    const elDashboard = document.getElementById(`dashboard-qr-${bot.clientId}`);
                    if (elDashboard) {
                        elDashboard.innerHTML = '';
                        try {
                            new QRCode(elDashboard, { 
                                text: bot.session.qrCode, 
                                width: 180, 
                                height: 180,
                                colorDark: "#000000",
                                colorLight: "#ffffff"
                            });
                            console.log(`✅ QR renderizado en dashboard para ${bot.clientId}`);
                        } catch (err) {
                            console.error(`Error renderizando QR para ${bot.clientId}:`, err);
                        }
                    }
                }
            });
        }
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
    const clientId = generateClientId();
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
                const hasQR = bot.session && bot.session.qrCode && !bot.isActive;
                
                html += `
                    <div class="card" data-bot-id="${bot.clientId}">
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
                        ${hasQR ? `
                            <div data-qr-container="${bot.clientId}" style="margin-top:15px; text-align:center; padding:15px; background:#f9f9f9; border-radius:6px;">
                                <div id="bots-qr-${bot.clientId}" style="display:inline-block;"></div>
                                <small style="display:block; margin-top:10px; color:#666;">Escanea este QR desde la app de WhatsApp</small>
                            </div>
                        ` : ''}
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
            html = '<div style="grid-column:1/-1; text-align:center; padding:40px; color:#999;"><p>No hay bots</p></div>';
        }

        document.getElementById('botsControl').innerHTML = html;

        // Render QR areas for bots view
        if (botsData.data && typeof QRCode !== 'undefined') {
            botsData.data.forEach(bot => {
                if (bot.session && bot.session.qrCode && !bot.isActive) {
                    const el = document.getElementById(`bots-qr-${bot.clientId}`);
                    if (el) {
                        el.innerHTML = '';
                        try {
                            new QRCode(el, { 
                                text: bot.session.qrCode, 
                                width: 200, 
                                height: 200,
                                colorDark: "#000000",
                                colorLight: "#ffffff"
                            });
                            console.log(`✅ QR renderizado en bots para ${bot.clientId}`);
                        } catch (err) {
                            console.error(`Error renderizando QR para ${bot.clientId}:`, err);
                        }
                    }
                }
            });
        }
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
        console.log(data);
        if (data.success) {
            showAlert('botAlert', `✅ ${data.message}`, 'success');
            
            // Si hay QR en la respuesta, mostrarlo inmediatamente en el área dedicada
            if (data.data && data.data.qrCode) {
                console.log('✅ QR recibido en la respuesta inmediatamente');
                displayQRInSeparateArea(clientId, data.data.qrCode);
            }
            
            // Refrescar periódicamente por si el QR se genera después
            await refreshBotsImmediate();
        } else {
            showAlert('botAlert', `❌ Error: ${data.error}`, 'error');
        }
    } catch (error) {
        showAlert('botAlert', `❌ Error: ${error.message}`, 'error');
    }
}

// Función para mostrar el QR en el área dedicada (div#show-qr)
function displayQRInSeparateArea(clientId, qrCode) {
    const showQRContainer = document.getElementById('show-qr');
    if (!showQRContainer) {
        console.error('Contenedor show-qr no encontrado');
        return;
    }
    
    // Obtener el nombre del cliente
    const botCard = document.querySelector(`[data-bot-id="${clientId}"]`);
    let clientName = 'Cliente';
    if (botCard) {
        const nameElement = botCard.querySelector('.card-header h3');
        if (nameElement) {
            clientName = nameElement.textContent;
        }
    }
    
    // Limpiar el contenedor
    showQRContainer.innerHTML = '';
    
    // Crear la estructura del QR
    const qrDisplay = document.createElement('div');
    qrDisplay.style.cssText = `
        background: white;
        border: 2px solid #667eea;
        border-radius: 12px;
        padding: 30px;
        margin-top: 20px;
        text-align: center;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);
    `;
    
    // Agregar título
    const title = document.createElement('h3');
    title.textContent = `📱 QR para ${clientName}`;
    title.style.marginBottom = '20px';
    title.style.color = '#333';
    qrDisplay.appendChild(title);
    
    // Crear contenedor para el QR
    const qrContainer = document.createElement('div');
    qrContainer.id = `qr-display-${clientId}`;
    qrContainer.style.cssText = `
        display: inline-block;
        margin: 0 auto 20px;
    `;
    qrDisplay.appendChild(qrContainer);
    
    // Agregar instrucciones
    const instructions = document.createElement('div');
    instructions.style.cssText = `
        background: #f8f9fa;
        padding: 15px;
        border-radius: 8px;
        margin-top: 20px;
    `;
    instructions.innerHTML = `
        <p style="margin: 0; color: #666; font-size: 14px;">
            <strong>Instrucciones:</strong> Abre WhatsApp en tu teléfono y escanea este código QR para conectar el bot.
        </p>
    `;
    qrDisplay.appendChild(instructions);
    
    // Agregar botón para cerrar
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕ Cerrar QR';
    closeBtn.className = 'btn-warning';
    closeBtn.style.marginTop = '15px';
    closeBtn.onclick = () => {
        showQRContainer.innerHTML = '';
    };
    qrDisplay.appendChild(closeBtn);
    
    showQRContainer.appendChild(qrDisplay);
    
    // Renderizar el QR
    if (typeof QRCode !== 'undefined') {
        try {
            new QRCode(qrContainer, {
                text: qrCode,
                width: 250,
                height: 250,
                colorDark: "#000000",
                colorLight: "#ffffff"
            });
            console.log(`✅ QR renderizado en show-qr para ${clientId}`);
        } catch (err) {
            console.error(`Error renderizando QR para ${clientId}:`, err);
            qrContainer.innerHTML = '<p style="color:red;">Error al generar QR</p>';
        }
    } else {
        console.warn('QRCode library no cargada');
        qrContainer.innerHTML = '<p style="color:red;">Librería QRCode no disponible</p>';
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
