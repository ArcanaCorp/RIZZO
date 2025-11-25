import pkg from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import chalk from "chalk";
import { loadFlow } from "./flowLoader.js";
import { logMessage } from "./logger.js";

const { Client, LocalAuth } = pkg;

export async function createBot({ clientName, clientPath, config }) {
  
    const client = new Client({
        authStrategy: new LocalAuth({
            clientId: clientName,
            dataPath: clientPath,
        }),
        puppeteer: {
            headless: true,
            args: ["--no-sandbox"],
        }
    });

    const flow = await loadFlow(config.flow || "default");

    client.on("qr", qr => {
        console.log(chalk.yellow(`\n🔐 Escanea este QR para: ${clientName}`));
        qrcode.generate(qr, { small: true });
    });

    client.on("ready", () => {
        console.log(chalk.green(`\n🤖 Bot listo para cliente: ${clientName}\n`));
    });

    client.on("message", async msg => {
        const from = msg.from;
        const text = msg.body;

        logMessage(clientName, from, text);

        const response = await flow(text, msg);

        if (response) {
            client.sendMessage(from, response);
        }
    });

    client.initialize();
}