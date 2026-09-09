"use client";

import { Canvas } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { Crystal, DiamondMesh, GoldRing } from "@/components/canvas/DiamondMesh";
import { WebGLBoundary } from "@/components/canvas/WebGLBoundary";
import { DiamondMark } from "@/components/brand/Logo";

function Scene() {
  return (
    <>
      <color attach="background" args={["#040404"]} />
      <hemisphereLight color="#ffd4b0" groundColor="#1a0602" intensity={0.5} />
      <ambientLight intensity={0.4} />
      <spotLight position={[3, 6, 5]} intensity={80} color="#ffc08a" angle={0.48} penumbra={1} />
      <pointLight position={[-2, 1, 2]} intensity={26} color="#ff4a12" />
      <Float speed={2.1} floatIntensity={0.4} rotationIntensity={0.24}>
        <DiamondMesh scale={1.8} speed={0.62} />
        <GoldRing rotation={[0.9, 0.15, 0]} radius={1.75} speed={0.4} />
        <GoldRing rotation={[-0.4, 0.7, 0.2]} radius={2.15} speed={-0.26} />
        <GoldRing rotation={[0.2, 1.1, 0.5]} radius={2.5} speed={0.14} tube={0.01} />
      </Float>
      <Crystal position={[-1.6, 0.7, 0.2]} scale={0.16} />
      <Crystal position={[1.7, -0.55, 0.3]} scale={0.12} color="#ffb070" speed={1} />
      <EffectComposer enableNormalPass={false}>
        <Bloom luminanceThreshold={0.24} intensity={1.05} mipmapBlur />
      </EffectComposer>
    </>
  );
}

export function PreloaderScene() {
  return (
    <WebGLBoundary fallback={<DiamondMark className="h-40 w-auto animate-pulse" />}>
      <Canvas
        camera={{ position: [0, 0.2, 4.6], fov: 38 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false }}
        style={{ background: "#040404" }}
        onCreated={({ gl }) => gl.setClearColor("#040404", 1)}
      >
        <Scene />
      </Canvas>
    </WebGLBoundary>
  );
}
