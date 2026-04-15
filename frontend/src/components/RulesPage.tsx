import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RulesContent, FaqContent } from './RulesContent';
import { RulesContentEs, FaqContentEs } from './RulesContentEs';
import { RulesContentZhHK, FaqContentZhHK } from './RulesContentZhHK';
import { useLanguage } from '../i18n/LanguageContext';
import BackIcon from './BackIcon';

export default function RulesPage() {
  const [tab, setTab] = useState<'rules' | 'faq'>('rules');
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  useEffect(() => {
    document.title = "Liar's Dice Rules & FAQ — Dudo Dice";
    return () => { document.title = "Dudo Dice - Play Liar's Dice Online Free"; };
  }, []);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 sm:p-8 relative" style={{ overflowY: 'auto' }}>
      {/* Back button - fixed top left, matches ProfileScreen */}
      <button
        onClick={() => navigate(-1)}
        className="fixed h-10 sm:h-8 text-white text-xs sm:text-sm font-semibold z-50 rounded-xl px-2 shadow-md bg-gradient-to-br from-indigo-700 to-purple-900 flex items-center"
        style={{ left: '0.75rem', top: '0.75rem' }}
      >
        <BackIcon />{t('common.back')}
      </button>

      <div className="max-w-2xl w-full pt-12 sm:pt-0">
        {/* Logo and title */}
        <div className="flex items-center justify-center gap-4 mb-5 pl-16 sm:pl-0">
          <img
            src="/Logo.webp"
            alt="Dudo Dice Logo"
            className="flex-shrink-0"
            style={{ width: '60px', height: '60px' }}
          />
          <div className="flex flex-col">
            <h1 className="text-2xl sm:text-4xl font-bold text-white">
              {tab === 'rules' ? t('rules.pageTitle') : t('rules.faqTitle')}
            </h1>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab('rules')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${tab === 'rules' ? 'btn-3d-accent text-white' : 'btn-glass'}`}
          >
            {t('rules.rulesTab')}
          </button>
          <button
            onClick={() => setTab('faq')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${tab === 'faq' ? 'btn-3d-accent text-white' : 'btn-glass'}`}
          >
            {t('rules.faqTab')}
          </button>
        </div>

        {/* Content card */}
        <div className="bg-gradient-to-br from-indigo-700 to-purple-900 rounded-xl shadow-2xl p-4 sm:p-8 mb-6">
          {tab === 'rules'
            ? (language === 'es' ? <RulesContentEs /> : language === 'zh-HK' ? <RulesContentZhHK /> : <RulesContent />)
            : (language === 'es' ? <FaqContentEs /> : language === 'zh-HK' ? <FaqContentZhHK /> : <FaqContent />)
          }
        </div>
      </div>
    </div>
  );
}
