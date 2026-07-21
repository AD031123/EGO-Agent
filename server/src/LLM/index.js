/**
 * LLM Adapter Layer
 * 大模型适配层 — 提供统一的模型调用接口，支持多 provider
 *
 * 从本目录的 package.json 读取 LLM 配置（provider 密钥、模型列表等）。
 */
const path = require('path')
const fs = require('fs')
const { execSync } = require('child_process')

let _config = null

/**
 * 加载 LLM 配置文件
 * @returns {object}
 */
function loadConfig() {
  if (_config) return _config

  try {
    const configPath = path.join(__dirname, 'package.json')
    const raw = fs.readFileSync(configPath, 'utf-8')
    const parsed = JSON.parse(raw)
    _config = parsed.llm || parsed
    return _config
  } catch (e) {
    console.warn('[LLM Config] Failed to load config, using defaults:', e.message)
    _config = { providers: {} }
    return _config
  }
}

/**
 * 保存配置到 package.json
 * @param {object} config 完整的 llm 配置对象
 */
function saveConfig(config) {
  const configPath = path.join(__dirname, 'package.json')
  const raw = fs.readFileSync(configPath, 'utf-8')
  const parsed = JSON.parse(raw)
  // Update the llm block (or the root if no llm key)
  if (parsed.llm) {
    parsed.llm = config
  } else {
    Object.assign(parsed, config)
  }
  fs.writeFileSync(configPath, JSON.stringify(parsed, null, 2) + '\n', 'utf-8')
  _config = null // bust cache so next loadConfig re-reads
}

/**
 * 更新指定 provider 的配置
 * @param {string} name provider 名称
 * @param {object} providerConfig 新的 provider 配置
 */
function updateProviderConfig(name, providerConfig) {
  const config = loadConfig()
  if (!config.providers) config.providers = {}
  config.providers[name] = providerConfig
  saveConfig(config)
}

/**
 * 从官方 API 获取模型列表
 * 支持 OpenAI 兼容格式 (/models) 和 Ollama 本地 CLI (ollama list)
 *
 * @param {string} baseUrl - API 地址
 * @param {string} apiKey - API 密钥（可选）
 * @param {string} filterPrefix - 可选的模型 ID 前缀过滤
 * @returns {Promise<Array<{id: string, name: string}>>}
 */
async function fetchProviderModels(baseUrl, apiKey, filterPrefix) {
  const normalizedUrl = baseUrl.replace(/\/+$/, '')

  // Ollama: 直接调用本地 CLI
  if (normalizedUrl.includes('localhost:11434') || normalizedUrl.includes('127.0.0.1:11434') || normalizedUrl.endsWith('/api')) {
    try {
      const stdout = execSync('ollama list', { encoding: 'utf-8', timeout: 10000 })
      const lines = stdout.trim().split('\n')
      // Skip header line, parse: NAME  ID  SIZE  MODIFIED
      const models = lines.slice(1).filter(Boolean).map((line) => {
        const name = line.split(/\s+/)[0]
        return { id: name, name }
      }).filter((m) => m.id)
      return models
    } catch (e) {
      throw new Error(`Ollama CLI 调用失败: ${e.message}. 请确保已安装 Ollama 并已启动服务.`)
    }
  }

  // OpenAI-compatible
  let url
  if (normalizedUrl.endsWith('/chat/completions')) {
    url = normalizedUrl.replace(/\/chat\/completions$/, '/models')
  } else {
    url = `${normalizedUrl}/models`
  }

  const headers = { 'Content-Type': 'application/json' }
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`

  const res = await fetch(url, { headers })

  if (!res.ok) {
    const bodyText = await res.text()
    const errMsg = `${res.status} ${res.statusText} — ${bodyText.slice(0, 200)}`
    throw new Error(errMsg)
  }

  const data = await res.json()
  let models = (data.data || data.models || []).map((m) => ({
    id: m.id,
    name: m.id,
  }))

  if (filterPrefix) {
    models = models.filter((m) => m.id.startsWith(filterPrefix))
  }

  return models
}

/**
 * 获取指定 provider 的配置
 * @param {string} name
 * @returns {object|null}
 */
function getProviderConfig(name) {
  const config = loadConfig()
  return config.providers?.[name] || null
}

/**
 * 获取所有启用的 provider 名称列表
 * @returns {string[]}
 */
function getEnabledProviders() {
  const config = loadConfig()
  const providers = config.providers || {}
  return Object.entries(providers)
    .filter(([, p]) => p.enabled !== false)
    .map(([name]) => name)
}

// ====== Provider 注册中心 ======

const providers = {}

/**
 * 注册一个 LLM Provider
 * @param {string} name - provider 名称，如 'openai', 'ollama'
 * @param {object} provider - { chat, models, name }
 */
function registerProvider(name, provider) {
  providers[name] = provider
}

/**
 * 清空所有已注册的 Provider（用于配置变更后重载）
 */
function clearProviders() {
  for (const key of Object.keys(providers)) {
    delete providers[key]
  }
}

/**
 * 获取已注册的所有 provider
 */
function getProviders() {
  return { ...providers }
}

/**
 * 获取所有可用模型的扁平列表（含 provider 信息）
 */
async function getAvailableModels() {
  const all = []
  for (const [providerName, provider] of Object.entries(providers)) {
    if (typeof provider.models === 'function') {
      try {
        const models = await provider.models()
        all.push(...models.map((m) => ({
          ...m,
          provider: providerName,
        })))
      } catch (e) {
        console.warn(`[LLM] Failed to fetch models from provider "${providerName}":`, e.message)
      }
    }
  }
  return all
}

/**
 * 发送聊天请求
 */
async function chat(providerName, modelId, messages, options = {}) {
  const provider = providers[providerName]
  if (!provider) {
    throw new Error(`Unknown LLM provider: "${providerName}". Available: ${Object.keys(providers).join(', ')}`)
  }
  if (typeof provider.chat !== 'function') {
    throw new Error(`Provider "${providerName}" does not support chat`)
  }
  return provider.chat(modelId, messages, options)
}

module.exports = {
  registerProvider,
  clearProviders,
  getProviders,
  getAvailableModels,
  chat,
  loadConfig,
  getProviderConfig,
  getEnabledProviders,
  saveConfig,
  updateProviderConfig,
  fetchProviderModels,
}
