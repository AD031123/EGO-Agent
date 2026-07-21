/**
 * DeepSeek Provider
 * 接入 DeepSeek API（兼容 OpenAI 接口规范）
 * 配置项见 LLM/package.json
 */
const { getProviderConfig } = require('../index')

function getConfig() {
  const cfg = getProviderConfig('deepseek') || {}
  return {
    baseUrl: cfg.baseUrl || 'https://api.deepseek.com',
    apiKey: cfg.apiKey || '',
    defaultModel: cfg.defaultModel || 'deepseek-chat',
    models: cfg.models || [
      { id: 'deepseek-chat', name: 'DeepSeek V3' },
      { id: 'deepseek-reasoner', name: 'DeepSeek R1' },
    ],
  }
}

/**
 * 调用 DeepSeek chat completions API
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
    throw new Error(`DeepSeek API error (${response.status}): ${errText}`)
  }

  const data = await response.json()

  const choice = data.choices?.[0]
  const content = choice?.message?.content || ''

  // DeepSeek-r1 可能在 content 之前包含 reasoning_content
  const reasoningContent = choice?.message?.reasoning_content || null

  // 提取 tool_calls（如果有）
  const toolCalls = choice?.message?.tool_calls || null

  // 如果有推理内容，附加在 content 前
  const finalContent = reasoningContent
    ? `<details><summary>推理过程</summary>\n\n${reasoningContent}\n\n</details>\n\n${content}`
    : content

  return {
    content: finalContent,
    toolCalls,
    usage: data.usage || null,
    model: data.model || model,
  }
}

/**
 * 获取 DeepSeek 可用模型列表
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
      .filter((m) => m.id.startsWith('deepseek-'))
      .map((m) => ({ id: m.id, name: m.id }))
    return listed.length > 0 ? listed : defaultModels
  } catch {
    return defaultModels
  }
}

module.exports = {
  name: 'deepseek',
  chat,
  models,
}
