import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, RoundedBox, Cylinder, Sphere, Torus, Cone, Text } from '@react-three/drei';
import * as THREE from 'three';
import { JointType, DegreeOfFreedom } from '../types';

export interface JointManualState {
    tx: number; ty: number; tz: number;
    rx: number; ry: number; rz: number;
}

interface JointsSceneProps {
  type: JointType;
  manualState?: JointManualState | null; // Si null, animation auto. Si objet, contrôle manuel.
}

// --- CONFIGURATION DES DDL ---
const JOINT_CONFIGS: Record<JointType, DegreeOfFreedom> = {
  [JointType.PIVOT]: { tx: false, ty: false, tz: false, rx: true, ry: false, rz: false },
  [JointType.GLISSIERE]: { tx: true, ty: false, tz: false, rx: false, ry: false, rz: false },
  [JointType.PIVOT_GLISSANT]: { tx: true, ty: false, tz: false, rx: true, ry: false, rz: false },
  [JointType.ROTULE]: { tx: false, ty: false, tz: false, rx: true, ry: true, rz: true },
  [JointType.APPUI_PLAN]: { tx: true, ty: false, tz: true, rx: false, ry: true, rz: false },
  [JointType.ENCASTREMENT]: { tx: false, ty: false, tz: false, rx: false, ry: false, rz: false },
};

const MaterialFixed = () => <meshStandardMaterial color="#64748b" metalness={0.5} roughness={0.5} />;
const MaterialMobile = ({ blocked }: { blocked?: boolean }) => (
    <meshStandardMaterial 
        color={blocked ? "#ef4444" : "#3b82f6"} // Rouge si bloqué pendant manip
        metalness={0.6} 
        roughness={0.2} 
        opacity={0.9} 
        transparent 
    />
);

// --- VISUALIZATION HELPERS ---
const AXIS_COLORS = { x: "#ef4444", y: "#22c55e", z: "#3b82f6" };

const TranslationArrow = ({ axis, position }: { axis: 'x' | 'y' | 'z', position: [number, number, number] }) => {
  const rotation: [number, number, number] = 
    axis === 'x' ? [0, 0, -Math.PI / 2] :
    axis === 'y' ? [0, 0, 0] :
    [Math.PI / 2, 0, 0];

  return (
    <group position={position} rotation={rotation}>
      <Cylinder args={[0.08, 0.08, 2, 16]} position={[0, 1, 0]}>
        <meshBasicMaterial color={AXIS_COLORS[axis]} />
      </Cylinder>
      <Cone args={[0.2, 0.4, 16]} position={[0, 2.2, 0]}>
        <meshBasicMaterial color={AXIS_COLORS[axis]} />
      </Cone>
      <Cone args={[0.2, 0.4, 16]} position={[0, -0.2, 0]} rotation={[Math.PI, 0, 0]}>
        <meshBasicMaterial color={AXIS_COLORS[axis]} />
      </Cone>
    </group>
  );
};

const RotationArrow = ({ axis, position }: { axis: 'x' | 'y' | 'z', position: [number, number, number] }) => {
  const groupRotation: [number, number, number] = 
    axis === 'x' ? [0, Math.PI/2, 0] :
    axis === 'y' ? [Math.PI/2, 0, 0] :
    [0, 0, 0];

  return (
    <group position={position} rotation={groupRotation}>
      <Torus args={[1.5, 0.05, 16, 32, Math.PI * 1.5]} rotation={[0, 0, Math.PI/4]}>
        <meshBasicMaterial color={AXIS_COLORS[axis]} />
      </Torus>
      <group rotation={[0, 0, Math.PI * 1.75]} position={[1.5, 0, 0]}>
         <Cone args={[0.15, 0.3, 16]} position={[0, 0.1, 0]} rotation={[0, 0, -0.5]}>
            <meshBasicMaterial color={AXIS_COLORS[axis]} />
         </Cone>
      </group>
    </group>
  );
};

const DOFVisualizer = ({ dof }: { dof: DegreeOfFreedom }) => {
  return (
    <group>
      {dof.tx && <TranslationArrow axis="x" position={[0, 2.5, 0]} />}
      {dof.ty && <TranslationArrow axis="y" position={[2.5, 0, 0]} />}
      {dof.tz && <TranslationArrow axis="z" position={[0, 2.5, 0]} />}
      {dof.rx && <RotationArrow axis="x" position={[0, 0, 0]} />}
      {dof.ry && <RotationArrow axis="y" position={[0, 0, 0]} />}
      {dof.rz && <RotationArrow axis="z" position={[0, 0, 0]} />}
    </group>
  );
};

