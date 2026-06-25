'use client';

import { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars } from '@react-three/drei';
import {
  EffectComposer,
  Bloom,
  Glitch,
} from '@react-three/postprocessing';
import * as THREE from 'three';
import { useRealityStore } from '@/store/realityStore';

const RelativePathway = ({
  currentPos,
  targetPos,
}: {
  currentPos: THREE.Vector3;
  targetPos: THREE.Vector3;
}) => {
  const lineRef = useRef<any>(null);

  useFrame((state) => {
    if (lineRef.current) {
      const material = lineRef.current.material as THREE.LineBasicMaterial;
      material.opacity = 0.3 + Math.sin(state.clock.getElapsedTime() * 4) * 0.2;
    }
  });

  const points = useMemo(
    () => [currentPos, targetPos],
    [currentPos, targetPos]
  );
  const lineGeometry = useMemo(
    () => new THREE.BufferGeometry().setFromPoints(points),
    [points]
  );

  useEffect(() => {
    return () => lineGeometry.dispose();
  }, [lineGeometry]);

  return (
    <line ref={lineRef}>
      <primitive object={lineGeometry} attach="geometry" />
      <lineBasicMaterial color="#a855f7" transparent opacity={0.5} />
    </line>
  );
};

const RealityNodes = ({
  currentPos,
  targetPos,
  entropy,
  phaseLock,
  theme,
}: {
  currentPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  entropy: number;
  phaseLock: boolean;
  theme: 'light' | 'dark';
}) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.03;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh position={currentPos}>
        <sphereGeometry args={[0.12, 32, 32]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0284c7"
          emissiveIntensity={2.5}
          roughness={0.05}
        />
      </mesh>

      <mesh position={targetPos}>
        <sphereGeometry args={[0.1 + entropy * 0.08, 32, 32]} />
        <meshStandardMaterial
          color={phaseLock ? '#fbbf24' : '#ec4899'}
          emissive={phaseLock ? '#d97706' : '#db2777'}
          emissiveIntensity={2.5}
        />
      </mesh>

      <mesh position={currentPos} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[currentPos.distanceTo(targetPos), 0.003, 8, 64]} />
        <meshBasicMaterial color={theme === 'light' ? '#94a3b8' : '#475569'} transparent opacity={0.2} />
      </mesh>

      <gridHelper args={[10, 20, theme === 'light' ? '#cbd5e1' : '#1e293b', theme === 'light' ? '#e2e8f0' : '#0f172a']} position={[0, -1.5, 0]} />
    </group>
  );
};

