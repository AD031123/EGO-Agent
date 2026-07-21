/**
 * Tool: edit_file
 * 精确编辑文件内容（替换指定行的文本）
 *
 * 参数:
 *   file_path   — 文件路径（必填）
 *   old_string  — 要被替换的文本（必填），必须唯一匹配
 *   new_string  — 替换后的文本（必填）
 *   replace_all — 可选，是否替换所有匹配项（默认 false，仅替换第一个）
 */
const path = require('path')
const fs = require('fs')
const { registerTool } = require('./index')
const { getWorkspaceRoot, resolvePath } = require('./workspace.tools')

registerTool({
  name: 'edit_file',
  description: '精确编辑文件内容，用新文本替换文件中的指定旧文本。支持单个替换和全部替换',
  inputSchema: {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: '文件路径（必填），相对项目根或绝对路径',
      },
      old_string: {
        type: 'string',
        description: '要被替换的文本（必填），必须在文件中存在且唯一匹配',
      },
      new_string: {
        type: 'string',
        description: '替换后的文本（必填）',
      },
      replace_all: {
        type: 'boolean',
        description: '可选，是否替换所有匹配项（默认 false，仅替换第一个）',
      },
    },
    required: ['file_path', 'old_string', 'new_string'],
  },
  async execute(args) {
    const { file_path: filePath, old_string: oldStr, new_string: newStr, replace_all: replaceAll } = args
    if (!filePath || !filePath.trim()) {
      return { error: 'file_path 是必填参数' }
    }
    if (!oldStr && oldStr !== '') {
      return { error: 'old_string 是必填参数' }
    }
    if (newStr === undefined || newStr === null) {
      return { error: 'new_string 是必填参数' }
    }

    const fullPath = resolvePath(filePath)

    // 安全检查：禁止离开工作区
    const workspaceRoot = getWorkspaceRoot()
    if (!fullPath.startsWith(workspaceRoot)) {
      return { error: '不允许编辑工作区目录之外的文件' }
    }

    if (!fs.existsSync(fullPath)) {
      return { error: `文件不存在: ${filePath}` }
    }

    let content
    try {
      content = fs.readFileSync(fullPath, 'utf-8')
    } catch (e) {
      return { error: `读取文件失败: ${e.message}` }
    }

    // 检查匹配次数
    const matches = content.split(oldStr).length - 1
    if (matches === 0) {
      return { error: `未在文件 ${filePath} 中找到与 old_string 匹配的文本` }
    }

    let newContent
    let replaced = 0
    if (replaceAll) {
      newContent = content.split(oldStr).join(newStr)
      replaced = matches
    } else {
      newContent = content.replace(oldStr, newStr)
      replaced = 1
    }

    if (newContent === content) {
      return { error: '替换操作未产生任何变化' }
    }

    try {
      fs.writeFileSync(fullPath, newContent, 'utf-8')
    } catch (e) {
      return { error: `写入文件失败: ${e.message}` }
    }

    return {
      success: true,
      file: filePath,
      replaced,
      totalMatches: matches,
    }
  },
})
