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

// --- УЛУЧШЕННАЯ СВЕЧА С ДЕТАЛЯМИ ---
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
  const glowRef = useRef<THREE.Mesh>(null);
  const phase = useMemo(() => Math.random() * 100, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime + phase;
    
    // Реалистичное мерцание света
    if (lightRef.current) {
      const flicker = Math.sin(t * 10 * flickerSpeed) * 0.3 + 
                      Math.cos(t * 23) * 0.15 + 
                      Math.sin(t * 7) * 0.1;
      lightRef.current.intensity = 2.5 + flicker;
      lightRef.current.position.x = position[0] + Math.sin(t * 2) * 0.03;
      lightRef.current.position.y = 0.8 * scale + Math.cos(t * 3) * 0.02;
    }
    
    // Органичная анимация пламени
    if (flameRef.current) {
      flameRef.current.scale.set(
        0.8 * scale + Math.sin(t * 15) * 0.15 * scale, 
        1.4 * scale + Math.sin(t * 10) * 0.25 * scale, 
        0.8 * scale + Math.cos(t * 12) * 0.1 * scale
      );
      flameRef.current.rotation.z = Math.sin(t * 5) * 0.1;
      flameRef.current.position.y = 0.55 * scale + Math.sin(t * 8) * 0.02;
    }
    
    // Мягкое свечение вокруг пламени
    if (glowRef.current) {
      glowRef.current.scale.set(
        1.2 + Math.sin(t * 8) * 0.2,
        1.2 + Math.cos(t * 10) * 0.2,
        1.2 + Math.sin(t * 6) * 0.2
      );
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.3 + Math.sin(t * 5) * 0.1;
    }
  });

  return (
    <group position={position}>
      {/* Основа свечи - более детализированная */}
      <mesh position={[0, -0.4 * scale, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.18 * scale, 0.2 * scale, 1.8 * scale, 32]} />
        <meshStandardMaterial 
          color="#2a1505" 
          roughness={0.75} 
          metalness={0.1}
          emissive="#1a0800" 
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* Капли воска */}
      {waxDrips && (
        <>
          <mesh position={[0.12 * scale, -0.2 * scale, 0.05 * scale]} castShadow>
            <sphereGeometry args={[0.05 * scale, 8, 8]} />
            <meshStandardMaterial color="#3d2010" roughness={0.6} metalness={0.2} />
          </mesh>
          <mesh position={[-0.1 * scale, 0.1 * scale, -0.08 * scale]} castShadow>
            <sphereGeometry args={[0.04 * scale, 8, 8]} />
            <meshStandardMaterial color="#3d2010" roughness={0.6} metalness={0.2} />
          </mesh>
        </>
      )}

      {/* Фитиль */}
      <mesh position={[0, 0.35 * scale, 0]}>
        <cylinderGeometry args={[0.015 * scale, 0.015 * scale, 0.15 * scale]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.9} />
      </mesh>

      {/* Внутреннее ядро пламени (яркое) */}
      <mesh ref={flameRef} position={[0, 0.5 * scale, 0]}>
        <coneGeometry args={[0.12 * scale, 0.4 * scale, 8]} />
        <meshBasicMaterial color={[8, 4, 1]} toneMapped={false} />
      </mesh>

      {/* Внешнее свечение пламени */}
      <mesh ref={glowRef} position={[0, 0.5 * scale, 0]}>
        <sphereGeometry args={[0.15 * scale, 16, 16]} />
        <meshBasicMaterial 
          color={[3, 1.5, 0.3]} 
          transparent 
          opacity={0.35}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Точечный источник света с тенями */}
      <pointLight 
        ref={lightRef} 
        position={[0, 0.8 * scale, 0]} 
        color="#ff8c00" 
        intensity={2.5}
        distance={4} 
        decay={2} 
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-bias={-0.0001}
      />

      {/* Мягкий заполняющий свет снизу */}
      <pointLight 
        position={[0, -0.5 * scale, 0]} 
        color="#ff6600" 
        intensity={0.3}
        distance={1.5}
      />
    </group>
  );
}

// --- УЛУЧШЕННОЕ ЗЕРКАЛО-ПОРТАЛ ---
function CinematicPortalMirror() {
  const mirrorRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (mirrorRef.current && mirrorRef.current.material) {
      const material = mirrorRef.current.material as any;
      if (material.distort !== undefined) {
        material.distort = 0.35 + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
      }
    }
  });

  return (
    <group position={[0, 0.5, -1.2]}>
      {/* Внешняя рама - более массивная */}
      <mesh position={[0, 0, -0.08]} castShadow receiveShadow>
        <ringGeometry args={[1.35, 1.85, 64]} />
        <meshStandardMaterial 
          color="#0d0d0d" 
          roughness={0.85} 
          metalness={0.6} 
          envMapIntensity={0.7}
        />
      </mesh>

      {/* Внутренняя рама с гравировкой */}
      <mesh position={[0, 0, -0.04]} castShadow>
        <ringGeometry args={[1.3, 1.4, 64]} />
        <meshStandardMaterial 
          color="#1a1410" 
          roughness={0.7} 
          metalness={0.3}
          emissive="#442200"
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Зеркальная поверхность с искажением */}
      <mesh ref={mirrorRef}>
        <circleGeometry args={[1.3, 64]} />
        <MeshDistortMaterial 
          color="#050505" 
          envMapIntensity={1.2} 
          clearcoat={1} 
          clearcoatRoughness={0.1}
          metalness={0.95} 
          roughness={0.05} 
          distort={0.35} 
          speed={0.4}
        />
      </mesh>

      {/* Магическая подсветка портала */}
      <pointLight 
        position={[0, 0, -1.5]} 
        intensity={6} 
        color="#5a1d7e" 
        distance={6}
        decay={2}
      />
      
      {/* Rim light для объема */}
      <pointLight 
        position={[0, 2, -0.5]} 
        intensity={2} 
        color="#7a3a9e" 
        distance={4}
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
        
        {/* Магические частицы */}
        <Sparkles 
          count={100} 
          scale={10} 
          size={3} 
          speed={0.3} 
          opacity={0.5} 
          color="#FFD700" 
          position={[0, 0.5, 0]}
        />
        <Sparkles 
          count={60} 
          scale={6} 
          size={2} 
          speed={0.15} 
          opacity={0.35} 
          color="#8b5cf6" 
          position={[0, 0, -0.5]}
        />
        
        <CinematicRig />

        {/* Кинематографичная пост-обработка */}
        <EffectComposer disableNormalPass>
          <Bloom 
            luminanceThreshold={0.9} 
            mipmapBlur 
            intensity={1.8} 
            radius={0.6}
            levels={8}
          />
          <DepthOfField 
            focusDistance={0.02} 
            focalLength={0.05} 
            bokehScale={3}
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
