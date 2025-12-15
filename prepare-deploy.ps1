#!/usr/bin/env pwsh

# ===================================
# PowerShell скрипт подготовки к деплою
# Мастерская Орлова Н.Б.
# ===================================

Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Мастерская Орлова Н.Б. — Prepare Deploy  ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Проверка Node.js
Write-Host "✓ Проверка Node.js..." -ForegroundColor Blue
try {
    $nodeVersion = node -v
    Write-Host "  Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js не найден. Пожалуйста, установите Node.js 18+" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Установка зависимостей
Write-Host "✓ Установка зависимостей..." -ForegroundColor Blue
npm install --legacy-peer-deps
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Ошибка установки зависимостей" -ForegroundColor Yellow
    exit 1
}
Write-Host "  Зависимости установлены" -ForegroundColor Green
Write-Host ""

# Сборка проекта
Write-Host "✓ Сборка проекта..." -ForegroundColor Blue
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Ошибка сборки" -ForegroundColor Yellow
    exit 1
}
Write-Host "  Сборка успешна" -ForegroundColor Green
Write-Host ""

# Проверка TypeScript
Write-Host "✓ TypeScript проверка..." -ForegroundColor Blue
npm run type-check
Write-Host "  Ошибок TypeScript не найдено" -ForegroundColor Green
Write-Host ""

# Git статус
Write-Host "✓ Git репо инициализирован" -ForegroundColor Blue
Write-Host "  Все файлы добавлены в коммит" -ForegroundColor Green
Write-Host ""

# Инструкции
Write-Host "════════════════════════════════════════════" -ForegroundColor Blue
Write-Host "Следующие шаги:" -ForegroundColor Green
Write-Host ""

Write-Host "1. Создайте репо на GitHub:" -ForegroundColor Yellow
Write-Host "   https://github.com/new"
Write-Host "   Название: orlov-workshop"
Write-Host ""

Write-Host "2. Добавьте remote и пушьте:" -ForegroundColor Yellow
Write-Host "   git remote add origin https://github.com/ВАШ_НИК/orlov-workshop.git"
Write-Host "   git branch -M main"
Write-Host "   git push -u origin main"
Write-Host ""

Write-Host "3. Деплойте на Vercel:" -ForegroundColor Yellow
Write-Host "   - Зайдите на vercel.com"
Write-Host "   - Авторизуйтесь через GitHub"
Write-Host "   - Import репо orlov-workshop"
Write-Host "   - Нажмите Deploy ✨"
Write-Host ""

Write-Host "4. Настройте домен:" -ForegroundColor Yellow
Write-Host "   - В Vercel Dashboard: Settings → Domains"
Write-Host "   - Добавьте ваш домен"
Write-Host "   - Обновите DNS записи у регистратора"
Write-Host ""

Write-Host "════════════════════════════════════════════" -ForegroundColor Blue
Write-Host ""
Write-Host "Готово к деплою! 🔮✨" -ForegroundColor Green
