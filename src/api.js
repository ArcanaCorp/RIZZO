import express from "express";
import chalk from "chalk";
import database from "./database.js";
import botManager from "./botManager.js";
import { loadFlow } from "./flowloader.js";

const router = express.Router();

// Sanitizar sesión para evitar serializar objetos no serializables (ej. instancia Client)
function sanitizeSession(session) {
    if (!session) return null;
    const { botInstance, client, ...rest } = session;
    // devolver sólo campos serializables, pero preservar qrCode
    return {
        ...rest,
        qrCode: session.qrCode || null  // Asegurar que qrCode se incluya
    };
}

// ==================== CLIENTES ====================

// Obtener todos los clientes
router.get("/clients", (req, res) => {
    const clients = database.getAllClients();
    res.json({
        success: true,
        data: clients
    });
});

// Obtener cliente específico
router.get("/clients/:clientId", (req, res) => {
    const { clientId } = req.params;
    const client = database.getClient(clientId);

    if (!client) {
        return res.status(404).json({
            success: false,
            error: "Cliente no encontrado"
        });
    }

    const session = database.getSession(clientId);
    const sessionSan = sanitizeSession(session);
    res.json({
        success: true,
        data: { ...client, session: sessionSan }
    });
});

// Crear nuevo cliente
router.post("/clients", async (req, res) => {
    try {
        const { clientId, name, email, phone, flow, config } = req.body;

        if (!clientId || !name || !email || !phone) {
            return res.status(400).json({
                success: false,
                error: "Faltan campos requeridos: clientId, name, email, phone"
            });
        }

        if (database.getClient(clientId)) {
            return res.status(409).json({
                success: false,
                error: "El cliente ya existe"
            });
        }

        const client = database.createClient(clientId, {
            name,
            email,
            phone,
            flow: flow || "default",
            config: config || {}
        });

        res.status(201).json({
            success: true,
            data: client,
            message: "Cliente creado exitosamente"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Actualizar cliente
router.put("/clients/:clientId", (req, res) => {
    try {
        const { clientId } = req.params;
        const { name, email, phone, flow, config } = req.body;

        const client = database.getClient(clientId);
        if (!client) {
            return res.status(404).json({
                success: false,
                error: "Cliente no encontrado"
            });
        }

        const updates = {};
        if (name) updates.name = name;
        if (email) updates.email = email;
        if (phone) updates.phone = phone;
        if (flow) updates.flow = flow;
        if (config) updates.config = { ...client.config, ...config };

        const updated = database.updateClient(clientId, updates);

        res.json({
            success: true,
            data: updated,
            message: "Cliente actualizado exitosamente"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Eliminar cliente
router.delete("/clients/:clientId", async (req, res) => {
    try {
        const { clientId } = req.params;

        const client = database.getClient(clientId);
        if (!client) {
            return res.status(404).json({
                success: false,
                error: "Cliente no encontrado"
            });
        }

        // Detener bot si está activo
        await botManager.stopBot(clientId);

        database.deleteClient(clientId);

        res.json({
            success: true,
            message: "Cliente eliminado exitosamente"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ==================== BOTS ====================

// Iniciar bot para un cliente
router.post("/bots/:clientId/start", async (req, res) => {
    try {
        const { clientId } = req.params;

        const client = database.getClient(clientId);
        if (!client) {
            return res.status(404).json({
                success: false,
                error: "Cliente no encontrado"
            });
        }

        if (botManager.getBot(clientId)) {
            return res.status(409).json({
                success: false,
                error: "El bot ya está activo para este cliente"
            });
        }

        let result;
        try {
            result = await botManager.createBotForClient(clientId);
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: `Error al crear bot: ${error.message}`
            });
        }

        const { botClient, qrPromise } = result;

        // Esperar el QR con un timeout de 30 segundos (más tiempo para que WhatsApp genere el QR)
        let qrCode = null;
        try {
            qrCode = await Promise.race([
                qrPromise,
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error("Timeout esperando QR")), 30000)
                )
            ]);
            console.log(chalk.green(`✅ QR obtenido para ${clientId}`));
        } catch (timeoutError) {
            console.log(chalk.yellow(`⚠️  QR no generado en tiempo límite para ${clientId}. Continuando...`));
            // No rechazamos, continuamos sin QR
        }

        res.json({
            success: true,
            message: `Bot iniciado para cliente: ${clientId}`,
            data: {
                clientId,
                status: "initializing",
                qrCode: qrCode || null
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Detener bot para un cliente
router.post("/bots/:clientId/stop", async (req, res) => {
    try {
        const { clientId } = req.params;

        const success = await botManager.stopBot(clientId);

        if (!success) {
            return res.status(404).json({
                success: false,
                error: "Bot no encontrado o ya estaba detenido"
            });
        }

        res.json({
            success: true,
            message: `Bot detenido para cliente: ${clientId}`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Obtener estado del bot
router.get("/bots/:clientId/status", (req, res) => {
    const { clientId } = req.params;

    const client = database.getClient(clientId);
    if (!client) {
        return res.status(404).json({
            success: false,
            error: "Cliente no encontrado"
        });
    }

    const session = database.getSession(clientId);
    const bot = botManager.getBot(clientId);
    const sessionSan = sanitizeSession(session);

    res.json({
        success: true,
        data: {
            clientId,
            clientName: client.name,
            status: client.status,
            isActive: bot !== null,
            session: sessionSan || null
        }
    });
});

// Obtener todos los bots activos
router.get("/bots/status/all", (req, res) => {
    const activeBots = botManager.getAllActiveBots();
    const allClients = database.getAllClients();

    const botsStatus = allClients.map(client => {
        const session = database.getSession(client.id);
        return {
            clientId: client.id,
            clientName: client.name,
            isActive: activeBots.includes(client.id),
            flow: client.flow,
            session: sanitizeSession(session) || null
        };
    });

    res.json({
        success: true,
        data: botsStatus
    });
});

// ==================== FLUJOS ====================

// Obtener flujos disponibles
router.get("/flows", (req, res) => {
    // Los flujos se cargan desde archivos .flow.js
    const flows = [
        { name: "default", description: "Flujo por defecto" },
        { name: "foodies", description: "Flujo para restaurantes" },
        { name: "hotel", description: "Flujo para hoteles" }
    ];

    res.json({
        success: true,
        data: flows
    });
});

// Cambiar flujo de un cliente
router.post("/clients/:clientId/flow", (req, res) => {
    try {
        const { clientId } = req.params;
        const { flowName } = req.body;

        if (!flowName) {
            return res.status(400).json({
                success: false,
                error: "flowName es requerido"
            });
        }

        const client = database.getClient(clientId);
        if (!client) {
            return res.status(404).json({
                success: false,
                error: "Cliente no encontrado"
            });
        }

        const updated = database.updateClient(clientId, { flow: flowName });

        res.json({
            success: true,
            data: updated,
            message: `Flujo cambiado a: ${flowName}`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ==================== SALUD ====================

router.get("/health", (req, res) => {
    res.json({
        success: true,
        status: "API operativa",
        timestamp: new Date().toISOString()
    });
});

export default router;
