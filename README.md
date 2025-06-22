# XMind Web - 在线思维导图

一个类似 XMind 的在线思维导图工具，基于 Next.js 构建，支持 Vercel 一键部署。

## 功能特性

- 🎨 **直观的思维导图编辑**：支持节点的创建、编辑、删除
- 🎯 **交互式画布**：支持拖拽平移、滚轮缩放
- 🌈 **丰富的样式**：多种颜色主题，美观的节点设计
- 💾 **数据持久化**：自动保存到本地存储
- 📤 **导入导出**：支持 JSON 格式的数据导入导出
- 📱 **响应式设计**：适配各种屏幕尺寸
- ⚡ **高性能渲染**：基于 D3.js 的 SVG 渲染

## 技术栈

- **前端框架**: Next.js 14 (React 18)
- **样式**: Tailwind CSS
- **图形渲染**: D3.js
- **图标**: Lucide React
- **语言**: TypeScript
- **部署**: Vercel

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看应用。

### 3. 构建生产版本

```bash
npm run build
npm start
```

## Vercel 部署

### 方式一：通过 Vercel CLI

1. 安装 Vercel CLI：
```bash
npm i -g vercel
```

2. 登录并部署：
```bash
vercel login
vercel
```

### 方式二：通过 Git 仓库

1. 将代码推送到 GitHub/GitLab
2. 在 [Vercel Dashboard](https://vercel.com/dashboard) 中导入项目
3. Vercel 会自动检测 Next.js 项目并进行部署

### 环境变量

无需额外的环境变量，应用开箱即用。

## 使用指南

### 基本操作

1. **创建节点**：选择一个节点，点击"添加节点"按钮
2. **编辑节点**：双击节点进行文本编辑
3. **删除节点**：选择节点后点击"删除节点"按钮
4. **改变颜色**：选择节点后点击调色板图标选择颜色

### 视图控制

- **缩放**：使用鼠标滚轮或工具栏的缩放按钮
- **平移**：拖拽画布空白区域
- **重置视图**：点击重置按钮回到初始视图

### 数据管理

- **自动保存**：所有更改自动保存到浏览器本地存储
- **导出数据**：点击下载按钮导出 JSON 文件
- **导入数据**：点击上传按钮选择 JSON 文件导入

## 项目结构

```
├── app/                    # Next.js App Router
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 主页面
├── components/            # React 组件
│   ├── MindMapCanvas.tsx  # 思维导图画布
│   └── Toolbar.tsx        # 工具栏
├── contexts/              # React Context
│   └── MindMapContext.tsx # 思维导图状态管理
├── types/                 # TypeScript 类型定义
│   └── mindmap.ts        # 思维导图类型
├── package.json          # 项目配置
├── tailwind.config.js    # Tailwind 配置
├── tsconfig.json         # TypeScript 配置
└── vercel.json           # Vercel 部署配置
```

## 开发指南

### 添加新功能

1. 在 `types/mindmap.ts` 中定义新的数据结构
2. 在 `contexts/MindMapContext.tsx` 中添加状态和操作
3. 在对应组件中实现 UI 和交互逻辑

### 自定义样式

编辑 `tailwind.config.js` 和 `app/globals.css` 来自定义应用外观。

### 性能优化

- 组件使用 React.memo 进行优化
- 大数据集考虑虚拟化渲染
- 使用 Web Workers 处理复杂计算

## 部署要求

- Node.js 18+
- 现代浏览器支持（Chrome 90+, Firefox 88+, Safari 14+）

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 更新日志

### v0.1.0
- 基础思维导图功能
- 支持节点增删改
- 画布交互（缩放、平移）
- 数据导入导出
- Vercel 部署支持 