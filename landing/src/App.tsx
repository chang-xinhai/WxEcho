import { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from './LanguageContext';
import Hero from './components/Hero';
import Features from './components/Features';
import VersionSupport from './components/VersionSupport';
import Steps from './components/Steps';
import Footer from './components/Footer';

function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}

function LangToggle() {
  const { lang, toggleLang } = useLanguage();

  return (
    <button
      className="lang-toggle"
      onClick={toggleLang}
      aria-label="Toggle language"
    >
      {lang === 'zh' ? 'EN' : '中'}
    </button>
  );
}

function AppContent() {
  return (
    <>
      <ThemeToggle />
      <LangToggle />
      <Hero />
      <Features />
      <VersionSupport />
      <Steps />
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
