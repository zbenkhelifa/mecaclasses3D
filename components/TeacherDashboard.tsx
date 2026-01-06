import React, { useState, useEffect } from 'react';
import { Lock, User, CheckCircle, Search } from 'lucide-react';
import { StudentResult } from '../types';

const TeacherDashboard: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [results, setResults] = useState<StudentResult[]>([]);

  // Simple hardcoded password for demonstration
  const TEACHER_CODE = "PROF2025";

  useEffect(() => {
    if (isAuthenticated) {
      // Load results from localStorage
      const savedResults = localStorage.getItem('meca_quiz_results');
      if (savedResults) {
        setResults(JSON.parse(savedResults).reverse()); // Newest first
      }
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === TEACHER_CODE) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Code incorrect');
    }
  };

  const getScoreColor = (score: number, total: number) => {
    const percentage = score / total;
    if (percentage >= 0.8) return 'text-green-600 bg-green-50 border-green-200';
    if (percentage >= 0.5) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="text-purple-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Accès Enseignant</h2>
          <p className="text-gray-500 mb-6">Veuillez entrer le code d'accès pour voir les résultats des élèves.</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Code d'accès"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button 
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Déverrouiller
            </button>
          </form>
          <p className="mt-4 text-xs text-gray-400">Code démo: PROF2025</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
            <h2 className="text-3xl font-bold text-gray-800">Tableau de Bord</h2>
            <p className="text-gray-500">Suivi des évaluations des étudiants</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border shadow-sm flex items-center gap-2">
            <User className="text-purple-600" size={20} />
            <span className="font-semibold text-gray-700">Professeur</span>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <Search className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500 text-lg">Aucun résultat enregistré pour le moment.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                  <th className="px-6 py-4">Étudiant</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-center">Score</th>
                  <th className="px-6 py-4 text-center">Appréciation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.map((result) => (
                  <tr key={result.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{result.studentName}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                        {new Date(result.date).toLocaleString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 text-center">
                        <span className="font-bold text-lg">{result.score}</span>
                        <span className="text-gray-400 text-sm"> / {result.totalQuestions}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getScoreColor(result.score, result.totalQuestions)}`}>
                            {result.score / result.totalQuestions >= 0.5 ? <CheckCircle size={12} className="mr-1" /> : null}
                            {result.score / result.totalQuestions >= 0.8 ? 'Excellent' : 
                             result.score / result.totalQuestions >= 0.5 ? 'Validé' : 'À revoir'}
                        </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;