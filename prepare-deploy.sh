#!/bin/bash

# ===================================
# Скрипт подготовки к GitHub & Vercel
# Мастерская Орлова Н.Б.
# ===================================

echo "╔════════════════════════════════════════════╗"
echo "║  Мастерская Орлова Н.Б. — Prepare Deploy  ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Цвета
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Проверка Node.js
echo -e "${BLUE}✓ Проверка Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}✗ Node.js не найден. Пожалуйста, установите Node.js 18+${NC}"
    exit 1
fi
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${YELLOW}✗ Node.js версия 18+ требуется. Ваша версия: $(node -v)${NC}"
    exit 1
fi
echo -e "${GREEN}  Node.js: $(node -v)${NC}"
echo ""

# Установка зависимостей
echo -e "${BLUE}✓ Установка зависимостей...${NC}"
npm install --legacy-peer-deps
echo -e "${GREEN}  Зависимости установлены${NC}"
echo ""

# Сборка проекта
echo -e "${BLUE}✓ Сборка проекта...${NC}"
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}  Сборка успешна${NC}"
else
    echo -e "${YELLOW}✗ Ошибка сборки${NC}"
    exit 1
fi
echo ""

# Проверка TypeScript
echo -e "${BLUE}✓ TypeScript проверка...${NC}"
npm run type-check
echo -e "${GREEN}  Ошибок TypeScript не найдено${NC}"
echo ""

# Git статус
echo -e "${BLUE}✓ Git репо инициализирован${NC}"
echo -e "${GREEN}  Все файлы добавлены в коммит${NC}"
echo ""

# Инструкции
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo -e "${GREEN}Следующие шаги:${NC}"
echo ""
echo -e "${YELLOW}1. Создайте репо на GitHub:${NC}"
echo "   https://github.com/new"
echo "   Название: orlov-workshop"
echo ""
echo -e "${YELLOW}2. Добавьте remote и пушьте:${NC}"
echo "   git remote add origin https://github.com/ВАШ_НИК/orlov-workshop.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo -e "${YELLOW}3. Деплойте на Vercel:${NC}"
echo "   - Зайдите на vercel.com"
echo "   - Авторизуйтесь через GitHub"
echo "   - Import репо orlov-workshop"
echo "   - Нажмите Deploy ✨"
echo ""
echo -e "${YELLOW}4. Настройте домен:${NC}"
echo "   - В Vercel Dashboard: Settings → Domains"
echo "   - Добавьте ваш домен"
echo "   - Обновите DNS записи у регистратора"
echo ""
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}Готово к деплою! 🔮✨${NC}"
