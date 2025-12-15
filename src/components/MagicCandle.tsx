"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { 
  Sparkles, 
  Float, 
  MeshDistortMaterial, 
  PerspectiveCamera, 
  Environment
} from "@react-three/drei";
import { EffectComposer, Bloom, Noise, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

// --- КОМПОНЕНТ ОДНОЙ СВЕЧИ ---
function Candle({ position, scale = 1, flickerSpeed = 1 }: { position: [number, number, number], scale?: number, flickerSpeed?: number }) {
  const lightRef = useRef<THREE.PointLight>(null);
  const flameRef = useRef<THREE.Mesh>(null);
  
  // Случайный сдвиг фазы для каждой свечи, чтобы они мерцали не синхронно
  const phase = useMemo(() => Math.random() * 100, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime + phase;
    
    // Анимация света (мерцание)
    if (lightRef.current) {
      lightRef.current.intensity = 1.5 + Math.sin(t * 10 * flickerSpeed) * 0.3 + Math.cos(t * 23) * 0.1;
      lightRef.current.position.x = position[0] + Math.sin(t * 2) * 0.02;
    }

    // Анимация пламени (растягивание и дрожание)
    if (flameRef.current) {
      flameRef.current.scale.set(
        1 * scale + Math.sin(t * 15) * 0.1 * scale, 
        1.2 * scale + Math.sin(t * 10) * 0.2 * scale, 
        1 * scale + Math.cos(t * 12) * 0.1 * scale
      );
      // Легкий наклон пламени
      flameRef.current.rotation.z = Math.sin(t * 5) * 0.05;
      flameRef.current.rotation.x = Math.cos(t * 3) * 0.05;
    }
  });

  return (
    <group position={position}>
      {/* Тело свечи */}
      <mesh position={[0, -0.5 * scale, 0]} castShadow>
        <cylinderGeometry args={[0.15 * scale, 0.18 * scale, 1.5 * scale, 16]} />
        <meshStandardMaterial 
          color="#1a0b00" 
          roughness={0.8} 
          emissive="#220a00"
          emissiveIntensity={0.2}
        />
      </mesh>
      
      {/* Фитиль */}
      <mesh position={[0, 0.25 * scale, 0]}>
        <cylinderGeometry args={[0.01 * scale, 0.01 * scale, 0.1 * scale]} />
        <meshBasicMaterial color="#000" />
      </mesh>

      {/* Пламя (яркое ядро для Bloom эффекта) */}
      <mesh ref={flameRef} position={[0, 0.45 * scale, 0]}>
        <sphereGeometry args={[0.06 * scale, 16, 16]} />
        <meshBasicMaterial color={[5, 2, 0.5]} toneMapped={false} /> {/* HDR цвет для свечения */}
      </mesh>

      {/* Свет от свечи */}
      <pointLight 
        ref={lightRef}
        position={[0, 0.6 * scale, 0]} 
        color="#ff7b00" 
        distance={3} 
        decay={2} 
        castShadow
      />
    </group>
  );
}

// --- КОМПОНЕНТ ЗЕРКАЛА-ПОРТАЛА ---
function PortalMirror() {
  return (
    <group position={[0, 0.5, -1]}>
      {/* Рама зеркала */}
      <mesh position={[0, 0, -0.05]}>
        <ringGeometry args={[1.4, 1.8, 64]} />
        <meshStandardMaterial 
          color="#0a0a0a" 
          roughness={0.9} 
          metalness={0.5} 
          envMapIntensity={0.5}
        />
      </mesh>
      
      {/* Само стекло (портал) с искажением */}
      <mesh>
        <circleGeometry args={[1.4, 64]} />
        <MeshDistortMaterial
          color="#000000"
          envMapIntensity={1}
          clearcoat={1}
          clearcoatRoughness={0}
          metalness={0.9}
          roughness={0.1}
          distort={0.4}
          speed={0.5}
        />
      </mesh>

      {/* Свечение позади зеркала (Backlight) */}
      <pointLight position={[0, 0, -1]} intensity={5} color="#4b0082" distance={5} />
    </group>
  );
}

