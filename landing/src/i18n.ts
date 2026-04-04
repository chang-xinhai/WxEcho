export const translations = {
  zh: {
    // Hero
    badge1: 'macOS 专属',
    badge2: '桌面版 4.x',
    badge3: '开源免费',
    tagline: '回声，你的聊天记录完整回响',

    // Features
    featuresTitle: '功能特性',
    featuresTagline: 'macOS 原生聊天记录导出，支持本地数据库解密',
    feat1Title: '安全密钥提取',
    feat1Desc: '通过 Mach VM API 从运行中的进程内存提取 AES-256 加密密钥',
    feat2Title: '数据库解密',
    feat2Desc: '解密 SQLCipher 4 加密的本地数据库，无需官方工具',
    feat3Title: '多格式导出',
    feat3Desc: '支持导出为 TXT、CSV、JSON 格式，方便阅读和分析',
    feat4Title: '智能搜索',
    feat4Desc: '按昵称、备注搜索联系人，一键导出历史消息',
    feat5Title: '群聊支持',
    feat5Desc: '完整支持群聊，显示每个发言者的实际昵称和备注',
    feat6Title: '原生体验',
    feat6Desc: '专为 macOS 设计，支持 Apple Silicon 和 Intel',

    // Steps
    stepsTitle: '快速开始',
    step1Title: '配置签名',
    step1Desc: '移除 Hardened Runtime，允许读取进程内存',
    step2Title: '提取密钥',
    step2Desc: '从进程内存中提取 AES-256 解密密钥',
    step3Title: '解密数据库',
    step3Desc: '解密 SQLCipher 4 加密的数据库',
    step4Title: '导出聊天',
    step4Desc: '导出联系人聊天记录为 TXT / CSV / JSON',

    // Footer
    footerTech: '基于 Mach VM API 和 SQLCipher 4',

    // Common
    copied: '已复制',
    copy: '复制命令',
  },
  en: {
    // Hero
    badge1: 'macOS Only',
    badge2: 'Desktop App 4.x',
    badge3: 'Open Source',
    tagline: 'Your chat history, fully exported',

    // Features
    featuresTitle: 'Features',
    featuresTagline: 'macOS chat history export with local database decryption',
    feat1Title: 'Secure Key Extraction',
    feat1Desc: 'Extracts AES-256 keys from running process memory via Mach VM API',
    feat2Title: 'Database Decryption',
    feat2Desc: 'Decrypts SQLCipher 4 encrypted local databases without official tools',
    feat3Title: 'Multi-Format Export',
    feat3Desc: 'Export to TXT, CSV, and JSON formats for easy reading and analysis',
    feat4Title: 'Smart Search',
    feat4Desc: 'Search contacts by nickname or remark, export history with one click',
    feat5Title: 'Group Chat Support',
    feat5Desc: 'Full group chat support with actual sender nicknames and remarks',
    feat6Title: 'Native macOS',
    feat6Desc: 'Designed for macOS, supporting Apple Silicon and Intel processors',

    // Steps
    stepsTitle: 'Quick Start',
    step1Title: 'Configure Code Signature',
    step1Desc: 'Remove Hardened Runtime to allow process memory access',
    step2Title: 'Extract Keys',
    step2Desc: 'Extract AES-256 decryption keys from running process memory',
    step3Title: 'Decrypt Databases',
    step3Desc: 'Decrypt SQLCipher 4 encrypted databases',
    step4Title: 'Export History',
    step4Desc: 'Export contact chat records as TXT / CSV / JSON',

    // Footer
    footerTech: 'Built on Mach VM API and SQLCipher 4',

    // Common
    copied: 'Copied',
    copy: 'Copy command',
  },
} as const;

export type Lang = keyof typeof translations;
export type TranslationKey = keyof typeof translations.zh;
