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
import { EffectComposer, Bloom, Noise, Vignette, ChromaticAberration, DepthOfField } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";

// --- АНИМАЦИЯ ПОЯВЛЕНИЯ ЭЛЕМЕНТА ---
function FadeInScale({ 
  children, 
  delay = 0 
}: { 
  children: React.ReactNode, 
  delay?: number 
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [appeared, setAppeared] = useState(false);

  useFrame((state) => {
    if (!appeared && state.clock.elapsedTime > delay) {
      setAppeared(true);
    }

    if (groupRef.current && appeared) {
      const progress = Math.min(1, (state.clock.elapsedTime - delay) / 2);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOut cubic
      
      groupRef.current.scale.setScalar(eased);
      groupRef.current.position.y = (1 - eased) * -2;
      
      groupRef.current.children.forEach((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const mat = child.material as any;
          if (mat.transparent !== undefined) {
            mat.opacity = eased;
          }
        }
      });
    } else if (groupRef.current && !appeared) {
      groupRef.current.scale.setScalar(0.01);
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

// --- БЕСШОВНЫЕ КИНЕМАТОГРАФИЧНЫЕ ЧАСТИЦЫ ---
function CustomSparkles({ 
  count = 50, 
  color = "#FFD700",
  size = 0.015,
  spread = 5,
  speed = 0.3,
  position = [0, 0, 0] as [number, number, number]
}: {
  count?: number,
  color?: string,
  size?: number,
  spread?: number,
  speed?: number,
  position?: [number, number, number]
}) {
  const groupRef = useRef<THREE.Group>(null);
  
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      initialPos: [
        (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * spread
      ] as [number, number, number],
      velocity: [
        (Math.random() - 0.5) * 0.012,
        (Math.random() - 0.5) * 0.012,
        (Math.random() - 0.5) * 0.012
      ] as [number, number, number],
      scale: 0.6 + Math.random() * 0.8,
      phase: Math.random() * Math.PI * 2,
      flickerSpeed: 0.85 + Math.random() * 0.35
    }));
  }, [count, spread]);

  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.elapsedTime * speed;
      
      groupRef.current.children.forEach((child, i) => {
        const particle = particles[i];
        
        // Плавное хаотичное движение
        const offsetX = particle.initialPos[0] + Math.sin(t * particle.flickerSpeed + particle.phase) * 0.22;
        const offsetY = particle.initialPos[1] + Math.cos(t * particle.flickerSpeed * 0.75 + particle.phase) * 0.22;
        const offsetZ = particle.initialPos[2] + Math.sin(t * particle.flickerSpeed * 0.55 + particle.phase) * 0.16;
        
        child.position.set(
          offsetX + particle.velocity[0] * t,
          offsetY + particle.velocity[1] * t,
          offsetZ + particle.velocity[2] * t
        );
        
        // Отражение от границ
        if (Math.abs(child.position.x) > spread * 0.6) particle.velocity[0] *= -1;
        if (Math.abs(child.position.y) > spread * 0.6) particle.velocity[1] *= -1;
        if (Math.abs(child.position.z) > spread * 0.6) particle.velocity[2] *= -1;
        
        // Естественное мерцание всех слоёв синхронно
        if (child instanceof THREE.Group) {
          const baseFlicker = 0.7 + Math.sin(t * 2.2 * particle.flickerSpeed + particle.phase) * 0.3;
          
          child.children.forEach((mesh, idx) => {
            if (mesh instanceof THREE.Mesh && mesh.material) {
              const mat = mesh.material as THREE.MeshBasicMaterial;
              
              // Плавный экспоненциальный градиент от центра
              // 0: ядро, 1-9: постепенное затухание
              let baseOpacity: number;
              if (idx === 0) {
                baseOpacity = 0.88; // Яркое но слегка прозрачное ядро
              } else {
                // Экспоненциальное затухание: каждый слой в 1.65x слабее
                baseOpacity = 0.5 / Math.pow(1.65, idx - 1);
              }
              
              mat.opacity = baseOpacity * baseFlicker;
            }
          });
        }
      });
      
      groupRef.current.rotation.y = t * 0.035;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {particles.map((particle, i) => (
        <group key={i} position={particle.initialPos}>
          {/* Микроскопическое яркое ядро - единственная полунепрозрачная часть */}
          <mesh>
            <sphereGeometry args={[size * particle.scale * 0.35, 10, 10]} />
            <meshBasicMaterial 
              color={color}
              transparent
              opacity={0.88}
              toneMapped={false}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          
          {/* Плавные слои рассеивания - создают бесшовный градиент */}
          {[0.7, 1.1, 1.6, 2.3, 3.2, 4.3, 5.8, 7.5, 9.5].map((multiplier, idx) => (
            <mesh key={idx}>
              <sphereGeometry args={[size * particle.scale * multiplier, 14, 14]} />
              <meshBasicMaterial 
                color={color}
                transparent
                opacity={0.5 / Math.pow(1.65, idx)} // Экспоненциальное затухание
                toneMapped={false}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

// --- ФИЗИЧЕСКИ ТОЧНЫЙ СТЕКАЮЩИЙ ВОСК ---
function WaxDrip({ 
  parentScale, 
  side = 0, 
  delay = 0 
}: { 
  parentScale: number, 
  side?: number, 
  delay?: number 
}) {
  const dripGroupRef = useRef<THREE.Group>(null);
  const trailRef = useRef<THREE.Mesh>(null);
  const [phase, setPhase] = useState<'accumulating' | 'dripping' | 'detaching' | 'reset'>('reset');
  const [progress, setProgress] = useState(0);
  const phaseTime = useMemo(() => Math.random() * 100 + delay, [delay]);
  const startY = 0.72; // Верхний край свечи (75 см от центра)
  const xOffset = useMemo(() => side * (0.14 + Math.random() * 0.03) * parentScale, [side, parentScale]);
  const zOffset = useMemo(() => (Math.random() - 0.5) * 0.08 * parentScale, [parentScale]);

  useFrame((state) => {
    const t = state.clock.elapsedTime + phaseTime;
    const cycleTime = t % 30; // Полный цикл 30 секунд
    
    if (dripGroupRef.current) {
      // ФАЗА 1: Накопление (0-8s) - воск собирается на краю
      if (cycleTime < 8) {
        setPhase('accumulating');
        const accumProgress = cycleTime / 8;
        setProgress(accumProgress);
        
        dripGroupRef.current.scale.set(
          0.5 + accumProgress * 0.5,
          0.3 + accumProgress * 0.7,
          0.5 + accumProgress * 0.5
        );
        
        dripGroupRef.current.children.forEach((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            (child.material as THREE.MeshStandardMaterial).opacity = accumProgress * 0.9;
          }
        });
      }
      // ФАЗА 2: Стекание (8-20s) - капля медленно стекает, растягиваясь
      else if (cycleTime < 20) {
        setPhase('dripping');
        const dripProgress = (cycleTime - 8) / 12;
        setProgress(dripProgress);
        
        const yPos = startY * parentScale - dripProgress * 2.0 * parentScale;
        dripGroupRef.current.position.y = yPos;
        
        // Растяжение капли при стекании (физика поверхностного натяжения)
        const stretchY = 1 + dripProgress * 4.5; // Сильное вытягивание
        const shrinkXZ = Math.max(0.35, 1 - dripProgress * 0.65);
        dripGroupRef.current.scale.set(shrinkXZ, stretchY, shrinkXZ);
        
        // След воска на теле свечи
        if (trailRef.current && trailRef.current.material) {
          trailRef.current.scale.y = 0.5 + dripProgress * 1.5;
          (trailRef.current.material as THREE.MeshStandardMaterial).opacity = 0.6 * (1 - dripProgress * 0.3);
        }
        
        dripGroupRef.current.children.forEach((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            (child.material as THREE.MeshStandardMaterial).opacity = Math.max(0, 0.9 - dripProgress * 1.0);
          }
        });
      }
      // ФАЗА 3: Отрыв и падение (20-22s) - капля отрывается и быстро падает
      else if (cycleTime < 22) {
        setPhase('detaching');
        const fallProgress = (cycleTime - 20) / 2;
        
        const yPos = startY * parentScale - (2.0 + fallProgress * 1.5) * parentScale;
        dripGroupRef.current.position.y = yPos;
        dripGroupRef.current.scale.set(0.8, 0.8 + fallProgress, 0.8);
        
        dripGroupRef.current.children.forEach((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            (child.material as THREE.MeshStandardMaterial).opacity = Math.max(0, 0.5 - fallProgress * 2);
          }
        });
      }
      // ФАЗА 4: Сброс (22-30s) - подготовка к новому циклу
      else {
        setPhase('reset');
        dripGroupRef.current.position.y = startY * parentScale;
        dripGroupRef.current.scale.set(0.5, 0.3, 0.5);
        
        dripGroupRef.current.children.forEach((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            (child.material as THREE.MeshStandardMaterial).opacity = 0;
          }
        });
        
        if (trailRef.current && trailRef.current.material) {
          (trailRef.current.material as THREE.MeshStandardMaterial).opacity = 0;
        }
      }
    }
  });

  return (
    <>
      {/* След воска на теле свечи */}
      <mesh ref={trailRef} position={[xOffset, 0.2 * parentScale, zOffset]}>
        <cylinderGeometry args={[0.012 * parentScale, 0.018 * parentScale, 1.0 * parentScale, 8]} />
        <meshStandardMaterial 
          color="#4a3520" 
          roughness={0.35} 
          metalness={0.08}
          transparent
          opacity={0}
          emissive="#2a1505"
          emissiveIntensity={0.25}
        />
      </mesh>
      
      {/* Группа капли */}
      <group ref={dripGroupRef} position={[xOffset, startY * parentScale, zOffset]}>
        {/* Основное тело капли - слеза */}
        <mesh position={[0, -0.03 * parentScale, 0]}>
          <sphereGeometry args={[0.028 * parentScale, 12, 12]} />
          <meshStandardMaterial 
            color="#4a3020" 
            roughness={0.2} 
            metalness={0.12}
            transparent
            opacity={0}
            emissive="#3a2010"
            emissiveIntensity={0.35}
          />
        </mesh>
        
        {/* Вытянутый хвост капли */}
        <mesh position={[0, 0.02 * parentScale, 0]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.015 * parentScale, 0.08 * parentScale, 8]} />
          <meshStandardMaterial 
            color="#5a4030" 
            roughness={0.18} 
            metalness={0.15}
            transparent
            opacity={0}
            emissive="#3a2010"
            emissiveIntensity={0.3}
          />
        </mesh>
        
        {/* Точка соединения со свечой */}
        <mesh position={[0, 0.06 * parentScale, 0]}>
          <sphereGeometry args={[0.012 * parentScale, 8, 8]} />
          <meshStandardMaterial 
            color="#5a4030" 
            roughness={0.15} 
            metalness={0.18}
            transparent
            opacity={0}
            emissive="#3a2010"
            emissiveIntensity={0.4}
          />
        </mesh>
      </group>
    </>
  );
}

// --- СТИЛИЗОВАННАЯ СВЕЧА С ОБЪЕМОМ И АНИМИРОВАННЫМ ВОСКОМ ---
function CinematicCandle({ 
  position, 
  scale = 1, 
  flickerSpeed = 1,
  waxDrips = true 
}: { 
  position: [number, number, number], 
  scale?: number, 
  flickerSpeed?: number,
  waxDrips?: boolean
}) {
  const lightRef = useRef<THREE.PointLight>(null);
  const flameRef = useRef<THREE.Mesh>(null);
  const phase = useMemo(() => Math.random() * 100, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime + phase;
    
    if (lightRef.current) {
      lightRef.current.intensity = 1.5 + Math.sin(t * 10 * flickerSpeed) * 0.3 + Math.cos(t * 23) * 0.1;
      lightRef.current.position.x = position[0] + Math.sin(t * 2) * 0.02;
    }
    
    // Стилизованное пламя как раньше
    if (flameRef.current) {
      flameRef.current.scale.set(
        1 * scale + Math.sin(t * 15) * 0.1 * scale, 
        1.2 * scale + Math.sin(t * 10) * 0.2 * scale, 
        1 * scale + Math.cos(t * 12) * 0.1 * scale
      );
      flameRef.current.rotation.z = Math.sin(t * 5) * 0.05;
    }
  });

  return (
    <FadeInScale delay={Math.random() * 0.5}>
      <group position={position}>
        {/* Тело свечи - более объемное и детальное */}
        <mesh position={[0, -0.5 * scale, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.15 * scale, 0.18 * scale, 1.5 * scale, 32]} />
          <meshStandardMaterial 
            color="#1a0b00" 
            roughness={0.8} 
            metalness={0.05}
            emissive="#220a00" 
            emissiveIntensity={0.2}
          />
        </mesh>

        {/* Стекающий воск - анимированные капли */}
        {waxDrips && (
          <>
            <WaxDrip parentScale={scale} side={1} delay={0} />
            <WaxDrip parentScale={scale} side={-1} delay={3} />
            <WaxDrip parentScale={scale} side={0.5} delay={6} />
          </>
        )}

        {/* Тело свечи - более объемное и детальное */}
        {/* Застывшие восковые потёки на теле */}
        <mesh position={[0.13 * scale, 0.35 * scale, 0.07 * scale]} castShadow rotation={[0, 0, -0.3]}>
          <capsuleGeometry args={[0.015 * scale, 0.25 * scale, 6, 10]} />
          <meshStandardMaterial 
            color="#3a2515" 
            roughness={0.35} 
            metalness={0.12}
            emissive="#2a1505"
            emissiveIntensity={0.2}
          />
        </mesh>
        
        <mesh position={[-0.11 * scale, 0.2 * scale, -0.08 * scale]} castShadow rotation={[0, 0, 0.25]}>
          <capsuleGeometry args={[0.012 * scale, 0.18 * scale, 6, 10]} />
          <meshStandardMaterial 
            color="#3a2515" 
            roughness={0.35} 
            metalness={0.12}
            emissive="#2a1505"
            emissiveIntensity={0.2}
          />
        </mesh>
        
        <mesh position={[0.08 * scale, 0.1 * scale, 0.12 * scale]} castShadow rotation={[0, 0, -0.15]}>
          <capsuleGeometry args={[0.01 * scale, 0.12 * scale, 6, 8]} />
          <meshStandardMaterial 
            color="#4a3020" 
            roughness={0.3} 
            metalness={0.15}
            emissive="#2a1505"
            emissiveIntensity={0.18}
          />
        </mesh>

        {/* Фитиль */}
        <mesh position={[0, 0.25 * scale, 0]}>
          <cylinderGeometry args={[0.01 * scale, 0.01 * scale, 0.1 * scale]} />
          <meshBasicMaterial color="#000" />
        </mesh>

        {/* СТИЛИЗОВАННОЕ пламя - сферическое как раньше */}
        <mesh ref={flameRef} position={[0, 0.45 * scale, 0]}>
          <sphereGeometry args={[0.06 * scale, 16, 16]} />
          <meshBasicMaterial color={[5, 2, 0.5]} toneMapped={false} />
        </mesh>

        {/* Точечный источник света */}
        <pointLight 
          ref={lightRef} 
          position={[0, 0.6 * scale, 0]} 
          color="#ff7b00" 
          intensity={1.5}
          distance={3} 
          decay={2} 
          castShadow
        />
      </group>
    </FadeInScale>
  );
}

// --- ДРЕВЕСНОЕ ЗЕРКАЛО-ПОРТАЛ С МАГИЕЙ ---
function CinematicPortalMirror() {
  const mirrorRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    
    // Динамичное искажение зеркала
    if (mirrorRef.current && mirrorRef.current.material) {
      const material = mirrorRef.current.material as any;
      if (material.distort !== undefined) {
        material.distort = 0.45 + Math.sin(t * 0.6) * 0.15;
      }
    }
  });

  return (
    <FadeInScale delay={0.3}>
      <group position={[0, 0.5, -1]}>
        {/* Внешняя рама - древесная текстура */}
        <mesh position={[0, 0, -0.05]} castShadow receiveShadow>
          <ringGeometry args={[1.4, 1.8, 64]} />
          <meshStandardMaterial 
            color="#0a0a0a" 
            roughness={0.9} 
            metalness={0.5} 
            envMapIntensity={0.5}
          />
        </mesh>

        {/* Внутренняя древесная рама с рельефом */}
        <mesh position={[0, 0, -0.03]} castShadow>
          <ringGeometry args={[1.35, 1.45, 6]} />
          <meshStandardMaterial 
            color="#3d2a1f" 
            roughness={0.95} 
            metalness={0.0}
            normalScale={new THREE.Vector2(0.5, 0.5)}
          />
        </mesh>

        {/* Резные узоры на раме */}
        <mesh position={[0, 0, -0.02]}>
          <ringGeometry args={[1.38, 1.42, 32]} />
          <meshStandardMaterial 
            color="#5a3a2a" 
            roughness={0.85} 
            emissive="#2a1510"
            emissiveIntensity={0.3}
          />
        </mesh>

        {/* Зеркальная поверхность с магическими переливами */}
        <mesh ref={mirrorRef}>
          <circleGeometry args={[1.4, 64]} />
          <MeshDistortMaterial 
            color="#0a0a0f" 
            envMapIntensity={2.0} 
            clearcoat={1} 
            clearcoatRoughness={0.05}
            metalness={0.98} 
            roughness={0.02} 
            distort={0.45} 
            speed={0.6}
            emissive="#1a1a3a"
            emissiveIntensity={0.1}
          />
        </mesh>
        
        {/* Тонкий слой магического переливания */}
        <mesh position={[0, 0, 0.01]}>
          <circleGeometry args={[1.38, 64]} />
          <meshStandardMaterial 
            color="#2a1a4a" 
            transparent
            opacity={0.08}
            metalness={0.9}
            roughness={0.1}
            emissive="#4a2a7a"
            emissiveIntensity={0.15}
          />
        </mesh>

        {/* Глубокая подсветка портала */}
        <pointLight 
          position={[0, 0, -1]} 
          intensity={5} 
          color="#4b0082" 
          distance={5}
          decay={2}
        />
      </group>
    </FadeInScale>
  );
}

