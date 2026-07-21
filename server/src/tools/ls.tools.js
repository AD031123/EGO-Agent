/**
 * Tool: ls
 * 列出指定目录的内容（文件和子目录）
 *
 * 参数:
 *   path    — 目录路径，相对项目根或绝对路径（可选，默认项目根）
 *   depth   — 可选，递归深度（0 表示仅当前目录，默认 0）
 */
const path = require('path')
const fs = require('fs')
const { registerTool } = require('./index')
const { getWorkspaceRoot, resolvePath } = require('./workspace.tools')

registerTool({
  name: 'ls',
  description: '列出指定目录的文件和子目录，支持递归深度控制。路径基于当前工作区解析（默认项目根目录，可用 set_workspace 更改）',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: '目录路径，基于工作区或绝对路径（可选，不传则列出当前工作区目录）',
      },
      depth: {
        type: 'number',
        description: '可选，递归深度（0 表示仅当前目录，默认 0）',
      },
    },
  },
  async execute(args) {
    const dirPath = args.path || '.'
    const depth = args.depth !== undefined ? args.depth : 0
    const fullPath = resolvePath(dirPath)

    if (!fs.existsSync(fullPath)) {
      return { error: `目录不存在: ${dirPath}` }
    }
    if (!fs.statSync(fullPath).isDirectory()) {
      return { error: `路径不是目录: ${dirPath}` }
    }

    function listDir(dir, currentDepth) {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      const result = []
      for (const entry of entries) {
        const relPath = path.relative(PROJECT_ROOT, path.join(dir, entry.name))
        const item = {
          name: entry.name,
          type: entry.isDirectory() ? 'directory' : 'file',
          path: relPath,
        }
        if (entry.isFile()) {
          const stat = fs.statSync(path.join(dir, entry.name))
          item.size = stat.size
        }
        result.push(item)
        if (entry.isDirectory() && currentDepth < depth) {
          const children = listDir(path.join(dir, entry.name), currentDepth + 1)
          result.push(...children.map(c => ({ ...c, path: relPath + '/' + c.path })))
        }
      }
      return result
    }

    const items = listDir(fullPath, 0)
    return {
      path: dirPath,
      total: items.length,
      items,
    }
  },
})
