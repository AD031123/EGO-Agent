/**
 * OpenAI-compatible Provider
 * 支持 OpenAI API 以及所有兼容 OpenAI 的接口（如 Azure、Together AI、DeepSeek、Qwen 等）
 * 配置项见 LLM/package.json
 */
const { getProviderConfig } = require('../index')

function getConfig() {
  const cfg = getProviderConfig('openai') || {}
  return {
    baseUrl: cfg.baseUrl || 'https://api.openai.com/v1',
    apiKey: cfg.apiKey || '',
    defaultModel: cfg.defaultModel || 'gpt-4o',
    models: cfg.models || [
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
    ],
  }
}

/**
 * 调用 OpenAI-compatible chat completions API
 */
async function chat(modelId, messages, options = {}) {
  const { baseUrl, apiKey, defaultModel } = getConfig()
  const model = modelId || defaultModel
  const { temperature = 0.7, stream = false, tools } = options

  const body = {
    model,
    messages,
    temperature,
    stream,
  }

  // 附加 tools（OpenAI 标准 function calling 格式）
  if (tools && Array.isArray(tools) && tools.length > 0) {
    body.tools = tools
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`OpenAI API error (${response.status}): ${errText}`)
  }

  const data = await response.json()

  const choice = data.choices?.[0]
  const content = choice?.message?.content || ''
  const toolCalls = choice?.message?.tool_calls || null

  return {
    content,
    toolCalls,
    usage: data.usage || null,
    model: data.model || model,
  }
}

/**
 * 获取当前可用的模型列表
 */
async function models() {
  const { baseUrl, apiKey, models: defaultModels } = getConfig()

  try {
    const response = await fetch(`${baseUrl}/models`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })
    if (!response.ok) return defaultModels
    const data = await response.json()
    const listed = (data.data || [])
      .filter((m) => m.id.startsWith('gpt-') || m.id.startsWith('o'))
      .map((m) => ({ id: m.id, name: m.id }))
    return listed.length > 0 ? listed : defaultModels
  } catch {
    return defaultModels
  }
}

module.exports = {
  name: 'openai',
  chat,
  models,
}