// --- АДАПТИВНАЯ ГРУППА СВЕЧЕЙ ---
function ResponsiveCandleGroup() {
  const { width } = useThree((state) => state.viewport);
  const isMobile = width < 5.5;

  if (isMobile) {
    // Мобильная версия: больше свечей, ближе к камере, более раскиданы по глубине
    return (
      <group position={[0, -0.3, 0]}>
        {/* Передний план */}
        <CinematicCandle position={[-1.4, -0.4, 2.8]} scale={1.3} flickerSpeed={0.9} />
        <CinematicCandle position={[1.5, -0.6, 2.5]} scale={1.2} flickerSpeed={1.0} />
        
        {/* Средний план */}
        <CinematicCandle position={[-1.8, -0.3, 1.5]} scale={1.1} flickerSpeed={0.8} />
        <CinematicCandle position={[1.9, -0.5, 1.3]} scale={1.0} flickerSpeed={1.1} />
        <CinematicCandle position={[0, -0.8, 1.8]} scale={0.9} flickerSpeed={1.2} />
        
        {/* Дальний план */}
        <CinematicCandle position={[-0.7, -0.9, 0.8]} scale={0.7} flickerSpeed={1.4} />
        <CinematicCandle position={[0.8, -0.9, 0.7]} scale={0.65} flickerSpeed={1.3} />
        <CinematicCandle position={[-2.2, -0.7, 0.5]} scale={0.6} flickerSpeed={1.5} />
        <CinematicCandle position={[2.3, -0.6, 0.4]} scale={0.6} flickerSpeed={1.6} waxDrips={false} />
      </group>
    );
  }

  // Десктопная версия: сохраняем исходную композицию
  return (
    <group position={[0, -0.5, 0]}>
      <CinematicCandle position={[-1.8, -0.5, 1.5]} scale={1.2} flickerSpeed={0.8} />
      <CinematicCandle position={[1.8, -0.8, 1.2]} scale={1.1} flickerSpeed={1.1} />
      <CinematicCandle position={[-0.8, -1.2, 2.5]} scale={0.6} flickerSpeed={1.5} />
      <CinematicCandle position={[0.9, -1.1, 2.8]} scale={0.5} flickerSpeed={1.3} waxDrips={false} />
      <CinematicCandle position={[-2.2, -1.0, 0.5]} scale={0.7} flickerSpeed={0.9} />
      <CinematicCandle position={[2.1, -0.6, 0]} scale={0.8} flickerSpeed={1.2} />
      <CinematicCandle position={[0, -1.5, 3]} scale={0.4} flickerSpeed={2} waxDrips={false} />
    </group>
  );
}