// --- LOGIC HOOK FOR MOTION ---
// Gère soit l'animation auto, soit la réponse aux inputs manuels
// Si manuel et mouvement interdit -> VIBRATION (feedback visuel d'erreur)
const useJointMotion = (
    ref: React.RefObject<THREE.Group>, 
    dof: DegreeOfFreedom, 
    manualState: JointManualState | undefined | null,
    autoAnimateFn: (time: number) => { pos: THREE.Vector3, rot: THREE.Euler }
) => {
    // Refs pour stocker l'état de "blocage" (vibration)
    const isBlocked = useRef(false);

    useFrame(({ clock }) => {
        if (!ref.current) return;

        if (manualState) {
            // --- MODE MANUEL ---
            const { tx, ty, tz, rx, ry, rz } = manualState;
            
            // Calculer la nouvelle position théorique demandée
            // On amplifie les valeurs des sliders (-1 à 1) pour l'affichage 3D
            const targetX = tx * 2;
            const targetY = ty * 2;
            const targetZ = tz * 2;
            const targetRotX = rx * Math.PI;
            const targetRotY = ry * Math.PI;
            const targetRotZ = rz * Math.PI;

            // Appliquer uniquement si autorisé, sinon vibrer
            let blocked = false;
            const vibration = Math.sin(clock.elapsedTime * 50) * 0.05; // Vibration rapide

            // Translation X
            if (dof.tx) ref.current.position.x = targetX;
            else if (Math.abs(tx) > 0.1) { ref.current.position.x = vibration; blocked = true; }
            else ref.current.position.x = 0;

            // Translation Y
            if (dof.ty) ref.current.position.y = targetY;
            else if (Math.abs(ty) > 0.1) { ref.current.position.y = vibration; blocked = true; }
            else ref.current.position.y = 0; // Reset si slider remis à 0

            // Translation Z
            if (dof.tz) ref.current.position.z = targetZ;
            else if (Math.abs(tz) > 0.1) { ref.current.position.z = vibration; blocked = true; }
            else ref.current.position.z = 0;

            // Rotation X
            if (dof.rx) ref.current.rotation.x = targetRotX;
            else if (Math.abs(rx) > 0.1) { ref.current.rotation.x = vibration; blocked = true; }
            else ref.current.rotation.x = 0;

            // Rotation Y
            if (dof.ry) ref.current.rotation.y = targetRotY;
            else if (Math.abs(ry) > 0.1) { ref.current.rotation.y = vibration; blocked = true; }
            else ref.current.rotation.y = 0;

            // Rotation Z
            if (dof.rz) ref.current.rotation.z = targetRotZ;
            else if (Math.abs(rz) > 0.1) { ref.current.rotation.z = vibration; blocked = true; }
            else ref.current.rotation.z = 0;

            isBlocked.current = blocked;

        } else {
            // --- MODE AUTO ---
            const { pos, rot } = autoAnimateFn(clock.elapsedTime);
            ref.current.position.copy(pos);
            ref.current.rotation.copy(rot);
            isBlocked.current = false;
        }
    });

    return isBlocked.current;
};


// --- MODELS ---

const PivotModel = ({ manualState }: { manualState?: JointManualState | null }) => {
  const movingPart = useRef<THREE.Group>(null);
  
  const blocked = useJointMotion(movingPart, JOINT_CONFIGS[JointType.PIVOT], manualState, (t) => ({
      pos: new THREE.Vector3(0, -1.5, 0),
      rot: new THREE.Euler(Math.sin(t * 2), 0, 0)
  }));

  // Correction de position de base pour le mode manuel si nécessaire
  // Le hook écrase la position, donc on ajoute un offset via un group parent si besoin
  // Ici, le pivot bouge autour de (0,0,0) local, on ajuste la géométrie

  return (
    <group>
      <group>
        <RoundedBox args={[1, 3, 1]} position={[-1.2, 0, 0]} radius={0.1}><MaterialFixed /></RoundedBox>
        <RoundedBox args={[1, 3, 1]} position={[1.2, 0, 0]} radius={0.1}><MaterialFixed /></RoundedBox>
        <Cylinder args={[0.4, 0.4, 3, 32]} rotation={[0, 0, Math.PI/2]}><MaterialFixed /></Cylinder>
      </group>
      {/* Wrapper pour l'animation qui applique les transforms */}
      <group ref={movingPart}> 
        {/* Géométrie décalée pour tourner autour du bon axe si besoin, ici c'est centré */}
        <group position={[0, -1.5, 0]}> 
            <RoundedBox args={[1.4, 2, 0.5]} radius={0.1}><MaterialMobile blocked={blocked} /></RoundedBox>
            <Cylinder args={[0.5, 0.5, 1.4, 32]} position={[0, 1.5, 0]} rotation={[0, 0, Math.PI/2]}><MaterialMobile blocked={blocked} /></Cylinder>
        </group>
      </group>
      <arrowHelper args={[new THREE.Vector3(1, 0, 0), new THREE.Vector3(2, 0, 0), 1, 0xff0000]} />
    </group>
  );
};

