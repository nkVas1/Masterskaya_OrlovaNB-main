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

// --- ПРОФЕССИОНАЛЬНЫЕ КИНЕМАТОГРАФИЧНЫЕ ЧАСТИЦЫ С РАЗМЫТИЕМ ---
function CustomSparkles({ 
  count = 50, 
  color = "#FFD700",
  size = 0.012,
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
        (Math.random() - 0.5) * 0.009,
        (Math.random() - 0.5) * 0.009,
        (Math.random() - 0.5) * 0.009
      ] as [number, number, number],
      scale: 0.7 + Math.random() * 0.6,
      phase: Math.random() * Math.PI * 2,
      flickerSpeed: 0.75 + Math.random() * 0.45
    }));
  }, [count, spread]);

  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.elapsedTime * speed;
      
      groupRef.current.children.forEach((child, i) => {
        const particle = particles[i];
        
        const offsetX = particle.initialPos[0] + Math.sin(t * particle.flickerSpeed + particle.phase) * 0.18;
        const offsetY = particle.initialPos[1] + Math.cos(t * particle.flickerSpeed * 0.7 + particle.phase) * 0.18;
        const offsetZ = particle.initialPos[2] + Math.sin(t * particle.flickerSpeed * 0.5 + particle.phase) * 0.12;
        
        child.position.set(
          offsetX + particle.velocity[0] * t,
          offsetY + particle.velocity[1] * t,
          offsetZ + particle.velocity[2] * t
        );
        
        if (Math.abs(child.position.x) > spread * 0.6) particle.velocity[0] *= -1;
        if (Math.abs(child.position.y) > spread * 0.6) particle.velocity[1] *= -1;
        if (Math.abs(child.position.z) > spread * 0.6) particle.velocity[2] *= -1;
        
        if (child instanceof THREE.Sprite) {
          const baseFlicker = 0.7 + Math.sin(t * 2.0 * particle.flickerSpeed + particle.phase) * 0.3;
          if (child.material instanceof THREE.SpriteMaterial) {
            child.material.opacity = baseFlicker;
          }
        }
      });
      
      groupRef.current.rotation.y = t * 0.025;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {particles.map((particle, i) => (
        <sprite key={i} position={particle.initialPos} scale={[size * particle.scale * 15, size * particle.scale * 15, 1]}>
          <spriteMaterial
            color={color}
            transparent
            opacity={0.7}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </sprite>
      ))}
    </group>
  );
}

