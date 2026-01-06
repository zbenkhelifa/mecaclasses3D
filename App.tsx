import React, { useState, useEffect } from 'react';
import { Play, Pause, Info, BrainCircuit, RefreshCw, Box, ArrowRight, User, Image as ImageIcon, Send, HelpCircle, Check, X, Settings, FileText, Layers, Network, BookOpen, ChevronRight, Link2, Sliders, CheckSquare, Dumbbell } from 'lucide-react';
import Scene3D from './components/Scene3D';
import ExamplesScene, { ExampleType } from './components/ExamplesScene';
import JointsScene, { JointManualState } from './components/JointsScene';
import GearsScene, { GearScenario } from './components/GearsScene';
import SchematicScene, { SchematicType } from './components/SchematicScene';
import GraphScene from './components/GraphScene';
import CourseSidebar from './components/CourseSidebar';
import TeacherDashboard from './components/TeacherDashboard';
import { PartType, EquivalenceClass, StudentResult, JointType, KinematicJoint } from './types';
import { getExplanation, getQuizQuestion, generateLessonImage } from './services/geminiService';

// Definition of the equivalence classes for the system
const classesDef: EquivalenceClass[] = [
  {
    id: PartType.FRAME,
    name: "Classe Bâti (0)",
    color: "#94a3b8", // Slate 400
    description: "Ensemble des pièces fixes par rapport au référentiel d'étude. C'est la référence du mouvement.",
    parts: ["Socle", "Guide Piston", "Support Vilebrequin"]
  },
  {
    id: PartType.CRANK,
    name: "Classe Manivelle (1)",
    color: "#ef4444", // Red 500
    description: "Pièces en rotation continue autour d'un axe fixe lié au bâti.",
    parts: ["Vilebrequin", "Arbre moteur"]
  },
  {
    id: PartType.ROD,
    name: "Classe Bielle (2)",
    color: "#22c55e", // Green 500
    description: "Pièce effectuant un mouvement plan général (rotation + translation combinées). Elle transmet l'effort.",
    parts: ["Corps de bielle", "Chapeaux de bielle"]
  },
  {
    id: PartType.PISTON,
    name: "Classe Piston (3)",
    color: "#3b82f6", // Blue 500
    description: "Pièce en translation rectiligne alternative par rapport au bâti.",
    parts: ["Tête de piston", "Axe de piston"]
  }
];

