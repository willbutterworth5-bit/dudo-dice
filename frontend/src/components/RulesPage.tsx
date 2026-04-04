import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RulesContent, FaqContent } from './RulesContent';

export default function RulesPage() {
  const [tab, setTab] = useState<'rules' | 'faq'>('rules');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-700 to-purple-900 font-nunito">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-indigo-800/80 backdrop-blur border-b border-white/20 px-4 py-3 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="text-white/80 hover:text-white transition-colors flex items-center gap-1.5 text-sm font-semibold"
        >
          <span className="text-lg leading-none">←</span> Back
        </button>
        <h1 className="text-white font-bold text-xl flex-1 text-center pr-12">
          {tab === 'rules' ? 'Game Rules' : 'FAQ'}
        </h1>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Tab switcher */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('rules')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${tab === 'rules' ? 'btn-3d-accent text-white' : 'btn-glass'}`}
          >
            Rules
          </button>
          <button
            onClick={() => setTab('faq')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${tab === 'faq' ? 'btn-3d-accent text-white' : 'btn-glass'}`}
          >
            FAQ
          </button>
        </div>

        {tab === 'rules' ? <RulesContent /> : <FaqContent />}
      </div>
    </div>
  );
}
