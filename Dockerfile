FROM node:22 as builder

# Builder: instalar dependencias de frontend y generar build (Vite)
WORKDIR /build
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci
COPY frontend ./frontend
RUN cd frontend && npm run build

FROM node:22-alpine

# Instalar dependencias del sistema necesarias para Puppeteer/Chromium
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    dumb-init

# Establecer variables de entorno para Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# Copiar package.json y lock e instalar dependencias de producción
COPY package*.json ./
RUN npm ci --only=production

# Copiar la aplicación
COPY . .

# Copiar build del frontend desde la etapa builder a la carpeta pública
COPY --from=builder /build/frontend/dist /app/public

# Crear directorio de datos
RUN mkdir -p /app/data

# Usar dumb-init para manejar señales correctamente
ENTRYPOINT ["/usr/sbin/dumb-init", "--"]

# Iniciar la aplicación
CMD ["npm", "start"]

# Exponer puerto
EXPOSE 8080