const jointsDef: KinematicJoint[] = [
  {
    id: JointType.PIVOT,
    name: "Liaison Pivot",
    description: "Autorise une seule rotation autour d'un axe (ex: charnière).",
    dof: { tx: false, ty: false, tz: false, rx: true, ry: false, rz: false }
  },
  {
    id: JointType.GLISSIERE,
    name: "Liaison Glissière",
    description: "Autorise une seule translation rectiligne (ex: tiroir).",
    dof: { tx: true, ty: false, tz: false, rx: false, ry: false, rz: false }
  },
  {
    id: JointType.PIVOT_GLISSANT,
    name: "Pivot Glissant",
    description: "Une rotation et une translation conjuguées ou indépendantes sur le même axe.",
    dof: { tx: true, ty: false, tz: false, rx: true, ry: false, rz: false }
  },
  {
    id: JointType.ROTULE,
    name: "Liaison Rotule",
    description: "Trois rotations indépendantes autour d'un point centre (ex: manette jeu).",
    dof: { tx: false, ty: false, tz: false, rx: true, ry: true, rz: true }
  },
  {
    id: JointType.APPUI_PLAN,
    name: "Appui Plan",
    description: "Contact plan sur plan. 2 Translations et 1 Rotation.",
    dof: { tx: true, ty: false, tz: true, rx: false, ry: true, rz: false }
  },
  {
    id: JointType.ENCASTREMENT,
    name: "Encastrement",
    description: "Aucun mouvement relatif autorisé. Liaison complète.",
    dof: { tx: false, ty: false, tz: false, rx: false, ry: false, rz: false }
  }
];

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState('intro');
  const [highlightedPart, setHighlightedPart] = useState<PartType | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [aiExplanation, setAiExplanation] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);
  
  // Lesson state
  const [lessonTab, setLessonTab] = useState<'GENERAL' | 'LIAISONS' | 'SCHEMAS' | 'ENGRENAGES'>('GENERAL');

  // Example state
  const [activeExample, setActiveExample] = useState<ExampleType>('ROTATION');
  
  // Joint state & Exercise
  const [activeJoint, setActiveJoint] = useState<JointType>(JointType.PIVOT);
  const [jointMode, setJointMode] = useState<'LEARN' | 'EXERCISE'>('LEARN');
  const [manualState, setManualState] = useState<JointManualState>({ tx: 0, ty: 0, tz: 0, rx: 0, ry: 0, rz: 0 });
  const [userAnswers, setUserAnswers] = useState({ tx: false, ty: false, tz: false, rx: false, ry: false, rz: false });
  const [exerciseResult, setExerciseResult] = useState<'IDLE' | 'CORRECT' | 'INCORRECT'>('IDLE');

  // Gear state & Config
  const [gearScenario, setGearScenario] = useState<GearScenario>('RATIO');
  const [gearZ1, setGearZ1] = useState(12);
  const [gearZ2, setGearZ2] = useState(24);
  const [gearCount, setGearCount] = useState(3);

  // Schematic State
  const [schematicType, setSchematicType] = useState<SchematicType>('PIVOT');
  const [schematicOpacity, setSchematicOpacity] = useState(0.5);

  // Student Identity State
  const [studentName, setStudentName] = useState("");
  const [nameInput, setNameInput] = useState("");

  // Lesson Image State
  const [lessonImage, setLessonImage] = useState<string | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);

  // Quiz Sequence State
  const [quizPhase, setQuizPhase] = useState<'IDLE' | 'ACTIVE' | 'FINISHED'>('IDLE');
  const [quizScore, setQuizScore] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestionData, setCurrentQuestionData] = useState<{question: string, options: string[], answer: string, explanation: string} | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  
  const TOTAL_QUESTIONS = 3;

  // When a part is selected, fetch AI explanation if in Simulation mode
  useEffect(() => {
    if (highlightedPart && activeSection === 'simulation') {
      const cls = classesDef.find(c => c.id === highlightedPart);
      if (cls) {
        setLoadingAi(true);
        getExplanation(cls.name, "Système Bielle-Manivelle").then(text => {
          setAiExplanation(text);
          setLoadingAi(false);
        });
      }
    } else {
      setAiExplanation("");
    }
  }, [highlightedPart, activeSection]);

  // Reset exercise when switching joints
  useEffect(() => {
      setManualState({ tx: 0, ty: 0, tz: 0, rx: 0, ry: 0, rz: 0 });
      setUserAnswers({ tx: false, ty: false, tz: false, rx: false, ry: false, rz: false });
      setExerciseResult('IDLE');
  }, [activeJoint, jointMode]);

  const handleStartQuiz = async () => {
      if (!studentName) {
          alert("Veuillez entrer votre nom avant de commencer.");
          return;
      }
      setQuizPhase('ACTIVE');
      setQuizScore(0);
      setCurrentQuestionIndex(0);
      await loadNextQuestion();
  };

  const loadNextQuestion = async () => {
      setQuizLoading(true);
      setShowResult(false);
      setSelectedAnswer(null);
      const data = await getQuizQuestion("Intermédiaire");
      setCurrentQuestionData(data);
      setQuizLoading(false);
  };

  const handleNextQuestion = () => {
      if (currentQuestionIndex < TOTAL_QUESTIONS - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
          loadNextQuestion();
      } else {
          finishQuiz();
      }
  };

  const finishQuiz = () => {
      setQuizPhase('FINISHED');
      // Save result to localStorage "Database"
      const result: StudentResult = {
          id: Date.now().toString(),
          studentName: studentName,
          score: quizScore,
          totalQuestions: TOTAL_QUESTIONS,
          date: new Date().toISOString()
      };
      
      const savedResults = localStorage.getItem('meca_quiz_results');
      const results = savedResults ? JSON.parse(savedResults) : [];
      results.push(result);
      localStorage.setItem('meca_quiz_results', JSON.stringify(results));
  };

  const handleAnswerClick = (option: string) => {
      if (showResult) return;
      setSelectedAnswer(option);
      setShowResult(true);
      if (currentQuestionData && option === currentQuestionData.answer) {
          setQuizScore(prev => prev + 1);
      }
  };

  const checkExercise = () => {
      const joint = jointsDef.find(j => j.id === activeJoint);
      if (!joint) return;
      
      const correct = 
          userAnswers.tx === joint.dof.tx &&
          userAnswers.ty === joint.dof.ty &&
          userAnswers.tz === joint.dof.tz &&
          userAnswers.rx === joint.dof.rx &&
          userAnswers.ry === joint.dof.ry &&
          userAnswers.rz === joint.dof.rz;
      
      setExerciseResult(correct ? 'CORRECT' : 'INCORRECT');
  };

  const handleGenerateImage = async () => {
      setGeneratingImage(true);
      const img = await generateLessonImage("Mécanisme bielle manivelle et classes d'équivalence");
      setLessonImage(img);
      setGeneratingImage(false);
  };

  const renderDofIcon = (allowed: boolean) => {
    return allowed ? (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600">
        <span className="font-bold text-xs">1</span>
      </div>
    ) : (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-50 text-red-300">
        <span className="font-bold text-xs">0</span>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'teacher':
        return <TeacherDashboard />;

      case 'intro':
        return (
          <div className="flex flex-col h-full overflow-hidden bg-white">
            <div className="border-b border-gray-200 px-6 py-4 flex gap-4 overflow-x-auto">
                <button onClick={() => setLessonTab('GENERAL')} className={`pb-2 text-sm font-semibold transition-colors whitespace-nowrap ${lessonTab === 'GENERAL' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Généralités</button>
                <button onClick={() => setLessonTab('LIAISONS')} className={`pb-2 text-sm font-semibold transition-colors whitespace-nowrap ${lessonTab === 'LIAISONS' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Liaisons & DDL</button>
                <button onClick={() => setLessonTab('SCHEMAS')} className={`pb-2 text-sm font-semibold transition-colors whitespace-nowrap ${lessonTab === 'SCHEMAS' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Schématisation</button>
                <button onClick={() => setLessonTab('ENGRENAGES')} className={`pb-2 text-sm font-semibold transition-colors whitespace-nowrap ${lessonTab === 'ENGRENAGES' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Engrenages</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-4xl mx-auto prose prose-indigo">
                {lessonTab === 'GENERAL' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                             Classes d'Équivalence Cinématique
                        </h2>
                        
                        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 mb-8 not-prose">
                            <h3 className="text-lg font-bold text-indigo-800 mb-2 flex items-center gap-2">
                                <BrainCircuit size={20} /> Définition
                            </h3>
                            <p className="text-indigo-900 leading-relaxed">
                                Une <strong>classe d'équivalence</strong> regroupe un ensemble de pièces solidaires les unes des autres (fixées entre elles sans mouvement possible). 
                                En cinématique, on considère cet ensemble comme un seul <strong>solide indéformable</strong>.
                            </p>
                        </div>
                         {/* ... Rest of General content ... */}
                         <div className="my-8 not-prose">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold text-gray-700">Illustration par IA</h4>
                                <button 
                                    onClick={handleGenerateImage}
                                    disabled={generatingImage}
                                    className="flex items-center gap-2 px-3 py-1 bg-pink-100 text-pink-700 rounded hover:bg-pink-200 text-sm font-semibold"
                                >
                                    <ImageIcon size={16} /> {generatingImage ? "..." : "Générer"}
                                </button>
                            </div>
                            <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center">
                                {lessonImage ? (
                                    <img src={lessonImage} alt="Illustration cours" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-gray-400 text-sm">Cliquez pour générer une illustration</span>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                {/* ... Keep other tabs as before ... */}
                {lessonTab === 'LIAISONS' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <h2 className="text-3xl font-bold text-gray-800 mb-6">Les Liaisons Mécaniques</h2>
                        <p className="lead">
                            Une liaison cinématique modélise le contact entre deux classes d'équivalence et définit les mouvements relatifs autorisés.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-prose my-8">
                             <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                                <h4 className="font-bold text-indigo-600 mb-2">Degrés de Liberté (DDL)</h4>
                                <p className="text-sm text-gray-600 mb-3">
                                    C'est le nombre de mouvements indépendants possibles entre deux pièces.
                                </p>
                                <ul className="text-sm space-y-1 text-gray-700">
                                    <li className="flex items-center gap-2"><ArrowRight size={14} className="text-green-500" /> 3 Translations (Tx, Ty, Tz)</li>
                                    <li className="flex items-center gap-2"><ArrowRight size={14} className="text-blue-500" /> 3 Rotations (Rx, Ry, Rz)</li>
                                </ul>
                            </div>
                            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                                <h4 className="font-bold text-purple-600 mb-2">Les Liaisons Usuelles</h4>
                                <ul className="text-sm space-y-2">
                                    <li className="border-b pb-1"><strong>Pivot :</strong> 1 Rotation (ex: porte)</li>
                                    <li className="border-b pb-1"><strong>Glissière :</strong> 1 Translation (ex: tiroir)</li>
                                    <li className="border-b pb-1"><strong>Hélicoïdale :</strong> 1 Mvt combiné (ex: vis-écrou)</li>
                                    <li><strong>Rotule :</strong> 3 Rotations (ex: joystick)</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
                 {lessonTab === 'SCHEMAS' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                         <h2 className="text-3xl font-bold text-gray-800 mb-6">Schématisation Cinématique</h2>
                         <p>
                             Le schéma cinématique est une représentation normalisée (ISO).
                         </p>
                         <p className="text-sm text-gray-500 italic mt-4">
                             Rendez-vous dans la section <strong>"Schémas"</strong> du menu pour voir les symboles animés.
                         </p>
                    </div>
                )}

                {lessonTab === 'ENGRENAGES' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                         <h2 className="text-3xl font-bold text-gray-800 mb-6">Les Engrenages</h2>
                         <p>
                             Ils servent à transmettre la puissance par rotation sans glissement (obstacle).
                         </p>
                    </div>
                )}
            </div>
          </div>
        );

      case 'graphs':
        return (
            <div className="h-full bg-gray-50 p-4 md:p-8 flex flex-col md:flex-row gap-6 overflow-hidden">
                <div className="w-full md:w-1/3 flex-shrink-0 flex flex-col">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                             <Network className="text-indigo-600" /> Le Graphe
                        </h2>
                        <p className="text-gray-600 text-sm mb-4">
                            Le graphe de liaison (ou graphe des structures) est une représentation topologique du mécanisme.
                        </p>
                         <ul className="space-y-3">
                            <li className="flex items-center gap-3 p-2 bg-indigo-50 rounded-lg text-sm text-indigo-900">
                                <span className="w-4 h-4 rounded-full bg-white border-2 border-indigo-400"></span>
                                <strong>Nœuds (Cercles)</strong> : Les classes d'équivalence.
                            </li>
                            <li className="flex items-center gap-3 p-2 bg-gray-100 rounded-lg text-sm text-gray-700">
                                <div className="w-8 h-0.5 bg-gray-400"></div>
                                <strong>Arcs (Traits)</strong> : Les liaisons mécaniques.
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="flex-1 h-full min-h-[400px]">
                    <GraphScene />
                </div>
            </div>
        );

      case 'classes':
        return (
          <div className="p-4 md:p-8 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto h-full pb-20 md:pb-8">
             <div className="col-span-full mb-2">
                 <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Les Classes</h2>
                 <p className="text-gray-600">Système Bielle-Manivelle</p>
             </div>
             {classesDef.map((cls) => (
               <div 
                 key={cls.id}
                 className={`cursor-pointer rounded-xl p-6 border-2 transition-all hover:shadow-md ${highlightedPart === cls.id ? 'border-indigo-500 bg-indigo-50' : 'border-transparent bg-white shadow-sm'}`}
                 onClick={() => {
                   setHighlightedPart(cls.id);
                   setActiveSection('simulation'); 
                 }}
               >
                 <div className="flex items-center gap-3 mb-3">
                   <div className="w-6 h-6 rounded-full shadow-sm" style={{ backgroundColor: cls.color }}></div>
                   <h3 className="font-bold text-lg text-gray-800">{cls.name}</h3>
                 </div>
                 <p className="text-gray-600 text-sm mb-3">{cls.description}</p>
                 <div className="text-xs bg-gray-100 p-2 rounded text-gray-500 font-mono break-words">
                   {cls.parts.join(", ")}
                 </div>
               </div>
             ))}
          </div>
        );

      case 'joints':
        const joint = jointsDef.find(j => j.id === activeJoint) || jointsDef[0];
        return (
            <div className="h-full flex flex-col md:flex-row bg-gray-50 overflow-hidden">
                {/* Mobile Selector */}
                <div className="md:hidden p-4 bg-white border-b border-gray-200 overflow-x-auto whitespace-nowrap scrollbar-hide">
                    {jointsDef.map(j => (
                        <button
                            key={j.id}
                            onClick={() => setActiveJoint(j.id)}
                            className={`px-4 py-2 mr-2 rounded-full text-sm font-medium transition-colors ${
                                activeJoint === j.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'
                            }`}
                        >
                            {j.name}
                        </button>
                    ))}
                </div>

                {/* Sidebar Desktop */}
                <div className="hidden md:block w-72 bg-white border-r border-gray-200 p-4 overflow-y-auto flex-shrink-0">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Liaisons Élémentaires</h2>
                    <div className="space-y-2">
                        {jointsDef.map(j => (
                            <button
                                key={j.id}
                                onClick={() => setActiveJoint(j.id)}
                                className={`w-full text-left p-3 rounded-lg border transition-all ${
                                    activeJoint === j.id 
                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold shadow-sm' 
                                    : 'border-transparent hover:bg-gray-50 text-gray-600'
                                }`}
                            >
                                {j.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col relative bg-gray-100 overflow-y-auto">
                    {/* Header Controls */}
                    <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center shadow-sm z-10">
                        <h3 className="text-lg font-bold text-gray-800">{joint.name}</h3>
                        <div className="flex bg-gray-100 rounded-lg p-1">
                            <button 
                                onClick={() => setJointMode('LEARN')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${jointMode === 'LEARN' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <BookOpen size={16} /> Cours
                            </button>
                            <button 
                                onClick={() => setJointMode('EXERCISE')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${jointMode === 'EXERCISE' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <Dumbbell size={16} /> Exercice
                            </button>
                        </div>
                    </div>

                    {/* 3D Scene */}
                    <div className="h-1/2 md:h-[55%] bg-gray-200 relative w-full">
                        <JointsScene 
                            type={activeJoint} 
                            manualState={jointMode === 'EXERCISE' ? manualState : null}
                        />
                    </div>

                    {/* Bottom Panel (Changes based on mode) */}
                    <div className="flex-1 bg-white p-4 md:p-8 overflow-y-auto">
                        
                        {jointMode === 'LEARN' ? (
                            <div className="animate-in fade-in slide-in-from-bottom-2">
                                <p className="text-gray-600 mb-6">{joint.description}</p>
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 text-center">Degrés de Liberté</h4>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div>
                                            <h5 className="text-center font-semibold text-gray-700 mb-3 border-b pb-1">Translation</h5>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-600 font-mono">Tx</span>
                                                    {renderDofIcon(joint.dof.tx)}
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-600 font-mono">Ty</span>
                                                    {renderDofIcon(joint.dof.ty)}
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-600 font-mono">Tz</span>
                                                    {renderDofIcon(joint.dof.tz)}
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <h5 className="text-center font-semibold text-gray-700 mb-3 border-b pb-1">Rotation</h5>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-600 font-mono">Rx</span>
                                                    {renderDofIcon(joint.dof.rx)}
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-600 font-mono">Ry</span>
                                                    {renderDofIcon(joint.dof.ry)}
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-600 font-mono">Rz</span>
                                                    {renderDofIcon(joint.dof.rz)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="animate-in fade-in slide-in-from-bottom-2 flex flex-col md:flex-row gap-6">
                                {/* Left: Manipulators */}
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center gap-2 mb-2 text-orange-600 font-bold">
                                        <Sliders size={18} /> 1. Manipulez le mécanisme
                                    </div>
                                    <div className="space-y-4 p-4 bg-orange-50 rounded-xl border border-orange-100">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase block">Translations</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {['tx', 'ty', 'tz'].map((axis) => (
                                                    <div key={axis} className="text-center">
                                                        <span className="text-xs font-mono font-bold text-gray-600 mb-1 block uppercase">{axis}</span>
                                                        <input 
                                                            type="range" min="-1" max="1" step="0.1" 
                                                            value={manualState[axis as keyof JointManualState]}
                                                            onChange={(e) => setManualState({...manualState, [axis]: parseFloat(e.target.value)})}
                                                            className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-orange-500"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase block">Rotations</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {['rx', 'ry', 'rz'].map((axis) => (
                                                    <div key={axis} className="text-center">
                                                        <span className="text-xs font-mono font-bold text-gray-600 mb-1 block uppercase">{axis}</span>
                                                        <input 
                                                            type="range" min="-1" max="1" step="0.1" 
                                                            value={manualState[axis as keyof JointManualState]}
                                                            onChange={(e) => setManualState({...manualState, [axis]: parseFloat(e.target.value)})}
                                                            className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-orange-500"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="text-xs text-center text-orange-700 italic">
                                            Si la pièce vibre/rouge, le mouvement est impossible.
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Answers */}
                                <div className="flex-1 flex flex-col">
                                    <div className="flex items-center gap-2 mb-2 text-indigo-600 font-bold">
                                        <CheckSquare size={18} /> 2. Cochez les possibles
                                    </div>
                                    <div className="bg-white border border-gray-200 rounded-xl p-4 flex-1 flex flex-col">
                                        <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-4">
                                            {(['tx', 'ty', 'tz', 'rx', 'ry', 'rz'] as const).map((key) => (
                                                <label key={key} className="flex items-center gap-3 cursor-pointer group">
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${userAnswers[key] ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300 bg-white group-hover:border-indigo-400'}`}>
                                                        {userAnswers[key] && <Check size={14} />}
                                                    </div>
                                                    <input 
                                                        type="checkbox" 
                                                        className="hidden" 
                                                        checked={userAnswers[key]} 
                                                        onChange={() => setUserAnswers(prev => ({...prev, [key]: !prev[key]}))}
                                                    />
                                                    <span className="font-mono text-gray-700 font-medium uppercase">{key}</span>
                                                </label>
                                            ))}
                                        </div>
                                        
                                        <div className="mt-auto pt-4 border-t border-gray-100">
                                            {exerciseResult === 'IDLE' ? (
                                                <button 
                                                    onClick={checkExercise}
                                                    className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors"
                                                >
                                                    Vérifier
                                                </button>
                                            ) : (
                                                <div className={`p-3 rounded-lg text-center font-bold mb-2 ${exerciseResult === 'CORRECT' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {exerciseResult === 'CORRECT' ? "Correct ! Bien joué." : "Incorrect, réessayez."}
                                                </div>
                                            )}
                                            {exerciseResult !== 'IDLE' && (
                                                <button 
                                                    onClick={() => setExerciseResult('IDLE')}
                                                    className="w-full py-2 bg-gray-100 text-gray-600 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-sm"
                                                >
                                                    Réessayer
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );

      case 'schematics':
          return (
             <div className="h-full flex flex-col md:flex-row bg-gray-50 overflow-hidden">
                <div className="w-full md:w-80 bg-white border-b md:border-b-0 md:border-r border-gray-200 p-4 md:p-6 overflow-y-auto z-10 shadow-lg flex-shrink-0">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <FileText className="text-indigo-600" /> Schémas
                    </h2>

                    <div className="space-y-3 mb-8">
                        <label className="text-xs font-bold text-gray-500 uppercase">Modèle</label>
                        <button 
                            onClick={() => setSchematicType('PIVOT')}
                            className={`w-full p-3 rounded-lg border-2 text-left transition-all ${schematicType === 'PIVOT' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        >
                            <div className="font-bold">Liaison Pivot</div>
                            <div className="text-xs opacity-70">Symbole normalisé</div>
                        </button>
                        <button 
                            onClick={() => setSchematicType('GLISSIERE')}
                            className={`w-full p-3 rounded-lg border-2 text-left transition-all ${schematicType === 'GLISSIERE' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        >
                            <div className="font-bold">Liaison Glissière</div>
                            <div className="text-xs opacity-70">Symbole normalisé</div>
                        </button>
                        <button 
                            onClick={() => setSchematicType('PIVOT_GLISSANT')}
                            className={`w-full p-3 rounded-lg border-2 text-left transition-all ${schematicType === 'PIVOT_GLISSANT' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        >
                            <div className="font-bold">Pivot Glissant</div>
                            <div className="text-xs opacity-70">Rotation + Translation</div>
                        </button>
                        <button 
                            onClick={() => setSchematicType('ROTULE')}
                            className={`w-full p-3 rounded-lg border-2 text-left transition-all ${schematicType === 'ROTULE' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        >
                            <div className="font-bold">Liaison Rotule</div>
                            <div className="text-xs opacity-70">Sphérique</div>
                        </button>
                        <button 
                            onClick={() => setSchematicType('SYSTEME')}
                            className={`w-full p-3 rounded-lg border-2 text-left transition-all ${schematicType === 'SYSTEME' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        >
                            <div className="font-bold">Bielle-Manivelle</div>
                            <div className="text-xs opacity-70">Schéma cinématique complet</div>
                        </button>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <div className="flex justify-between items-center mb-2">
                             <label className="text-xs font-bold text-gray-700 flex items-center gap-2">
                                <Layers size={14} /> MODE DE VUE
                             </label>
                             <span className="text-xs font-mono bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-500">
                                 {schematicOpacity === 0 ? "Réel" : schematicOpacity === 1 ? "Schéma" : "Mixte"}
                             </span>
                        </div>
                        <input 
                            type="range" 
                            min="0" max="1" step="0.01"
                            value={schematicOpacity}
                            onChange={(e) => setSchematicOpacity(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-2">
                            <span>Réaliste</span>
                            <span>Schématique</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 relative bg-gray-100 p-4 md:p-8 flex flex-col">
                    <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
                         <SchematicScene type={schematicType} opacity={schematicOpacity} />
                         
                         <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-4 py-2 rounded-lg border border-gray-200 shadow-sm text-sm">
                             <p className="font-bold text-gray-700">Animation synchronisée</p>
                             <p className="text-gray-500 text-xs">Observez la correspondance des mouvements</p>
                         </div>
                    </div>
                </div>
             </div>
          );
      
      case 'gears':
          return (
             <div className="h-full flex flex-col md:flex-row bg-gray-50 overflow-hidden">
                <div className="w-full md:w-96 bg-white border-b md:border-b-0 md:border-r border-gray-200 flex-shrink-0 flex flex-col overflow-hidden">
                    <div className="p-4 md:p-6 border-b border-gray-100">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                           <Settings className="text-indigo-600" /> Engrenages
                        </h2>
                        <p className="text-sm text-gray-500">Transmission de puissance par obstacle.</p>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                        {/* Section Rapport */}
                        <div 
                           onClick={() => setGearScenario('RATIO')}
                           className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${gearScenario === 'RATIO' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                        >
                            <h3 className="font-bold text-gray-800 mb-2">1. Rapport de Transmission</h3>
                            <p className="text-sm text-gray-600 mb-3">
                                Le rapport de vitesse dépend inversement du nombre de dents.
                            </p>
                            
                            {/* Contrôles Dynamiques pour le Rapport */}
                            {gearScenario === 'RATIO' && (
                                <div className="mt-4 space-y-4 bg-white p-3 rounded-lg border border-blue-100 animate-in fade-in slide-in-from-top-2">
                                    <div>
                                        <label className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                                            <span>Dents Entrée (Z1)</span>
                                            <span className="text-blue-600">{gearZ1}</span>
                                        </label>
                                        <input 
                                            type="range" 
                                            min="8" max="40" step="1"
                                            value={gearZ1}
                                            onChange={(e) => setGearZ1(parseInt(e.target.value))}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                        />
                                    </div>
                                    <div>
                                        <label className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                                            <span>Dents Sortie (Z2)</span>
                                            <span className="text-blue-600">{gearZ2}</span>
                                        </label>
                                        <input 
                                            type="range" 
                                            min="8" max="40" step="1"
                                            value={gearZ2}
                                            onChange={(e) => setGearZ2(parseInt(e.target.value))}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="mt-2 bg-gray-50 p-2 rounded border border-gray-100 text-center font-mono text-xs">
                                r = ω_sortie / ω_entrée = Z_entrée / Z_sortie
                            </div>
                        </div>

                        {/* Section Sens */}
                        <div 
                           onClick={() => setGearScenario('DIRECTION')}
                           className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${gearScenario === 'DIRECTION' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
                        >
                            <h3 className="font-bold text-gray-800 mb-2">2. Sens de Rotation</h3>
                            <p className="text-sm text-gray-600 mb-3">
                                Chaque contact extérieur inverse le sens de rotation.
                            </p>

                             {/* Contrôles Dynamiques pour le Sens */}
                             {gearScenario === 'DIRECTION' && (
                                <div className="mt-4 bg-white p-3 rounded-lg border border-green-100 animate-in fade-in slide-in-from-top-2">
                                    <label className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                                        <span>Nombre d'engrenages</span>
                                        <span className="text-green-600">{gearCount}</span>
                                    </label>
                                    <input 
                                        type="range" 
                                        min="2" max="5" step="1"
                                        value={gearCount}
                                        onChange={(e) => setGearCount(parseInt(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                                    />
                                    <div className="flex justify-between text-[10px] text-gray-400 mt-1 px-1">
                                        <span>2</span><span>3</span><span>4</span><span>5</span>
                                    </div>
                                </div>
                            )}

                             <div className="mt-2 bg-gray-50 p-2 rounded border border-gray-100 text-center font-mono text-xs">
                                Sens = (-1)^n
                                <br/>
                                <span className="text-[10px] text-gray-400">n = nombre de contacts extérieurs</span>
                            </div>
                        </div>

                         <div className="bg-gray-50 p-4 rounded-lg text-xs text-gray-500 leading-relaxed">
                            <p className="font-semibold mb-1">Lexique :</p>
                            <ul className="list-disc pl-4 space-y-1">
                                <li><strong>Z</strong> : Nombre de dents</li>
                                <li><strong>ω</strong> : Vitesse angulaire (rad/s)</li>
                                <li><strong>Module (m)</strong> : Taille des dents (doit être identique pour engrener)</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="flex-1 relative bg-gray-100">
                    <GearsScene 
                        scenario={gearScenario} 
                        config={{
                            z1: gearZ1,
                            z2: gearZ2,
                            count: gearCount
                        }}
                    />
                </div>
             </div>
          );

      case 'examples':
        return (
          <div className="h-full flex flex-col md:flex-row bg-gray-50 overflow-hidden">
            <div className="w-full md:w-80 bg-white border-b md:border-b-0 md:border-r border-gray-200 p-4 md:p-6 overflow-y-auto z-10 shadow-lg flex-shrink-0">
               <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">Cas Concrets</h2>
               <div className="flex md:flex-col gap-4 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
                 <div 
                    onClick={() => setActiveExample('ROTATION')}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all min-w-[200px] md:min-w-0 flex-shrink-0 ${activeExample === 'ROTATION' ? 'border-amber-500 bg-amber-50 shadow-md' : 'border-gray-100 hover:border-gray-300'}`}
                 >
                    <h3 className="font-bold text-gray-800 mb-1 flex items-center justify-between">
                      Rotation <ArrowRight size={16} className={activeExample === 'ROTATION' ? 'text-amber-500' : 'text-gray-300'} />
                    </h3>
                    <p className="text-sm text-gray-600">Ex: Ventilateur</p>
                 </div>

                 <div 
                    onClick={() => setActiveExample('TRANSLATION')}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all min-w-[200px] md:min-w-0 flex-shrink-0 ${activeExample === 'TRANSLATION' ? 'border-cyan-500 bg-cyan-50 shadow-md' : 'border-gray-100 hover:border-gray-300'}`}
                 >
                    <h3 className="font-bold text-gray-800 mb-1 flex items-center justify-between">
                      Translation <ArrowRight size={16} className={activeExample === 'TRANSLATION' ? 'text-cyan-500' : 'text-gray-300'} />
                    </h3>
                    <p className="text-sm text-gray-600">Ex: Tiroir</p>
                 </div>

                 <div 
                    onClick={() => setActiveExample('PIVOT')}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all min-w-[200px] md:min-w-0 flex-shrink-0 ${activeExample === 'PIVOT' ? 'border-lime-500 bg-lime-50 shadow-md' : 'border-gray-100 hover:border-gray-300'}`}
                 >
                    <h3 className="font-bold text-gray-800 mb-1 flex items-center justify-between">
                      Pivot <ArrowRight size={16} className={activeExample === 'PIVOT' ? 'text-lime-500' : 'text-gray-300'} />
                    </h3>
                    <p className="text-sm text-gray-600">Ex: Barrière</p>
                 </div>
               </div>
            </div>

            <div className="flex-1 relative bg-gray-200 min-h-[300px]">
               <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur p-4 rounded-xl shadow-lg max-w-[90%] md:max-w-md border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    {activeExample === 'ROTATION' && "Rotation Axe Fixe"}
                    {activeExample === 'TRANSLATION' && "Translation Rectiligne"}
                    {activeExample === 'PIVOT' && "Liaison Pivot"}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {activeExample === 'ROTATION' && "Rotation continue autour d'un axe fixe."}
                    {activeExample === 'TRANSLATION' && "Glissement rectiligne le long d'une direction."}
                    {activeExample === 'PIVOT' && "Rotation angulaire limitée."}
                  </p>
               </div>
               <ExamplesScene type={activeExample} />
            </div>
          </div>
        );

      case 'quiz':
          return (
              <div className="p-4 md:p-8 max-w-3xl mx-auto h-full overflow-y-auto">
                  <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                          <BrainCircuit className="text-indigo-500" />
                          Évaluation
                      </h2>
                      {studentName && <span className="text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-full text-xs md:text-sm truncate max-w-[150px]">{studentName}</span>}
                  </div>
                  
                  {/* Phase 1: Identity */}
                  {!studentName && (
                      <div className="max-w-md mx-auto bg-white p-6 md:p-8 rounded-xl shadow-md border border-gray-200 mt-4 md:mt-10">
                          <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">Identification</h3>
                          <p className="text-gray-600 mb-6 text-center text-sm">Entrez votre nom pour que vos résultats soient envoyés à l'enseignant.</p>
                          <div className="flex flex-col md:flex-row gap-2">
                              <div className="relative flex-1">
                                <User className="absolute left-3 top-3 text-gray-400" size={20} />
                                <input 
                                    type="text" 
                                    value={nameInput}
                                    onChange={(e) => setNameInput(e.target.value)}
                                    placeholder="Nom Prénom" 
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                              </div>
                              <button 
                                onClick={() => setStudentName(nameInput)}
                                disabled={!nameInput.trim()}
                                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg font-semibold transition-colors w-full md:w-auto"
                              >
                                  Valider
                              </button>
                          </div>
                      </div>
                  )}

                  {/* Phase 2: Start */}
                  {studentName && quizPhase === 'IDLE' && (
                      <div className="text-center py-8 md:py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                          <div className="w-16 h-16 md:w-20 md:h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                            <HelpCircle size={32} className="text-indigo-600 md:w-10 md:h-10" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-800 mb-2">Quiz Classes & Liaisons</h3>
                          <p className="text-gray-600 mb-6 px-4">3 questions générées par IA.</p>
                          <button 
                            onClick={handleStartQuiz}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 mx-auto shadow-lg shadow-indigo-200"
                          >
                              <Play size={20} /> Commencer
                          </button>
                      </div>
                  )}

                  {/* Phase 3: Active Quiz */}
                  {quizPhase === 'ACTIVE' && (
                      <div>
                          {quizLoading ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
                                    <p className="text-gray-500">Chargement...</p>
                                </div>
                          ) : currentQuestionData && (
                              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                                  <div className="p-4 md:p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                                      <h3 className="text-md md:text-lg font-semibold text-gray-800 pr-2">{currentQuestionData.question}</h3>
                                      <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded whitespace-nowrap">Q{currentQuestionIndex+1}/{TOTAL_QUESTIONS}</span>
                                  </div>
                                  <div className="p-4 md:p-6 space-y-3">
                                      {currentQuestionData.options.map((option, idx) => (
                                          <button
                                            key={idx}
                                            disabled={showResult}
                                            onClick={() => handleAnswerClick(option)}
                                            className={`w-full text-left p-3 md:p-4 rounded-lg border transition-all text-sm md:text-base ${
                                                showResult 
                                                    ? option === currentQuestionData.answer 
                                                        ? 'bg-green-100 border-green-500 text-green-800' 
                                                        : option === selectedAnswer 
                                                            ? 'bg-red-50 border-red-300 text-red-800'
                                                            : 'bg-gray-50 border-gray-200 opacity-50'
                                                    : 'hover:bg-indigo-50 hover:border-indigo-300 border-gray-200'
                                            }`}
                                          >
                                              <span className="font-bold mr-2">{String.fromCharCode(65 + idx)}.</span> {option}
                                          </button>
                                      ))}
                                  </div>
                                  {showResult && (
                                      <div className="p-4 md:p-6 bg-blue-50 border-t border-blue-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                          <h4 className="font-bold text-blue-900 mb-1">Explication :</h4>
                                          <p className="text-blue-800 text-sm mb-4">{currentQuestionData.explanation}</p>
                                          <button 
                                            onClick={handleNextQuestion}
                                            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                                          >
                                              {currentQuestionIndex < TOTAL_QUESTIONS - 1 ? "Suivant" : "Terminer"} <ArrowRight size={18} />
                                          </button>
                                      </div>
                                  )}
                              </div>
                          )}
                      </div>
                  )}

                  {/* Phase 4: Results */}
                  {quizPhase === 'FINISHED' && (
                      <div className="text-center py-12 bg-white rounded-xl shadow-lg border border-gray-200">
                          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${quizScore >= TOTAL_QUESTIONS/2 ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                              <span className="text-4xl font-bold">{quizScore}/{TOTAL_QUESTIONS}</span>
                          </div>
                          <h3 className="text-2xl font-bold text-gray-800 mb-2">Terminé !</h3>
                          <p className="text-gray-600 mb-6">Résultats enregistrés.</p>
                          
                          <div className="flex flex-col md:flex-row gap-4 justify-center px-4">
                              <button 
                                onClick={() => {
                                    setQuizPhase('IDLE');
                                    setStudentName(""); 
                                    setNameInput("");
                                }}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                  Nouveau Joueur
                              </button>
                              <button 
                                onClick={() => {
                                    setQuizPhase('IDLE');
                                }}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                              >
                                  <RefreshCw size={18} /> Recommencer
                              </button>
                          </div>
                      </div>
                  )}
              </div>
          );

      default: // Simulation
        return (
          <div className="h-full flex flex-col relative">
            {/* 3D Viewport */}
            <div className="flex-1 bg-gray-100 relative z-0 min-h-[50vh]">
               <Scene3D 
                 highlightedPart={highlightedPart} 
                 setHighlightedPart={setHighlightedPart}
                 classes={classesDef}
                 isPlaying={isPlaying}
               />
               
               {/* Controls Overlay */}
               <div className="absolute top-4 right-4 flex gap-2">
                 <button 
                   onClick={() => setIsPlaying(!isPlaying)}
                   className="bg-white p-3 rounded-full shadow-md hover:bg-gray-50 transition-colors text-gray-700"
                   title={isPlaying ? "Pause" : "Lecture"}
                 >
                   {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                 </button>
               </div>
            </div>

            {/* Context Panel */}
            <div className="h-auto md:h-1/3 bg-white border-t border-gray-200 p-4 md:p-6 overflow-y-auto z-10 shadow-up">
               {!highlightedPart ? (
                 <div className="flex flex-col items-center justify-center h-full text-gray-400 py-4">
                   <Box size={40} className="mb-2 opacity-20" />
                   <p className="text-center">Sélectionnez une pièce 3D</p>
                 </div>
               ) : (
                 <div className="flex flex-col md:flex-row gap-6 h-full">
                    {(() => {
                        const cls = classesDef.find(c => c.id === highlightedPart);
                        if (!cls) return null;
                        return (
                            <>
                                <div className="w-full md:w-1/3 flex-shrink-0 md:border-r border-gray-100 md:pr-6 mb-4 md:mb-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-4 h-4 rounded-full" style={{backgroundColor: cls.color}}></div>
                                        <h3 className="text-xl font-bold text-gray-800">{cls.name}</h3>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-4">{cls.description}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {cls.parts.map(p => (
                                            <span key={p} className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 border border-gray-200">{p}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-semibold text-indigo-600 mb-2 flex items-center gap-2">
                                        <BrainCircuit size={16} /> Analyse IA
                                    </h4>
                                    {loadingAi ? (
                                        <div className="space-y-2 animate-pulse">
                                            <div className="h-2 bg-gray-200 rounded w-full"></div>
                                            <div className="h-2 bg-gray-200 rounded w-5/6"></div>
                                            <div className="h-2 bg-gray-200 rounded w-4/6"></div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-700 leading-relaxed italic bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                                            "{aiExplanation || "Cliquez sur une pièce pour obtenir une analyse détaillée."}"
                                        </p>
                                    )}
                                </div>
                            </>
                        );
                    })()}
                 </div>
               )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen bg-gray-50 overflow-hidden">
      <CourseSidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      <main className="flex-1 overflow-hidden relative flex flex-col">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;