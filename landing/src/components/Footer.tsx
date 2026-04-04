import { useLanguage } from '../LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="footer">
      <div className="footer-links">
        <a href="https://github.com/chang-xinhai/WxEcho" target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        <a href="https://www.npmjs.com/package/wxecho" target="_blank" rel="noopener noreferrer">
          npm
        </a>
        <a href="https://chang-xinhai.github.io/WxEcho" target="_blank" rel="noopener noreferrer">
          Docs
        </a>
      </div>
      <p>{t.footerTech}</p>
      <p className="footer-license">MIT License</p>
    </footer>
  );
}
