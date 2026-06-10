#!/bin/bash

# ==============================================================================
# 沉没还是暴富 (Sink or Rich) 一键部署脚本 (项目独立环境版)
# ==============================================================================

# 设置文本颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}===========================================${NC}"
echo -e "${GREEN}    沉没还是暴富 一键部署与混淆打包脚本    ${NC}"
echo -e "${GREEN}===========================================${NC}"

# 1. 检测必要的系统工具
echo -e "${YELLOW}[1/6] 正在检测基础系统工具 (curl, tar, xz)...${NC}"
for cmd in curl tar xz; do
    if ! command -v $cmd >/dev/null 2>&1; then
        echo -e "${RED}系统缺少 $cmd 命令，请先使用系统包管理器(apt/yum)安装它。${NC}"
        exit 1
    fi
done

# 2. 在本项目内独立安装 Node.js (不影响系统环境)
NODE_VERSION="v22.14.0"
LOCAL_NODE_DIR="$(pwd)/.local-node"
export PATH="$LOCAL_NODE_DIR/bin:$PATH"

echo -e "${YELLOW}[2/6] 检查项目专属的 Node.js 环境...${NC}"

# 检查当前架构
ARCH=$(uname -m)
case $ARCH in
    x86_64) NODE_ARCH="x64" ;;
    aarch64) NODE_ARCH="arm64" ;;
    armv7l) NODE_ARCH="armv7l" ;;
    *) echo -e "${RED}不支持的架构: $ARCH${NC}"; exit 1 ;;
esac

# 检查本地是否已安装符合版本的 Node
NEED_INSTALL=true
if [ -f "$LOCAL_NODE_DIR/bin/node" ]; then
    CURRENT_VER=$("$LOCAL_NODE_DIR/bin/node" -v)
    if [ "$CURRENT_VER" = "$NODE_VERSION" ]; then
        NEED_INSTALL=false
        echo -e "${GREEN}已检测到项目专属 Node.js ($CURRENT_VER)，跳过下载。${NC}"
    fi
fi

if [ "$NEED_INSTALL" = true ]; then
    echo -e "${YELLOW}正在为本项目下载并隔离安装 Node.js $NODE_VERSION ($NODE_ARCH)...${NC}"
    rm -rf "$LOCAL_NODE_DIR"
    mkdir -p "$LOCAL_NODE_DIR"
    
    DOWNLOAD_URL="https://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}-linux-${NODE_ARCH}.tar.xz"
    echo "下载地址: $DOWNLOAD_URL"
    
    curl -fL "$DOWNLOAD_URL" -o "node-local.tar.xz" || { echo -e "${RED}下载 Node.js 失败！${NC}"; exit 1; }
    
    echo -e "${YELLOW}正在解压...${NC}"
    tar -xf node-local.tar.xz -C "$LOCAL_NODE_DIR" --strip-components=1
    rm -f node-local.tar.xz
    
    echo -e "${GREEN}项目专属 Node.js 安装成功: $(node -v)${NC}"
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
if ! grep -q "\"terser\"" package.json; then
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

# 查找之前由本脚本启动的 vite 进程并杀掉
if [ -f ".pid" ]; then
    OLD_PID=$(cat .pid)
    if ps -p $OLD_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}检测到之前的服务正在运行 (PID: $OLD_PID)，正在停止老服务...${NC}"
        kill -9 $OLD_PID
    fi
    rm -f .pid
fi

# 自动规避端口占用 (从 4173 开始往上找)
PORT=4173
while :
do
    if command -v ss >/dev/null; then
        (ss -tuln | grep -q ":$PORT ") || break
    elif command -v netstat >/dev/null; then
        (netstat -tuln | grep -q ":$PORT ") || break
    else
        (echo >/dev/tcp/127.0.0.1/$PORT) >/dev/null 2>&1 || break
    fi
    echo -e "${YELLOW}端口 $PORT 被占用，尝试端口 $((PORT+1))...${NC}"
    PORT=$((PORT+1))
done

echo -e "${GREEN}===========================================${NC}"
echo -e "${GREEN}部署完成！游戏将在端口 $PORT 上运行。${NC}"
echo -e "${GREEN}===========================================${NC}"

# 使用 nohup 在后台运行，不阻塞终端
nohup npx vite preview --port $PORT --host 0.0.0.0 > server.log 2>&1 &
NEW_PID=$!
echo $NEW_PID > .pid

echo -e "${GREEN}服务已在后台静默运行，您可以随时安全地关闭当前终端窗口了！${NC}"
echo -e "${GREEN}如果想查看运行日志，请输入: tail -f server.log${NC}"
