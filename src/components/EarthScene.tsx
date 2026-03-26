import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Sphere, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'motion/react';
import { EffectComposer, Bloom, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';

// ==========================================
// 1. STABLE 2D FALLBACK (Never crashes)
// ==========================================
const Earth2D = ({ scale = 1 }: { scale?: number }) => (
  <div className="w-full h-full absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden bg-[#020205]">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#0a0a1a_0%,_transparent_100%)] opacity-60" />
    <div className="absolute inset-0 opacity-40">
      {[...Array(80)].map((_, i) => (
        <div key={i} className="absolute bg-white rounded-full" style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, width: `${Math.random() * 1.5 + 0.5}px`, height: `${Math.random() * 1.5 + 0.5}px`, opacity: Math.random() * 0.7 + 0.3 }} />
      ))}
    </div>
    <div className="absolute -top-40 -right-40 w-[800px] h-[800px] bg-orange-500/5 rounded-full blur-[150px]" />
    <motion.div animate={{ scale }} transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }} className="relative w-72 h-72 md:w-[520px] md:h-[520px] rounded-full">
      <div className="absolute inset-0 rounded-full bg-cover bg-center shadow-[0_0_80px_rgba(76,169,255,0.15)]" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?q=80&w=1000&auto=format&fit=crop')", backgroundSize: '110%' }} />
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,_transparent_20%,_rgba(0,0,0,0.85)_85%)]" />
      <div className="absolute inset-0 rounded-full opacity-40 mix-blend-screen" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/stardust.png')", backgroundSize: '200px' }} />
      <div className="absolute -inset-4 rounded-full border border-blue-400/10 blur-xl" />
      <div className="absolute -inset-10 rounded-full bg-blue-500/5 blur-3xl" />
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 240, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-full opacity-20 pointer-events-none" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/clouds.png')", backgroundSize: '400px' }} />
    </motion.div>
    <div className="absolute w-72 h-72 md:w-[520px] md:h-[520px] rounded-full pointer-events-none shadow-[inset_10px_10px_40px_rgba(255,255,255,0.1)] opacity-50" />
  </div>
);

// ==========================================
// 2. ERROR BOUNDARY (Prevents White Screens)
// ==========================================
class WebGLErrorBoundary extends React.Component<{ children: React.ReactNode, fallback: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode, fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any) {
    console.warn("3D Earth crashed, falling back to 2D:", error);
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

// ==========================================
// 3. OPTIMIZED 3D EARTH (Manual Texture Loading)
// ==========================================
const Earth3D = ({ scale = 1 }: { scale?: number }) => {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  
  const [textures, setTextures] = useState<{ map: THREE.Texture | null, clouds: THREE.Texture | null }>({ map: null, clouds: null });

  // Load textures manually to avoid React Suspense throwing errors that crash the app
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    let isMounted = true;

    Promise.all([
      new Promise<THREE.Texture | null>(res => loader.load('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg', res, undefined, () => res(null))),
      new Promise<THREE.Texture | null>(res => loader.load('https://unpkg.com/three-globe/example/img/earth-clouds.png', res, undefined, () => res(null)))
    ]).then(([map, clouds]) => {
      if (isMounted) setTextures({ map, clouds });
    });

    return () => { isMounted = false; };
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (earthRef.current) earthRef.current.rotation.y = t * 0.05;
    if (cloudsRef.current) cloudsRef.current.rotation.y = t * 0.06;
  });

  return (
    <group scale={scale * 2.5}>
      {/* Earth Sphere */}
      <Sphere ref={earthRef} args={[1, 48, 48]}>
        {textures.map ? (
          <meshStandardMaterial map={textures.map} roughness={0.8} metalness={0.1} />
        ) : (
          <meshStandardMaterial color="#0a2a4a" roughness={0.8} /> // Fallback color if texture fails
        )}
      </Sphere>

      {/* Clouds Sphere */}
      {textures.clouds && (
        <Sphere ref={cloudsRef} args={[1.015, 48, 48]}>
          <meshStandardMaterial map={textures.clouds} transparent opacity={0.4} depthWrite={false} blending={THREE.AdditiveBlending} />
        </Sphere>
      )}

      {/* Atmosphere Glow */}
      <Sphere args={[1.05, 32, 32]}>
        <meshBasicMaterial color="#4ca9ff" transparent opacity={0.1} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </Sphere>
    </group>
  );
};

