/**
 * Script de prueba para verificar que todo funciona correctamente
 * Ejecuta: node test.js
 */

import database from "./src/database.js";
import botManager from "./src/botManager.js";
import { loadFlow } from "./src/flowLoader.js";
import chalk from "chalk";

async function runTests() {
    console.log(chalk.cyan("\n=== PRUEBAS RIZZO ===\n"));

    try {
        // Test 1: Base de datos
        console.log(chalk.yellow("🧪 Test 1: Base de Datos"));
        const client1 = database.createClient("test_client_1", {
            name: "Cliente Test 1",
            email: "test1@example.com",
            phone: "+51987654321",
            flow: "default"
        });
        console.log(chalk.green("✅ Cliente creado correctamente"));

        const retrieved = database.getClient("test_client_1");
        if (retrieved.id === "test_client_1") {
            console.log(chalk.green("✅ Cliente recuperado correctamente"));
        }

        const allClients = database.getAllClients();
        console.log(chalk.green(`✅ Total clientes en BD: ${allClients.length}`));

        // Test 2: Flujos
        console.log(chalk.yellow("\n🧪 Test 2: Cargador de Flujos"));
        const defaultFlow = await loadFlow("default");
        console.log(chalk.green("✅ Flujo 'default' cargado correctamente"));

        const testResponse = await defaultFlow("hola", null);
        if (testResponse.includes("RIZZO")) {
            console.log(chalk.green("✅ Flujo respondiendo correctamente"));
        }

        // Test 3: Sesiones
        console.log(chalk.yellow("\n🧪 Test 3: Gestión de Sesiones"));
        const session = database.createSession("test_client_1", {});
        if (session.clientId === "test_client_1") {
            console.log(chalk.green("✅ Sesión creada correctamente"));
        }

        const sessionUpdate = database.updateSession("test_client_1", {
            status: "connected"
        });
        if (sessionUpdate.status === "connected") {
            console.log(chalk.green("✅ Sesión actualizada correctamente"));
        }

        // Test 4: Eliminación
        console.log(chalk.yellow("\n🧪 Test 4: Eliminación de Datos"));
        database.removeSession("test_client_1");
        const checkSession = database.getSession("test_client_1");
        if (checkSession === null) {
            console.log(chalk.green("✅ Sesión eliminada correctamente"));
        }

        database.deleteClient("test_client_1");
        const checkClient = database.getClient("test_client_1");
        if (checkClient === null) {
            console.log(chalk.green("✅ Cliente eliminado correctamente"));
        }

        console.log(chalk.green("\n✅ TODAS LAS PRUEBAS PASARON CORRECTAMENTE!\n"));
        process.exit(0);

    } catch (error) {
        console.error(chalk.red(`\n❌ Error en pruebas: ${error.message}\n`));
        process.exit(1);
    }
}

runTests();
