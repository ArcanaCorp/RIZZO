import fs from "fs-extra";

export function logMessage(clientName, from, text) {
    const logLine = `[${new Date().toISOString()}] ${from}: ${text}\n`;
    fs.appendFile(`./clients/${clientName}/messages.log`, logLine);
}