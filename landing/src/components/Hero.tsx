import { useState } from 'react';
import Icon from './Icon';
import { useLanguage } from '../LanguageContext';

export default function Hero() {
  const [copied, setCopied] = useState(false);
  const { t } = useLanguage();

  const copyInstall = () => {
    navigator.clipboard.writeText('npm install -g wxecho');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="hero">
      <div className="hero-content">
        <div className="logo-container">
          <span className="logo-icon"><Icon name="chat" size={64} /></span>
        </div>

        <div className="badges">
          <span className="badge">{t.badge1}</span>
          <span className="badge">{t.badge2}</span>
          <span className="badge">{t.badge3}</span>
        </div>

        <h1>WxEcho</h1>
        <p className="tagline">{t.tagline}</p>

        <div className="install-command">
          <code>npm install -g wxecho</code>
          <button className="copy-btn" onClick={copyInstall} aria-label={copied ? t.copied : t.copy}>
            <Icon name={copied ? 'check' : 'copy'} size={14} />
          </button>
        </div>

        <div className="hero-links">
          <a
            href="https://github.com/chang-xinhai/WxEcho"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-github"
          >
            GitHub
          </a>
          <a
            href="https://www.npmjs.com/package/wxecho"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-npm"
          >
            npm
          </a>
        </div>
      </div>
    </section>
  );
}