// --- VOLUMETRIC FOG ---
function VolumetricAtmosphere() {
  return (
    <>
      <fog attach="fog" args={["#050505", 5, 12]} />
      {/* Ambient occlusion через слабый свет */}
      <ambientLight intensity={0.08} color="#1a1410" />
      <hemisphereLight intensity={0.15} color="#ffd4a3" groundColor="#000000" />
    </>
  );
}

// --- УЛУЧШЕННАЯ СИСТЕМА УПРАВЛЕНИЯ КАМЕРОЙ ---
function CinematicRig() {
  const { camera, mouse, viewport } = useThree();
  const vec = new THREE.Vector3();
  const [deviceOrientation, setDeviceOrientation] = useState({ alpha: 0, beta: 0, gamma: 0 });
  const isMobile = viewport.width < 5.5;

  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      setDeviceOrientation({
        alpha: event.alpha || 0,
        beta: event.beta || 0,
        gamma: event.gamma || 0,
      });
    };
    
    if (typeof window !== 'undefined' && window.DeviceOrientationEvent) {
      window.addEventListener("deviceorientation", handleOrientation);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener("deviceorientation", handleOrientation);
      }
    };
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    
    let x = 0;
    let y = 0;

    // Мобильная версия: приближаем камеру для крупного плана
    const cameraZ = isMobile ? 4.2 : 4.8;
    const cameraY = isMobile ? 0.2 : 0;

    if (deviceOrientation.beta !== 0 || deviceOrientation.gamma !== 0) {
      // Гироскоп
      x = THREE.MathUtils.clamp(deviceOrientation.gamma, -25, 25) * 0.04;
      y = THREE.MathUtils.clamp(deviceOrientation.beta - 45, -25, 25) * 0.04;
    } else {
      // Параллакс мышью
      x = mouse.x * (isMobile ? 0.6 : 0.9);
      y = mouse.y * (isMobile ? 0.3 : 0.5);
      
      // Idle-анимация (дыхание камеры)
      if (Math.abs(mouse.x) < 0.01 && Math.abs(mouse.y) < 0.01) {
        x = Math.sin(t * 0.3) * 0.15;
        y = Math.cos(t * 0.25) * 0.1;
      }
    }

    camera.position.lerp(vec.set(x, y + cameraY, cameraZ), 0.04);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

