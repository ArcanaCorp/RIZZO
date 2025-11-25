import chalk from "chalk";

export async function loadFlow(flowName) {
    try {
        const module = await import(`../flows/${flowName}.flow.js`);
        const flow = module.default || module;
        console.log(chalk.green(`✅ Flujo '${flowName}' cargado correctamente`));
        return flow;
    } catch (error) {
        console.warn(chalk.yellow(`⚠️ No se encontró el flujo '${flowName}', usando 'default'`));
        try {
            const module = await import(`../flows/default.flow.js`);
            return module.default || module;
        } catch (fallbackError) {
            console.error(chalk.red(`❌ Error crítico: No se puede cargar ni 'default'`), fallbackError);
            throw fallbackError;
        }
    }
}