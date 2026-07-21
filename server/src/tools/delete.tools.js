/**
 * Tool: delete
 * 删除文件或目录（递归删除）
 *
 * 参数:
 *   path    — 要删除的文件或目录路径（必填），相对项目根或绝对路径
 *   force   — 可选，是否强制递归删除目录（默认 false，删除空目录或文件不需要 force）
 */
const fs = require('fs')
const { registerTool } = require('./index')
const { getWorkspaceRoot, resolvePath } = require('./workspace.tools')

registerTool({
  name: 'delete',
  description: '删除文件或空目录。删除非空目录时需要 force 参数',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: '要删除的文件或目录路径（必填），相对项目根或绝对路径',
      },
      force: {
        type: 'boolean',
        description: '可选，是否强制递归删除非空目录（默认 false）',
      },
    },
    required: ['path'],
  },
  async execute(args) {
    const targetPath = args.path
    const force = args.force || false

    if (!targetPath || !targetPath.trim()) {
      return { error: 'path 是必填参数' }
    }

    const fullPath = resolvePath(targetPath)

    // 安全检查：禁止离开工作区
    const workspaceRoot = getWorkspaceRoot()
    if (!fullPath.startsWith(workspaceRoot)) {
      return { error: '不允许删除工作区目录之外的文件' }
    }

    // 禁止删除工作区根目录
    if (fullPath === workspaceRoot) {
      return { error: '不允许删除项目根目录' }
    }

    if (!fs.existsSync(fullPath)) {
      return { error: `路径不存在: ${targetPath}` }
    }

    const stat = fs.statSync(fullPath)

    try {
      if (stat.isDirectory()) {
        if (force) {
          fs.rmSync(fullPath, { recursive: true, force: true })
        } else {
          // 仅当目录为空时删除
          const contents = fs.readdirSync(fullPath)
          if (contents.length > 0) {
            return { error: `目录非空 (${contents.length} 个项目)，如需删除请设置 force: true` }
          }
          fs.rmdirSync(fullPath)
        }
      } else {
        fs.unlinkSync(fullPath)
      }
    } catch (e) {
      return { error: `删除失败: ${e.message}` }
    }

    return {
      success: true,
      path: targetPath,
      type: stat.isDirectory() ? 'directory' : 'file',
    }
  },
})
