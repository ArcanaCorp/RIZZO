import database from "../src/database.js";

function normalize(text) {
    return (text || "").toString().trim().toLowerCase();
}

// Simple date validation (dd/mm/yyyy or yyyy-mm-dd)
function looksLikeDate(s) {
    return /^(\d{2}\/\d{2}\/\d{4})$/.test(s) || /^(\d{4}-\d{2}-\d{2})$/.test(s);
}

export default async (text, msg, clientId) => {
    const t = normalize(text);
    const chatId = msg?.from || "unknown";

    // Load session & per-chat state
    const session = database.getSession(clientId) || {};
    const chats = session.chats || {};
    const chatState = chats[chatId] || { state: null, data: {} };

    const saveChatState = (newState) => {
        const updatedChats = { ...chats, [chatId]: newState };
        database.updateSession(clientId, { chats: updatedChats });
    };

    // Multi-turn: awaiting date for reservation
    if (chatState.state === "awaiting_date") {
        if (looksLikeDate(t)) {
            saveChatState({ state: null, data: {} });
            return `✅ Reserva registrada para la fecha ${t}. Te enviaremos confirmación.`;
        }
        return "Por favor indica la fecha en formato DD/MM/YYYY o YYYY-MM-DD.";
    }

    if (t.includes("hola") || t.includes("buenas")) {
        return "🏨 ¡Bienvenido al Hotel!\nOpciones:\n1️⃣ Habitaciones\n2️⃣ Precios\n3️⃣ Reservas\nEscribe 'ayuda' para más opciones.";
    }

    if (t === "1" || t.includes("habitac")) {
        return "🛏️ Habitaciones disponibles:\n- Simple\n- Doble\n- Suite";
    }

    if (t === "2" || t.includes("precio")) {
        return "💵 Precios por noche:\nSimple S/80\nDoble S/120\nSuite S/200";
    }

    if (t === "3" || t.includes("reserva") || t.includes("reservas") || t.includes("reservar")) {
        saveChatState({ state: "awaiting_date", data: {} });
        return "🗓️ Perfecto, ¿para qué fecha desea reservar? (DD/MM/YYYY o YYYY-MM-DD)";
    }

    if (t === "ayuda" || t === "help") {
        return "Comandos:\n- '1' Habitaciones\n- '2' Precios\n- '3' Reservas\n- 'ayuda' para ver comandos";
    }

    return "No entendí tu mensaje. Escribe 'ayuda' para ver las opciones disponibles.";
};