const GlissiereModel = ({ manualState }: { manualState?: JointManualState | null }) => {
  const movingPart = useRef<THREE.Group>(null);
  const blocked = useJointMotion(movingPart, JOINT_CONFIGS[JointType.GLISSIERE], manualState, (t) => ({
      pos: new THREE.Vector3(Math.sin(t * 1.5) * 1.5, 0.2, 0),
      rot: new THREE.Euler(0, 0, 0)
  }));

  return (
    <group>
      <group>
        <RoundedBox args={[6, 0.5, 2]} position={[0, -0.5, 0]} radius={0.05}><MaterialFixed /></RoundedBox>
        <RoundedBox args={[6, 0.5, 0.5]} position={[0, 0.5, 0.75]} radius={0.05}><MaterialFixed /></RoundedBox>
        <RoundedBox args={[6, 0.5, 0.5]} position={[0, 0.5, -0.75]} radius={0.05}><MaterialFixed /></RoundedBox>
      </group>
      <group ref={movingPart}>
         <RoundedBox args={[1.5, 0.9, 1.9]} radius={0.05}><MaterialMobile blocked={blocked} /></RoundedBox>
      </group>
      <arrowHelper args={[new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1.5, 0), 1, 0x00ff00]} />
    </group>
  );
};

const PivotGlissantModel = ({ manualState }: { manualState?: JointManualState | null }) => {
    const movingPart = useRef<THREE.Group>(null);
    const blocked = useJointMotion(movingPart, JOINT_CONFIGS[JointType.PIVOT_GLISSANT], manualState, (t) => ({
        pos: new THREE.Vector3(Math.sin(t) * 1.5, 0, 0),
        rot: new THREE.Euler(t * 2, 0, 0)
    }));
  
    return (
      <group>
        <group>
            <Cylinder args={[0.8, 0.8, 4, 32, 1, true]} rotation={[0, 0, Math.PI/2]} side={THREE.DoubleSide}><MaterialFixed /></Cylinder>
            <RoundedBox args={[4, 1, 2]} position={[0, -1, 0]} radius={0.1}><MaterialFixed /></RoundedBox>
        </group>
        <group ref={movingPart}>
           <Cylinder args={[0.75, 0.75, 6, 32]} rotation={[0, 0, Math.PI/2]}><MaterialMobile blocked={blocked} /></Cylinder>
        </group>
      </group>
    );
};

const RotuleModel = ({ manualState }: { manualState?: JointManualState | null }) => {
    const movingPart = useRef<THREE.Group>(null);
    const blocked = useJointMotion(movingPart, JOINT_CONFIGS[JointType.ROTULE], manualState, (t) => ({
        pos: new THREE.Vector3(0, -0.5, 0),
        rot: new THREE.Euler(Math.sin(t) * 0.5, Math.cos(t * 0.8) * 0.5, Math.sin(t * 0.5) * 0.5)
    }));

    return (
        <group>
            <group position={[0, -1, 0]}>
                <Cylinder args={[1.2, 1.5, 1, 32]} position={[0, 0, 0]}><MaterialFixed /></Cylinder>
                <mesh position={[0, 0.5, 0]}>
                    <sphereGeometry args={[1.05, 32, 16, 0, Math.PI * 2, 0, Math.PI/2]} />
                    <meshStandardMaterial color="#475569" side={THREE.BackSide} />
                </mesh>
            </group>
            <group ref={movingPart}>
                {/* On enveloppe pour le hook, puis on dessine la géométrie relative */}
                <group position={manualState ? [0,0,0] : [0,0,0]}> 
                    <Sphere args={[1, 32, 32]}><MaterialMobile blocked={blocked} /></Sphere>
                    <Cylinder args={[0.3, 0.3, 2]} position={[0, 1.5, 0]}><MaterialMobile blocked={blocked} /></Cylinder>
                </group>
            </group>
        </group>
    );
};

