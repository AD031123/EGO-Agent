/**
 * Local Model Provider
 * 通过 Ollama 接入本地模型（如 Llama、Qwen、DeepSeek 等）
 * 配置项见 LLM/package.json
 */
const { getProviderConfig } = require('../index')

function getConfig() {
  const cfg = getProviderConfig('ollama') || {}
  return {
    baseUrl: cfg.baseUrl || 'http://localhost:11434',
    defaultModel: cfg.defaultModel || 'qwen2.5',
    models: cfg.models || [
      { id: 'qwen2.5', name: 'Qwen 2.5' },
      { id: 'llama3.2', name: 'Llama 3.2' },
    ],
  }
}

/**
 * 调用 Ollama chat API
 */
async function chat(modelId, messages, options = {}) {
  const { baseUrl, defaultModel } = getConfig()
  const model = modelId || defaultModel
  const { temperature = 0.7, stream = false, tools } = options

  const body = {
    model,
    messages,
    options: { temperature },
    stream,
  }

  // 附加 tools（Ollama 兼容 OpenAI function calling 格式）
  if (tools && Array.isArray(tools) && tools.length > 0) {
    body.tools = tools
  }

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Ollama API error (${response.status}): ${errText}`)
  }

  const data = await response.json()

  return {
    content: data.message?.content || '',
    toolCalls: data.message?.tool_calls || null,
    usage: data.usage || null,
    model: data.model || model,
  }
}

/**
 * 获取 Ollama 本地已安装的模型
 */
async function models() {
  const { baseUrl, models: defaultModels } = getConfig()

  try {
    const response = await fetch(`${baseUrl}/api/tags`)
    if (!response.ok) return defaultModels
    const data = await response.json()
    const installed = (data.models || []).map((m) => ({ id: m.name, name: m.name }))
    return installed.length > 0 ? installed : defaultModels
  } catch {
    return defaultModels
  }
}

module.exports = {
  name: 'ollama',
  chat,
  models,
}