export default function UniversalRealityMap({
  triggerGlitch,
  phaseLock,
  onMapClick,
}: {
  triggerGlitch: boolean;
  phaseLock: boolean;
  onMapClick?: (coord: { dims: number; psi: number; entropy: number; localGravity: number; quantumFlux: number }, label: string) => void;
}) {
  const [glitchIntensity, setGlitchIntensity] = useState(0);
  const [glError, setGlError] = useState<string | null>(null);

  const currentReality = useRealityStore((s) => s.currentReality);
  const targetReality = useRealityStore((s) => s.targetReality);
  const theme = useRealityStore((s) => s.theme);

  useEffect(() => {
    if (triggerGlitch) {
      setGlitchIntensity(1.0);
      const startTime = Date.now();
      const duration = 1500;
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setGlitchIntensity(1 - eased);
        if (progress >= 1) clearInterval(interval);
      }, 16);
      return () => clearInterval(interval);
    }
  }, [triggerGlitch]);

  const currentPos = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  const targetPos = useMemo(() => {
    if (!targetReality) {
      return new THREE.Vector3(1.5, 0, 1.5);
    }
    const radius = 1.5 + currentReality.dims * 0.12;
    const angle = (targetReality.psi / 10) * Math.PI * 2;
    const height = (targetReality.entropy - currentReality.entropy) * 2;
    const gravOffset = (targetReality.localGravity - currentReality.localGravity) * 3;
    return new THREE.Vector3(
      Math.cos(angle) * radius + gravOffset * 0.5,
      height,
      Math.sin(angle) * radius + gravOffset * 0.5
    );
  }, [targetReality, currentReality]);

  if (glError) {
    return (
      <div className={`w-full h-full flex items-center justify-center p-4 ${theme === 'light' ? 'bg-[#f8fafc]' : 'bg-[#020210]'}`}>
        <span className="text-rose-500 font-medium text-sm text-center">{glError}</span>
      </div>
    );
  }

  return (
    <div className={`w-full h-full relative ${theme === 'light' ? 'bg-[#f8fafc]' : 'bg-[#020210]'}`}>
      <Canvas
        gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
        dpr={[1, 2]}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            setGlError('Reality frame buffer lost. Please re-anchor.');
          });
        }}
      >
        <color attach="background" args={[theme === 'light' ? '#f8fafc' : '#020210']} />
        <PerspectiveCamera makeDefault position={[2.5, 2, 3.5]} fov={50} />
        <OrbitControls enableDamping dampingFactor={0.05} minDistance={1} maxDistance={15} maxPolarAngle={Math.PI / 1.6} />
        {theme === 'dark' ? (
          <Stars radius={150} depth={60} count={3000} factor={5} saturation={0.4} fade speed={1} />
        ) : (
          <Stars radius={150} depth={60} count={200} factor={2} saturation={0.1} fade speed={0.5} />
        )}
        <ambientLight intensity={theme === 'light' ? 0.8 : 0.5} color={theme === 'light' ? '#f8fafc' : '#0a0a2e'} />
        <pointLight position={[5, 5, 5]} intensity={theme === 'light' ? 2.5 : 2} color="#ffffff" />
        <pointLight position={[-5, -3, -5]} intensity={theme === 'light' ? 0.8 : 0.5} color={theme === 'light' ? '#a855f7' : '#3b82f6'} />
        <fog attach="fog" args={[theme === 'light' ? '#f8fafc' : '#020210', 3, 15]} />

        <RealityNodes
          currentPos={currentPos}
          targetPos={targetPos}
          entropy={currentReality.entropy}
          phaseLock={phaseLock}
          theme={theme}
        />
        <RelativePathway currentPos={currentPos} targetPos={targetPos} />

        {/* Interactive Click Catcher Plane */}
        {onMapClick && (
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -1.5, 0]}
            onClick={(e) => {
              e.stopPropagation();
              const pt = e.point;
              const cx = pt.x;
              const cz = pt.z;
              
              // Angle for psi
              const angle = Math.atan2(cz, cx);
              const calculatedPsi = Math.round((((angle + Math.PI) / (Math.PI * 2)) * 9.0 + 1.0) * 100) / 100;
              
              // Radial distance for gravity
              const dist = Math.sqrt(cx * cx + cz * cz);
              const calculatedGravity = Math.round(Math.min(2.0, Math.max(0.05, dist / 2.5)) * 100) / 100;
              
              // Entropy and flux mapped from coordinates
              const calculatedEntropy = Math.round(Math.min(0.95, Math.max(0.05, 0.1 + (Math.abs(cx) % 0.85))) * 100) / 100;
              const calculatedFlux = Math.round(Math.min(1.00, Math.max(0.01, 0.05 + (Math.abs(cz) % 0.95))) * 100) / 100;
              
              // Keep target dimensions or baseline 3
              const dims = targetReality ? targetReality.dims : 3;

              const coords = {
                dims,
                psi: calculatedPsi,
                entropy: calculatedEntropy,
                localGravity: calculatedGravity,
                quantumFlux: calculatedFlux,
              };

              const label = `Map Point (X: ${cx.toFixed(1)}, Z: ${cz.toFixed(1)})`;
              onMapClick(coords, label);
            }}
          >
            <planeGeometry args={[30, 30]} />
            <meshBasicMaterial visible={false} />
          </mesh>
        )}

        <EffectComposer>
          <Bloom intensity={theme === 'light' ? 0.5 : 1.0} luminanceThreshold={theme === 'light' ? 0.4 : 0.05} luminanceSmoothing={0.9} />
          <Glitch
            active={glitchIntensity > 0.01}
            delay={new THREE.Vector2(0, 0)}
            duration={new THREE.Vector2(1.5, 1.5)}
            strength={new THREE.Vector2(glitchIntensity * 0.3, glitchIntensity * 0.3)}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}