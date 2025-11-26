import pkg from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import chalk from "chalk";
import path from "path";
import database from "./database.js";
import { loadFlow } from "./flowloader.js";
import { logMessage } from "./logger.js";

const { Client, LocalAuth } = pkg;

class BotManager {
    constructor() {
        this.bots = {}; // Almacena todas las instancias de bots por clientId
    }

    async createBotForClient(clientId) {
        if (this.bots[clientId]) {
            console.log(chalk.yellow(`⚠️  Bot ya existe para cliente: ${clientId}`));
            return this.bots[clientId];
        }

        const client = await database.getClient(clientId);
        if (!client) {
            throw new Error(`Cliente no encontrado: ${clientId}`);
        }

        const clientPath = `./clients/${clientId}`;
        const flow = await loadFlow(client.flow || "default");

        const botClient = new Client({
            authStrategy: new LocalAuth({
                clientId: clientId,
                dataPath: clientPath,
            }),
            puppeteer: {
                headless: true,
                args: [
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-gpu"
                ]
            }
        });

        // Crear sesión inicial con metadatos serializables (NO guardar la instancia Client)
        database.createSession(clientId, {
            status: "starting",
            qrCode: null,
            botConnected: false,
            startedAt: new Date().toISOString()
        });

        // Promesa para esperar el QR
        let qrPromiseResolve;
        const qrPromise = new Promise(resolve => {
            qrPromiseResolve = resolve;
        });

        // Evento: QR Code
        botClient.on("qr", qr => {
            console.log(chalk.yellow(`\n🔐 QR Code generado para cliente: ${clientId}`));
            
            // En desarrollo, mostrar en terminal
            if (process.env.NODE_ENV !== 'production') {
                qrcode.generate(qr, { small: true });
            }
            
            // Guardar QR en la sesión para que se muestre en la UI
            database.updateSession(clientId, { qrCode: qr });
            console.log(chalk.cyan(`📱 Escanea el QR desde el dashboard: http://localhost:8080`));
            
            // Resolver la promesa con el QR
            qrPromiseResolve(qr);
        });

        // Evento: Bot listo
        botClient.on("ready", () => {
            console.log(chalk.green(`\n🤖 Bot conectado para cliente: ${clientId}`));
            database.updateClient(clientId, { status: "active" });
            // Guardar solo metadatos serializables; nunca la instancia Client
            database.updateSession(clientId, {
                status: "connected",
                botConnected: true,
                lastActivity: new Date().toISOString()
            });
        });

        // Evento: Mensaje recibido
        botClient.on("message", async msg => {
            try {
                const from = msg.from; // ID del chat que envió el mensaje
                const text = msg.body;
                const chatId = msg.from; // Asegurar que se responde al mismo chat

                logMessage(clientId, from, text);

                const response = await flow(text, msg, clientId);

                if (response) {
                    // Enviar respuesta SOLO al chat que envió el mensaje
                    await botClient.sendMessage(chatId, response);
                    console.log(chalk.green(`✅ Respuesta enviada a ${chatId} (Cliente: ${clientId})`));
                }
            } catch (error) {
                console.error(chalk.red(`❌ Error procesando mensaje para ${clientId}:`), error);
            }
        });

        // Evento: Desconexión
        botClient.on("disconnected", () => {
            console.log(chalk.red(`\n❌ Bot desconectado: ${clientId}`));
            database.updateClient(clientId, { status: "inactive" });
            database.updateSession(clientId, { status: "disconnected", botConnected: false });
            delete this.bots[clientId];
        });

        // Evento: Error
        botClient.on("error", error => {
            console.error(chalk.red(`❌ Error en bot ${clientId}:`), error);
        });

        // Inicializar cliente - esto dispara el evento 'qr'
        try {
            await botClient.initialize();
        } catch (error) {
            console.error(chalk.red(`❌ Error inicializando bot ${clientId}:`), error.message);
            throw error;
        }

        // Guardar en memoria (instancia en memoria SOLO)
        this.bots[clientId] = botClient;

        // Actualizar sesión para reflejar que la instancia está en memoria
        database.updateSession(clientId, { botConnected: true, lastActivity: new Date().toISOString() });

        console.log(chalk.green(`✅ Bot creado para cliente: ${clientId}`));
        
        // Retornar objeto con la instancia del bot y la promesa para esperar el QR
        // La promesa se resolverá cuando se genere el código QR
        return { botClient, qrPromise };
    }

    async stopBot(clientId) {
        if (this.bots[clientId]) {
            try {
                console.log(chalk.yellow(`⏹️  Deteniendo bot para cliente: ${clientId}`));
                
                // Dar tiempo para que se cierren conexiones
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Destruir el cliente
                await this.bots[clientId].destroy();
                
                // Dar más tiempo después de destroy
                await new Promise(resolve => setTimeout(resolve, 500));
                
                delete this.bots[clientId];
                database.removeSession(clientId);
                database.updateClient(clientId, { status: "inactive" });
                console.log(chalk.yellow(`⏹️  Bot detenido para cliente: ${clientId}`));
                return true;
            } catch (error) {
                console.error(chalk.red(`Error deteniendo bot ${clientId}:`), error.message);
                // Intentar eliminar de todas formas
                delete this.bots[clientId];
                database.removeSession(clientId);
                database.updateClient(clientId, { status: "inactive" });
                return false;
            }
        }
        return false;
    }

    getBot(clientId) {
        return this.bots[clientId] || null;
    }

    getAllActiveBots() {
        return Object.keys(this.bots);
    }

    async stopAllBots() {
        for (const clientId of Object.keys(this.bots)) {
            await this.stopBot(clientId);
        }
    }
}

export default new BotManager();