// --- ГЛАВНАЯ СЦЕНА ---
export default function MagicCandleScene() {
  return (
    <div className="h-[85vh] w-full absolute top-0 left-0 -z-10">
      <Canvas 
        shadows 
        dpr={[1, 2]} 
        gl={{ 
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 4.8]} fov={52} />
        <Environment preset="night" environmentIntensity={0.15} />
        
        <VolumetricAtmosphere />
        
        <Float speed={1.2} rotationIntensity={0.08} floatIntensity={0.15}>
          <CinematicPortalMirror />
        </Float>
        
        <ResponsiveCandleGroup />
        
        {/* Золотые частицы - мягкое кинематографичное свечение */}
        <CustomSparkles 
          count={120} 
          color="#FFD700" 
          size={0.012} 
          spread={8} 
          speed={0.3}
          position={[0, 0.3, 0.2]}
        />
        
        {/* Фиолетовая мистическая пыль - тончайшие частицы */}
        <CustomSparkles 
          count={90} 
          color="#a97cf6" 
          size={0.006} 
          spread={6.5} 
          speed={0.18}
          position={[0, 0.05, -0.7]}
        />
        
        <CinematicRig />

        {/* Кинематографичная пост-обработка */}
        <EffectComposer disableNormalPass>
          <Bloom 
            luminanceThreshold={1.0} 
            mipmapBlur 
            intensity={1.5} 
            radius={0.5}
            levels={8}
          />
          <DepthOfField 
            focusDistance={0.015} 
            focalLength={0.04} 
            bokehScale={2}
            height={480}
          />
          <ChromaticAberration 
            offset={[0.0008, 0.0008] as [number, number]}
            blendFunction={BlendFunction.NORMAL}
          />
          <Noise opacity={0.04} />
          <Vignette eskil={false} offset={0.2} darkness={1.25} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
