/**
 * Tool: glob
 * 使用 glob 模式匹配查找文件
 *
 * 参数:
 *   pattern   — glob 模式（必填），如 /*.vue、src//*.js
 *   root      — 可选，搜索根目录（相对项目根，默认项目根）
 */
const path = require('path')
const fs = require('fs')
const { registerTool } = require('./index')
const { getWorkspaceRoot, resolvePath } = require('./workspace.tools')

/**
 * 简单的 glob 匹配 — 将 glob 模式转为正则
 */
function globMatch(pattern, filePath) {
  // 标准化路径分隔符
  const normalized = filePath.replace(/\\/g, '/')
  const patternNorm = pattern.replace(/\\/g, '/')

  // 处理 ** 前缀
  if (patternNorm.startsWith('**')) {
    const suffix = patternNorm.slice(2)
    if (normalized.endsWith(suffix.replace(/\*/g, '[^/]*'))) return true
    // 简单通配
    const regexStr = patternNorm
      .replace(/\*\*/g, '<<<GLOBSTAR>>>')
      .replace(/\*/g, '[^/]*')
      .replace(/<<<GLOBSTAR>>>/g, '.*')
    return new RegExp('^' + regexStr + '$').test(normalized)
  }

  const regexStr = patternNorm
    .replace(/\*\*/g, '<<<GLOBSTAR>>>')
    .replace(/\*/g, '[^/]*')
    .replace(/<<<GLOBSTAR>>>/g, '.*')
    .replace(/\?/g, '.')
  return new RegExp('^' + regexStr + '$').test(normalized)
}

/**
 * 递归扫描文件（排除 node_modules / .git / dist）
 */
function scanFiles(dir, rootDir, maxFiles = 5000) {
  const results = []
  let entries
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return results
  }
  for (const entry of entries) {
    if (results.length >= maxFiles) break
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') continue
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...scanFiles(fullPath, rootDir, maxFiles - results.length))
    } else if (entry.isFile()) {
      results.push(path.relative(rootDir, fullPath))
    }
  }
  return results
}

registerTool({
  name: 'glob',
  description: '使用 glob 模式匹配查找文件，如 "**/*.vue"、"src/**/*.js"、"*.md"',
  inputSchema: {
    type: 'object',
    properties: {
      pattern: {
        type: 'string',
        description: 'glob 模式，如 **/*.vue、src/**/*.js、*.md',
      },
      root: {
        type: 'string',
        description: '可选，搜索根目录（相对项目根，默认项目根目录）',
      },
    },
    required: ['pattern'],
  },
  async execute(args) {
    const { pattern, root } = args
    if (!pattern || !pattern.trim()) {
      return { error: 'pattern 是必填参数' }
    }

    const rootDir = root ? resolvePath(root) : getWorkspaceRoot()

    if (!fs.existsSync(rootDir)) {
      return { error: `目录不存在: ${root || '(根目录)'}` }
    }

    const allFiles = scanFiles(rootDir, rootDir)
    const matched = allFiles.filter(f => globMatch(pattern, f))

    return {
      pattern,
      root: root || '/',
      total: matched.length,
      files: matched.slice(0, 200), // 最多返回 200 个结果
      truncated: matched.length > 200,
    }
  },
})
