/**
 * Tool: read_file
 * 读取文件内容，支持指定行数范围
 *
 * 参数:
 *   file_path  — 文件路径（必填），相对项目根或绝对路径
 *   offset     — 可选，起始行号（从 1 开始，默认 1）
 *   limit      — 可选，读取行数（默认全部，最大 2000）
 */
const path = require('path')
const fs = require('fs')
const { registerTool } = require('./index')
const { getWorkspaceRoot, resolvePath } = require('./workspace.tools')

registerTool({
  name: 'read_file',
  description: '读取文件内容，可指定行数范围（offset 和 limit），适用于大文件的分段读取',
  inputSchema: {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: '文件路径（必填），相对项目根或绝对路径，如 src/views/ChatView.vue',
      },
      offset: {
        type: 'number',
        description: '可选，起始行号，从 1 开始（默认 1）',
      },
      limit: {
        type: 'number',
        description: '可选，读取行数（默认全部，最大 2000）',
      },
    },
    required: ['file_path'],
  },
  async execute(args) {
    const { file_path: filePath, offset = 1, limit } = args
    if (!filePath || !filePath.trim()) {
      return { error: 'file_path 是必填参数' }
    }

    const fullPath = resolvePath(filePath)

    if (!fs.existsSync(fullPath)) {
      return { error: `文件不存在: ${filePath}` }
    }

    const stat = fs.statSync(fullPath)
    if (!stat.isFile()) {
      return { error: `路径不是文件: ${filePath}` }
    }

    // 检查文件大小（限制 5MB）
    if (stat.size > 5 * 1024 * 1024) {
      return { error: `文件过大 (${(stat.size / 1024 / 1024).toFixed(1)}MB)，无法读取` }
    }

    let content
    try {
      content = fs.readFileSync(fullPath, 'utf-8')
    } catch (e) {
      return { error: `读取文件失败: ${e.message}` }
    }

    const lines = content.split('\n')
    const totalLines = lines.length

    const startLine = Math.max(0, offset - 1)
    const effectiveLimit = limit !== undefined
      ? Math.min(limit, 2000)
      : totalLines - startLine

    const endLine = Math.min(startLine + effectiveLimit, totalLines)
    const sliced = lines.slice(startLine, endLine)
    const contentOut = sliced.join('\n')

    const result = {
      file: filePath,
      totalLines,
      lineRange: `${startLine + 1}-${endLine}`,
      content: contentOut,
    }

    if (endLine < totalLines) {
      result.note = `仅显示了第 ${startLine + 1}-${endLine} 行，共 ${totalLines} 行。如需读取更多请调整 offset 和 limit。`
    }

    return result
  },
})
