import { useState } from 'react';

export default function Hero() {
  const [copied, setCopied] = useState(false);

  const copyInstall = () => {
    navigator.clipboard.writeText('npm install -g wxecho');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="hero">
      <div className="hero-content">
        <div className="logo-container">
          <span className="logo">💬</span>
        </div>

        <div className="badges">
          <span className="badge">macOS 专属</span>
          <span className="badge">微信 4.x 支持</span>
          <span className="badge">开源免费</span>
        </div>

        <h1>WxEcho</h1>
        <p className="tagline">回声，你的聊天记录完整回响</p>

        <div className="install-command">
          <code>npm install -g wxecho</code>
          <button className="copy-btn" onClick={copyInstall}>
            {copied ? '✓' : '复制'}
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
