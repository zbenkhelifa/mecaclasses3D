import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Cylinder, Sphere, RoundedBox, Torus } from '@react-three/drei';
import * as THREE from 'three';
import { PartType, EquivalenceClass } from '../types';

interface MechanicalModelProps {
  angle: number;
  highlightedPart: PartType | null;
  onPartClick: (part: PartType) => void;
  classes: EquivalenceClass[];
}

// Component to handle material animation
const AnimatedMaterial = ({ type, highlightedPart, color, opacity }: { type: PartType, highlightedPart: PartType | null, color: string, opacity: number }) => {
    const matRef = useRef<THREE.MeshStandardMaterial>(null);
    
    useFrame(({ clock }) => {
        if (matRef.current) {
            if (highlightedPart === type) {
                const t = clock.elapsedTime;
                // Gentle pulse: sine wave oscillating emissive intensity
                const intensity = (Math.sin(t * 3) + 1) * 0.15 + 0.1; 
                matRef.current.emissive.set(color);
                matRef.current.emissiveIntensity = intensity;
            } else {
                matRef.current.emissiveIntensity = 0;
            }
        }
    });

    return (
        <meshStandardMaterial
            ref={matRef}
            color={color}
            transparent
            opacity={opacity}
            metalness={0.6}
            roughness={0.2}
        />
    );
};

