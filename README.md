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
EGO-Agent/
├── src/                         # 前端源码（Vue 3）
│   ├── views/ChatView.vue       # 聊天主界面
│   └── router/index.js          # 路由配置
├── server/                      # 后端源码（Express）
│   ├── index.js                 # ★ 入口：API 路由 + 初始化
│   └── src/
│       ├── LLM/                 # LLM 适配层 + Provider
│       ├── characters/          # Agent 角色注册中心
│       ├── tools/               # 工具注册中心
│       ├── prompt/              # System Prompt
│       └── db/                  # MySQL 连接
├── ARCHITECTURE.md              # 架构详解
└── FUNCTION_CALLING_VS_MCP.md   # Function Calling 与 MCP 协议对比
```
## 项目图片
<img width="1920" height="957" alt="image" src="https://github.com/user-attachments/assets/a1889c7c-93bf-4ba7-ace6-f7412cbad7ed" />
<img width="1920" height="957" alt="image" src="https://github.com/user-attachments/assets/cad41586-7b3e-48ca-b0d4-98b732012704" />
<img width="1920" height="957" alt="image" src="https://github.com/user-attachments/assets/53df03a7-1895-437f-b62e-60a3a80869a8" />
<img width="1920" height="957" alt="image" src="https://github.com/user-attachments/assets/45c57b5f-7688-4fa4-affd-c54a4d64d11c" />
<img width="1920" height="957" alt="image" src="https://github.com/user-attachments/assets/e16148d6-f93c-4d8e-966f-a7494ab595d5" />
<img width="412" height="308" alt="image" src="https://github.com/user-attachments/assets/696586ac-92e6-4f7a-bde9-8965af078a79" />

