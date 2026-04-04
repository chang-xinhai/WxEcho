import { useState } from 'react';

export default function Steps() {
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  const copyCommand = (step: number, cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedStep(step);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const steps = [
    {
      title: '重签微信',
      desc: '去掉 Hardened Runtime，以便读取进程内存',
      cmd: 'sudo codesign --force --deep --sign - /Applications/WeChat.app',
    },
    {
      title: '提取密钥',
      desc: '从微信进程内存中提取 AES-256 解密密钥',
      cmd: 'sudo wxecho keys',
    },
    {
      title: '解密数据库',
      desc: '解密 SQLCipher 4 加密的 WCDB 数据库',
      cmd: 'wxecho decrypt',
    },
    {
      title: '导出聊天',
      desc: '按联系人导出聊天记录为 TXT / CSV / JSON',
      cmd: 'wxecho export -l',
    },
  ];

  return (
    <section className="steps">
      <h2>快速开始</h2>
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
              >
                {copiedStep === i ? '✓' : '复制'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
