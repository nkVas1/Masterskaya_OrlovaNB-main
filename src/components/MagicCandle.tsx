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

// --- УЛУЧШЕННЫЕ ЧАСТИЦЫ БЕЗ АРТЕФАКТОВ ---
function CustomSparkles({ 
  count = 50, 
  color = "#FFD700",
  size = 0.03,
  spread = 5,
  speed = 0.3
}: {
  count?: number,
  color?: string,
  size?: number,
  spread?: number,
  speed?: number
}) {
  const pointsRef = useRef<THREE.Points>(null);
  
  const [positions, scales] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const scl = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * spread;
      pos[i * 3 + 1] = (Math.random() - 0.5) * spread;
      pos[i * 3 + 2] = (Math.random() - 0.5) * spread;
      scl[i] = Math.random() * 0.5 + 0.5;
    }
    
    return [pos, scl];
  }, [count, spread]);

  useFrame((state) => {
    if (pointsRef.current) {
      const t = state.clock.elapsedTime * speed;
      
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        positions[i3 + 1] += Math.sin(t + i) * 0.001;
      }
      
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
      pointsRef.current.rotation.y = t * 0.05;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-scale"
          count={count}
          array={scales}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        color={color}
        transparent
        opacity={0.8}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// --- РЕАЛИСТИЧНЫЙ СТЕКАЮЩИЙ ВОСК ---
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
  const [isActive, setIsActive] = useState(false);
  const phase = useMemo(() => Math.random() * 100 + delay, [delay]);
  const startY = useMemo(() => 0.4 + Math.random() * 0.2, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime + phase;
    
    if (dripGroupRef.current) {
      const cycle = (Math.sin(t * 0.2) + 1) / 2;
      
      if (cycle > 0.92 && !isActive) {
        setIsActive(true);
      } else if (cycle < 0.08 && isActive) {
        setIsActive(false);
      }
      
      if (isActive) {
        const flowProgress = Math.min(1, ((t % 15) * 0.1));
        const yPos = (startY - flowProgress * 1.8) * parentScale;
        
        dripGroupRef.current.position.y = yPos;
        dripGroupRef.current.scale.y = 1 + flowProgress * 2; // Растягивается вниз
        dripGroupRef.current.scale.x = Math.max(0.3, 1 - flowProgress * 0.7);
        dripGroupRef.current.scale.z = Math.max(0.3, 1 - flowProgress * 0.7);
        
        dripGroupRef.current.children.forEach((child) => {
          if (child instanceof THREE.Mesh) {
            (child.material as THREE.MeshStandardMaterial).opacity = Math.max(0, 1 - flowProgress * 1.2);
          }
        });
      } else {
        dripGroupRef.current.position.y = startY * parentScale;
        dripGroupRef.current.scale.set(1, 1, 1);
        
        dripGroupRef.current.children.forEach((child) => {
          if (child instanceof THREE.Mesh) {
            (child.material as THREE.MeshStandardMaterial).opacity = 0;
          }
        });
      }
    }
  });

  const xOffset = side * 0.16 * parentScale;
  const zOffset = (Math.random() - 0.5) * 0.12 * parentScale;

  return (
    <group ref={dripGroupRef} position={[xOffset, startY * parentScale, zOffset]}>
      {/* Капля воска - вытянутая форма */}
      <mesh position={[0, 0, 0]}>
        <capsuleGeometry args={[0.025 * parentScale, 0.08 * parentScale, 4, 8]} />
        <meshStandardMaterial 
          color="#4a3020" 
          roughness={0.3} 
          metalness={0.15}
          transparent
          opacity={0}
          emissive="#3a2010"
          emissiveIntensity={0.3}
        />
      </mesh>
      
      {/* Хвостик капли */}
      <mesh position={[0, 0.05 * parentScale, 0]}>
        <sphereGeometry args={[0.015 * parentScale, 8, 8]} />
        <meshStandardMaterial 
          color="#5a4030" 
          roughness={0.25} 
          metalness={0.2}
          transparent
          opacity={0}
          emissive="#3a2010"
          emissiveIntensity={0.2}
        />
      </mesh>
    </group>
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
        
        {/* Золотые частицы - чистая система без артефактов */}
        <CustomSparkles 
          count={100} 
          color="#FFD700" 
          size={0.04} 
          spread={8} 
          speed={0.3}
        />
        
        {/* Магическая пыль (фиолетовая) - мистическое сияние */}
        <CustomSparkles 
          count={80} 
          color="#8b5cf6" 
          size={0.02} 
          spread={6} 
          speed={0.2}
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
