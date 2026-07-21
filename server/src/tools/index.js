/**
 * Tools Registry
 *
 * MCP 协议格式：
 * {
 *   name, description, inputSchema,
 *   execute: async (args, context) => any
 * }
 */

const tools = new Map()

/**
 * 注册一个工具
 * @param {object} tool
 * @param {string} tool.name
 * @param {string} tool.description
 * @param {object} tool.inputSchema - JSON Schema
 * @param {Function} tool.execute - async (args, context) => result
 */
function registerTool(tool) {
  if (!tool.name) throw new Error('Tool must have a name')
  if (tools.has(tool.name)) {
    console.warn(`[Tools] Overwriting existing tool: "${tool.name}"`)
  }

  // 兼容旧版 parameters → inputSchema
  if (tool.parameters && !tool.inputSchema) {
    tool.inputSchema = tool.parameters
    delete tool.parameters
  }

  tools.set(tool.name, {
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
    execute: tool.execute,
  })
}

/**
 * 获取所有已注册的工具
 */
function getTools() {
  return new Map(tools)
}

/**
 * 将内部 MCP 工具格式转换为 OpenAI function calling 格式
 */
function getOpenAITools(toolNames) {
  const all = []
  for (const [name, tool] of tools) {
    if (toolNames && !toolNames.includes(name)) continue
    all.push({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
      },
    })
  }
  return all
}

/**
 * 执行一个工具调用
 */
async function executeTool(name, args, context) {
  const tool = tools.get(name)
  if (!tool) {
    throw new Error(`Unknown tool: "${name}". Registered: ${[...tools.keys()].join(', ')}`)
  }

  const result = await tool.execute(args, context)

  return result
}

/**
 * 统一解析 tool_calls（兼容 OpenAI 和 MCP 格式）
 */
function parseToolCall(tc) {
  const name = tc.function?.name || tc.name
  const argsRaw = tc.function?.arguments || tc.arguments
  const args = typeof argsRaw === 'string' ? JSON.parse(argsRaw) : argsRaw
  return { name, args }
}

/**
 * 处理 LLM 返回的 tool_calls，批量执行
 */
async function handleToolCalls(toolCalls, context) {
  if (!toolCalls || !Array.isArray(toolCalls)) return []

  const results = await Promise.allSettled(
    toolCalls.map(async (tc) => {
      const { name, args } = parseToolCall(tc)
      const result = await executeTool(name, args, context)
      const success = !(result && result.error)
      console.log(`  ${success ? '✅' : '❌'} ${name} — ${success ? '成功' : '失败'}`)
      return {
        tool_call_id: tc.id,
        role: 'tool',
        name,
        content: typeof result === 'string' ? result : JSON.stringify(result),
      }
    })
  )

  return results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value
    const tc = toolCalls[i]
    return {
      tool_call_id: tc?.id || 'error',
      role: 'tool',
      name: tc?.function?.name || 'error',
      content: `Tool execution error: ${r.reason?.message || 'Unknown error'}`,
    }
  })
}

module.exports = {
  registerTool,
  getTools,
  getOpenAITools,
  executeTool,
  handleToolCalls,
  parseToolCall,
}
