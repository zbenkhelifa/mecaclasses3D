import React, { useEffect, useState } from 'react';
import { ArrowRight, Activity } from 'lucide-react';

const GraphScene: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  // Animation loop to cycle through the kinematic chain
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const nodes = [
    { id: 0, label: "0", name: "Bâti", color: "bg-slate-400", x: 50, y: 80 },
    { id: 1, label: "1", name: "Manivelle", color: "bg-red-500", x: 50, y: 20 },
    { id: 2, label: "2", name: "Bielle", color: "bg-green-500", x: 20, y: 50 },
    { id: 3, label: "3", name: "Piston", color: "bg-blue-500", x: 80, y: 50 },
  ];

  const edges = [
    { from: 0, to: 1, label: "Pivot", type: "rotation", activeOn: 0 },
    { from: 1, to: 2, label: "Pivot", type: "rotation", activeOn: 1 },
    { from: 2, to: 3, label: "Pivot", type: "rotation", activeOn: 2 },
    { from: 3, to: 0, label: "Glissière", type: "translation", activeOn: 3 },
  ];

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Activity className="text-indigo-600" size={20} />
            Graphe de Liaison
        </h3>
        <span className="text-xs font-mono text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
            Cycle Fermé
        </span>
      </div>
      
      <div className="flex-1 relative flex items-center justify-center bg-gray-50/50 p-8">
        <svg viewBox="0 0 100 100" className="w-full max-w-md h-auto drop-shadow-xl">
            {/* Definitions for markers */}
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                </marker>
            </defs>

            {/* Edges (Lines) */}
            {edges.map((edge, idx) => {
                const start = nodes.find(n => n.id === edge.from)!;
                const end = nodes.find(n => n.id === edge.to)!;
                const isActive = activeStep === edge.activeOn;

                return (
                    <g key={idx} className="transition-all duration-500">
                        <line 
                            x1={start.x} y1={start.y} 
                            x2={end.x} y2={end.y} 
                            stroke={isActive ? "#4f46e5" : "#cbd5e1"} 
                            strokeWidth={isActive ? 1.5 : 1}
                            strokeDasharray={edge.type === 'translation' ? "4 1" : ""}
                        />
                        {/* Edge Label Badge */}
                        <foreignObject 
                            x={(start.x + end.x) / 2 - 10} 
                            y={(start.y + end.y) / 2 - 5} 
                            width="20" height="10"
                        >
                            <div className={`text-[4px] text-center rounded px-0.5 border ${isActive ? "bg-indigo-600 text-white border-indigo-600 scale-110" : "bg-white text-gray-500 border-gray-200" } transition-all duration-300 font-bold shadow-sm`}>
                                {edge.label[0]}
                            </div>
                        </foreignObject>
                    </g>
                );
            })}

            {/* Nodes (Circles) */}
            {nodes.map((node) => {
                const isHighlight = 
                    activeStep === node.id || 
                    activeStep === (node.id - 1 < 0 ? 3 : node.id - 1); 

                return (
                    <g key={node.id} className="transition-all duration-300 cursor-default">
                        <circle 
                            cx={node.x} cy={node.y} r="8" 
                            className={`${isHighlight ? "stroke-indigo-300 stroke-[3px]" : "stroke-white stroke-2"} transition-all duration-500`}
                            fill="white"
                        />
                         {/* Colored Center */}
                         <circle 
                            cx={node.x} cy={node.y} r="6" 
                            className={`${node.color} fill-current`} 
                        />
                        <text 
                            x={node.x} y={node.y} 
                            dy="1.5" 
                            textAnchor="middle" 
                            className="text-[4px] font-bold fill-white pointer-events-none"
                        >
                            {node.label}
                        </text>
                        {/* Name Label */}
                        <text 
                            x={node.x} y={node.y + 12} 
                            textAnchor="middle" 
                            className={`text-[3px] uppercase font-bold tracking-wider ${isHighlight ? "fill-indigo-700" : "fill-gray-400"}`}
                        >
                            {node.name}
                        </text>
                    </g>
                );
            })}
        </svg>
      </div>

      <div className="p-4 bg-white border-t border-gray-100 text-sm text-gray-600">
         <div className="flex items-start gap-3">
             <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0 text-indigo-600 font-bold">
                 {activeStep + 1}
             </div>
             <div>
                 <p className="font-semibold text-gray-800 mb-1">
                    {activeStep === 0 && "Liaison Bâti (0) → Manivelle (1)"}
                    {activeStep === 1 && "Liaison Manivelle (1) → Bielle (2)"}
                    {activeStep === 2 && "Liaison Bielle (2) → Piston (3)"}
                    {activeStep === 3 && "Liaison Piston (3) → Bâti (0)"}
                 </p>
                 <p className="text-xs text-gray-500">
                    {activeStep === 0 && "Pivot d'axe fixe. C'est l'entrée du mouvement (Moteur)."}
                    {activeStep === 1 && "Pivot mobile. Transmission du mouvement de rotation."}
                    {activeStep === 2 && "Pivot mobile. Transformation du mouvement."}
                    {activeStep === 3 && "Glissière (Translation). Guidage rectiligne du piston par rapport au bâti."}
                 </p>
             </div>
         </div>
      </div>
    </div>
  );
};

export default GraphScene;