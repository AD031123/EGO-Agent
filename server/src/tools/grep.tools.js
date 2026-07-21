/**
 * Tool: grep
 * 在文件中搜索内容（支持正则表达式）
 *
 * 参数:
 *   pattern   — 搜索模式（必填），支持正则表达式
 *   path      — 可选，限定搜索目录（相对项目根，默认项目根）
 *   glob      — 可选，限定文件 glob，如 *.js、*.{vue,ts}
 *   maxResults — 可选，最多返回结果数（默认 50）
 */
const path = require('path')
const fs = require('fs')
const { registerTool } = require('./index')
const { getWorkspaceRoot, resolvePath } = require('./workspace.tools')

/**
 * 递归扫描文件（排除 node_modules / .git / dist / .claude）
 */
function scanFiles(dir, maxFiles = 10000) {
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
      results.push(...scanFiles(fullPath, maxFiles - results.length))
    } else if (entry.isFile()) {
      results.push(fullPath)
    }
  }
  return results
}

/**
 * 简单的 glob 匹配
 */
function globMatch(globPattern, filePath) {
  const normalized = filePath.replace(/\\/g, '/')
  const regexStr = globPattern
    .replace(/\*\*/g, '<<<GLOBSTAR>>>')
    .replace(/\*/g, '[^/]*')
    .replace(/<<<GLOBSTAR>>>/g, '.*')
    .replace(/\?/g, '.')
  return new RegExp('^' + regexStr + '$').test(normalized)
}

registerTool({
  name: 'grep',
  description: '在文件中搜索文本内容，支持正则表达式，返回匹配的文件路径、行号和行内容',
  inputSchema: {
    type: 'object',
    properties: {
      pattern: {
        type: 'string',
        description: '搜索模式（必填），支持正则表达式，如 "TODO" 或 "function\\s+\\w+"',
      },
      path: {
        type: 'string',
        description: '可选，限定搜索目录（相对项目根，默认项目根目录）',
      },
      glob: {
        type: 'string',
        description: '可选，限定文件扩展名/glob，如 *.js、*.{vue,ts,js}',
      },
      maxResults: {
        type: 'number',
        description: '可选，最多返回结果数（默认 50）',
      },
    },
    required: ['pattern'],
  },
  async execute(args) {
    const { pattern, glob: fileGlob, maxResults = 50 } = args
    if (!pattern || !pattern.trim()) {
      return { error: 'pattern 是必填参数' }
    }

    const searchDir = args.path
      ? resolvePath(args.path)
      : getWorkspaceRoot()

    if (!fs.existsSync(searchDir)) {
      return { error: `目录不存在: ${args.path || '(根目录)'}` }
    }

    let regex
    try {
      regex = new RegExp(pattern, 'gi')
    } catch (e) {
      return { error: `无效的正则表达式: ${e.message}` }
    }

    const allFiles = scanFiles(searchDir)
    const results = []
    const limitedFiles = fileGlob
      ? allFiles.filter(f => globMatch(fileGlob, path.relative(searchDir, f)))
      : allFiles

    for (const filePath of limitedFiles) {
      if (results.length >= maxResults) break
      const relPath = path.relative(getWorkspaceRoot(), filePath)

      // 检查文件大小（跳过大于 2MB 的）
      const stat = fs.statSync(filePath)
      if (stat.size > 2 * 1024 * 1024) continue

      try {
        const content = fs.readFileSync(filePath, 'utf-8')
        const lines = content.split('\n')

        for (let i = 0; i < lines.length; i++) {
          if (results.length >= maxResults) break
          regex.lastIndex = 0 // 重置正则状态
          if (regex.test(lines[i])) {
            results.push({
              file: relPath,
              line: i + 1,
              content: lines[i].trim(),
            })
          }
        }
      } catch {
        // 跳过无法读取的文件
      }
    }

    return {
      pattern,
      total: results.length,
      results,
    }
  },
})
