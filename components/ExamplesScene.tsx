import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Text, Float } from '@react-three/drei';
import * as THREE from 'three';

export type ExampleType = 'ROTATION' | 'TRANSLATION' | 'PIVOT';

interface ExamplesSceneProps {
  type: ExampleType;
}

const RotationModel = () => {
  const rotorRef = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (rotorRef.current) rotorRef.current.rotation.y += delta * 2;
  });

  return (
    <group position={[0, -1, 0]}>
      {/* Classe 1: Bâti (Stator) */}
      <mesh position={[0, -1, 0]}>
        <cylinderGeometry args={[2, 2.5, 0.5, 32]} />
        <meshStandardMaterial color="#64748b" /> {/* Slate 500 */}
      </mesh>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 3, 16]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
      <Text position={[2.5, -1, 0]} color="#64748b" fontSize={0.4} anchorX="left">
        Classe A: Stator (Fixe)
      </Text>

      {/* Classe 2: Rotor */}
      <group ref={rotorRef} position={[0, 1, 0]}>
        <mesh>
           <boxGeometry args={[4, 0.2, 0.5]} />
           <meshStandardMaterial color="#f59e0b" /> {/* Amber 500 */}
        </mesh>
        <mesh rotation={[0, Math.PI/2, 0]}>
           <boxGeometry args={[4, 0.2, 0.5]} />
           <meshStandardMaterial color="#f59e0b" />
        </mesh>
        <mesh position={[0, 0.5, 0]}>
            <coneGeometry args={[0.5, 1, 16]} />
            <meshStandardMaterial color="#f59e0b" />
        </mesh>
      </group>
      <Text position={[0, 2.5, 0]} color="#f59e0b" fontSize={0.4}>
        Classe B: Rotor (Rotation)
      </Text>
    </group>
  );
};

const TranslationModel = () => {
  const sliderRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (sliderRef.current) {
      sliderRef.current.position.x = Math.sin(state.clock.elapsedTime * 2) * 2;
    }
  });

  return (
    <group position={[0, -0.5, 0]}>
      {/* Classe 1: Rail (Guide) */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI/2]}>
        <cylinderGeometry args={[0.2, 0.2, 8, 32]} />
        <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-4, -0.5, 0]}>
         <boxGeometry args={[0.5, 1.5, 1]} />
         <meshStandardMaterial color="#64748b" />
      </mesh>
      <mesh position={[4, -0.5, 0]}>
         <boxGeometry args={[0.5, 1.5, 1]} />
         <meshStandardMaterial color="#64748b" />
      </mesh>
      <Text position={[0, -1.5, 0]} color="#64748b" fontSize={0.4}>
        Classe A: Guide (Fixe)
      </Text>

      {/* Classe 2: Chariot */}
      <group ref={sliderRef}>
        <mesh>
          <boxGeometry args={[1.5, 1, 1]} />
          <meshStandardMaterial color="#06b6d4" /> {/* Cyan 500 */}
        </mesh>
        <Text position={[0, 1, 0]} color="#06b6d4" fontSize={0.4}>
          Classe B: Chariot
        </Text>
      </group>
    </group>
  );
};

const PivotModel = () => {
    const armRef = useRef<THREE.Group>(null);
    useFrame((state) => {
      if (armRef.current) {
        // Mouvement d'ouverture fermeture (0 à 90 deg)
        armRef.current.rotation.z = Math.abs(Math.sin(state.clock.elapsedTime)) * (Math.PI / 2);
      }
    });
  
    return (
      <group position={[-1, -1.5, 0]}>
        {/* Classe 1: Poteau */}
        <mesh position={[0, 1.5, 0]}>
          <boxGeometry args={[0.5, 3.5, 0.5]} />
          <meshStandardMaterial color="#64748b" />
        </mesh>
        <mesh position={[0, 0, 0]}>
            <boxGeometry args={[2, 0.2, 2]} />
            <meshStandardMaterial color="#64748b" />
        </mesh>
        <Text position={[0, -0.5, 0]} color="#64748b" fontSize={0.4}>
          Classe A: Bâti
        </Text>
  
        {/* Classe 2: Bras */}
        <group position={[0, 2.5, 0.3]} ref={armRef}>
           <group position={[2, 0, 0]}> {/* Offset center to pivot */}
             <mesh>
               <boxGeometry args={[4, 0.3, 0.1]} />
               <meshStandardMaterial color="#84cc16" /> {/* Lime 500 */}
             </mesh>
             <mesh position={[1.5, -0.5, 0]}>
                <sphereGeometry args={[0.3]} />
                <meshStandardMaterial color="#84cc16" />
             </mesh>
             <Text position={[0, 0.5, 0]} color="#84cc16" fontSize={0.4}>
                Classe B: Barrière
             </Text>
           </group>
        </group>
      </group>
    );
  };

const ExamplesScene: React.FC<ExamplesSceneProps> = ({ type }) => {
  return (
    <div className="w-full h-full relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50 shadow-inner">
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 2, 8]} fov={45} />
        <OrbitControls enableZoom={true} minDistance={4} maxDistance={15} />
        
        <ambientLight intensity={0.6} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        <Environment preset="studio" />

        {type === 'ROTATION' && <RotationModel />}
        {type === 'TRANSLATION' && <TranslationModel />}
        {type === 'PIVOT' && <PivotModel />}

      </Canvas>
       <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur px-3 py-1 rounded-full text-xs font-mono text-gray-500 border border-gray-200">
         Modèle Interactif
       </div>
    </div>
  );
};

export default ExamplesScene;