const AppuiPlanModel = ({ manualState }: { manualState?: JointManualState | null }) => {
    const movingPart = useRef<THREE.Group>(null);
    const blocked = useJointMotion(movingPart, JOINT_CONFIGS[JointType.APPUI_PLAN], manualState, (t) => ({
        pos: new THREE.Vector3(Math.sin(t), 0.3, Math.cos(t)),
        rot: new THREE.Euler(0, Math.sin(t * 0.5), 0)
    }));

    return (
        <group>
            <RoundedBox args={[5, 0.2, 5]} position={[0, -0.1, 0]} radius={0.05}><MaterialFixed /></RoundedBox>
            <group ref={movingPart}>
                {/* En auto l'offset Y est dans le hook, en manuel on le force ici si besoin, 
                    mais le hook écrase Y. On doit donc tricher si on veut que ça flotte un peu.
                    Pour l'appui plan, Ty est bloqué à 0 en manuel, donc on décale la géométrie. */}
                 <group position={[0, 0.3, 0]}>
                    <RoundedBox args={[2, 0.6, 2]} radius={0.1}><MaterialMobile blocked={blocked} /></RoundedBox>
                 </group>
            </group>
        </group>
    )
}

const EncastrementModel = ({ manualState }: { manualState?: JointManualState | null }) => {
    const movingPart = useRef<THREE.Group>(null);
    const blocked = useJointMotion(movingPart, JOINT_CONFIGS[JointType.ENCASTREMENT], manualState, () => ({
        pos: new THREE.Vector3(0, 0, 0),
        rot: new THREE.Euler(0, 0, 0)
    }));

    return (
        <group>
             <RoundedBox args={[2, 2, 2]} position={[-1.1, 0, 0]} radius={0.1}><MaterialFixed /></RoundedBox>
             <group ref={movingPart}>
                <RoundedBox args={[2, 2, 2]} position={[1.1, 0, 0]} radius={0.1}><MaterialMobile blocked={blocked} /></RoundedBox>
                <Cylinder args={[0.2, 0.2, 3]} rotation={[0, 0, Math.PI/2]} position={[0, 0.5, 0.5]}>
                    <meshStandardMaterial color="#1e293b" />
                </Cylinder>
                <Cylinder args={[0.2, 0.2, 3]} rotation={[0, 0, Math.PI/2]} position={[0, -0.5, -0.5]}>
                    <meshStandardMaterial color="#1e293b" />
                </Cylinder>
             </group>
             <Text position={[0, 2, 0]} color="#1e293b" fontSize={0.3}>
                 Aucun mouvement relatif
             </Text>
        </group>
    )
}


const JointsScene: React.FC<JointsSceneProps> = ({ type, manualState }) => {
  const activeDof = JOINT_CONFIGS[type];

  return (
    <div className="w-full h-full relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50 shadow-inner group">
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[3, 4, 6]} fov={45} />
        <OrbitControls enableZoom={true} minDistance={3} maxDistance={15} />
        
        <ambientLight intensity={0.6} />
        <spotLight position={[5, 10, 5]} angle={0.25} penumbra={1} intensity={1} castShadow />
        <Environment preset="city" />

        <group position={[0, 0, 0]}>
             {type === JointType.PIVOT && <PivotModel manualState={manualState} />}
             {type === JointType.GLISSIERE && <GlissiereModel manualState={manualState} />}
             {type === JointType.PIVOT_GLISSANT && <PivotGlissantModel manualState={manualState} />}
             {type === JointType.ROTULE && <RotuleModel manualState={manualState} />}
             {type === JointType.APPUI_PLAN && <AppuiPlanModel manualState={manualState} />}
             {type === JointType.ENCASTREMENT && <EncastrementModel manualState={manualState} />}
             
             {/* Render DOF Arrows only in auto mode or if specifically desired */}
             {!manualState && <DOFVisualizer dof={activeDof} />}
        </group>

      </Canvas>

       {/* Légende */}
       <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur p-3 rounded-lg shadow-lg border border-gray-200 text-xs md:text-sm pointer-events-none">
          <h4 className="font-bold text-gray-700 mb-2 border-b pb-1">Légende DDL</h4>
          <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500 block"></span>
                  <span className="text-gray-600">Axe X</span>
              </div>
              <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500 block"></span>
                  <span className="text-gray-600">Axe Y</span>
              </div>
              <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500 block"></span>
                  <span className="text-gray-600">Axe Z</span>
              </div>
              {manualState && (
                  <div className="mt-2 pt-2 border-t border-gray-100 font-bold text-red-500">
                      Rouge = Mouvement Bloqué
                  </div>
              )}
          </div>
       </div>

       <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur px-3 py-1 rounded-full text-xs font-mono text-gray-500 border border-gray-200">
         {manualState ? "Mode Interactif" : "Animation Auto"}
       </div>
    </div>
  );
};

export default JointsScene;