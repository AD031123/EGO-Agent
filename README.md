# ✦ EGO Agent — AI 智能助手

一个部署在 Windows 本地的全栈 AI Agent 应用，支持多种大模型（OpenAI / DeepSeek / Ollama），模型可自动调用本地文件系统工具，实现自主操作。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Vue 3 + Vite + Bootstrap 5 + Vue Router |
| 后端 | Express 5（Node.js） |
| 数据库 | MySQL |
| LLM | OpenAI / DeepSeek / Ollama（本地模型） |

## 快速开始

### 环境要求

- Node.js ^20.19.0 或 >=22.12.0
- MySQL（对话历史持久化）
- Ollama（可选，使用本地模型时需要）

### 安装与启动

```sh
# 安装依赖
npm install

# 一键启动前后端
npm start
```

- 前端：http://localhost:5173
- 后端 API：http://localhost:3000/api
- 健康检查：http://localhost:3000/api/health

### 配置 LLM

编辑 `server/src/LLM/package.json`，配置各 Provider 的 API Key 和启用状态：

```json
{
  "llm": {
    "maxToolRounds": 100,
    "providers": {
      "openai": { "enabled": false, "apiKey": "", ... },
      "deepseek": { "enabled": true, "apiKey": "sk-xxx", ... },
      "ollama": { "enabled": true, "baseUrl": "http://localhost:11434", ... }
    }
  }
}
```

## 核心功能

- **多模型接入**：统一适配 OpenAI、DeepSeek、Ollama 三种 LLM 提供商
- **文件系统工具**：AI 可自主操作本地文件（读/写/搜索/编辑/删除），支持设置工作区
- **Agent 角色系统**：内置"聊天助手"和"代码专家"两种角色，支持自定义角色和工具权限
- **对话历史**：对话自动持久化到 MySQL，支持 CRUD 操作
- **配置热重载**：修改 LLM 配置后自动生效，无需重启服务

## 可用工具

| 工具 | 说明 |
|---|---|
| `set_workspace` | 设置工作区目录 |
| `ls` | 列出目录内容 |
| `glob` | 文件模式匹配 |
| `grep` | 文件内容搜索 |
| `read_file` | 读取文件 |
| `write_file` | 写入文件 |
| `edit_file` | 编辑文件 |
| `delete` | 删除文件 |

## 项目结构

