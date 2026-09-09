"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line, Stars } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";
import { LAND_DOTS } from "@/lib/land-dots";
import { WebGLBoundary } from "@/components/canvas/WebGLBoundary";

const RADIUS = 1.6;
const DOT_RADIUS = RADIUS * 1.004;
const ARC_COUNT = 9;

function latLngToVec3(lat: number, lng: number, r: number, target = new THREE.Vector3()) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return target.set(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

/** Continents as a dot matrix. One InstancedMesh, so ~5.5k dots cost a single draw call. */
function LandDots() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const count = LAND_DOTS.length / 2;

  useLayoutEffect(() => {
    if (!mesh.current) return;
    const dummy = new THREE.Object3D();
    const pos = new THREE.Vector3();

    for (let i = 0; i < count; i++) {
      latLngToVec3(LAND_DOTS[i * 2], LAND_DOTS[i * 2 + 1], DOT_RADIUS, pos);
      dummy.position.copy(pos);
      dummy.lookAt(0, 0, 0); // lie each disc flat against the sphere
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
      <circleGeometry args={[0.0125, 6]} />
      <meshBasicMaterial color="#ff8434" side={THREE.DoubleSide} toneMapped={false} />
    </instancedMesh>
  );
}

/** Evenly spread anchor points — index-derived, not tied to any real place. */
function spiralPoints(count: number, radius: number) {
  const golden = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: count }, (_, i) => {
    const y = 1 - (i / (count - 1)) * 2;
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    return new THREE.Vector3(Math.cos(theta) * ring, y, Math.sin(theta) * ring).multiplyScalar(radius);
  });
}

function Pulse({ curve, delay }: { curve: THREE.QuadraticBezierCurve3; delay: number }) {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const t = (clock.elapsedTime * 0.22 + delay) % 1;
    curve.getPointAt(t, mesh.current.position);
    mesh.current.scale.setScalar(0.4 + Math.sin(t * Math.PI) * 1.0);
  });
  return (
    <mesh ref={mesh}>
      <sphereGeometry args={[0.024, 12, 12]} />
      <meshBasicMaterial color="#fff0dd" toneMapped={false} />
    </mesh>
  );
}

function Globe() {
  const group = useRef<THREE.Group>(null);

  const links = useMemo(() => {
    const anchors = spiralPoints(ARC_COUNT * 2, RADIUS * 1.01);
    const out: { curve: THREE.QuadraticBezierCurve3; points: THREE.Vector3[]; delay: number }[] = [];
    for (let i = 0; i < ARC_COUNT; i++) {
      const a = anchors[i];
      const b = anchors[(i + 5) % anchors.length];
      const lift = 1 + a.distanceTo(b) * 0.17;
      const mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(RADIUS * lift);
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      out.push({ curve, points: curve.getPoints(48), delay: i / ARC_COUNT });
    }
    return out;
  }, []);

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.075;
  });

  return (
    <group ref={group} rotation={[0.32, 0.4, 0.08]}>
      {/* Opaque body: hides the dots on the far hemisphere so it reads as a solid globe */}
      <mesh>
        <sphereGeometry args={[RADIUS, 64, 64]} />
        <meshBasicMaterial color="#0a0402" />
      </mesh>

      <LandDots />

      {/* Rim glow */}
      <mesh>
        <sphereGeometry args={[RADIUS * 1.045, 48, 48]} />
        <meshBasicMaterial color="#ff5a14" transparent opacity={0.09} side={THREE.BackSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[RADIUS * 1.16, 32, 32]} />
        <meshBasicMaterial color="#ff7a28" transparent opacity={0.05} side={THREE.BackSide} />
      </mesh>

      {links.map((link, i) => (
        <group key={`arc-${i}`}>
          <Line points={link.points} color="#ffa860" lineWidth={1} transparent opacity={0.42} />
          <Pulse curve={link.curve} delay={link.delay} />
        </group>
      ))}
    </group>
  );
}

export function GlobeScene() {
  return (
    <WebGLBoundary
      fallback={
        <div className="flex h-full items-center justify-center text-sm text-white/50">Markets worldwide</div>
      }
    >
      <Canvas camera={{ position: [0, 0.2, 4.15], fov: 40 }} dpr={[1, 1.6]} gl={{ alpha: true, antialias: true }}>
        <ambientLight intensity={0.6} />
        <Stars radius={26} depth={22} count={160} factor={2.4} fade speed={0.7} />
        <Globe />
        <EffectComposer>
          <Bloom luminanceThreshold={0.18} intensity={1.15} mipmapBlur />
        </EffectComposer>
      </Canvas>
    </WebGLBoundary>
  );
}