// ==========================================
// 3.5. GENERATIVE ART PARTICLE ENGINE (GLSL Vector Fields)
// ==========================================
const ParticleBackground = () => {
  const count = 30000; // High density point cloud
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  const [positions, sizes, randoms] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const rnd = new Float32Array(count);
    for(let i = 0; i < count; i++) {
      // Distribute in a wide spherical/cylindrical volume
      const r = 50 + Math.random() * 150;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      pos[i*3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i*3+1] = (Math.random() - 0.5) * 100; // Flatter y-axis
      pos[i*3+2] = r * Math.sin(phi) * Math.sin(theta);
      
      sz[i] = Math.random() * 2.0 + 0.5;
      rnd[i] = Math.random();
    }
    return [pos, sz, rnd];
  }, [count]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  const vertexShader = `
    uniform float uTime;
    attribute float aSize;
    attribute float aRandom;
    varying float vAlpha;
    varying vec3 vColor;

    // Pseudo Curl Noise / Vector Field Approximation
    vec3 vectorField(vec3 p) {
        float t = uTime * 0.15;
        float x = sin(p.y * 0.05 + t) * cos(p.z * 0.05 + t);
        float y = sin(p.z * 0.05 + t) * cos(p.x * 0.05 + t);
        float z = sin(p.x * 0.05 + t) * cos(p.y * 0.05 + t);
        return vec3(x, y, z);
    }

    void main() {
        vec3 pos = position;
        
        // Apply Vector Field Displacement (Non-linear differential vector field)
        vec3 flow = vectorField(pos);
        pos += flow * 20.0 * aRandom;

        // Orbital rotation around Y axis
        float angle = uTime * 0.05 * (aRandom * 0.5 + 0.5);
        float s = sin(angle);
        float c = cos(angle);
        mat2 rot = mat2(c, -s, s, c);
        pos.xz = rot * pos.xz;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        
        // Frustum Fitting & Perspective Size
        gl_PointSize = aSize * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
        
        // Dynamic Alpha & Color based on depth and noise
        float depthFade = smoothstep(200.0, 20.0, -mvPosition.z);
        float pulse = (sin(uTime * 2.0 + aRandom * 10.0) + 1.0) * 0.5;
        vAlpha = depthFade * (0.3 + pulse * 0.7);
        
        // Color mapping (ACES Filmic ready)
        vec3 colorA = vec3(0.1, 0.4, 1.0); // Deep Blue
        vec3 colorB = vec3(0.0, 0.8, 1.0); // Cyan
        vec3 colorC = vec3(1.0, 0.3, 0.1); // Orange accent
        
        float mixVal = sin(pos.x * 0.02 + uTime * 0.2) * 0.5 + 0.5;
        vColor = mix(mix(colorA, colorB, aRandom), colorC, mixVal * 0.3);
    }
  `;

  const fragmentShader = `
    varying float vAlpha;
    varying vec3 vColor;
    
    void main() {
        // Soft circular particle
        vec2 xy = gl_PointCoord.xy - vec2(0.5);
        float ll = length(xy);
        if (ll > 0.5) discard;
        
        // Gaussian-like glow
        float glow = exp(-ll * 6.0);
        
        gl_FragColor = vec4(vColor * glow * 1.5, vAlpha * glow);
    }
  `;

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aSize" count={count} array={sizes} itemSize={1} />
        <bufferAttribute attach="attributes-aRandom" count={count} array={randoms} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{ uTime: { value: 0 } }}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </points>
  );
};

// ==========================================
// 4. MAIN SCENE COMPONENT
// ==========================================
export const EarthScene = ({ scale = 1 }: { scale?: number }) => {
  const [isWebGL, setIsWebGL] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      if (!window.WebGLRenderingContext || (!canvas.getContext('webgl') && !canvas.getContext('experimental-webgl'))) {
        setIsWebGL(false);
      }
    } catch (e) {
      setIsWebGL(false);
    }
  }, []);

  if (!isWebGL) {
    return <Earth2D scale={scale} />;
  }

  return (
    <div className="w-full h-full absolute inset-0 z-0 bg-[#020205]">
      <WebGLErrorBoundary fallback={<Earth2D scale={scale} />}>
        <Canvas 
          dpr={[1, 1]} // STRICTLY limit DPR to 1 to prevent mobile/retina crashes
          gl={{ antialias: false, powerPreference: "low-power" }} // Optimize for stability
          camera={{ position: [0, 0, 10], fov: 40 }}
          onError={() => setIsWebGL(false)}
        >
          <color attach="background" args={['#020205']} />
          
          <ambientLight intensity={0.2} />
          <pointLight position={[20, 10, -20]} intensity={15} color="#ffeedd" distance={200} />
          
          {/* Sun Glow */}
          <Sphere position={[20, 10, -20]} args={[2, 16, 16]}>
            <meshBasicMaterial color="#ffeedd" />
          </Sphere>
          
          <ParticleBackground />

          <Earth3D scale={scale} />

          <OrbitControls 
            enableZoom={false} 
            enablePan={false} 
            enableRotate={true}
            autoRotate={false}
            rotateSpeed={0.5}
          />

          {/* Post-Processing (后期重映射管线) */}
          <EffectComposer disableNormalPass multisampling={0}>
            <Bloom luminanceThreshold={0.2} mipmapBlur intensity={1.5} />
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          </EffectComposer>
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  );
};

