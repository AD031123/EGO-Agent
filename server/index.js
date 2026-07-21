/**
 * EGO Agent Server — Express 后端入口
 *
 * 包含所有 API 路由（chat、conversations、config、health）
 * 和初始化逻辑（Provider/Agent/Tool 注册、MySQL 连接）。
 */

const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
const { chat, loadConfig } = require('./src/LLM')
const { getSystemPrompt, getAgentTools, getAgent, getAgents, getAgentList } = require('./src/characters')
const { getOpenAITools, handleToolCalls, getTools } = require('./src/tools')
const { query } = require('./src/db/mysql.db')

const app = express()
const PORT = 3000
const llmConfig = loadConfig()
const MAX_TOOL_ROUNDS = llmConfig.maxToolRounds || 10

// ====== 中间件 ======
app.use(cors())
app.use(express.json({ limit: '10mb' }))

// ====== 初始化：注册 Providers 与 Agents ======
const { registerProvider, getEnabledProviders } = require('./src/LLM')

/**
 * 根据当前配置重新注册所有 Provider
 */
function reloadProviders() {
  const { clearProviders } = require('./src/LLM')
  clearProviders() // 清空旧注册，使禁用生效

  const enabledProviders = getEnabledProviders()
  const providerFiles = { openai: 'openai', deepseek: 'deepseek', ollama: 'local' }
  for (const name of ['openai', 'deepseek', 'ollama']) {
    if (enabledProviders.includes(name)) {
      const mod = require(`./src/LLM/providers/${providerFiles[name]}.provider`)
      registerProvider(name, mod)
      console.log(`  ✓ Provider: ${name}`)
    }
  }
}

reloadProviders()

require('./src/characters')

// ====== 文件系统工具 ======
require('./src/tools/workspace.tools')
require('./src/tools/ls.tools')
require('./src/tools/glob.tools')
require('./src/tools/grep.tools')
require('./src/tools/read_file.tools')
require('./src/tools/write_file.tools')
require('./src/tools/edit_file.tools')
require('./src/tools/delete.tools')

// ====== 系统工具 ======
// (如需网络请求、时间等工具，在此添加)

// ====== Database ======
const { testConnection } = require('./src/db/mysql.db')
testConnection()

// ====== Chat API 路由 ======
app.post('/api/chat', async (req, res) => {
  try {
    const { agent: agentName = '聊天助手', model, messages = [], temperature = 0.7, conversationId, toolMessages } = req.body
    if (!messages || messages.length === 0) {
      return res.status(400).json({ error: 'messages is required' })
    }

    const systemPrompt = getSystemPrompt(agentName)
    const toolNames = getAgentTools(agentName)

    // 如果前端有结构化工具调用历史，用它替代 messages 中的文本摘要，
    // 让 LLM 看到完整的 tool_calls + tool responses 上下文
    let fullMessages
    if (toolMessages && toolMessages.length > 0) {
      fullMessages = [
        { role: 'system', content: systemPrompt },
        ...toolMessages,
        ...messages.slice(-1), // 最新用户消息
      ]
    } else {
      fullMessages = systemPrompt
        ? [{ role: 'system', content: systemPrompt }, ...messages]
        : messages
    }
    const tools = toolNames.length > 0 ? getOpenAITools(toolNames) : undefined
    const providerName = model?.provider || 'openai'
    const modelId = model?.id || 'gpt-4o'

    const steps = []
    let finalContent = ''
    let finalToolMessages = []

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const result = await chat(providerName, modelId, fullMessages, {
        temperature,
        tools: tools?.length > 0 ? tools : undefined,
      })

      if (result.toolCalls && result.toolCalls.length > 0) {
        const toolResults = await handleToolCalls(result.toolCalls, { conversationId })
        for (let i = 0; i < result.toolCalls.length; i++) {
          const tc = result.toolCalls[i]
          const tr = toolResults[i]
          steps.push({
            tool: tc.function.name,
            arguments: tc.function.arguments,
            result: tr ? tr.content : 'error',
          })
        }

        const assistantMsg = { role: 'assistant', content: result.content || null, tool_calls: result.toolCalls }
        const toolMsgs = toolResults.map((tr) => ({
          role: 'tool',
          tool_call_id: tr.tool_call_id,
          content: tr.content,
        }))

        fullMessages = [...fullMessages, assistantMsg, ...toolMsgs]
        finalToolMessages = [...finalToolMessages, assistantMsg, ...toolMsgs]
        continue
      }

      finalContent = result.content || ''
      break
    }

    if (!finalContent && steps.length >= MAX_TOOL_ROUNDS) {
      throw new Error('工具调用循环超过上限，请重试或简化请求')
    }

    res.json({ content: finalContent, steps, toolMessages: finalToolMessages, model: modelId })
  } catch (err) {
    console.error('[Chat Error]', err)
    res.status(500).json({ error: err.message || 'Internal server error' })
  }
})

