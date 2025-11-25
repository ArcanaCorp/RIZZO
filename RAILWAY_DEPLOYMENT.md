# 🚀 RIZZO - Deployment en Railway

## Requisitos previos
- Cuenta en [Railway.app](https://railway.app)
- Git configurado localmente
- Repositorio sincronizado con GitHub

## Pasos de deployment

### 1. Conectar Railway a tu repositorio
```bash
# Desde la carpeta del proyecto
railway login
railway link
```

### 2. Configurar variables de entorno en Railway
En el dashboard de Railway, ve a tu proyecto y configura:

```
ENVIRONMENT=production
NODE_ENV=production
PORT=8080
DATA_PATH=./data
URL_API_PRODUCTION=https://your-railway-app.up.railway.app/api
URL_API_DEVELPMENT=http://localhost:3000/api
```

### 3. Hacer push para desplegar
```bash
git add .
git commit -m "Deploy: Production setup"
git push origin main
```

Railway automáticamente:
- Detectará el Dockerfile
- Construirá la imagen Docker
- Instalará las dependencias del sistema para Puppeteer
- Desplegará la aplicación

### 4. Verificar logs
```bash
railway logs
```

Busca el mensaje: `🚀 Servidor RIZZO iniciado en puerto 8080`

## Características en producción

✅ **QR en pantalla**: El código QR se muestra automáticamente en el dashboard web
✅ **Chromium incluido**: Dockerfile instala todas las dependencias necesarias
✅ **Almacenamiento persistente**: Los datos se guardan en volúmenes de Railway
✅ **Auto-reinicio**: Si falla, Railway reinicia automáticamente

## Troubleshooting

### Error: "Failed to launch the browser process!"
- Railway usará Chromium del sistema Alpine Linux
- Asegúrate de que el Dockerfile está actualizado

### El QR no aparece en el dashboard
- Verifica que el cliente esté iniciando correctamente
- Revisa los logs de Railway: `railway logs`
- Abre el dashboard en `https://your-railway-app.up.railway.app`

### Base de datos corrupta
- Los datos se guardan en `/app/data/database.json`
- Para reiniciar, elimina el volumen en Railway

## URLs útiles
- 🌐 Dashboard: `https://your-railway-app.up.railway.app`
- 📡 API: `https://your-railway-app.up.railway.app/api`
- 📋 API Info: `https://your-railway-app.up.railway.app/api/info`

## Monitoreo
Railway proporciona:
- 📊 Métricas de CPU/RAM
- 📝 Logs en tiempo real
- 🔄 Historial de deployments
- ⚡ Auto-scaling (plan pagado)
