#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
PY_DIR="$ROOT_DIR/py"

echo "🔧 正在设置 WxEcho..."

# Check if C compiler is available
if command -v cc &> /dev/null; then
  echo "📦 编译密钥扫描器..."
  cd "$PY_DIR"

  if [ -f "find_all_keys_macos.c" ]; then
    cc -O2 -o find_all_keys_macos find_all_keys_macos.c -framework Foundation 2>/dev/null || {
      echo "⚠️  编译失败，请确保已安装 Xcode Command Line Tools"
      echo "   运行: xcode-select --install"
    }
    echo "✓ find_all_keys_macos 编译完成"
  fi
else
  echo "⚠️  gcc/clang 未找到"
  echo "   请安装 Xcode Command Line Tools: xcode-select --install"
fi

# Check Python dependencies
echo ""
echo "🐍 检查 Python 依赖..."
if python3 -c "import Crypto" 2>/dev/null; then
  echo "✓ pycryptodome 已安装"
else
  echo "⚠️  pycryptodome 未安装"
  echo "   请运行: pip install pycryptodome"
fi

echo ""
echo "✨ 设置完成！"
echo ""
echo "使用方式："
echo "  wxecho doctor              # 检测环境"
echo "  wxecho keys                # 提取密钥（需 sudo）"
echo "  wxecho decrypt             # 解密数据库"
echo "  wxecho export -l          # 列出会话"