// ====== Conversations CRUD 路由 ======
// 建表
async function ensureConversationsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS conversations (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      title      VARCHAR(255) NOT NULL DEFAULT '新对话',
      messages   JSON NOT NULL,
      model      VARCHAR(100) DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
}
ensureConversationsTable().catch((e) => console.warn('[Conversations] Table init warning:', e.message))

app.get('/api/conversations', async (req, res) => {
  try {
    const [rows] = await query(
      'SELECT id, title, model, created_at, updated_at FROM conversations ORDER BY updated_at DESC'
    )
    res.json(rows)
  } catch (err) {
    console.error('[Conversations] List error:', err)
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/conversations/:id', async (req, res) => {
  try {
    const [rows] = await query('SELECT * FROM conversations WHERE id = ?', [req.params.id])
    if (rows.length === 0) return res.status(404).json({ error: 'Conversation not found' })
    res.json(rows[0])
  } catch (err) {
    console.error('[Conversations] Get error:', err)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/conversations', async (req, res) => {
  try {
    const { title = '新对话', messages = [], model = null } = req.body
    const [result] = await query(
      'INSERT INTO conversations (title, messages, model) VALUES (?, ?, ?)',
      [title, JSON.stringify(messages), model]
    )
    res.status(201).json({ id: result.insertId, title, messages, model })
  } catch (err) {
    console.error('[Conversations] Create error:', err)
    res.status(500).json({ error: err.message })
  }
})

app.put('/api/conversations/:id', async (req, res) => {
  try {
    const { title, messages, model } = req.body
    const [rows] = await query('SELECT * FROM conversations WHERE id = ?', [req.params.id])
    if (rows.length === 0) return res.status(404).json({ error: 'Conversation not found' })
    const cur = rows[0]
    const newTitle = title !== undefined ? title : cur.title
    const newMessages = messages !== undefined ? JSON.stringify(messages) : cur.messages
    const newModel = model !== undefined ? model : cur.model
    await query(
      'UPDATE conversations SET title = ?, messages = ?, model = ? WHERE id = ?',
      [newTitle, newMessages, newModel, req.params.id]
    )
    res.json({ id: Number(req.params.id), title: newTitle, messages: JSON.parse(newMessages), model: newModel })
  } catch (err) {
    console.error('[Conversations] Update error:', err)
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/conversations/:id', async (req, res) => {
  try {
    const [result] = await query('DELETE FROM conversations WHERE id = ?', [req.params.id])
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Conversation not found' })
    res.json({ success: true })
  } catch (err) {
    console.error('[Conversations] Delete error:', err)
    res.status(500).json({ error: err.message })
  }
})

// ====== 配置端点 ======
app.get('/api/config', (req, res) => {
  const { getAvailableModels } = require('./src/LLM')
  const { getAgentList } = require('./src/characters')

  getAvailableModels().then((models) => {
    res.json({ models, agents: getAgentList() })
  }).catch(() => {
    res.json({
      models: [
        { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai' },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai' },
        { id: 'qwen2.5', name: 'Qwen 2.5 (Local)', provider: 'ollama' },
      ],
      agents: getAgentList(),
    })
  })
})

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ====== LLM 配置管理 API ======
const { getProviderConfig, updateProviderConfig, fetchProviderModels, getAvailableModels } = require('./src/LLM')

/** 获取所有 provider 配置 */
app.get('/api/llm-config', (req, res) => {
  try {
    const config = loadConfig()
    res.json(config.providers || {})
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** 更新指定 provider 配置 */
app.put('/api/llm-config/:provider', (req, res) => {
  try {
    const providerName = req.params.provider
    const providerConfig = req.body
    updateProviderConfig(providerName, providerConfig)
    // 清除缓存并重新载入 Provider 注册
    delete require.cache[require.resolve('./src/LLM/providers/openai.provider')]
    delete require.cache[require.resolve('./src/LLM/providers/deepseek.provider')]
    delete require.cache[require.resolve('./src/LLM/providers/local.provider')]
    reloadProviders()
    delete require.cache[require.resolve('./src/characters/package')]
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** 从官方 API 获取模型列表 */
app.post('/api/llm-config/:provider/fetch-models', async (req, res) => {
  try {
    const providerName = req.params.provider
    const config = getProviderConfig(providerName)
    if (!config) return res.status(404).json({ error: `Provider "${providerName}" not found` })

    const filterPrefix = req.body.filterPrefix || ''
    const baseUrl = req.body.baseUrl || config.baseUrl
    const apiKey = req.body.apiKey || config.apiKey
    if (!baseUrl) return res.status(400).json({ error: 'baseUrl is required' })

    const models = await fetchProviderModels(baseUrl, apiKey, filterPrefix)
    res.json({ models })
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch models' })
  }
})

// ====== Characters / Tools 管理 API ======
const CHARACTERS_FILE = path.resolve(__dirname, 'src/characters/package.js')

/** 读取所有已注册的工具列表（不含 execute，仅供前端展示） */
app.get('/api/tools', (req, res) => {
  const tools = getTools()
  const list = []
  for (const [name, tool] of tools) {
    list.push({ name, description: tool.description, inputSchema: tool.inputSchema })
  }
  res.json(list)
})

/** 获取所有角色完整信息 */
app.get('/api/characters', (req, res) => {
  const agents = getAgentList()
  res.json(agents)
})

/** 获取单个角色信息 */
app.get('/api/characters/:name', (req, res) => {
  const agent = getAgent(req.params.name)
  if (!agent) return res.status(404).json({ error: 'Character not found' })
  res.json({
    name: agent.name,
    description: agent.description,
    prompt: agent.rawPrompt,
    tools: agent.tools,
  })
})

/** 创建新角色 */
app.post('/api/characters', (req, res) => {
  try {
    const { name, description, prompt, tools } = req.body
    if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' })

    // 读取当前配置
    const chars = require('./src/characters/package')
    if (chars[name]) return res.status(409).json({ error: `Character "${name}" already exists` })

    // 写入配置
    chars[name] = {
      description: description || '',
      prompt: prompt || '',
      tools: tools || [],
    }

    fs.writeFileSync(CHARACTERS_FILE, `// Characters Configuration\n// 角色配置 — 每个角色（Agent）的定义、工具、推理策略、预算等\n\nmodule.exports = ${JSON.stringify(chars, null, 2)}\n`, 'utf-8')

    // 重新加载到内存
    delete require.cache[require.resolve('./src/characters/package')]
    const { registerAgent } = require('./src/characters')
    registerAgent({
      name,
      description: chars[name].description || '',
      character: name,
      rawPrompt: chars[name].prompt || '',
      tools: chars[name].tools || [],
      config: {},
    })

    res.status(201).json({ name, description, prompt, tools })
  } catch (err) {
    console.error('[Characters] Create error:', err)
    res.status(500).json({ error: err.message })
  }
})

/** 更新角色配置 */
app.put('/api/characters/:name', (req, res) => {
  try {
    const targetName = req.params.name
    const { name, description, prompt, tools } = req.body
    if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' })

    const chars = require('./src/characters/package')
    if (!chars[targetName]) return res.status(404).json({ error: `Character "${targetName}" not found` })

    // 如果改名，删除旧键
    const newName = name !== targetName ? name : targetName
    delete chars[targetName]

    chars[newName] = {
      description: description || '',
      prompt: prompt || '',
      tools: tools || [],
    }

    fs.writeFileSync(CHARACTERS_FILE, `// Characters Configuration\n// 角色配置 — 每个角色（Agent）的定义、工具、推理策略、预算等\n\nmodule.exports = ${JSON.stringify(chars, null, 2)}\n`, 'utf-8')

    // 重新加载
    delete require.cache[require.resolve('./src/characters/package')]
    const { registerAgent } = require('./src/characters')
    registerAgent({
      name: newName,
      description: chars[newName].description || '',
      character: newName,
      rawPrompt: chars[newName].prompt || '',
      tools: chars[newName].tools || [],
      config: {},
    })

    res.json({ name: newName, description, prompt, tools })
  } catch (err) {
    console.error('[Characters] Update error:', err)
    res.status(500).json({ error: err.message })
  }
})

/** 删除角色 */
app.delete('/api/characters/:name', (req, res) => {
  try {
    const targetName = req.params.name
    const protectedNames = ['聊天助手', '代码专家']
    if (protectedNames.includes(targetName)) {
      return res.status(403).json({ error: `Cannot delete built-in character "${targetName}"` })
    }

    const chars = require('./src/characters/package')
    if (!chars[targetName]) return res.status(404).json({ error: `Character "${targetName}" not found` })

    delete chars[targetName]

    fs.writeFileSync(CHARACTERS_FILE, `// Characters Configuration\n// 角色配置 — 每个角色（Agent）的定义、工具、推理策略、预算等\n\nmodule.exports = ${JSON.stringify(chars, null, 2)}\n`, 'utf-8')

    res.json({ success: true })
  } catch (err) {
    console.error('[Characters] Delete error:', err)
    res.status(500).json({ error: err.message })
  }
})

// ====== 启动 ======
app.listen(PORT, () => {
  console.log(`✦ EGO Agent Server running at http://localhost:${PORT}`)
  console.log(`  API: http://localhost:${PORT}/api`)
  console.log(`  Health: http://localhost:${PORT}/api/health`)
})
