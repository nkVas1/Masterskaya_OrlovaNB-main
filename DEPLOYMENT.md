# Инструкция по развертыванию сайта Мастерская Орлова Н.Б.

## Содержание
1. [Локальная разработка](#локальная-разработка)
2. [GitHub](#github)
3. [Vercel Deploy](#vercel-deploy)
4. [Настройка домена](#настройка-домена)
5. [Добавление изображений](#добавление-изображений)

---

## Локальная разработка

### Требования
- Node.js 18+ (скачать с [nodejs.org](https://nodejs.org))
- Git
- Любой текстовый редактор (VS Code рекомендуется)

### Установка

1. **Скачиваем проект**
```bash
git clone https://github.com/ВАШ_НИК/orlov-workshop.git
cd orlov-workshop
```

2. **Устанавливаем зависимости**
```bash
npm install
```

3. **Запускаем сервер разработки**
```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

### Полезные команды

```bash
# Сборка для production
npm run build

# Старт production версии
npm start

# Проверка TypeScript ошибок
npm run type-check

# ESLint проверка
npm run lint
```

---

## GitHub

### 1. Создание репозитория

1. Зайдите на [github.com](https://github.com)
2. Нажмите **+ New repository**
3. Заполните форму:
   - **Repository name:** `orlov-workshop`
   - **Description:** "Мастерская Орлова Н.Б. - сайт магических зеркал"
   - **Public** (чтобы Vercel мог доступ получить)
4. Нажмите **Create repository**

### 2. Первый коммит

В терминале проекта:

```bash
git init
git add .
git commit -m "Initial commit: Мастерская Орлова Н.Б. сайт"
git branch -M main
git remote add origin https://github.com/ВАШ_НИК/orlov-workshop.git
git push -u origin main
```

Где `ВАШ_НИК` — ваш GitHub ник.

### 3. Последующие обновления

```bash
# Добавить изменения
git add .

# Создать коммит
git commit -m "описание изменений"

# Загрузить на GitHub
git push
```

---

## Vercel Deploy

### Вариант 1: Через GitHub (рекомендуется)

#### Первый деплой:

1. Откройте [vercel.com](https://vercel.com)
2. Нажмите **Sign up** и авторизуйтесь через GitHub
3. После авторизации нажмите **Add New...** → **Project**
4. Выберите репозиторий `orlov-workshop`
5. Нажмите **Import**
6. **Framework Preset:** Next.js выберется автоматически
7. Остальное оставьте по умолчанию
8. Нажмите **Deploy** ✨

Дождитесь завершения (обычно 2-3 минуты). Вы получите ссылку вида `orlov-workshop.vercel.app`.

#### Последующие деплои:

После каждого `git push` на main ветку, Vercel автоматически пересоберет и задеплоит сайт.

Вы можете отслеживать статус в [Vercel Dashboard](https://vercel.com/dashboard).

### Вариант 2: Через Vercel CLI

```bash
# Установка (один раз)
npm install -g vercel

# Деплой
vercel

# Следуйте инструкциям в терминале
```

---

## Настройка домена

### Покупка домена

Рекомендуемые регистраторы:
- [Namecheap](https://www.namecheap.com)
- [GoDaddy](https://www.godaddy.com)
- [Google Domains](https://domains.google)
- [1&1](https://www.1and1.com)

**Рекомендуемые домены:**
- `orlov-magic.ru` (~400₽/год)
- `master-orlov.com` (~$8/год)
- `zerkalo-orlov.ru` (~400₽/год)

### Подключение к Vercel

1. В [Vercel Dashboard](https://vercel.com/dashboard) откройте проект `orlov-workshop`
2. Перейдите в **Settings** → **Domains**
3. Нажмите **Add**
4. Введите ваш домен (например, `orlov-magic.ru`)
5. Следуйте инструкциям по настройке DNS

**Для .ru домена:**
- Используйте NS записи, которые дает Vercel
- В панели регистратора домена обновите nameservers на:
  - `ns-382.awsdns-47.com`
  - `ns-1633.awsdns-21.co.uk`
  - `ns-1012.awsdns-61.net`
  - `ns-550.awsdns-04.org`

Ожидание активации: 24-48 часов.

---

## Добавление изображений

### 1. Генерация изображений

Используйте Flux или Midjourney с готовыми промптами:

**Hero Image (1920x1080):**
> Cinematic medium shot, hyper-realistic photo of a 79-year-old Russian hermit craftsman named Nikolai, with a long grey beard and deep wrinkles, kind but mysterious eyes. He is sitting in a dark, wooden village hut, carving a rune into a wooden mirror frame. Illumination comes from a single warm candle flame on the table, creating strong chiaroscuro shadows.

**Product Mirror (1080x1350):**
> Product photography of a handmade round wall mirror with a thick, gnarly wooden frame resembling tree roots. Embedded in the wood are small amethyst crystals and beeswax candles attached to the sides. The mirror surface reflects a dim, mysterious forest. Dark background, studio lighting with a mystical purple rim light.

**Workshop Interior (1920x1080):**
> Wide interior shot of an old Slavic wooden workshop hut in Pskov region. Shelves filled with dried herbs, glass jars, unfinished wooden crafts, and many candles. A workbench in the center with tools. Outside the window is a snowy twilight forest.

### 2. Загрузка в проект

1. Сохраните изображения в `public/images/`
2. Отредактируйте `src/app/page.tsx`
3. Замените плейсхолдеры на реальные пути:

```jsx
// Было:
<div className="w-full h-full bg-[url('https://images.unsplash.com/...')] ... />

// Стало:
import Image from 'next/image';

<Image 
  src="/images/master-portrait.jpg" 
  alt="Мастер Николай Орлов"
  width={1920}
  height={1080}
/>
```

### 3. Оптимизация изображений

Next.js автоматически оптимизирует изображения через `next/image`, но убедитесь:
- Изображения сжаты (до 2-3MB)
- Формат WebP будет использован для современных браузеров

---

## Проверочный список перед продакшеном

- [ ] Установлены все зависимости (`npm install`)
- [ ] Локально работает (`npm run dev`)
- [ ] Собирается без ошибок (`npm run build`)
- [ ] GitHub репо создан и синхронизирован
- [ ] Vercel проект создан и развернут
- [ ] Домен куплен и подключен
- [ ] DNS обновлены и активны (проверить через ping)
- [ ] Все изображения загружены в `public/images/`
- [ ] Meta-теги проверены в `src/app/layout.tsx`
- [ ] 404 страница не показывает ошибок (опционально)
- [ ] Mobile версия протестирована
- [ ] Форма отправки писем подключена (опционально)

---

## Полезные ссылки

- [Next.js Документация](https://nextjs.org/docs)
- [Vercel Guide](https://vercel.com/docs)
- [GitHub Docs](https://docs.github.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

**Готово!** Ваш сайт "Мастерская Орлова Н.Б." теперь доступен во всем мире. ✨🔮
