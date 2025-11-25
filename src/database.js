import fs from "fs-extra";
import path from "path";

const DB_FILE = "./data/database.json";

class Database {
    constructor() {
        this.ensureDataDir();
        this.loadDatabase();
    }

    ensureDataDir() {
        const dataDir = "./data";
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
    }

    loadDatabase() {
        if (fs.existsSync(DB_FILE)) {
            const data = fs.readFileSync(DB_FILE, "utf-8");
            this.data = JSON.parse(data);
            // Sanitizar sesiones cargadas para eliminar referencias no serializables
            if (this.data.sessions) {
                for (const id of Object.keys(this.data.sessions)) {
                    const s = this.data.sessions[id];
                    if (s && typeof s === 'object') {
                        // Eliminar cualquier posible campo 'botInstance' que no deba existir
                        if (s.botInstance) {
                            delete s.botInstance;
                            s.botConnected = true;
                        } else {
                            s.botConnected = s.botConnected || false;
                        }
                    }
                }
                // Guardar cambios si hubo limpieza
                this.save();
            }
        } else {
            this.data = {
                clients: {},
                flows: {},
                sessions: {}
            };
            this.save();
        }
    }

    save() {
        fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    }

    // Clientes
    createClient(clientId, clientData) {
        this.data.clients[clientId] = {
            id: clientId,
            name: clientData.name,
            email: clientData.email,
            phone: clientData.phone,
            flow: clientData.flow || "default",
            status: "inactive",
            createdAt: new Date().toISOString(),
            config: clientData.config || {}
        };
        this.save();
        return this.data.clients[clientId];
    }

    getClient(clientId) {
        return this.data.clients[clientId] || null;
    }

    getAllClients() {
        return Object.values(this.data.clients);
    }

    updateClient(clientId, updates) {
        if (this.data.clients[clientId]) {
            this.data.clients[clientId] = {
                ...this.data.clients[clientId],
                ...updates
            };
            this.save();
            return this.data.clients[clientId];
        }
        return null;
    }

    deleteClient(clientId) {
        delete this.data.clients[clientId];
        this.save();
    }

    // Sesiones activas
    createSession(clientId, sessionData) {
        this.data.sessions[clientId] = {
            clientId,
            status: sessionData.status || "active",
            botConnected: sessionData.botConnected || false,
            qrCode: sessionData.qrCode || null,
            startedAt: sessionData.startedAt || new Date().toISOString(),
            lastActivity: new Date().toISOString()
        };
        this.save();
        return this.data.sessions[clientId];
    }

    getSession(clientId) {
        return this.data.sessions[clientId] || null;
    }

    updateSession(clientId, updates) {
        if (this.data.sessions[clientId]) {
            this.data.sessions[clientId] = {
                ...this.data.sessions[clientId],
                ...updates,
                lastActivity: new Date().toISOString()
            };
            this.save();
            return this.data.sessions[clientId];
        }
        return null;
    }

    removeSession(clientId) {
        delete this.data.sessions[clientId];
        this.save();
    }

    // Flujos
    getFlowByName(flowName) {
        return this.data.flows[flowName] || null;
    }

    getAllFlows() {
        return Object.values(this.data.flows);
    }
}

export default new Database();
