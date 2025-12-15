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

// --- КАСТОМНЫЙ ШЕЙДЕР ДЛЯ ПЛАВНОГО РАДИАЛЬНОГО ГРАДИЕНТА ---
const createSmoothGradientMaterial = (color: string, intensity: number) => {
  return new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(color) },
      intensity: { value: intensity }
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform float intensity;
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      void main() {
        // Расстояние от центра сферы (0.0 в центре, 1.0 на краю)
        float dist = length(vPosition);
        
        // Плавный радиальный градиент с затуханием
        // Используем smoothstep для идеально плавного перехода
        float alpha = 1.0 - smoothstep(0.0, 1.0, dist);
        
        // Дополнительное сглаживание краев
        alpha = pow(alpha, 1.8) * intensity;
        
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  });
};

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

// --- ПРОФЕССИОНАЛЬНЫЕ ЧАСТИЦЫ С БЕСШОВНЫМ ГРАДИЕНТОМ ---
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
  
  // Создаём градиентные материалы для разных слоёв интенсивности
  const gradientMaterials = useMemo(() => {
    return [
      createSmoothGradientMaterial(color, 0.95), // Ядро
      createSmoothGradientMaterial(color, 0.75), // Слой 1
      createSmoothGradientMaterial(color, 0.55), // Слой 2
      createSmoothGradientMaterial(color, 0.38), // Слой 3
      createSmoothGradientMaterial(color, 0.25), // Слой 4
      createSmoothGradientMaterial(color, 0.16), // Слой 5
      createSmoothGradientMaterial(color, 0.10), // Слой 6
      createSmoothGradientMaterial(color, 0.06), // Слой 7
      createSmoothGradientMaterial(color, 0.03), // Слой 8
    ];
  }, [color]);
  
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      initialPos: [
        (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * spread
      ] as [number, number, number],
      velocity: [
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.01
      ] as [number, number, number],
      scale: 0.7 + Math.random() * 0.6,
      phase: Math.random() * Math.PI * 2,
      flickerSpeed: 0.8 + Math.random() * 0.4
    }));
  }, [count, spread]);

  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.elapsedTime * speed;
      
      groupRef.current.children.forEach((child, i) => {
        const particle = particles[i];
        
        const offsetX = particle.initialPos[0] + Math.sin(t * particle.flickerSpeed + particle.phase) * 0.2;
        const offsetY = particle.initialPos[1] + Math.cos(t * particle.flickerSpeed * 0.75 + particle.phase) * 0.2;
        const offsetZ = particle.initialPos[2] + Math.sin(t * particle.flickerSpeed * 0.55 + particle.phase) * 0.14;
        
        child.position.set(
          offsetX + particle.velocity[0] * t,
          offsetY + particle.velocity[1] * t,
          offsetZ + particle.velocity[2] * t
        );
        
        if (Math.abs(child.position.x) > spread * 0.6) particle.velocity[0] *= -1;
        if (Math.abs(child.position.y) > spread * 0.6) particle.velocity[1] *= -1;
        if (Math.abs(child.position.z) > spread * 0.6) particle.velocity[2] *= -1;
        
        // Мерцание через обновление uniform'ов шейдера
        if (child instanceof THREE.Group) {
          const baseFlicker = 0.7 + Math.sin(t * 2.1 * particle.flickerSpeed + particle.phase) * 0.3;
          
          child.children.forEach((mesh) => {
            if (mesh instanceof THREE.Mesh && mesh.material instanceof THREE.ShaderMaterial) {
              mesh.material.uniforms.intensity.value = mesh.userData.baseIntensity * baseFlicker;
            }
          });
        }
      });
      
      groupRef.current.rotation.y = t * 0.03;
    }
  });

  // Размеры слоёв с оптимальным распределением для плавного перехода
  const layerSizes = [0.35, 0.7, 1.2, 1.9, 2.9, 4.2, 6.0, 8.5, 12.0];

  return (
    <group ref={groupRef} position={position}>
      {particles.map((particle, i) => (
        <group key={i} position={particle.initialPos}>
          {layerSizes.map((layerSize, idx) => {
            const material = gradientMaterials[idx].clone();
            const intensity = [0.95, 0.75, 0.55, 0.38, 0.25, 0.16, 0.10, 0.06, 0.03][idx];
            
            return (
              <mesh 
                key={idx}
                userData={{ baseIntensity: intensity }}
              >
                <sphereGeometry args={[size * particle.scale * layerSize, 16, 16]} />
                <primitive object={material} attach="material" />
              </mesh>
            );
          })}
        </group>
      ))}
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
        
        {/* Золотые частицы - 11 слоев плавного затухания */}
        <CustomSparkles 
          count={140} 
          color="#FFD700" 
          size={0.0095} 
          spread={8.5} 
          speed={0.28}
          position={[0, 0.25, 0.1]}
        />
        
        {/* Фиолетовая магическая пыльца - крохотные микрочастицы */}
        <CustomSparkles 
          count={120} 
          color="#a855f7" 
          size={0.0028} 
          spread={7} 
          speed={0.15}
          position={[0, -0.05, -0.9]}
        />
        
        <CinematicRig />

        {/* Кинематографичная пост-обработка */}
        <EffectComposer enableNormalPass={false}>
          <Bloom 
            luminanceThreshold={0.8} 
            mipmapBlur 
            intensity={2.5} 
            radius={0.85}
            levels={9}
          />
          <DepthOfField 
            focusDistance={0.015} 
            focalLength={0.04} 
            bokehScale={2}
            height={480}
          />
          <ChromaticAberration 
            offset={new THREE.Vector2(0.0008, 0.0008)}
            radialModulation={false}
            modulationOffset={0}
            blendFunction={BlendFunction.NORMAL}
          />
          <Noise opacity={0.04} />
          <Vignette eskil={false} offset={0.2} darkness={1.25} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
