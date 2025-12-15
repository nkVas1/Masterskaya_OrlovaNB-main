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

// --- КОМПОНЕНТ СВЕЧИ ---
function Candle({ position, scale = 1, flickerSpeed = 1 }: { position: [number, number, number], scale?: number, flickerSpeed?: number }) {
  const lightRef = useRef<THREE.PointLight>(null);
  const flameRef = useRef<THREE.Mesh>(null);
  const phase = useMemo(() => Math.random() * 100, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime + phase;
    if (lightRef.current) {
      lightRef.current.intensity = 1.5 + Math.sin(t * 10 * flickerSpeed) * 0.3 + Math.cos(t * 23) * 0.1;
      lightRef.current.position.x = position[0] + Math.sin(t * 2) * 0.02;
    }
    if (flameRef.current) {
      flameRef.current.scale.set(
        1 * scale + Math.sin(t * 15) * 0.1 * scale, 
        1.2 * scale + Math.sin(t * 10) * 0.2 * scale, 
        1 * scale + Math.cos(t * 12) * 0.1 * scale
      );
    }
  });

  return (
    <group position={position}>
      <mesh position={[0, -0.5 * scale, 0]} castShadow>
        <cylinderGeometry args={[0.15 * scale, 0.18 * scale, 1.5 * scale, 16]} />
        <meshStandardMaterial color="#1a0b00" roughness={0.8} emissive="#220a00" emissiveIntensity={0.2}/>
      </mesh>
      <mesh position={[0, 0.25 * scale, 0]}>
        <cylinderGeometry args={[0.01 * scale, 0.01 * scale, 0.1 * scale]} />
        <meshBasicMaterial color="#000" />
      </mesh>
      <mesh ref={flameRef} position={[0, 0.45 * scale, 0]}>
        <sphereGeometry args={[0.06 * scale, 16, 16]} />
        <meshBasicMaterial color={[5, 2, 0.5]} toneMapped={false} />
      </mesh>
      <pointLight ref={lightRef} position={[0, 0.6 * scale, 0]} color="#ff7b00" distance={3} decay={2} castShadow/>
    </group>
  );
}

// --- КОМПОНЕНТ ЗЕРКАЛА ---
function PortalMirror() {
  return (
    <group position={[0, 0.5, -1]}>
      <mesh position={[0, 0, -0.05]}>
        <ringGeometry args={[1.4, 1.8, 64]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.9} metalness={0.5} envMapIntensity={0.5}/>
      </mesh>
      <mesh>
        <circleGeometry args={[1.4, 64]} />
        <MeshDistortMaterial color="#000000" envMapIntensity={1} clearcoat={1} metalness={0.9} roughness={0.1} distort={0.4} speed={0.5}/>
      </mesh>
      <pointLight position={[0, 0, -1]} intensity={5} color="#4b0082" distance={5} />
    </group>
  );
}

// --- УПРАВЛЕНИЕ КАМЕРОЙ С АДАПТАЦИЕЙ ДЛЯ МОБИЛЬНЫХ ---
function Rig() {
  const { camera, mouse, viewport } = useThree();
  const vec = new THREE.Vector3();
  const [deviceOrientation, setDeviceOrientation] = useState({ alpha: 0, beta: 0, gamma: 0 });

  const isMobile = viewport.width < 5;

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

    const cameraZ = isMobile ? 6.5 : 4.5;

    if (deviceOrientation.beta !== 0 || deviceOrientation.gamma !== 0) {
      x = THREE.MathUtils.clamp(deviceOrientation.gamma, -20, 20) * 0.05;
      y = THREE.MathUtils.clamp(deviceOrientation.beta - 45, -20, 20) * 0.05;
    } else {
      x = mouse.x * 0.8;
      y = mouse.y * 0.4;
      
      if (Math.abs(mouse.x) < 0.01 && Math.abs(mouse.y) < 0.01) {
        x = Math.sin(t * 0.2) * 0.2;
        y = Math.cos(t * 0.2) * 0.1;
      }
    }

    camera.position.lerp(vec.set(x, y, cameraZ), 0.05);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

// --- СЦЕНА ---
export default function MagicCandleScene() {
  return (
    <div className="h-[80vh] w-full absolute top-0 left-0 -z-10">
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: false, toneMapping: THREE.ReinhardToneMapping }}>
        <PerspectiveCamera makeDefault position={[0, 0, 4.5]} fov={50} />
        <Environment preset="city" environmentIntensity={0.2} />
        
        <group position={[0, -0.5, 0]}>
          <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
            <PortalMirror />
          </Float>
          
          <Candle position={[-1.8, -0.5, 1.5]} scale={1.2} flickerSpeed={0.8} />
          <Candle position={[1.8, -0.8, 1.2]} scale={1.1} flickerSpeed={1.1} />
          <Candle position={[-0.8, -1.2, 2.5]} scale={0.6} flickerSpeed={1.5} />
          <Candle position={[0.9, -1.1, 2.8]} scale={0.5} flickerSpeed={1.3} />
          <Candle position={[-2.2, -1.0, 0.5]} scale={0.7} flickerSpeed={0.9} />
          <Candle position={[2.1, -0.6, 0]} scale={0.8} flickerSpeed={1.2} />
          <Candle position={[0, -1.5, 3]} scale={0.4} flickerSpeed={2} />

          <Sparkles count={80} scale={8} size={4} speed={0.4} opacity={0.6} color="#FFD700" position={[0, 0, 1]}/>
          <Sparkles count={40} scale={5} size={2} speed={0.2} opacity={0.3} color="#4b0082" position={[0, 0, -1]}/>
        </group>
        
        <Rig />

        <EffectComposer disableNormalPass>
          <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} radius={0.4} />
          <Noise opacity={0.05} /> 
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
