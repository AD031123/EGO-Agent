/**
 * Characters Registry
 * 角色注册中心 — 管理所有角色（Agent）的注册与导出
 *
 * 角色定义在 package.js 中，启动时自动读取并注册。
 * systemPrompt 在运行时动态构建：base + prompt + 工具描述
 */

const { getPrompt } = require('../prompt')
const characters = require('./package')

const agentMap = new Map()

/**
 * 构建工具描述文本（运行时实时读取已注册的工具）
 */
function buildToolsDescription(toolNames) {
  let allTools
  try {
    allTools = require('../tools').getTools()
  } catch {
    return ''
  }
  const lines = (toolNames || [])
    .map((name) => {
      const tool = allTools.get(name)
      if (!tool) return null
      return `- ${tool.name} — ${tool.description}`
    })
    .filter(Boolean)
  return lines.length > 0 ? `\n\n## 可用工具\n${lines.join('\n')}` : ''
}

/**
 * 注册一个角色到 agent 注册表
 */
function registerAgent(agent) {
  if (!agent.name) throw new Error('Agent must have a name')
  if (agentMap.has(agent.name)) {
    console.warn(`[Characters] Overwriting existing agent: "${agent.name}"`)
  }
  // systemPrompt 在注册时只存原始 prompt，工具描述在 getSystemPrompt 调用时动态追加
  agentMap.set(agent.name, {
    name: agent.name,
    description: agent.description || '',
    character: agent.character || '',
    rawPrompt: agent.rawPrompt || '',
    tools: agent.tools || [],
    config: agent.config || {},
    model: agent.model || null,
  })
}

/**
 * 获取所有注册的 Agent
 */
function getAgents() {
  return new Map(agentMap)
}

/**
 * 获取 Agent 列表（不含 systemPrompt 的轻量版，用于前端展示）
 */
function getAgentList() {
  return [...agentMap.values()].map(({ name, description, character, rawPrompt, tools }) => ({
    name, description, character, rawPrompt, tools
  }))
}

/**
 * 获取指定 Agent
 */
function getAgent(name) {
  return agentMap.get(name)
}

/**
 * 获取 Agent 的系统提示词（动态构建）
 * 每次调用都实时读取已注册的工具描述，追加到 prompt 末尾
 */
function getSystemPrompt(name) {
  const agent = agentMap.get(name)
  if (!agent) return ''

  const desc = buildToolsDescription(agent.tools)
  const characterPrompt = agent.rawPrompt ? agent.rawPrompt + desc : ''
  const full = characterPrompt ? getPrompt(characterPrompt) : ''

  return full
}

/**
 * 获取 Agent 允许使用的工具列表
 */
function getAgentTools(name) {
  return agentMap.get(name)?.tools || []
}

/**
 * 获取 Agent 的完整配置
 */
function getAgentConfig(name) {
  return agentMap.get(name)?.config || {}
}

// ====== 自动注册 ======
function autoRegister() {
  for (const [characterKey, cfg] of Object.entries(characters)) {
    const { description, prompt, tools, ...restConfig } = cfg

    registerAgent({
      name: characterKey,
      description: description || '',
      character: characterKey,
      rawPrompt: prompt || '',
      tools: tools || [],
      config: restConfig,
    })
    console.log(`  ✓ Character: ${characterKey}`)
  }
}

autoRegister()

module.exports = {
  registerAgent,
  getAgents,
  getAgentList,
  getAgent,
  getSystemPrompt,
  getAgentTools,
  getAgentConfig,
}
