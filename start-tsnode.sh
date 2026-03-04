#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 18.17

cd /home/talenteedio/sites/Talenteed-Back

# Lancer le serveur compilé
node dist/index.js