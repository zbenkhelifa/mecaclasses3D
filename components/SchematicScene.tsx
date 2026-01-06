import React, { useRef, useEffect } from 'react';

export type SchematicType = 'PIVOT' | 'GLISSIERE' | 'SYSTEME' | 'PIVOT_GLISSANT' | 'ROTULE';

interface SchematicSceneProps {
  type: SchematicType;
  opacity: number; // 0 = Réel, 1 = Schéma
}

const SchematicScene: React.FC<SchematicSceneProps> = ({ type, opacity }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  // --- DRAWING HELPERS ---

  const drawGroundSymbol = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, angle: number = 0) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      
      // Ligne principale
      ctx.beginPath();
      ctx.moveTo(-width/2, 0);
      ctx.lineTo(width/2, 0);
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Hachures
      ctx.beginPath();
      const spacing = 10;
      const hLength = 10;
      for(let i = -width/2 + 5; i < width/2; i += spacing) {
          ctx.moveTo(i, 0);
          ctx.lineTo(i - 5, hLength);
      }
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
  };

  // --- PIVOT ---

  const drawRealPivot = (ctx: CanvasRenderingContext2D, cx: number, cy: number, angle: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      // Support fixe
      ctx.fillStyle = "#94a3b8"; 
      ctx.beginPath();
      ctx.moveTo(-20, 50); ctx.lineTo(-20, 0); ctx.arc(0, 0, 20, Math.PI, 0); ctx.lineTo(20, 50);
      ctx.fill();
      // Bras mobile
      ctx.rotate(angle);
      ctx.fillStyle = "#3b82f6"; 
      ctx.beginPath();
      ctx.rect(-10, -15, 200, 30);
      ctx.fill();
      // Axe
      ctx.fillStyle = "#cbd5e1";
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
  };

  const drawSchematicPivot = (ctx: CanvasRenderingContext2D, cx: number, cy: number, angle: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      // Bâti
      ctx.strokeStyle = "#000"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-15, 25); ctx.lineTo(15, 25); ctx.closePath(); ctx.stroke();
      drawGroundSymbol(ctx, 0, 25, 40);
      // Rond
      ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI*2); ctx.fillStyle = "#fff"; ctx.fill(); ctx.stroke();
      // Bras
      ctx.rotate(angle);
      ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(200, 0); ctx.strokeStyle = "#3b82f6"; ctx.lineWidth = 3; ctx.stroke();
      ctx.restore();
  };

  // --- GLISSIERE ---

  const drawRealSlider = (ctx: CanvasRenderingContext2D, cx: number, cy: number, pos: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      // Sol
      ctx.fillStyle = "#94a3b8";
      ctx.fillRect(-150, 20, 300, 20);
      // Bloc
      ctx.translate(pos, 0);
      ctx.fillStyle = "#22c55e"; 
      ctx.fillRect(-40, -20, 80, 40);
      ctx.restore();
  };

  const drawSchematicSlider = (ctx: CanvasRenderingContext2D, cx: number, cy: number, pos: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      // Sol
      drawGroundSymbol(ctx, 0, 20, 300);
      // Rectangle
      ctx.translate(pos, 0);
      ctx.strokeStyle = "#22c55e"; ctx.lineWidth = 2;
      ctx.strokeRect(-40, -15, 80, 30);
      // Centre + Tige
      ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI*2); ctx.fillStyle = "#22c55e"; ctx.fill();
      ctx.beginPath(); ctx.moveTo(-40, 0); ctx.lineTo(-80, 0); ctx.stroke();
      ctx.restore();
  };

  // --- PIVOT GLISSANT ---

  const drawRealPivotGlissant = (ctx: CanvasRenderingContext2D, cx: number, cy: number, pos: number, angle: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      
      // Guide Fixe (Tube coupé)
      ctx.fillStyle = "#94a3b8";
      ctx.fillRect(-100, -25, 200, 50);
      
      // Arbre Mobile
      ctx.translate(pos, 0);
      ctx.rotate(angle);
      
      // Dessin de l'arbre
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.roundRect(-140, -15, 280, 30, 5);
      ctx.fill();
      
      // Repère visuel de rotation (ligne blanche sur l'arbre)
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-130, 0); ctx.lineTo(130, 0);
      ctx.stroke();
      
      // Manivelle au bout pour bien voir la rotation
      ctx.beginPath();
      ctx.moveTo(100, 0);
      ctx.lineTo(100, 40);
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#ef4444";
      ctx.stroke();
      ctx.beginPath(); ctx.arc(100, 45, 5, 0, Math.PI*2); ctx.fill();

      ctx.restore();
  };

  const drawSchematicPivotGlissant = (ctx: CanvasRenderingContext2D, cx: number, cy: number, pos: number, angle: number) => {
      ctx.save();
      ctx.translate(cx, cy);

      // Guide (Rectangle vide)
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.strokeRect(-60, -20, 120, 40);
      // Symbole fixe
      drawGroundSymbol(ctx, 0, 25, 80);
      
      // Axe Mobile
      ctx.translate(pos, 0);
      // On ne tourne pas tout le contexte pour garder l'axe horizontal dans le schéma "normalisé" 2D standard
      // Mais on peut dessiner la flèche de rotation ou faire tourner un élément témoin
      
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 2;
      
      // Ligne d'axe (Tige)
      ctx.beginPath();
      ctx.moveTo(-150, 0);
      ctx.lineTo(150, 0);
      ctx.stroke();

      // Petit losange au centre pour symboliser le contact complet
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.moveTo(0, -10); ctx.lineTo(10, 0); ctx.lineTo(0, 10); ctx.lineTo(-10, 0); ctx.closePath();
      ctx.fill(); ctx.stroke();
      
      // Témoin de rotation (flèche courbe)
      ctx.save();
      ctx.translate(80, -30);
      // On simule la rotation visuelle de la flèche
      ctx.scale(1, Math.cos(angle)); 
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI, true); // Demi cercle
      ctx.strokeStyle = "#ef4444";
      ctx.stroke();
      // Pointe flèche
      ctx.restore();
      
      ctx.restore();
  };

  // --- ROTULE ---

  const drawRealRotule = (ctx: CanvasRenderingContext2D, cx: number, cy: number, angle: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      
      // Support (Cupule)
      ctx.fillStyle = "#94a3b8";
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI, false); // Demi-cercle bas
      ctx.lineTo(0, 60); // Pied
      ctx.lineTo(-5, 60);
      ctx.lineTo(-30, 0);
      ctx.fill();
      
      // Sphère
      // On simule la 3D simple
      ctx.fillStyle = "#8b5cf6"; // Violet
      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, Math.PI*2);
      ctx.fill();
      
      // Tige
      ctx.rotate(angle); // Oscillation
      ctx.fillStyle = "#8b5cf6";
      ctx.beginPath();
      ctx.rect(-8, -100, 16, 80);
      ctx.fill();
      
      ctx.restore();
  };

  const drawSchematicRotule = (ctx: CanvasRenderingContext2D, cx: number, cy: number, angle: number) => {
      ctx.save();
      ctx.translate(cx, cy);

      // Support (U)
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI, false); // Coupe
      ctx.stroke();
      
      // Pied du support
      ctx.beginPath();
      ctx.moveTo(0, 15); ctx.lineTo(0, 40);
      ctx.stroke();
      drawGroundSymbol(ctx, 0, 40, 30);
      
      // Sphère (Cercle)
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI*2);
      ctx.fill();
      ctx.stroke();
      
      // Tige
      ctx.rotate(angle);
      ctx.strokeStyle = "#8b5cf6";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(0, -100);
      ctx.stroke();
      
      // Petit point centre
      ctx.fillStyle = "#8b5cf6";
      ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI*2); ctx.fill();

      ctx.restore();
  };

  // --- BIELLE MANIVELLE ---

  const drawRealCrankSystem = (ctx: CanvasRenderingContext2D, cx: number, cy: number, angle: number) => {
      const r = 50;
      const l = 120;
      const crankX = Math.cos(angle) * r;
      const crankY = Math.sin(angle) * r;
      const pistonX = crankX + Math.sqrt(l*l - crankY*crankY);

      ctx.save();
      ctx.translate(cx, cy);
      // Manivelle
      ctx.save(); ctx.rotate(angle); ctx.fillStyle = "#ef4444"; 
      ctx.beginPath(); ctx.roundRect(0, -8, r+10, 16, 5); ctx.fill(); ctx.restore();
      // Bielle
      ctx.save(); ctx.translate(crankX, crankY);
      const rodAngle = Math.atan2(-crankY, pistonX - crankX);
      ctx.rotate(rodAngle); ctx.fillStyle = "#22c55e"; 
      ctx.beginPath(); ctx.roundRect(0, -6, l, 12, 4); ctx.fill(); ctx.restore();
      // Piston
      ctx.save(); ctx.translate(pistonX, 0); ctx.fillStyle = "#3b82f6"; 
      ctx.fillRect(-20, -15, 40, 30); ctx.restore();
      // Guide
      ctx.fillStyle = "#94a3b8"; ctx.fillRect(50, 16, 200, 10); ctx.fillRect(50, -26, 200, 10);
      ctx.restore();
  };

  const drawSchematicCrankSystem = (ctx: CanvasRenderingContext2D, cx: number, cy: number, angle: number) => {
      const r = 50;
      const l = 120;
      const crankX = Math.cos(angle) * r;
      const crankY = Math.sin(angle) * r;
      const pistonX = crankX + Math.sqrt(l*l - crankY*crankY);

      ctx.save();
      ctx.translate(cx, cy);
      // Bâti
      ctx.strokeStyle = "#000"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-10, 15); ctx.lineTo(10, 15); ctx.closePath(); ctx.stroke();
      drawGroundSymbol(ctx, 0, 15, 30);
      // Manivelle
      ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(crankX, crankY); ctx.stroke();
      // Bielle
      ctx.strokeStyle = "#22c55e";
      ctx.beginPath(); ctx.moveTo(crankX, crankY); ctx.lineTo(pistonX, 0); ctx.stroke();
      // Piston
      ctx.strokeStyle = "#3b82f6"; ctx.strokeRect(pistonX - 15, -10, 30, 20);
      ctx.beginPath(); ctx.arc(pistonX, 0, 3, 0, Math.PI*2); ctx.fillStyle = "#3b82f6"; ctx.fill();
      // Guidage
      ctx.strokeStyle = "#000"; ctx.lineWidth = 1; ctx.setLineDash([10, 5]);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(pistonX + 50, 0); ctx.stroke(); ctx.setLineDash([]);
      ctx.translate(pistonX, 20); drawGroundSymbol(ctx, 0, 0, 60);
      ctx.restore();
  };


  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Responsive Canvas
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
    }
    
    ctx.resetTransform();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);
    
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    // Animation time
    timeRef.current += 0.03;
    const t = timeRef.current;

    // State calculation
    const oscAngle = Math.sin(t) * (Math.PI / 4); // Oscillating angle
    const rotContinuous = t;
    const slidePos = Math.sin(t) * 80;
    const slidePosShort = Math.sin(t) * 60;

    // --- DRAWING LAYERS ---
    
    // 1. REALISTIC LAYER
    if (opacity < 1) {
        ctx.save();
        ctx.globalAlpha = 1 - opacity;
        
        if (type === 'PIVOT') drawRealPivot(ctx, cx, cy, oscAngle);
        else if (type === 'GLISSIERE') drawRealSlider(ctx, cx, cy, slidePos);
        else if (type === 'PIVOT_GLISSANT') drawRealPivotGlissant(ctx, cx, cy, slidePosShort, rotContinuous);
        else if (type === 'ROTULE') drawRealRotule(ctx, cx, cy + 20, oscAngle);
        else if (type === 'SYSTEME') drawRealCrankSystem(ctx, cx - 50, cy, rotContinuous);
        
        ctx.restore();
    }

    // 2. SCHEMATIC LAYER
    if (opacity > 0) {
        ctx.save();
        ctx.globalAlpha = opacity;
        
        if (type === 'PIVOT') drawSchematicPivot(ctx, cx, cy, oscAngle);
        else if (type === 'GLISSIERE') drawSchematicSlider(ctx, cx, cy, slidePos);
        else if (type === 'PIVOT_GLISSANT') drawSchematicPivotGlissant(ctx, cx, cy, slidePosShort, rotContinuous);
        else if (type === 'ROTULE') drawSchematicRotule(ctx, cx, cy + 20, oscAngle);
        else if (type === 'SYSTEME') drawSchematicCrankSystem(ctx, cx - 50, cy, rotContinuous);

        ctx.restore();
    }

    animationRef.current = requestAnimationFrame(render);
  };

  useEffect(() => {
    animationRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationRef.current);
  }, [type, opacity]);

  return (
    <div className="w-full h-full bg-white rounded-lg border border-gray-200 shadow-inner overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-50 pointer-events-none"></div>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};

export default SchematicScene;