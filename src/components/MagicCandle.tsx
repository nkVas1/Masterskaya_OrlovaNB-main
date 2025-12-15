"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sparkles, Environment, Float } from "@react-three/drei";
import * as THREE from "three";

function CandleMesh() {
  const flameRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (flameRef.current) {
      // Анимация пламени (мерцание и дрожание)
      const t = state.clock.elapsedTime;
      flameRef.current.scale.set(
        1 + Math.sin(t * 10) * 0.05,
        1 + Math.sin(t * 15) * 0.1,
        1 + Math.cos(t * 10) * 0.05
      );
      flameRef.current.position.y = 1.6 + Math.sin(t * 2) * 0.02;
    }
  });

  return (
    <group position={[0, -1, 0]}>
      {/* Тело свечи */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.4, 0.45, 3, 32]} />
        <meshStandardMaterial
          color="#F5DEB3"
          roughness={0.3}
          metalness={0.1}
          emissive="#552200"
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Фитиль */}
      <mesh position={[0, 1.55, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.3]} />
        <meshStandardMaterial color="black" />
      </mesh>

      {/* Пламя (сферы для имитации огня) */}
      <Float speed={5} rotationIntensity={0.2} floatIntensity={0.2}>
        <mesh ref={flameRef} position={[0, 1.7, 0]}>
          <coneGeometry args={[0.15, 0.6, 16]} />
          <meshBasicMaterial color="#FF4500" toneMapped={false} />
        </mesh>
        <pointLight
          position={[0, 1.8, 0]}
          intensity={3}
          color="#FFD700"
          distance={5}
          decay={2}
        />
      </Float>

      {/* Магические частицы вокруг */}
      <Sparkles
        count={50}
        scale={4}
        size={2}
        speed={0.4}
        opacity={0.5}
        color="#FFD700"
        position={[0, 1, 0]}
      />
    </group>
  );
}

export default function MagicCandleScene() {
  return (
    <div className="h-[60vh] w-full absolute top-0 left-0 -z-10 opacity-80 pointer-events-none md:pointer-events-auto">
      <Canvas
        shadows
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true }}
      >
        <ambientLight intensity={0.2} />
        <CandleMesh />
        <Environment preset="night" />
        {/* Туман для глубины */}
        <fog attach="fog" args={["#050505", 3, 10]} />
      </Canvas>
    </div>
  );
}
