#!/bin/bash

# ==============================================================================
# 沉没还是暴富 (Sink or Rich) 一键部署脚本
# 支持: Ubuntu/Debian/CentOS/RHEL/Arch 等各种 Linux 发行版
# 功能: 自动安装依赖 (Node.js/npm), 自动拉取更新, 自动规避端口, 打包混淆代码
# ==============================================================================

# 设置文本颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}===========================================${NC}"
echo -e "${GREEN}    沉没还是暴富 一键部署与混淆打包脚本    ${NC}"
echo -e "${GREEN}===========================================${NC}"

# 1. 检测操作系统包管理器并安装基础依赖
echo -e "${YELLOW}[1/6] 正在检测包管理器并安装 curl/git...${NC}"
if command -v apt-get >/dev/null; then
    sudo apt-get update
    sudo apt-get install -y curl git
elif command -v yum >/dev/null; then
    sudo yum install -y curl git
elif command -v dnf >/dev/null; then
    sudo dnf install -y curl git
elif command -v pacman >/dev/null; then
    sudo pacman -Sy --noconfirm curl git
elif command -v apk >/dev/null; then
    sudo apk add curl git
else
    echo -e "${RED}无法识别的包管理器，请手动安装 curl 和 git。${NC}"
    exit 1
fi

# 2. 检测并安装 Node.js 和 npm
echo -e "${YELLOW}[2/6] 正在检测 Node.js 环境...${NC}"
if ! command -v node >/dev/null; then
    echo -e "${YELLOW}未检测到 Node.js，正在通过 NVM 自动安装 LTS 版本...${NC}"
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    nvm install --lts
    nvm use --lts
else
    echo -e "${GREEN}Node.js 已安装: $(node -v)${NC}"
fi

# 3. 自动更新代码
echo -e "${YELLOW}[3/6] 正在同步最新的 Git 代码...${NC}"
if [ -d ".git" ]; then
    git pull origin main || echo -e "${YELLOW}拉取代码失败或已经在最新版本。${NC}"
else
    echo -e "${YELLOW}当前目录不是 Git 仓库，跳过自动更新。${NC}"
fi

# 4. 安装 NPM 依赖
echo -e "${YELLOW}[4/6] 正在安装依赖包...${NC}"
npm install

# 确保安装了混淆工具 terser
if ! grep -q "terser" package.json; then
    echo -e "${YELLOW}检测到未安装 terser 混淆插件，正在自动安装...${NC}"
    npm install -D terser
fi

# 5. 代码混淆打包
echo -e "${YELLOW}[5/6] 正在进行生产环境编译与代码混淆...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}编译失败，请检查源代码是否有错误。${NC}"
    exit 1
fi
echo -e "${GREEN}编译混淆成功，打包文件位于 dist/ 目录。${NC}"

# 6. 端口检测与启动
echo -e "${YELLOW}[6/6] 准备启动预览服务，正在扫描可用端口...${NC}"

# 如果没有安装 vite，全局安装用于预览
if ! command -v vite >/dev/null && ! npx vite --version >/dev/null 2>&1; then
    npm install -g vite
fi

# 自动规避端口占用 (从 4173 开始往上找)
PORT=4173
while :
do
    # 检查端口是否被占用 (支持 netstat 或 ss)
    if command -v ss >/dev/null; then
        (ss -tuln | grep -q ":$PORT ") || break
    elif command -v netstat >/dev/null; then
        (netstat -tuln | grep -q ":$PORT ") || break
    else
        # fallback
        (echo >/dev/tcp/127.0.0.1/$PORT) >/dev/null 2>&1 || break
    fi
    echo -e "${YELLOW}端口 $PORT 被占用，尝试端口 $((PORT+1))...${NC}"
    PORT=$((PORT+1))
done

echo -e "${GREEN}===========================================${NC}"
echo -e "${GREEN}部署完成！游戏将在端口 $PORT 上运行。${NC}"
echo -e "${GREEN}正在启动服务 (按 Ctrl+C 停止)...${NC}"
echo -e "${GREEN}===========================================${NC}"

# 启动服务并在后台运行或前台挂起
npx vite preview --port $PORT --host 0.0.0.0
