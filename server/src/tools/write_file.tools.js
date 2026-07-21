/**
 * Tool: write_file
 * 写入或覆盖文件内容（支持创建新文件和覆盖已有文件）
 *
 * 参数:
 *   file_path  — 文件路径（必填），相对项目根或绝对路径
 *   content    — 文件内容（必填）
 *   append     — 可选，如果为 true 则在文件末尾追加而非覆盖（默认 false）
 */
const path = require('path')
const fs = require('fs')
const { registerTool } = require('./index')
const { getWorkspaceRoot, resolvePath } = require('./workspace.tools')

registerTool({
  name: 'write_file',
  description: '写入或覆盖文件内容，也可追加内容。创建新文件或覆盖已有文件',
  inputSchema: {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: '文件路径（必填），相对项目根或绝对路径，如 src/utils/helper.js',
      },
      content: {
        type: 'string',
        description: '文件内容（必填）',
      },
      append: {
        type: 'boolean',
        description: '可选，如果为 true 则在文件末尾追加而非覆盖（默认 false）',
      },
    },
    required: ['file_path', 'content'],
  },
  async execute(args) {
    const { file_path: filePath, content, append } = args
    if (!filePath || !filePath.trim()) {
      return { error: 'file_path 是必填参数' }
    }
    if (content === undefined || content === null) {
      return { error: 'content 是必填参数' }
    }

    const fullPath = resolvePath(filePath)

    // 安全检查：禁止离开工作区
    const workspaceRoot = getWorkspaceRoot()
    if (!fullPath.startsWith(workspaceRoot)) {
      return { error: '不允许在工作区目录之外写入文件' }
    }

    // 创建父目录（如果不存在）
    const parentDir = path.dirname(fullPath)
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true })
    }

    try {
      if (append && fs.existsSync(fullPath)) {
        fs.appendFileSync(fullPath, content, 'utf-8')
      } else {
        fs.writeFileSync(fullPath, content, 'utf-8')
      }
    } catch (e) {
      return { error: `写入文件失败: ${e.message}` }
    }

    const stat = fs.statSync(fullPath)
    return {
      success: true,
      file: filePath,
      size: stat.size,
      action: append ? 'appended' : 'written',
      size_formatted: stat.size < 1024
        ? `${stat.size} B`
        : `${(stat.size / 1024).toFixed(1)} KB`,
    }
  },
})
