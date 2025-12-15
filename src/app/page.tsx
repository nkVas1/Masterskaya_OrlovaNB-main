import dynamic from "next/dynamic";
import Section from "@/components/Section";
import Button from "@/components/Button";
import { ArrowDown, Sparkles, MapPin, Mail, Phone } from "lucide-react";

// Динамический импорт Canvas компонента без SSR (только клиент)
const MagicCandleScene = dynamic(() => import("@/components/MagicCandle"), {
  ssr: false,
  loading: () => <div className="h-[80vh] w-full bg-gradient-to-b from-void to-mystic" />,
});

// Данные каталога
const products = [
  {
    id: 1,
    title: "Зеркало «Око Леса»",
    price: "45 000 ₽",
    desc: "Зеркало в оправе из мореного дуба, найденного на болотах Пскова. Инкрустация аметистом.",
    tags: ["Защита", "Ясновидение"],
  },
  {
    id: 2,
    title: "Алтарь «Дыхание Севра»",
    price: "32 000 ₽",
    desc: "Малый переносной алтарь с руническим ставом на удачу. Ручная резьба, воск.",
    tags: ["Удача", "Ритуал"],
  },
  {
    id: 3,
    title: "Зеркало «Черное Солнце»",
    price: "78 000 ₽",
    desc: "Черное зеркало для гаданий. Рама покрыта сусальным золотом и заговоренным воском.",
    tags: ["Мистика", "Эксклюзив"],
  },
  {
    id: 4,
    title: "Амулет «Защита Дома»",
    price: "18 000 ₽",
    desc: "Деревянный амулет с древними славянскими рунами, освященный на алтаре мастера.",
    tags: ["Защита", "Амулет"],
  },
  {
    id: 5,
    title: "Зеркало «Туман Рассвета»",
    price: "56 000 ₽",
    desc: "Овальное зеркало в раме из белого дуба с инкрустацией горного хрусталя. Для медитации.",
    tags: ["Медитация", "Ясность"],
  },
  {
    id: 6,
    title: "Свеча Ритуальная",
    price: "8 500 ₽",
    desc: "Восковые свечи, изготовленные в полнолуние с добавлением трав и магических масел.",
    tags: ["Ритуал", "Магия"],
  },
];

const craftProcess = [
  {
    title: "Поиск материала",
    desc: "Выбор дерева по интуиции, часто это деревья с многовековой историей из леса.",
  },
  {
    title: "Резьба и работа",
    desc: "Ручная резьба рун и узоров, каждый мазок содержит намерение мастера.",
  },
  {
    title: "Магический заговор",
    desc: "Прочтение древних слов для активации артефакта и наполнения его силой.",
  },
  {
    title: "Упаковка и отправка",
    desc: "Предмет упаковывается в пергамент и отправляется в духовном состоянии готовности.",
  },
];

