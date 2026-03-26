import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars, Sphere, MeshDistortMaterial, Float, Text } from '@react-three/drei';
import * as THREE from 'three';

interface PlanetProps {
  position: [number, number, number];
  size: number;
  color: string;
  label: string;
  rotationSpeed?: number;
}

const Planet = ({ position, size, color, label, rotationSpeed = 0.005 }: PlanetProps) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += rotationSpeed;
    }
  });

  return (
    <group position={position}>
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
        <Sphere ref={meshRef} args={[size, 32, 32]}>
          <meshStandardMaterial color={color} roughness={0.7} metalness={0.3} />
        </Sphere>
      </Float>
      <Text
        position={[0, size + 1, 0]}
        fontSize={0.5}
        color="white"
        anchorX="center"
        anchorY="middle"
        font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKOBj2VuDX6MjrV_S6Bw.woff"
      >
        {label}
      </Text>
    </group>
  );
};

interface SpaceSceneProps {
  zoom: number; // 0 to 100
}

export const SpaceScene = ({ zoom }: SpaceSceneProps) => {
  // Map zoom to camera Z position
  // zoom 0 (Present) -> Camera close to Earth (Z = 10)
  // zoom 100 (Past) -> Camera far away (Z = 500)
  const cameraZ = useMemo(() => 10 + zoom * 5, [zoom]);

  useFrame((state) => {
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, cameraZ, 0.1);
    state.camera.lookAt(0, 0, 0);
  });

  return (
    <>
      <color attach="background" args={['#000000']} />
      <ambientLight intensity={0.5} />
      <pointLight position={[100, 100, 100]} intensity={2} />
      <Stars radius={300} depth={60} count={20000} factor={7} saturation={0} fade speed={1} />

      {/* Earth - The Centerpiece */}
      <Planet position={[0, 0, 0]} size={3} color="#2b5d9b" label="Earth" rotationSpeed={0.01} />

      {/* Moon */}
      <Planet position={[8, 2, -5]} size={0.8} color="#888888" label="Moon" rotationSpeed={0.02} />

      {/* Sun - Far away */}
      <Planet position={[0, 0, -150]} size={20} color="#f9d71c" label="Sun" rotationSpeed={0.001} />

      {/* Other Planets at different distances to simulate "traveling back in time" */}
      <Planet position={[20, -10, -40]} size={1.5} color="#e27b58" label="Mars" />
      <Planet position={[-30, 15, -80]} size={5} color="#d39c7e" label="Jupiter" />
      <Planet position={[40, -5, -120]} size={4} color="#c5ab6e" label="Saturn" />
      <Planet position={[-50, -20, -180]} size={2.5} color="#b2d1d4" label="Uranus" />
      <Planet position={[60, 10, -240]} size={2.5} color="#3f54ba" label="Neptune" />
      
      {/* Distant Stars/Galaxies as placeholders for deep time */}
      {Array.from({ length: 10 }).map((_, i) => (
        <Planet 
          key={i}
          position={[
            (Math.random() - 0.5) * 200,
            (Math.random() - 0.5) * 200,
            -300 - i * 50
          ]}
          size={0.5}
          color="#ffffff"
          label={`Galaxy ${i + 1}`}
        />
      ))}
    </>
  );
};
