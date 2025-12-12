#!/bin/bash

echo "🚀 Iniciando Deploy Limpo do ZapCar..."

# 1. Parar processos antigos (se houver, tenta matar node)
echo "🛑 Parando processos antigos..."
pkill -f node || true

# 2. Atualizar código
echo "⬇️ Baixando código mais recente..."
git fetch --all
git reset --hard origin/main

# 3. Limpeza e Instalação do Backend
echo "🧹 Limpando backend (removendo node_modules antigos)..."
cd backend
rm -rf node_modules package-lock.json dist .wwebjs_auth .baileys_auth

echo "📦 Instalando dependências novas (Leves)..."
npm install

echo "🔨 Construindo projeto..."
npm run build

# 4. Iniciar Servidor Otimizado
echo "✅ Iniciando servidor em modo PRODUÇÃO..."
# Usa nohup para rodar em background mesmo se fechar o terminal
nohup npm run start:prod > app.log 2>&1 &

echo "🎉 Concluído! O servidor está rodando em background."
echo "📝 Você pode ver os logs com: tail -f backend/app.log"