export default function Home() {
  return (
    <main className="relative min-h-screen flex flex-col items-center w-full">
      {/* --- HERO SECTION --- */}
      <section className="relative h-screen w-full flex flex-col justify-center items-center text-center overflow-hidden">
        <MagicCandleScene />

        <div className="z-10 mt-[45vh] p-4 relative pointer-events-none space-y-8">
          <div className="space-y-4">
            <h2 className="text-gold tracking-[0.2em] text-sm md:text-base mb-4 uppercase opacity-80 font-sans">
              Псковская область • Ручная работа • Магия
            </h2>
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-parchment leading-tight drop-shadow-2xl">
              Мастерская <br /> <span className="italic text-copper">Орлова Н.Б.</span>
            </h1>
          </div>
          <p className="max-w-xl mx-auto text-gray-400 text-lg md:text-xl font-light font-sans leading-relaxed">
            Зеркала, в которых живет душа. Сакральные предметы интерьера, созданные руками старого мастера в глухой деревне.
          </p>
        </div>

        <div className="absolute bottom-10 animate-bounce opacity-50">
          <ArrowDown className="w-8 h-8 text-gold" />
        </div>
      </section>

      {/* --- ABOUT SECTION --- */}
      <Section id="about" className="grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6 order-2 md:order-1">
          <div className="flex items-center gap-2 text-gold">
            <Sparkles size={20} />
            <span className="uppercase tracking-widest text-sm font-sans">О Мастере</span>
          </div>
          <h2 className="font-serif text-4xl md:text-5xl text-parchment">
            79 лет жизни. <br /> Полвека в ремесле.
          </h2>
          <div className="space-y-4 text-gray-300 font-light text-lg leading-relaxed">
            <p>
              Меня зовут Николай Борисович. Я живу в старом доме на краю псковского леса, где тишина звенит громче колоколов. Всю свою жизнь я работал руками, чувствуя тепло дерева и холод металла.
            </p>
            <p>
              Сейчас, на закате лет, я решил открыть двери своей мастерской миру. Каждое зеркало, которое я создаю — это не просто предмет интерьера. Это портал, оберег, молчаливый свидетель вашей жизни. В них я вкладываю рунические формулы и частичку своей души.
            </p>
            <p className="text-copper italic border-l-2 border-copper pl-4">
              «Я делаю вещи, которые будут жить дольше меня. Это мое наследие.»
            </p>
          </div>
        </div>

        {/* Placeholder для фото мастера */}
        <div className="relative h-[500px] w-full bg-mystic rounded-sm overflow-hidden border border-white/10 group order-1 md:order-2">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
          <div
            className="w-full h-full bg-cover bg-center sepia-[.5] brightness-50 group-hover:scale-105 transition-transform duration-700 ease-out grayscale hover:grayscale-0"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1544468266-6a8948003cd5?q=80&w=2074&auto=format&fit=crop')",
            }}
          />
          <div className="absolute bottom-6 left-6 z-20">
            <p className="text-gold font-serif text-2xl">Николай Орлов</p>
            <p className="text-sm text-gray-400">Мастер, Эзотерик</p>
          </div>
        </div>
      </Section>

      {/* --- CATALOG SECTION --- */}
      <Section id="catalog" className="w-full">
        <div className="text-center mb-16">
          <span className="text-gold uppercase tracking-widest text-sm block mb-2 font-sans">
            Альманах Работ
          </span>
          <h2 className="font-serif text-4xl md:text-6xl text-parchment">
            Избранные Артефакты
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((item) => (
            <div
              key={item.id}
              className="group relative bg-mystic/40 border border-white/5 hover:border-gold/30 transition-all duration-500 overflow-hidden"
            >
              {/* Image Placeholder */}
              <div className="h-80 w-full bg-black relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                <div className="absolute inset-0 bg-gold/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20 mix-blend-overlay" />

                <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-neutral-700 font-serif text-sm">
                  [Артефакт {item.id}]
                </div>
              </div>

              <div className="p-6 relative z-30 -mt-12">
                <div className="flex flex-wrap gap-2 mb-3">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] uppercase tracking-wider text-gold border border-gold/20 px-2 py-1 rounded-full font-sans"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="text-2xl font-serif text-parchment mb-2 group-hover:text-gold transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                  {item.desc}
                </p>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
                  <span className="text-xl font-serif text-copper">
                    {item.price}
                  </span>
                  <button className="text-xs uppercase tracking-widest text-white hover:text-gold transition-colors font-sans">
                    Подробнее →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* --- PROCESS SECTION --- */}
      <Section id="process" className="w-full">
        <div className="text-center mb-16">
          <span className="text-gold uppercase tracking-widest text-sm block mb-2 font-sans">
            Путь Создания
          </span>
          <h2 className="font-serif text-4xl md:text-6xl text-parchment">
            Как Рождается Магия
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {craftProcess.map((step, idx) => (
            <div
              key={idx}
              className="relative p-6 border border-gold/20 bg-gold/5 hover:bg-gold/10 transition-all duration-500 group"
            >
              <div className="absolute -top-4 -left-4 w-8 h-8 bg-gold text-black rounded-full flex items-center justify-center font-serif font-bold text-sm group-hover:scale-110 transition-transform">
                {idx + 1}
              </div>
              <h3 className="text-xl font-serif text-gold mb-3 mt-2">
                {step.title}
              </h3>
              <p className="text-gray-400 font-light leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* --- CONTACT SECTION --- */}
      <Section id="contact" className="w-full max-w-2xl mb-20">
        <div className="border border-gold/20 p-8 md:p-12 bg-mystic/20 backdrop-blur-sm relative">
          {/* Декоративные уголки */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-gold" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-gold" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-gold" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-gold" />

          <h2 className="font-serif text-3xl md:text-4xl mb-6 text-parchment">
            Написать Мастеру
          </h2>
          <p className="text-gray-400 mb-8 font-light">
            Работаю я медленно, вдумчиво. Если вы хотите заказать зеркало или задать вопрос, напишите мне. Я отвечаю лично, когда спускаюсь в город за связью.
          </p>

          <form className="space-y-4 text-left">
            <div>
              <label className="block text-xs uppercase text-gold mb-2 tracking-widest font-sans">
                Ваше Имя
              </label>
              <input
                type="text"
                className="w-full bg-black/50 border border-white/10 p-3 text-parchment focus:border-gold outline-none transition-colors"
                placeholder="Иван"
              />
            </div>
            <div>
              <label className="block text-xs uppercase text-gold mb-2 tracking-widest font-sans">
                Почта для связи
              </label>
              <input
                type="email"
                className="w-full bg-black/50 border border-white/10 p-3 text-parchment focus:border-gold outline-none transition-colors"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-xs uppercase text-gold mb-2 tracking-widest font-sans">
                Ваше Послание
              </label>
              <textarea
                rows={4}
                className="w-full bg-black/50 border border-white/10 p-3 text-parchment focus:border-gold outline-none transition-colors resize-none"
                placeholder="Опишите, какой артефакт вам нужен..."
              />
            </div>
            <Button type="submit" size="lg">
              Отправить ворона
            </Button>
          </form>

          <div className="mt-12 space-y-3 text-sm text-gray-500 font-sans">
            <div className="flex items-center gap-2">
              <MapPin size={16} /> Псковская область, д. Глухово
            </div>
            <div className="flex items-center gap-2">
              <Mail size={16} /> master@orlov-magic.ru
            </div>
            <div className="flex items-center gap-2">
              <Phone size={16} /> По предварительному уговору
            </div>
          </div>
        </div>
      </Section>

      {/* FOOTER */}
      <footer className="w-full py-12 text-center text-xs text-gray-700 border-t border-white/5 bg-black z-20 relative">
        <div className="flex flex-col gap-4 items-center justify-center">
          <p>© 2025 Мастерская Орлова Н.Б. Все права защищены.</p>
          <p className="text-gray-600 flex items-center gap-1">
            Разработка сайта — 
            <a 
              href="https://odinlab-studios.vercel.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-copper hover:text-gold transition-colors font-serif italic tracking-wide border-b border-transparent hover:border-gold"
            >
              OdinLab Studios
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
