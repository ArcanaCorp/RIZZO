import express from "express";
import chalk from "chalk";
import path from "path";
import { fileURLToPath } from "url";
import database from "./src/database.js";
import botManager from "./src/botManager.js";
import apiRoutes from "./src/api.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Rutas API
app.use("/api", apiRoutes);

// Ruta raíz
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// API Info
app.get("/api/info", (req, res) => {
    res.json({
        name: "RIZZO - WhatsApp Bot Manager",
        version: "2.0.0",
        description: "Plataforma para gestionar múltiples bots de WhatsApp"
    });
});

// Iniciar servidor
app.listen(PORT, "0.0.0.0", () => {
    console.log(chalk.green(`\n🚀 Servidor RIZZO iniciado en puerto ${PORT}`));
    console.log(chalk.cyan(`📍 URL: http://localhost:${PORT}`));
    console.log(chalk.cyan(`📊 Panel: http://localhost:${PORT}`));
    console.log(chalk.cyan(`📚 API: http://localhost:${PORT}/api\n`));
});

// Graceful shutdown
process.on("SIGINT", async () => {
    console.log(chalk.yellow("\n📴 Deteniendo servidor...\n"));
    await botManager.stopAllBots();
    process.exit(0);
});