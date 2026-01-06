import React, { useRef, useEffect } from 'react';

export type GearScenario = 'RATIO' | 'DIRECTION';

export interface GearConfig {
    z1: number; // Dents entrée
    z2: number; // Dents sortie
    count: number; // Nombre d'engrenages (pour scénario direction)
}

interface GearsSceneProps {
  scenario: GearScenario;
  config: GearConfig;
}

const GearsScene: React.FC<GearsSceneProps> = ({ scenario, config }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  // Configuration graphique
  const MODULE = 10; // Unité de base pour la taille

  // Fonction de dessin d'un engrenage
  const drawGear = (
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    teeth: number, 
    color: string, 
    angleOffset: number,
    label: string,
    showSpeed: boolean
  ) => {
    const pitchRadius = (teeth * MODULE) / 2;
    const outerRadius = pitchRadius + MODULE;
    const rootRadius = pitchRadius - (MODULE * 1.25);
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angleOffset);

    // 1. Dessiner les dents (Profil amélioré)
    ctx.beginPath();
    const toothAngle = (Math.PI * 2) / teeth; // Angle pour une dent + un creux
    
    for (let i = 0; i < teeth; i++) {
        const theta = i * toothAngle;
        
        // Coordonnées relatives à l'angle theta
        // On dessine une dent trapézoïdale
        
        // Début pied de dent
        const a1 = theta - toothAngle * 0.25; 
        ctx.lineTo(Math.cos(a1) * rootRadius, Math.sin(a1) * rootRadius);
        
        // Début tête de dent
        const a2 = theta - toothAngle * 0.15;
        ctx.lineTo(Math.cos(a2) * outerRadius, Math.sin(a2) * outerRadius);
        
        // Fin tête de dent
        const a3 = theta + toothAngle * 0.15;
        ctx.lineTo(Math.cos(a3) * outerRadius, Math.sin(a3) * outerRadius);
        
        // Fin pied de dent
        const a4 = theta + toothAngle * 0.25;
        ctx.lineTo(Math.cos(a4) * rootRadius, Math.sin(a4) * rootRadius);
    }
    ctx.closePath();
    
    // Remplissage et contour
    ctx.fillStyle = color + "33"; // Couleur transparente (hex + alpha)
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // 2. Cercle Primitif (Ligne pointillée)
    ctx.beginPath();
    ctx.arc(0, 0, pitchRadius, 0, Math.PI * 2);
    ctx.setLineDash([5, 3]);
    ctx.strokeStyle = "#94a3b8"; // Slate 400
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Axe central
    ctx.beginPath();
    ctx.arc(0, 0, MODULE * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = "#333";
    ctx.fill();
    
    // Clavette ou marqueur visuel sur l'axe pour bien voir la rotation
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(0) * (MODULE * 0.6), Math.sin(0) * (MODULE * 0.6));
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();

    // 4. Rayon visuel (Marqueur de rotation sur le corps)
    ctx.beginPath();
    ctx.moveTo(MODULE * 0.6, 0);
    ctx.lineTo(rootRadius - 2, 0);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();

    // 5. Labels (Statiques)
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "#1e293b";
    ctx.font = "bold 14px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Position du label sous l'engrenage
    const labelY = outerRadius + 20;
    ctx.fillText(label, 0, labelY);
    
    ctx.font = "12px Inter, sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText(`Z = ${teeth}`, 0, labelY + 16);
    
    // Flèche de vitesse angulaire (si demandé)
    if (showSpeed) {
        // ... optionnel
    }
    ctx.restore();
  };

  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Gestion Retina / High DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
    }
    
    ctx.resetTransform(); // Réinitialiser avant d'effacer
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Configuration de base
    ctx.scale(dpr, dpr);
    const width = rect.width;
    const height = rect.height;
    const cx = width / 2;
    const cy = height / 2;

    // Mise à jour du temps
    timeRef.current += 0.03;

    // --- LOGIQUE DE SCÉNARIO ---
    
    if (scenario === 'RATIO') {
        const { z1, z2 } = config;
        
        // Calcul des rayons
        const r1 = (z1 * MODULE) / 2;
        const r2 = (z2 * MODULE) / 2;
        const dist = r1 + r2;
        
        // Auto-Zoom : Calcul de l'échelle pour que tout rentre
        const totalWidth = (r1 + r2 + MODULE * 3) * 2; // Largeur estimée avec marge
        const totalHeight = Math.max(r1, r2) * 2 + MODULE * 8; // Hauteur avec marge labels
        const scaleX = width / totalWidth;
        const scaleY = height / totalHeight;
        const scale = Math.min(scaleX, scaleY, 1.2); // Max zoom 1.2

        ctx.translate(cx, cy);
        ctx.scale(scale, scale);
        
        // Positionnement (centré autour du point de contact)
        // Le point de contact est à (0,0) dans ce référentiel local
        const x1 = -r1;
        const x2 = r2;

        // Vitesses
        const w1 = 1.0; 
        const w2 = -w1 * (z1 / z2);
        
        const a1 = timeRef.current * w1;
        // Offset initial pour que les dents s'emboîtent
        // Dent face à creux au point de contact (angle 0 pour roue 1, angle PI pour roue 2)
        const a2 = timeRef.current * w2 + Math.PI + (Math.PI / z2);

        // Ligne d'entraxe
        ctx.beginPath();
        ctx.moveTo(x1, 0);
        ctx.lineTo(x2, 0);
        ctx.strokeStyle = "#e2e8f0";
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        drawGear(ctx, x1, 0, z1, "#ef4444", a1, "Entrée", true);
        drawGear(ctx, x2, 0, z2, "#3b82f6", a2, "Sortie", true);
        
        // Point de contact
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI*2);
        ctx.fillStyle = "#f59e0b";
        ctx.fill();

        // Texte Ratio
        ctx.save();
        ctx.translate(0, -Math.max(r1, r2) - 40);
        ctx.fillStyle = "#333";
        ctx.font = "16px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`Ratio = ${z1}/${z2} = ${(z1/z2).toFixed(2)}`, 0, 0);
        ctx.restore();

    } else {
        // SCENARIO DIRECTION
        const count = config.count;
        const z = 20; // Dents fixes
        const r = (z * MODULE) / 2;
        const d = r * 2;
        
        const totalW = count * d + MODULE * 4;
        const scale = Math.min(width / totalW, 1);
        
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);
        
        // Point de départ (x du premier engrenage)
        const startX = -((count - 1) * d) / 2;

        const w = 1.0;
        let currentW = w;
        
        for (let i = 0; i < count; i++) {
            const x = startX + i * d;
            const color = i === 0 ? "#22c55e" : i === count - 1 ? (currentW > 0 ? "#22c55e" : "#ef4444") : "#f59e0b";
            const label = i === 0 ? "In" : i === count - 1 ? "Out" : `${i+1}`;
            
            // Alternance angle
            // Pour i=0, angle A. Pour i=1, angle -A + offset.
            // Offset pour emboîtement : PI + PI/z
            const meshOffset = i * (Math.PI + Math.PI/z);
            const angle = timeRef.current * currentW + meshOffset;

            drawGear(ctx, x, 0, z, color, angle, label, false);
            
            currentW *= -1;
        }
    }

    animationRef.current = requestAnimationFrame(render);
  };

  useEffect(() => {
    animationRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationRef.current);
  }, [config, scenario]);

  return (
    <div className="w-full h-full relative rounded-lg overflow-hidden border border-gray-200 bg-white shadow-inner flex flex-col">
       <canvas 
        ref={canvasRef} 
        className="w-full h-full block touch-none"
      />
    </div>
  );
};

export default GearsScene;