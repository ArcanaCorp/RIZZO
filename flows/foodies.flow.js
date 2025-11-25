import database from "../src/database.js";

function normalize(text) {
    return (text || "").toString().trim().toLowerCase();
}

function isNumeric(s) {
    return /^\d+$/.test(s);
}

export default async (text, msg, clientId) => {
    const t = normalize(text);
    const chatId = msg?.from || "unknown";

    // Load session & per-chat state
    const session = database.getSession(clientId) || {};
    const chats = session.chats || {};
    const chatState = chats[chatId] || { state: null, data: {} };

    // Helper to save chat state
    const saveChatState = (newState) => {
        const updatedChats = { ...chats, [chatId]: newState };
        database.updateSession(clientId, { chats: updatedChats });
    };

    // Multi-turn: if we asked for number of people
    if (chatState.state === "awaiting_people") {
        if (isNumeric(t)) {
            const people = parseInt(t, 10);
            saveChatState({ state: null, data: {} });
            return `✅ Reserva registrada para ${people} persona${people > 1 ? 's' : ''}. Pronto confirmaremos.`;
        }

        return "Por favor indica el número de personas (ej: 3).";
    }

    // Intents
    if (t.includes("hola") || t.includes("buenas") || t.includes("buenos")) {
        return "👋 ¡Bienvenido al restaurante!\n¿Quieres ver?\n1️⃣ Carta\n2️⃣ Promos\n3️⃣ Reservas\nEscribe 'ayuda' para opciones adicionales.";
    }

    if (t === "1" || t.includes("carta") || t.includes("menu")) {
        return "🍽️ Aquí tienes la carta:\nhttps://tusitio.com/carta";
    }

    if (t === "2" || t.includes("promo") || t.includes("promoc")) {
        return "🔥 Promociones de hoy:\n- 2x1 en pizzas\n- 20% en pastas\n¿Te interesa alguna? Responde con el número o escribe 'reservas' para reservar.";
    }

    if (t === "3" || t.includes("reserva") || t.includes("reservas") || t.includes("reservar")) {
        // Set state to awaiting_people for this chat
        saveChatState({ state: "awaiting_people", data: {} });
        return "Perfecto, ¿para cuántas personas será la reserva?";
    }

    if (t === "ayuda" || t === "help" || t === "opciones") {
        return "Comandos disponibles:\n- 'hola' - Saludo y menú\n- '1' o 'carta' - Ver carta\n- '2' o 'promos' - Promociones\n- '3' o 'reservas' - Iniciar reserva";
    }

    // Fallback with suggestion
    return "No entendí tu mensaje. Escribe 'ayuda' para ver las opciones disponibles.";
};