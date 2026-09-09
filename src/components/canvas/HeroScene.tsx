"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Sparkles, Text } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { Coin, Crystal, DiamondMesh, GoldBar, GoldRing } from "@/components/canvas/DiamondMesh";
import { WebGLBoundary } from "@/components/canvas/WebGLBoundary";
import { DiamondMark } from "@/components/brand/Logo";

const plasmaVert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const plasmaFrag = /* glsl */ `
uniform float uTime;
varying vec2 vUv;
void main() {
  vec2 p = vUv * 2.0 - 1.0;
  p.x *= 1.6;
  float r = length(p);
  float a = atan(p.y, p.x);
  float w = sin(r * 7.5 - uTime * 1.15) * 0.5 + 0.5;
  float b = sin(a * 5.0 + uTime * 0.55 + r * 5.5) * 0.5 + 0.5;
  float m = smoothstep(1.35, 0.08, r);
  vec3 c1 = vec3(0.015, 0.008, 0.006);
  vec3 c2 = vec3(1.0, 0.28, 0.03);
  vec3 c3 = vec3(1.0, 0.78, 0.38);
  vec3 col = mix(c1, c2, pow(w * m, 1.15));
  col = mix(col, c3, b * m * 0.42);
  col += vec3(1.0, 0.45, 0.12) * (0.18 / (r * 2.4 + 0.18)) * m;
  gl_FragColor = vec4(col, 1.0);
}
`;

function Plasma() {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  useFrame(({ clock }) => {
    if (mat.current) mat.current.uniforms.uTime.value = clock.elapsedTime;
  });
  return (
    <mesh position={[0, 0.2, -5]} scale={[18, 11, 1]}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial ref={mat} uniforms={uniforms} vertexShader={plasmaVert} fragmentShader={plasmaFrag} />
    </mesh>
  );
}

function OrbitLight() {
  const ref = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * 0.55;
    ref.current.position.set(Math.cos(t) * 4.2, 1.4 + Math.sin(t * 1.3) * 0.8, Math.sin(t) * 4.2);
  });
  return <pointLight ref={ref} color="#ff9a40" intensity={48} distance={12} />;
}

function Parallax({ children }: { children: ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const { pointer } = useThree();
  useFrame(() => {
    if (!group.current) return;
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, pointer.x * 0.2, 0.045);
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -pointer.y * 0.1, 0.045);
  });
  return <group ref={group}>{children}</group>;
}

function Scene() {
  return (
    <>
      <color attach="background" args={["#050201"]} />
      <fog attach="fog" args={["#050201", 10, 22]} />
      <Plasma />
      <hemisphereLight color="#ffd4b0" groundColor="#220804" intensity={0.7} />
      <ambientLight intensity={0.5} />
      <spotLight position={[0, 8, 6]} intensity={110} color="#ffe0c0" angle={0.55} penumbra={0.85} />
      <pointLight position={[0, 0.4, 3.2]} intensity={26} color="#ff4a10" />
      <OrbitLight />
      <Parallax>
        <Text
          position={[-2.55, 0.55, -1.6]}
          fontSize={1.85}
          color="#ff6a1a"
          fillOpacity={0.22}
          letterSpacing={-0.08}
          anchorX="center"
        >
          31
        </Text>
        <Text
          position={[2.4, -0.85, -1.8]}
          fontSize={0.38}
          color="#ffc08a"
          fillOpacity={0.28}
          letterSpacing={0.18}
          anchorX="center"
        >
          CAPITALS
        </Text>
        <Float speed={1.15} rotationIntensity={0.18} floatIntensity={0.32}>
          <group position={[0, 0.08, 0]}>
            <DiamondMesh scale={1.95} speed={0.32} />
            <GoldRing rotation={[0.78, 0.12, 0.05]} radius={1.85} speed={0.22} />
            <GoldRing rotation={[-0.5, 0.9, 0.28]} radius={2.28} speed={-0.14} tube={0.014} />
            <GoldRing rotation={[1.2, -0.28, 0.18]} radius={2.72} speed={0.08} tube={0.01} />
          </group>
        </Float>
        <Crystal position={[-2.1, 1.25, 0.4]} scale={0.22} color="#ffb068" />
        <Crystal position={[2.25, 1.05, 0.15]} scale={0.16} color="#ff5a18" speed={0.95} />
        <Crystal position={[-1.85, -0.55, 0.9]} scale={0.14} color="#c91800" />
        <Crystal position={[2.05, -0.7, 0.7]} scale={0.11} color="#ffe0c0" speed={1.2} />
        <GoldBar position={[-2.35, -1.15, 0.55]} rotation={[0.12, 0.6, -0.1]} />
        <GoldBar position={[-2.15, -0.98, 0.38]} rotation={[0.04, 0.25, 0.05]} />
        <GoldBar position={[2.2, -1.12, 0.5]} rotation={[0.1, -0.5, 0.08]} />
        <Coin position={[-1.55, 1.7, 0.2]} speed={0.9} />
        <Coin position={[1.7, 1.55, 0.35]} speed={1.15} />
        <Coin position={[0.95, -1.05, 1.15]} speed={0.7} />
      </Parallax>
      <Sparkles count={160} scale={[14, 8, 8]} size={3.4} speed={0.55} color="#ffb07a" opacity={0.85} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.45, 0]}>
        <circleGeometry args={[10, 72]} />
        <meshStandardMaterial color="#120805" metalness={0.82} roughness={0.28} emissive="#2a0a04" emissiveIntensity={0.25} />
      </mesh>
      <EffectComposer enableNormalPass={false}>
        <Bloom luminanceThreshold={0.18} intensity={1.25} mipmapBlur />
      </EffectComposer>
    </>
  );
}

export function HeroScene() {
  return (
    <WebGLBoundary
      fallback={
        <div className="flex h-full w-full items-center justify-center bg-[#050201]">
          <DiamondMark className="h-[70vh] w-[55vw] max-w-2xl opacity-95" />
        </div>
      }
    >
      <Canvas
        camera={{ position: [0, 0.25, 5.35], fov: 38 }}
        dpr={[1, 1.6]}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        style={{ width: "100%", height: "100%", background: "#050201", display: "block" }}
        onCreated={({ gl }) => gl.setClearColor("#050201", 1)}
      >
        <Scene />
      </Canvas>
    </WebGLBoundary>
  );
}
