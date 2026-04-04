import { useState } from 'react';
import Icon from './Icon';
import { useLanguage } from '../LanguageContext';

export default function Steps() {
  const [copiedStep, setCopiedStep] = useState<number | null>(null);
  const { t } = useLanguage();

  const copyCommand = (step: number, cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedStep(step);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const steps = [
    { title: t.step1Title, desc: t.step1Desc, cmd: 'sudo codesign --force --deep --sign - /Applications/WeChat.app' },
    { title: t.step2Title, desc: t.step2Desc, cmd: 'wxecho keys' },
    { title: t.step3Title, desc: t.step3Desc, cmd: 'wxecho decrypt' },
    { title: t.step4Title, desc: t.step4Desc, cmd: 'wxecho export "Aurora"' },
  ];

  return (
    <section className="steps">
      <h2>{t.stepsTitle}</h2>
      {steps.map((step, i) => (
        <div key={i} className="step">
          <div className="step-number">{i + 1}</div>
          <div className="step-content">
            <h3>{step.title}</h3>
            <p>{step.desc}</p>
            <div className="step-code-wrapper">
              <code className="step-code">{step.cmd}</code>
              <button
                className="copy-btn-small"
                onClick={() => copyCommand(i, step.cmd)}
                aria-label={copiedStep === i ? t.copied : t.copy}
              >
                <Icon name={copiedStep === i ? 'check' : 'copy'} size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