// --- УПРАВЛЕНИЕ КАМЕРОЙ (ГИРОСКОП + МЫШЬ) ---
function Rig() {
  const { camera } = useThree();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Простейшая проверка на мобильное устройство (с проверкой window для SSR)
    if (typeof window !== 'undefined') {
      try {
        setIsMobile(/Android|iPhone/i.test(navigator.userAgent));
      } catch (error) {
        console.warn('Ошибка определения мобильного устройства:', error);
        setIsMobile(false);
      }
    }
  }, []);

  useFrame((state) => {
    try {
      if (isMobile) {
         // На мобильных - автоматический дрейф для эффекта
         const t = state.clock.elapsedTime;
         camera.position.lerp(new THREE.Vector3(Math.sin(t * 0.5) * 0.5, Math.cos(t * 0.3) * 0.2, 4.5), 0.05);
         camera.lookAt(0, 0, 0);
      } else {
         // Параллакс мышью для десктопа
         const x = state.mouse.x * 0.8; 
         const y = state.mouse.y * 0.4;
         
         camera.position.lerp(new THREE.Vector3(x, y, 4.5), 0.05);
         camera.lookAt(0, 0, 0);
      }
    } catch (error) {
      console.warn('Ошибка в Rig useFrame:', error);
    }
  });

  return null;
}

// --- ОСНОВНАЯ СЦЕНА ---
export default function MagicCandleScene() {
  return (
    <div className="h-[80vh] w-full absolute top-0 left-0 -z-10 pointer-events-none">
      <Canvas 
        shadows 
        dpr={[1, 2]} 
        gl={{ 
          antialias: false, 
          toneMapping: THREE.ReinhardToneMapping, 
          toneMappingExposure: 1.5,
          alpha: true, // Добавляем прозрачность
          powerPreference: 'high-performance' // Оптимизация для мобильных
        }}
        onCreated={(state) => {
          // Логирование для отладки
          console.log('Canvas инициализирован успешно');
        }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 4.5]} fov={50} />
        
        {/* Окружение для отражений в зеркале */}
        <Environment preset="city" environmentIntensity={0.2} />

        <group position={[0, -0.5, 0]}>
          {/* Зеркало */}
          <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
            <PortalMirror />
          </Float>

          {/* Группа свечей */}
          {/* Большая левая */}
          <Candle position={[-1.8, -0.5, 1.5]} scale={1.2} flickerSpeed={0.8} />
          {/* Большая правая */}
          <Candle position={[1.8, -0.8, 1.2]} scale={1.1} flickerSpeed={1.1} />
          
          {/* Маленькие вокруг */}
          <Candle position={[-0.8, -1.2, 2.5]} scale={0.6} flickerSpeed={1.5} />
          <Candle position={[0.9, -1.1, 2.8]} scale={0.5} flickerSpeed={1.3} />
          <Candle position={[-2.2, -1.0, 0.5]} scale={0.7} flickerSpeed={0.9} />
          <Candle position={[2.1, -0.6, 0]} scale={0.8} flickerSpeed={1.2} />
          <Candle position={[0, -1.5, 3]} scale={0.4} flickerSpeed={2} />

          {/* Частицы пыли и магии */}
          <Sparkles 
            count={80} 
            scale={8} 
            size={4} 
            speed={0.4} 
            opacity={0.6} 
            color="#FFD700" 
            position={[0, 0, 1]}
          />
           <Sparkles 
            count={40} 
            scale={5} 
            size={2} 
            speed={0.2} 
            opacity={0.3} 
            color="#4b0082"
            position={[0, 0, -1]}
          />
        </group>

        {/* Управление камерой */}
        <Rig />

        {/* Пост-обработка для "киношности" */}
        <EffectComposer disableNormalPass>
          {/* Bloom заставляет яркие объекты (пламя) светиться */}
          <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} radius={0.4} />
          {/* Шум для эффекта старой пленки */}
          <Noise opacity={0.05} /> 
          {/* Виньетка затемняет углы, фокусируя внимание на центре */}
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
