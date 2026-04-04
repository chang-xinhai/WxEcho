export default function Features() {
  const features = [
    {
      icon: '🔑',
      title: '安全密钥提取',
      description: '通过 Mach VM API 从微信进程内存中提取 AES-256 加密密钥，安全可靠',
    },
    {
      icon: '🔓',
      title: '数据库解密',
      description: '解密 SQLCipher 4 加密的 WCDB 数据库，无需微信官方工具',
    },
    {
      icon: '📤',
      title: '多格式导出',
      description: '支持导出为 TXT、CSV、JSON 格式，方便阅读和分析',
    },
    {
      icon: '🔍',
      title: '智能搜索',
      description: '支持按昵称、备注搜索联系人，一键导出历史消息',
    },
    {
      icon: '💬',
      title: '群聊支持',
      description: '完美支持群聊，显示每个发言者的实际昵称和备注',
    },
    {
      icon: '🍎',
      title: '原生体验',
      description: '专为 macOS 设计，支持 Apple Silicon 和 Intel 处理器',
    },
  ];

  return (
    <section className="features">
      <h2>功能特性</h2>
      <p className="features-tagline">macOS 微信聊天记录一键解密导出工具</p>
      <div className="features-grid">
        {features.map((feature, index) => (
          <div key={index} className="feature-card">
            <span className="feature-icon">{feature.icon}</span>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
