import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

type Language = 'hebrew' | 'english' | 'italian';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem('preferredLanguage');
    return (stored as Language) || 'hebrew';
  });

  useEffect(() => {
    if (user) {
      // Fetch user's language preference
      const fetchUserLanguage = async () => {
        const { data } = await supabase
          .from('users')
          .select('current_language')
          .eq('id', user.id)
          .single();
        
        if (data?.current_language) {
          setLanguageState(data.current_language as Language);
        }
      };
      
      setTimeout(() => {
        fetchUserLanguage();
      }, 0);
    }
  }, [user]);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('preferredLanguage', lang);
    
    if (user) {
      await supabase
        .from('users')
        .update({ current_language: lang })
        .eq('id', user.id);
    }
  };

  const isRTL = language === 'hebrew';

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    if (isRTL) {
      document.documentElement.classList.add('rtl-mode');
    } else {
      document.documentElement.classList.remove('rtl-mode');
    }
  }, [isRTL]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