// --- ФИЗИЧЕСКИ ТОЧНЫЙ СТЕКАЮЩИЙ ВОСК ---
// --- ПРОФЕССИОНАЛЬНЫЙ СТЕКАЮЩИЙ ВОСК ---
function WaxDrip({ 
  parentScale, 
  parentPosition,
  side = 0, 
  delay = 0
}: { 
  parentScale: number,
  parentPosition: [number, number, number],
  side?: number, 
  delay?: number
}) {
  const dripRef = useRef<THREE.Mesh>(null);
  const trailRef = useRef<THREE.Mesh>(null);
  const phaseTime = useMemo(() => Math.random() * 100 + delay, [delay]);
  
  // Расчет позиций ОТНОСИТЕЛЬНО локальной системы координат свечи
  const candleTopY = 0.75; // Верх свечи в локальной системе
  const candleRadius = 0.15; // Радиус свечи
  
  const angle = useMemo(() => side * (Math.PI / 3) + (Math.random() - 0.5) * 0.3, [side]);
  const localX = useMemo(() => Math.cos(angle) * candleRadius * 0.92, [angle]);
  const localZ = useMemo(() => Math.sin(angle) * candleRadius * 0.92, [angle]);

  useFrame((state) => {
    const t = state.clock.elapsedTime + phaseTime;
    const cycleTime = t % 26;
    
    if (dripRef.current && trailRef.current) {
      const worldX = parentPosition[0] + localX * parentScale;
      const worldZ = parentPosition[2] + localZ * parentScale;
      
      // ФАЗА 1: Накопление (0-6s)
      if (cycleTime < 6) {
        const accumProgress = cycleTime / 6;
        
        const worldY = parentPosition[1] + candleTopY * parentScale;
        dripRef.current.position.set(worldX, worldY, worldZ);
        dripRef.current.scale.set(
          0.35 + accumProgress * 0.65,
          0.2 + accumProgress * 0.8,
          0.35 + accumProgress * 0.65
        );
        
        if (dripRef.current.material instanceof THREE.MeshStandardMaterial) {
          dripRef.current.material.opacity = accumProgress * 0.8;
        }
        
        if (trailRef.current.material instanceof THREE.MeshStandardMaterial) {
          trailRef.current.material.opacity = 0;
        }
      }
      // ФАЗА 2: Стекание (6-18s)
      else if (cycleTime < 18) {
        const dripProgress = (cycleTime - 6) / 12;
        
        const worldY = parentPosition[1] + (candleTopY - dripProgress * 2.4) * parentScale;
        dripRef.current.position.set(worldX, worldY, worldZ);
        
        const stretchY = 1 + dripProgress * 6.0;
        const shrinkXZ = Math.max(0.25, 1 - dripProgress * 0.75);
        dripRef.current.scale.set(shrinkXZ, stretchY, shrinkXZ);
        
        // След
        const trailY = parentPosition[1] + (candleTopY - 0.6) * parentScale;
        trailRef.current.position.set(worldX, trailY, worldZ);
        trailRef.current.scale.y = 0.2 + dripProgress * 2.0;
        
        if (dripRef.current.material instanceof THREE.MeshStandardMaterial) {
          dripRef.current.material.opacity = Math.max(0, 0.8 - dripProgress * 0.9);
        }
        if (trailRef.current.material instanceof THREE.MeshStandardMaterial) {
          trailRef.current.material.opacity = 0.5 * (1 - dripProgress * 0.2);
        }
      }
      // ФАЗА 3: Отрыв (18-20s)
      else if (cycleTime < 20) {
        const fallProgress = (cycleTime - 18) / 2;
        
        const worldY = parentPosition[1] + (candleTopY - 2.4 - fallProgress * 2.0) * parentScale;
        dripRef.current.position.set(worldX, worldY, worldZ);
        dripRef.current.scale.set(0.6, 1.5, 0.6);
        
        if (dripRef.current.material instanceof THREE.MeshStandardMaterial) {
          dripRef.current.material.opacity = Math.max(0, 0.3 - fallProgress * 2);
        }
        if (trailRef.current.material instanceof THREE.MeshStandardMaterial) {
          trailRef.current.material.opacity = Math.max(0, 0.3 - fallProgress);
        }
      }
      // ФАЗА 4: Сброс (20-26s)
      else {
        const worldY = parentPosition[1] + candleTopY * parentScale;
        dripRef.current.position.set(worldX, worldY, worldZ);
        dripRef.current.scale.set(0.35, 0.2, 0.35);
        
        if (dripRef.current.material instanceof THREE.MeshStandardMaterial) {
          dripRef.current.material.opacity = 0;
        }
        if (trailRef.current.material instanceof THREE.MeshStandardMaterial) {
          trailRef.current.material.opacity = 0;
        }
      }
    }
  });

  return (
    <>
      {/* След воска */}
      <mesh ref={trailRef}>
        <cylinderGeometry args={[0.009 * parentScale, 0.014 * parentScale, 1.2 * parentScale, 8]} />
        <meshStandardMaterial 
          color="#453220" 
          roughness={0.3} 
          metalness={0.12}
          transparent
          opacity={0}
          emissive="#2a1808"
          emissiveIntensity={0.2}
        />
      </mesh>
      
      {/* Капля воска */}
      <mesh ref={dripRef}>
        <sphereGeometry args={[0.024 * parentScale, 12, 12]} />
        <meshStandardMaterial 
          color="#4a3020" 
          roughness={0.2} 
          metalness={0.15}
          transparent
          opacity={0}
          emissive="#3a2210"
          emissiveIntensity={0.3}
        />
      </mesh>
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

        {/* Стекающий воск - анимированные капли привязаны к свече */}
        {waxDrips && (
          <>
            <WaxDrip parentScale={scale} parentPosition={position} side={1} delay={0} />
            <WaxDrip parentScale={scale} parentPosition={position} side={-1} delay={5} />
            <WaxDrip parentScale={scale} parentPosition={position} side={0} delay={10} />
          </>
        )}

        {/* Застывшие восковые потёки - естественное размещение */}
        <mesh position={[0.125 * scale, 0.5 * scale, 0.04 * scale]} castShadow rotation={[0.12, 0.1, -0.4]}>
          <capsuleGeometry args={[0.011 * scale, 0.35 * scale, 10, 14]} />
          <meshStandardMaterial 
            color="#3a2515" 
            roughness={0.35} 
            metalness={0.12}
            emissive="#2a1808"
            emissiveIntensity={0.16}
          />
        </mesh>
        
        <mesh position={[-0.11 * scale, 0.38 * scale, -0.06 * scale]} castShadow rotation={[-0.1, -0.08, 0.35]}>
          <capsuleGeometry args={[0.009 * scale, 0.26 * scale, 10, 12]} />
          <meshStandardMaterial 
            color="#3a2515" 
            roughness={0.35} 
            metalness={0.12}
            emissive="#2a1808"
            emissiveIntensity={0.16}
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
          count={140} 
          color="#d4af37" 
          size={0.009} 
          spread={8.5} 
          speed={0.28}
          position={[0, 0.25, 0.1]}
        />
        
        {/* Фиолетовая мистическая пыль - тончайшие частицы */}
        <CustomSparkles 
          count={110} 
          color="#a855f7" 
          size={0.003} 
          spread={6.8} 
          speed={0.16}
          position={[0, -0.1, -0.9]}
        />
        
        <CinematicRig />

        {/* Кинематографичная пост-обработка */}
        <EffectComposer disableNormalPass>
          <Bloom 
            luminanceThreshold={1.0} 
            mipmapBlur 
            intensity={1.8} 
            radius={0.65}
            levels={9}
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
