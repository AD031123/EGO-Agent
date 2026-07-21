/**
 * 工作区模块 — 维护一个工作目录上下文
 *
 * agent 可通过 set_workspace 工具指定一个目录为工作区，
 * 之后所有文件操作（ls/glob/grep/read_file/write_file/edit_file/delete）
 * 的相对路径都基于此工作区解析，而非项目根目录。
 *
 * 默认工作区为项目根目录。
 */
const path = require('path')
const fs = require('fs')
const { registerTool } = require('./index')

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..')

/** 当前工作区路径（可变） */
let currentWorkspace = PROJECT_ROOT

/**
 * 获取当前工作区根目录
 */
function getWorkspaceRoot() {
  return currentWorkspace
}

/**
 * 将用户传入的路径解析为绝对路径（基于工作区或绝对路径）
 */
function resolvePath(userPath) {
  if (!userPath || !userPath.trim()) return currentWorkspace
  return path.isAbsolute(userPath)
    ? path.resolve(userPath)
    : path.resolve(currentWorkspace, userPath)
}

registerTool({
  name: 'set_workspace',
  description: '设置工作区目录。设置后，后续所有文件操作（ls/glob/grep/read_file/write_file/edit_file/delete）的相对路径都基于此目录解析',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: '工作区目录路径（必填），相对项目根或绝对路径，如 src/components 或 D:\\my-project',
      },
    },
    required: ['path'],
  },
  async execute(args) {
    const targetPath = args.path
    if (!targetPath || !targetPath.trim()) {
      return { error: 'path 是必填参数' }
    }

    const fullPath = path.isAbsolute(targetPath)
      ? path.resolve(targetPath)
      : path.resolve(PROJECT_ROOT, targetPath)

    if (!fs.existsSync(fullPath)) {
      return { error: `目录不存在: ${targetPath}` }
    }

    if (!fs.statSync(fullPath).isDirectory()) {
      return { error: `路径不是目录: ${targetPath}` }
    }

    currentWorkspace = fullPath
    const relPath = path.relative(PROJECT_ROOT, fullPath)

    return {
      success: true,
      workspace: fullPath,
      relative: relPath || '(项目根目录)',
      note: `工作区已设置为: ${relPath || '项目根目录'}。后续文件操作将基于此目录解析相对路径。`,
    }
  },
})

module.exports = {
  getWorkspaceRoot,
  resolvePath,
}
