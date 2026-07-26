#!/bin/bash
# Instala as dependências se elas não existirem (útil para build local)
# No Render, o ideal é usar o comando de build separado
npm install
node "ARQUIVOS DO BOT/index.js"
