import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Grid } from '@react-three/drei';
import MechanicalModel from './MechanicalModel';
import { PartType, EquivalenceClass } from '../types';

interface Scene3DProps {
  highlightedPart: PartType | null;
  setHighlightedPart: (part: PartType | null) => void;
  classes: EquivalenceClass[];
  isPlaying: boolean;
}

const Scene3D: React.FC<Scene3DProps> = ({ highlightedPart, setHighlightedPart, classes, isPlaying }) => {
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    let animationFrameId: number;
    
    const animate = () => {
      if (isPlaying) {
        setAngle(prev => (prev + 0.02) % (Math.PI * 2));
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying]);

  return (
    <div className="w-full h-full relative bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden shadow-inner border border-gray-300">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[5, 4, 10]} fov={50} />
        <OrbitControls enablePan={true} enableZoom={true} minDistance={5} maxDistance={20} />
        
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1} 
          castShadow 
        />
        <Environment preset="city" />

        <Grid 
          position={[0, -2, 0]} 
          args={[20, 20]} 
          cellSize={1} 
          cellThickness={0.5} 
          cellColor="#6f6f6f" 
          sectionSize={5} 
          sectionThickness={1} 
          sectionColor="#9d4b4b" 
          fadeDistance={30} 
          fadeStrength={1} 
        />

        <MechanicalModel 
          angle={angle} 
          highlightedPart={highlightedPart}
          onPartClick={(part) => setHighlightedPart(part === highlightedPart ? null : part)}
          classes={classes}
        />
      </Canvas>
      
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded shadow text-sm text-gray-600 max-w-xs">
        <p>🖱️ <strong>Clic gauche + glisser</strong> pour tourner</p>
        <p>🖱️ <strong>Clic sur une pièce</strong> pour identifier sa classe</p>
        <p>🖱️ <strong>Molette</strong> pour zoomer</p>
      </div>
    </div>
  );
};

export default Scene3D;