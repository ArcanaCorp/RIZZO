export default async (text, msg, clientId) => {
    const t = (text || "").toString().toLowerCase();

    if (t.includes("hola") || t.includes("buenas")) {
        return "👋 Hola, soy RIZZO! ¿En qué puedo ayudarte? Escribe 'ayuda' para opciones.";
    }

    if (t === "ayuda" || t === "help") {
        return "Comandos:\n- 'hola' - Saludo\n- Escribe tu pregunta y te ayudaré.";
    }

    return "No entendí tu mensaje. Escribe 'ayuda' para ver las opciones disponibles.";
};