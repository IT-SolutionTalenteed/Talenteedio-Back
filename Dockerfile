# Utilise Node.js 20 Alpine
FROM node:20-alpine

# Définit le répertoire de travail
WORKDIR /app

# Copie les fichiers de dépendances
COPY package*.json ./

# Installe les dépendances avec npm (ignore les conflits peer deps)
RUN npm install --legacy-peer-deps

# Expose le port 4000
EXPOSE 4000

# Démarre avec nodemon pour le hot reload
CMD ["sh", "-c", "npm install --legacy-peer-deps && npx nodemon"]
