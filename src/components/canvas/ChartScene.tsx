"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import type { Group } from "three";
import { WebGLBoundary } from "@/components/canvas/WebGLBoundary";

const LEVELS = [0.45, 1.05, 0.62, 1.35, 0.82, 1.55, 0.95, 1.72, 1.18, 0.7, 1.42, 1.08, 1.6, 0.88];

function Candles() {
  const group = useRef<Group>(null);
  const bars = useMemo(
    () =>
      LEVELS.map((h, i) => ({
        x: i * 0.3 - 1.95,
        h,
        up: i % 3 !== 1,
      })),
    [],
  );

  useFrame(({ clock }) => {
    if (group.current) {
      group.current.rotation.y = Math.sin(clock.elapsedTime * 0.28) * 0.22;
      group.current.position.y = Math.sin(clock.elapsedTime * 0.7) * 0.08;
    }
  });

  return (
    <group ref={group} position={[0, -0.1, 0]}>
      {bars.map((b, i) => (
        <group key={i} position={[b.x, b.h / 2 - 0.35, 0]}>
          <mesh>
            <boxGeometry args={[0.16, b.h, 0.16]} />
            <meshStandardMaterial
              color={b.up ? "#ff7a28" : "#6a1c10"}
              emissive={b.up ? "#ff4a10" : "#2a0804"}
              emissiveIntensity={b.up ? 0.85 : 0.25}
              metalness={0.45}
              roughness={0.22}
            />
          </mesh>
          <mesh position={[0, b.h / 2 + 0.14, 0]}>
            <boxGeometry args={[0.035, 0.28, 0.035]} />
            <meshStandardMaterial color="#f0c48a" emissive="#aa6a20" emissiveIntensity={0.4} />
          </mesh>
        </group>
      ))}
      <gridHelper args={[8, 18, "#3a180c", "#1a0c08"]} position={[0, -0.55, 0]} />
    </group>
  );
}

export function ChartScene() {
  return (
    <WebGLBoundary fallback={null}>
      <Canvas camera={{ position: [0.4, 1.1, 4.4], fov: 38 }} dpr={[1, 1.5]} gl={{ alpha: true, antialias: true }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[2, 4, 3]} intensity={1.6} color="#ffd0a8" />
        <pointLight position={[-2, 1, 2]} color="#ff4a12" intensity={16} />
        <Candles />
        <EffectComposer>
          <Bloom luminanceThreshold={0.25} intensity={0.9} mipmapBlur />
        </EffectComposer>
      </Canvas>
    </WebGLBoundary>
  );
}
