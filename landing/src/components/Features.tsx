import Icon from './Icon';

const features = [
  {
    icon: 'key',
    title: '安全密钥提取',
    description: '通过 Mach VM API 从微信进程内存中提取 AES-256 加密密钥，安全可靠',
  },
  {
    icon: 'unlock',
    title: '数据库解密',
    description: '解密 SQLCipher 4 加密的 WCDB 数据库，无需微信官方工具',
  },
  {
    icon: 'export',
    title: '多格式导出',
    description: '支持导出为 TXT、CSV、JSON 格式，方便阅读和分析',
  },
  {
    icon: 'search',
    title: '智能搜索',
    description: '支持按昵称、备注搜索联系人，一键导出历史消息',
  },
  {
    icon: 'group',
    title: '群聊支持',
    description: '完美支持群聊，显示每个发言者的实际昵称和备注',
  },
  {
    icon: 'apple',
    title: '原生体验',
    description: '专为 macOS 设计，支持 Apple Silicon 和 Intel 处理器',
  },
];

export default function Features() {
  return (
    <section className="features">
      <h2>功能特性</h2>
      <p className="features-tagline">macOS 微信聊天记录一键解密导出工具</p>
      <div className="features-grid">
        {features.map((feature, index) => (
          <div key={index} className="feature-card">
            <span className="feature-icon">
              <Icon name={feature.icon as 'key' | 'unlock' | 'export' | 'search' | 'group' | 'apple'} size={36} />
            </span>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
