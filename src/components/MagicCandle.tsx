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

// --- КОМПОНЕНТ АНИМИРОВАННЫХ КАПЕЛЬ ВОСКА ---
function WaxDrip({ 
  parentScale, 
  side = 0, 
  delay = 0 
}: { 
  parentScale: number, 
  side?: number, 
  delay?: number 
}) {
  const dripRef = useRef<THREE.Mesh>(null);
  const [isActive, setIsActive] = useState(false);
  const phase = useMemo(() => Math.random() * 100 + delay, [delay]);

  useFrame((state) => {
    const t = state.clock.elapsedTime + phase;
    
    if (dripRef.current) {
      // Периодическое появление и стекание капель
      const cycle = (Math.sin(t * 0.3) + 1) / 2; // 0 to 1
      
      if (cycle > 0.95) {
        setIsActive(true);
      } else if (cycle < 0.05) {
        setIsActive(false);
      }
      
      if (isActive) {
        // Капля медленно стекает вниз
        const flowProgress = Math.min(1, (t % 10) * 0.15);
        dripRef.current.position.y = 0.3 * parentScale - flowProgress * 1.2 * parentScale;
        dripRef.current.scale.setScalar(1 - flowProgress * 0.5);
        (dripRef.current.material as THREE.MeshStandardMaterial).opacity = 1 - flowProgress * 0.7;
      } else {
        dripRef.current.position.y = 0.3 * parentScale;
        dripRef.current.scale.setScalar(1);
        (dripRef.current.material as THREE.MeshStandardMaterial).opacity = 0;
      }
    }
  });

  const xOffset = side * 0.15 * parentScale;
  const zOffset = (Math.random() - 0.5) * 0.1 * parentScale;

  return (
    <mesh ref={dripRef} position={[xOffset, 0.3 * parentScale, zOffset]}>
      <sphereGeometry args={[0.04 * parentScale, 8, 12]} />
      <meshStandardMaterial 
        color="#4a3020" 
        roughness={0.4} 
        metalness={0.1}
        transparent
        opacity={0}
        emissive="#2a1505"
        emissiveIntensity={0.2}
      />
    </mesh>
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
  );
}

// --- ДРЕВЕСНОЕ ЗЕРКАЛО-ПОРТАЛ С МАГИЕЙ ---
function CinematicPortalMirror() {
  const mirrorRef = useRef<THREE.Mesh>(null);
  const portalRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    
    // Динамичное искажение зеркала
    if (mirrorRef.current && mirrorRef.current.material) {
      const material = mirrorRef.current.material as any;
      if (material.distort !== undefined) {
        material.distort = 0.45 + Math.sin(t * 0.6) * 0.15;
      }
    }
    
    // Портальная энергия
    if (portalRef.current) {
      portalRef.current.rotation.z = t * 0.1;
      (portalRef.current.material as THREE.MeshBasicMaterial).opacity = 0.15 + Math.sin(t * 2) * 0.05;
    }
  });

  return (
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

      {/* Портальное свечение за зеркалом */}
      <mesh ref={portalRef} position={[0, 0, -0.1]}>
        <ringGeometry args={[1.1, 1.35, 64]} />
        <meshBasicMaterial 
          color="#6a2d9e" 
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Зеркальная поверхность с сильным искажением */}
      <mesh ref={mirrorRef}>
        <circleGeometry args={[1.4, 64]} />
        <MeshDistortMaterial 
          color="#000000" 
          envMapIntensity={1.5} 
          clearcoat={1} 
          clearcoatRoughness={0}
          metalness={1} 
          roughness={0} 
          distort={0.45} 
          speed={0.6}
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
        
        {/* Золотые частицы */}
        <Sparkles 
          count={80} 
          scale={8} 
          size={4} 
          speed={0.4} 
          opacity={0.6} 
          color="#FFD700" 
          position={[0, 0, 1]}
        />
        
        {/* Магическая пыль (фиолетовая) - очень мелкая */}
        <Sparkles 
          count={50} 
          scale={5} 
          size={0.8} 
          speed={0.2} 
          opacity={0.25} 
          color="#4b0082" 
          position={[0, 0, -1]}
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
