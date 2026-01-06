import React from 'react';
import { BookOpen, Box, Activity, HelpCircle, Library, GraduationCap, Link2, Settings, FileText, Network } from 'lucide-react';

interface CourseSidebarProps {
  activeSection: string;
  setActiveSection: (id: string) => void;
}

const CourseSidebar: React.FC<CourseSidebarProps> = ({ activeSection, setActiveSection }) => {
  const menuItems = [
    { id: 'intro', label: 'Leçon', icon: <BookOpen size={20} /> },
    { id: 'classes', label: 'Classes', icon: <Box size={20} /> },
    { id: 'joints', label: 'Liaisons', icon: <Link2 size={20} /> },
    { id: 'graphs', label: 'Graphes', icon: <Network size={20} /> },
    { id: 'schematics', label: 'Schémas', icon: <FileText size={20} /> },
    { id: 'gears', label: 'Engrenages', icon: <Settings size={20} /> },
    { id: 'examples', label: 'Exemples', icon: <Library size={20} /> },
    { id: 'simulation', label: '3D', icon: <Activity size={20} /> },
    { id: 'quiz', label: 'Quiz', icon: <HelpCircle size={20} /> },
  ];

  return (
    <div className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-gray-200 flex flex-col flex-shrink-0">
      <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center md:block">
        <div>
            <h1 className="text-lg md:text-xl font-bold text-indigo-600 flex items-center gap-2">
            MécaClasses <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">3D</span>
            </h1>
            <p className="text-xs text-gray-500 mt-1 hidden md:block">Apprentissage cinématique</p>
        </div>
        {/* Mobile only teacher button mini */}
        <button onClick={() => setActiveSection('teacher')} className="md:hidden text-gray-400">
            <GraduationCap size={24} />
        </button>
      </div>
      
      {/* Scrollable Horizontal Menu for Mobile / Vertical for Desktop */}
      <nav className="flex-1 overflow-x-auto md:overflow-y-auto flex md:flex-col p-2 md:p-4 gap-2 scrollbar-hide">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`flex-shrink-0 flex items-center gap-2 md:gap-3 px-3 py-2 md:px-4 md:py-3 rounded-lg transition-all duration-200 text-sm md:text-base whitespace-nowrap ${
              activeSection === item.id
                ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="hidden md:block p-4 border-t border-gray-100">
        <button
            onClick={() => setActiveSection('teacher')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${
              activeSection === 'teacher'
                ? 'bg-purple-50 text-purple-700 font-semibold'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
        >
            <GraduationCap size={20} />
            <span>Espace Prof</span>
        </button>
      </div>
    </div>
  );
};

export default CourseSidebar;