import { useState } from 'react';
import { RulesContent, FaqContent } from './RulesContent';
import { RulesContentEs, FaqContentEs } from './RulesContentEs';
import { RulesContentZhHK, FaqContentZhHK } from './RulesContentZhHK';
import { useLanguage } from '../i18n/LanguageContext';

interface RulesModalProps {
  onClose: () => void;
}

export default function RulesModal({ onClose }: RulesModalProps) {
  const [tab, setTab] = useState<'rules' | 'faq'>('rules');
  const { t, language } = useLanguage();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-gradient-to-br from-indigo-700 to-purple-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white/10 border-b border-white/20 p-4 sm:p-6 flex justify-between items-center shrink-0 rounded-t-2xl">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              {tab === 'rules' ? t('rules.pageTitle') : t('rules.faqTitle')}
            </h2>
            <div className="flex gap-1.5">
              <button
                onClick={() => setTab('rules')}
                className={`px-3 py-1 rounded-lg text-sm font-bold transition-colors ${tab === 'rules' ? 'btn-3d-accent text-white' : 'btn-glass'}`}
              >
                {t('rules.rulesTab')}
              </button>
              <button
                onClick={() => setTab('faq')}
                className={`px-3 py-1 rounded-lg text-sm font-bold transition-colors ${tab === 'faq' ? 'btn-3d-accent text-white' : 'btn-glass'}`}
              >
                {t('rules.faqTab')}
              </button>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:text-white/70 text-3xl font-bold">×</button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto scrollbar-indigo">
          {tab === 'rules'
            ? (language === 'es' ? <RulesContentEs /> : language === 'zh-HK' ? <RulesContentZhHK /> : <RulesContent />)
            : (language === 'es' ? <FaqContentEs /> : language === 'zh-HK' ? <FaqContentZhHK /> : <FaqContent />)
          }
        </div>
      </div>
    </div>
  );
}
