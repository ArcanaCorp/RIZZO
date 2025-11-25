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

# Crear directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias de Node
RUN npm ci --only=production

# Copiar el resto de la aplicación
COPY . .

# Crear directorio de datos
RUN mkdir -p /app/data

# Usar dumb-init para manejar señales correctamente
ENTRYPOINT ["/usr/sbin/dumb-init", "--"]

# Iniciar la aplicación
CMD ["npm", "start"]

# Exponer puerto
EXPOSE 8080
