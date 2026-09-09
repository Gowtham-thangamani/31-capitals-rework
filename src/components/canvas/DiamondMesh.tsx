"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function createDiamondGeometry() {
  const points = [
    new THREE.Vector2(0.0, 0.68),
    new THREE.Vector2(0.38, 0.68),
    new THREE.Vector2(0.55, 0.42),
    new THREE.Vector2(1.05, 0.16),
    new THREE.Vector2(1.08, 0.08),
    new THREE.Vector2(0.04, -1.38),
    new THREE.Vector2(0.0, -1.42),
  ];
  const geometry = new THREE.LatheGeometry(points, 16);
  geometry.computeVertexNormals();
  return geometry;
}

export function DiamondMesh({
  scale = 1,
  speed = 0.28,
  color = "#ff6418",
}: {
  scale?: number;
  speed?: number;
  color?: string;
}) {
  const group = useRef<THREE.Group>(null);
  const geometry = useMemo(() => createDiamondGeometry(), []);
  const inner = useMemo(() => new THREE.OctahedronGeometry(0.46, 0), []);

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * speed;
    group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.45) * 0.14;
  });

  return (
    <group ref={group} scale={scale} position={[0, 0.22, 0]}>
      <mesh geometry={geometry} castShadow>
        <meshPhysicalMaterial
          color={color}
          emissive="#ff2a00"
          emissiveIntensity={0.85}
          metalness={0.35}
          roughness={0.08}
          transmission={0.22}
          thickness={1.4}
          ior={2.2}
          reflectivity={0.9}
          clearcoat={1}
          clearcoatRoughness={0.06}
          iridescence={0.25}
          iridescenceIOR={1.8}
          flatShading
        />
      </mesh>
      <mesh geometry={inner} scale={[0.95, 1.2, 0.95]}>
        <meshStandardMaterial
          color="#ffb070"
          emissive="#ff4a10"
          emissiveIntensity={2.8}
          transparent
          opacity={0.62}
        />
      </mesh>
      <SparkStar />
    </group>
  );
}

function SparkStar() {
  const mesh = useRef<THREE.Mesh>(null);
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    const spikes = [
      [0, 0.42],
      [0.07, 0.07],
      [0.42, 0],
      [0.07, -0.07],
      [0, -0.42],
      [-0.07, -0.07],
      [-0.42, 0],
      [-0.07, 0.07],
    ];
    shape.moveTo(spikes[0][0], spikes[0][1]);
    spikes.slice(1).forEach(([x, y]) => shape.lineTo(x, y));
    shape.closePath();
    const g = new THREE.ShapeGeometry(shape);
    g.center();
    return g;
  }, []);

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const s = 1 + Math.sin(clock.elapsedTime * 3.6) * 0.12;
    mesh.current.scale.setScalar(s);
  });

  return (
    <mesh ref={mesh} position={[0, 0.32, 1.08]} geometry={geometry}>
      <meshBasicMaterial color="#fff7ed" toneMapped={false} />
    </mesh>
  );
}

export function Crystal({
  position,
  color = "#ff7a28",
  scale = 0.22,
  speed = 0.6,
}: {
  position: [number, number, number];
  color?: string;
  scale?: number;
  speed?: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * speed;
    ref.current.rotation.z += delta * speed * 0.4;
  });
  return (
    <mesh ref={ref} position={position} scale={scale} castShadow>
      <octahedronGeometry args={[1, 0]} />
      <meshPhysicalMaterial
        color={color}
        metalness={0.35}
        roughness={0.08}
        transmission={0.6}
        thickness={1.4}
        ior={1.9}
        emissive={color}
        emissiveIntensity={0.25}
        flatShading
      />
    </mesh>
  );
}

export function GoldRing({
  rotation,
  radius = 1.55,
  speed = 0.2,
  tube = 0.018,
}: {
  rotation: [number, number, number];
  radius?: number;
  speed?: number;
  tube?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.z += delta * speed;
  });
  return (
    <group ref={ref} rotation={rotation}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, tube, 20, 160]} />
        <meshStandardMaterial
          color="#f0c48a"
          metalness={1}
          roughness={0.16}
          emissive="#7a3a12"
          emissiveIntensity={0.35}
        />
      </mesh>
    </group>
  );
}

export function GoldBar({
  position,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow>
      <boxGeometry args={[0.82, 0.16, 0.32]} />
      <meshStandardMaterial color="#e0b15a" metalness={1} roughness={0.22} emissive="#6a3a08" emissiveIntensity={0.2} />
    </mesh>
  );
}

export function Coin({
  position,
  speed = 0.8,
}: {
  position: [number, number, number];
  speed?: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * speed;
    ref.current.rotation.x += delta * speed * 0.15;
  });
  return (
    <mesh ref={ref} position={position} rotation={[0.4, 0.2, 0.1]} castShadow>
      <cylinderGeometry args={[0.22, 0.22, 0.04, 32]} />
      <meshStandardMaterial color="#f2c56d" metalness={1} roughness={0.18} />
    </mesh>
  );
}

export function WireKnot({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.12;
  });
  return (
    <mesh ref={ref} position={position} scale={0.55}>
      <torusKnotGeometry args={[1.1, 0.015, 180, 8, 2, 3]} />
      <meshBasicMaterial color="#ff7a28" transparent opacity={0.28} />
    </mesh>
  );
}