const MechanicalModel: React.FC<MechanicalModelProps> = ({ angle, highlightedPart, onPartClick, classes }) => {
  // Mechanism Dimensions
  const crankLength = 2;
  const rodLength = 5;
  
  // Calculate positions based on angle (Kinematics)
  const crankX = Math.cos(angle) * crankLength;
  const crankY = Math.sin(angle) * crankLength;
  
  const safeTerm = Math.max(0, rodLength * rodLength - crankY * crankY);
  const pistonX = crankX + Math.sqrt(safeTerm);
  
  const rodAngle = Math.atan2(-crankY, pistonX - crankX);
  const rodCenterX = (crankX + pistonX) / 2;
  const rodCenterY = crankY / 2;

  const getColor = (type: PartType) => {
    const cls = classes.find(c => c.id === type);
    if (!cls) return '#888888';
    
    // If a part is highlighted, dim the others significantly
    if (highlightedPart && highlightedPart !== type) {
      return '#d1d5db'; // gray-300, very desaturated
    }
    return cls.color;
  };

  const getOpacity = (type: PartType) => {
      if (highlightedPart && highlightedPart !== type) {
          return 0.4;
      }
      return 1;
  }

  // Helper to render the animated material for a given part type
  const renderMaterial = (type: PartType) => (
      <AnimatedMaterial 
        type={type} 
        highlightedPart={highlightedPart} 
        color={getColor(type)} 
        opacity={getOpacity(type)} 
      />
  );

  // Bolt/Joint Detail Component
  const BoltHead = ({ position, rotation = [0,0,0] }: { position: [number, number, number], rotation?: [number, number, number] }) => (
    <group position={position} rotation={rotation as any}>
        <Cylinder args={[0.15, 0.15, 0.1, 6]} rotation={[Math.PI/2, 0, 0]}>
            <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} />
        </Cylinder>
    </group>
  );

  return (
    <group position={[-2, -1, 0]}>
      
      {/* --- FRAME (Bâti) --- */}
      <group onClick={(e) => { e.stopPropagation(); onPartClick(PartType.FRAME); }}>
        {/* Main Base Plate */}
        <RoundedBox args={[12, 0.5, 5]} radius={0.1} position={[3, -2, 0]}>
          {renderMaterial(PartType.FRAME)}
        </RoundedBox>
        
        {/* Crank Bearing Support Block */}
        <RoundedBox args={[1, 2.5, 1]} radius={0.1} position={[0, -1, 0]}>
           {renderMaterial(PartType.FRAME)}
        </RoundedBox>
        
        {/* Piston Guide Rails (Top and Bottom) */}
        <group position={[5, 0, 0]}>
            <RoundedBox args={[8, 0.2, 0.8]} radius={0.05} position={[0, 1.2, 0]}>
                {renderMaterial(PartType.FRAME)}
            </RoundedBox>
            <RoundedBox args={[8, 0.2, 0.8]} radius={0.05} position={[0, -1.2, 0]}>
                {renderMaterial(PartType.FRAME)}
            </RoundedBox>
            {/* End cap for rails */}
            <RoundedBox args={[0.5, 2.6, 1]} radius={0.1} position={[4.25, 0, 0]}>
                {renderMaterial(PartType.FRAME)}
            </RoundedBox>
        </group>
        
        {/* Main Axis Pivot (visual) */}
        <Cylinder args={[0.4, 0.4, 1.2, 32]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
           <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
        </Cylinder>
      </group>


      {/* --- CRANK (Manivelle) --- */}
      <group 
        rotation={[0, 0, angle]} 
        onClick={(e) => { e.stopPropagation(); onPartClick(PartType.CRANK); }}
      >
        {/* Main Arm */}
        <RoundedBox args={[crankLength + 0.5, 0.6, 0.3]} radius={0.1} position={[crankLength / 2 - 0.25, 0, 0.2]}>
          {renderMaterial(PartType.CRANK)}
        </RoundedBox>
        
        {/* Counterweight visual */}
        <RoundedBox args={[1, 0.8, 0.3]} radius={0.1} position={[-0.8, 0, 0.2]}>
            {renderMaterial(PartType.CRANK)}
        </RoundedBox>

        {/* Crank Pin (Connection to Rod) */}
        <Cylinder args={[0.25, 0.25, 0.8, 32]} rotation={[Math.PI/2, 0, 0]} position={[crankLength, 0, 0]}>
            <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.1} />
        </Cylinder>
        <BoltHead position={[crankLength, 0, 0.45]} />
      </group>


      {/* --- ROD (Bielle) --- */}
      <group 
        position={[rodCenterX, rodCenterY, 0]} 
        rotation={[0, 0, rodAngle]}
        onClick={(e) => { e.stopPropagation(); onPartClick(PartType.ROD); }}
      >
        {/* Main Beam (I-beam style simplified) */}
        <RoundedBox args={[rodLength - 1, 0.3, 0.15]} radius={0.05}>
           {renderMaterial(PartType.ROD)}
        </RoundedBox>
        
        {/* Big End (Crank side) */}
        <group position={[-rodLength/2, 0, 0]}>
            <Cylinder args={[0.6, 0.6, 0.3, 32]} rotation={[Math.PI/2, 0, 0]}>
                {renderMaterial(PartType.ROD)}
            </Cylinder>
            {/* Visual hole/cap separation */}
            <Cylinder args={[0.62, 0.62, 0.05, 32]} rotation={[Math.PI/2, 0, 0]}>
                 <meshStandardMaterial color="#000" transparent opacity={0.1} />
            </Cylinder>
            <BoltHead position={[0, 0.4, 0.15]} />
            <BoltHead position={[0, -0.4, 0.15]} />
        </group>

        {/* Small End (Piston side) */}
        <group position={[rodLength/2, 0, 0]}>
            <Cylinder args={[0.4, 0.4, 0.3, 32]} rotation={[Math.PI/2, 0, 0]}>
                {renderMaterial(PartType.ROD)}
            </Cylinder>
        </group>
      </group>


      {/* --- PISTON --- */}
      <group 
        position={[pistonX, 0, 0]}
        onClick={(e) => { e.stopPropagation(); onPartClick(PartType.PISTON); }}
      >
        {/* Main Piston Body (Cylindrical) */}
        <Cylinder args={[0.9, 0.9, 1.8, 32]} rotation={[0, 0, Math.PI/2]}>
           {renderMaterial(PartType.PISTON)}
        </Cylinder>

        {/* Piston Rings (Details) */}
        <Torus args={[0.91, 0.05, 16, 32]} rotation={[0, Math.PI/2, 0]} position={[-0.4, 0, 0]}>
            <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
        </Torus>
        <Torus args={[0.91, 0.05, 16, 32]} rotation={[0, Math.PI/2, 0]} position={[-0.2, 0, 0]}>
            <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
        </Torus>

        {/* Wrist Pin (Axe de piston) visible on sides */}
        <Cylinder args={[0.3, 0.3, 2, 32]} rotation={[Math.PI/2, 0, 0]}>
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
        </Cylinder>
      </group>


      {/* --- LABELS --- */}
      {highlightedPart === PartType.FRAME && (
          <Text position={[2, -3, 0]} color="#1e293b" fontSize={0.5} anchorY="top">
              Classe 0: Bâti (Fixe)
          </Text>
      )}
       {highlightedPart === PartType.CRANK && (
          <Text position={[crankX/2, crankY/2 + 1.5, 0]} color="#b91c1c" fontSize={0.5}>
              Classe 1: Manivelle (Rotation)
          </Text>
      )}
      {highlightedPart === PartType.ROD && (
          <Text position={[rodCenterX, rodCenterY + 1.5, 0]} color="#15803d" fontSize={0.5}>
              Classe 2: Bielle (Mvt Plan)
          </Text>
      )}
      {highlightedPart === PartType.PISTON && (
          <Text position={[pistonX, 1.8, 0]} color="#1d4ed8" fontSize={0.5}>
              Classe 3: Piston (Translation)
          </Text>
      )}

    </group>
  );
};

export default MechanicalModel;