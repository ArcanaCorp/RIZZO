#!/usr/bin/env node

/**
 * Script de ejemplo para usar la plataforma RIZZO
 * Ejecuta: node examples.js
 */

const API_URL = "http://localhost:3000/api";

async function apiCall(method, endpoint, data = null) {
    const options = {
        method,
        headers: { "Content-Type": "application/json" }
    };

    if (data) options.body = JSON.stringify(data);

    const response = await fetch(`${API_URL}${endpoint}`, options);
    return response.json();
}

async function main() {
    console.log("\n=== EJEMPLOS DE USO RIZZO ===\n");

    try {
        // 1. Crear cliente
        console.log("1️⃣ Creando cliente...");
        const clientRes = await apiCall("POST", "/clients", {
            clientId: "restaurante_central",
            name: "Restaurante Central",
            email: "admin@central.com",
            phone: "+51987654321",
            flow: "foodies"
        });
        console.log("✅ Cliente creado:", clientRes.data?.id);

        // 2. Obtener todos los clientes
        console.log("\n2️⃣ Listando clientes...");
        const clientsRes = await apiCall("GET", "/clients");
        console.log("✅ Total clientes:", clientsRes.data?.length);

        // 3. Obtener cliente específico
        console.log("\n3️⃣ Obteniendo detalles del cliente...");
        const clientDetailRes = await apiCall("GET", "/clients/restaurante_central");
        console.log("✅ Cliente:", clientDetailRes.data?.name);

        // 4. Iniciar bot
        console.log("\n4️⃣ Iniciando bot...");
        console.log("⏳ Esperando conexión...");
        const startRes = await apiCall("POST", "/bots/restaurante_central/start");
        console.log("✅ Bot iniciado:", startRes.message);
        console.log("📱 Escanea el QR en la consola del servidor");

        // 5. Obtener estado del bot
        console.log("\n5️⃣ Verificando estado del bot...");
        await new Promise(resolve => setTimeout(resolve, 3000)); // Esperar 3 segundos
        const statusRes = await apiCall("GET", "/bots/restaurante_central/status");
        console.log("✅ Estado del bot:", statusRes.data?.isActive ? "Activo" : "Inactivo");

        // 6. Obtener todos los bots
        console.log("\n6️⃣ Listando todos los bots...");
        const allBotsRes = await apiCall("GET", "/bots/status/all");
        console.log("✅ Bots registrados:", allBotsRes.data?.length);
        allBotsRes.data?.forEach(bot => {
            console.log(`   - ${bot.clientName}: ${bot.isActive ? "🟢 Activo" : "🔴 Inactivo"}`);
        });

        // 7. Cambiar flujo
        console.log("\n7️⃣ Cambiando flujo del cliente...");
        const flowRes = await apiCall("POST", "/clients/restaurante_central/flow", {
            flowName: "hotel"
        });
        console.log("✅ Flujo cambiado a:", flowRes.data?.flow);

        // 8. Obtener flujos disponibles
        console.log("\n8️⃣ Listando flujos disponibles...");
        const flowsRes = await apiCall("GET", "/flows");
        console.log("✅ Flujos disponibles:");
        flowsRes.data?.forEach(flow => {
            console.log(`   - ${flow.name}: ${flow.description}`);
        });

        // 9. Estado de salud
        console.log("\n9️⃣ Verificando salud del API...");
        const healthRes = await apiCall("GET", "/health");
        console.log("✅ API Status:", healthRes.status);

        // 10. Detener bot
        console.log("\n🔟 Deteniendo bot...");
        const stopRes = await apiCall("POST", "/bots/restaurante_central/stop");
        console.log("✅ Bot detenido:", stopRes.message);

        // 11. Eliminar cliente
        console.log("\n1️⃣1️⃣ Eliminando cliente...");
        const deleteRes = await apiCall("DELETE", "/clients/restaurante_central");
        console.log("✅ Cliente eliminado:", deleteRes.message);

        console.log("\n✅ Todos los ejemplos completados correctamente!\n");

    } catch (error) {
        console.error("❌ Error:", error.message);
        console.log("\n⚠️ Asegúrate de que el servidor está ejecutándose en http://localhost:3000");
        console.log("Ejecuta: npm start");
    }
}

main();