```
EGO-Agent/                              # 项目根目录
├── public/                             # 静态资源目录 (Vite 直接复制到 dist/)
│   ├── favicon.ico                     # 网站图标
│   └── favicon.svg                     # SVG 格式图标
│
├── server/                             # ────── 后端 (Express API 服务) ──────
│   ├── package.json                    # 声明后端为 CommonJS 模块 ("type": "commonjs")
│   ├── index.js                        # Express 入口 — 路由、中间件、初始化
│   │                                   #   ★ POST   /api/chat              聊天(LLM调用+工具执行循环)
│   │                                   #   ★ GET    /api/conversations      对话列表
│   │                                   #   ★ GET    /api/conversations/:id  获取单个对话
│   │                                   #   ★ POST   /api/conversations      创建对话
│   │                                   #   ★ PUT    /api/conversations/:id  更新对话
│   │                                   #   ★ DELETE /api/conversations/:id  删除对话
│   │                                   #   ★ GET    /api/config             前端配置(模型列表+角色列表)
│   │                                   #   ★ GET    /api/health             健康检查
│   │                                   #   ★ GET    /api/llm-config         LLM Provider 配置
│   │                                   #   ★ PUT    /api/llm-config/:pro..  更新 Provider 配置
│   │                                   #   ★ POST   /api/llm-config/:pro..  从官方API拉取模型列表
│   │                                   #   ★ GET    /api/tools              工具列表
│   │                                   #   ★ GET    /api/characters         角色列表
│   │                                   #   ★ GET    /api/characters/:name   单个角色
│   │                                   #   ★ POST   /api/characters         创建角色
│   │                                   #   ★ PUT    /api/characters/:name   更新角色
│   │                                   #   ★ DELETE /api/characters/:name   删除角色
│   │
│   └── src/                            # 后端源码
│       ├── db/                         # ── 数据库层 ──
│       │   ├── config.db.js            # MySQL 连接配置 (host/port/user/password/database)
│       │   └── mysql.db.js             # MySQL 连接池 + query()/testConnection()
│       │
│       ├── LLM/                        # ── 大模型适配层 ──
│       │   ├── package.json            # LLM Provider 配置文件 (密钥/URL/模型列表)
│       │   ├── index.js                # Provider 注册中心 + chat() 统一入口 + 配置管理
│       │   └── providers/
│       │       ├── openai.provider.js  # OpenAI 兼容接口 (chat + models)
│       │       ├── deepseek.provider.js# DeepSeek 适配 (支持 reasoning_content)
│       │       └── local.provider.js   # Ollama 本地模型适配
│       │
│       ├── prompt/                     # ── 系统提示词 ──
│       │   └── index.js                # 全局基底 prompt (行为准则 + 工具使用规范)
│       │
│       ├── characters/                 # ── 角色注册中心 ──
│       │   ├── package.js              # 角色定义 (聊天助手、代码专家 及其 prompt/工具列表)
│       │   └── index.js                # 角色注册 + system prompt 动态构建
│       │
│       └── tools/                      # ── 工具系统 (MCP 风格 function calling) ──
│           ├── index.js                # 工具注册中心 (registerTool/getOpenAITools/handleToolCalls)
│           ├── workspace.tools.js      # set_workspace — 设置工作区目录
│           ├── ls.tools.js             # ls          — 列出目录内容
│           ├── glob.tools.js           # glob        — 文件模式匹配
│           ├── grep.tools.js           # grep        — 文件内容搜索
│           ├── read_file.tools.js      # read_file   — 读取文件 (支持行范围)
│           ├── write_file.tools.js     # write_file  — 写入/覆盖/追加文件
│           ├── edit_file.tools.js      # edit_file   — 文件内容替换
│           └── delete.tools.js         # delete      — 删除文件
│
├── src/                                # ────── 前端 (Vue 3 + Vite + Bootstrap) ──────
│   ├── main.js                         # 应用入口 — 创建 Vue 实例，挂载 router，引入全局样式
│   ├── App.vue                         # 根组件 — 只包含 <router-view /> 占位
│   ├── router/
│   │   └── index.js                    # Vue Router 配置 — 目前只有 / → ChatView 单页面路由
│   ├── views/
│   │   └── ChatView.vue                # 核心聊天界面 — 消息列表/侧边栏/设置弹窗/模型管理 (约2000行 SFC)
│   └── assets/
│       └── styles/
│           └── global.css              # 全局 CSS 变量与基础样式 (暗色主题/毛玻璃风格)
│
├── dist/                               # Vite 构建产物
├── node_modules/                       # 依赖包
│
├── index.html                          # Vite HTML 入口
├── vite.config.js                      # Vite 配置 (Vue 插件 + @ 路径别名)
├── jsconfig.json                       # VSCode JS 配置 (路径别名等)
├── package.json                        # 前端依赖 — vue/vue-router/bootstrap/marked/highlight.js
│                                       #      后端依赖 — express/cors/openai/mysql2
│                                       #      脚本 — dev/build/preview/server/start
└── .gitignore                          # Git 忽略规则
```
## 项目图片
<img width="1920" height="957" alt="image" src="https://github.com/user-attachments/assets/a1889c7c-93bf-4ba7-ace6-f7412cbad7ed" />
<img width="1920" height="957" alt="image" src="https://github.com/user-attachments/assets/cad41586-7b3e-48ca-b0d4-98b732012704" />
<img width="1920" height="957" alt="image" src="https://github.com/user-attachments/assets/53df03a7-1895-437f-b62e-60a3a80869a8" />
<img width="1920" height="957" alt="image" src="https://github.com/user-attachments/assets/45c57b5f-7688-4fa4-affd-c54a4d64d11c" />
<img width="1920" height="957" alt="image" src="https://github.com/user-attachments/assets/e16148d6-f93c-4d8e-966f-a7494ab595d5" />
<img width="412" height="308" alt="image" src="https://github.com/user-attachments/assets/696586ac-92e6-4f7a-bde9-8965af078a79" />

