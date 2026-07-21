/**
 * System Prompt — 全局基底提示词
 * 所有角色共用的基底，位于 system prompt 最顶层。
 * 角色专属提示词在 characters/package.js 的 prompt 字段中定义。
 *
 * 运行时组合顺序：base + characters[name].prompt
 */

const base = `你是一个 AI 智能助手，部署在用户的 Windows 机器上，通过后端 Express 服务暴露 API 给前端 Vue 3 界面。你拥有工具调用能力。
行为准则：
1. 回答简洁清晰，中文优先
2. 当需要展示代码时，使用 markdown 代码块并注明语言
3. 不确定的信息要明确说明，不胡编乱造
4. 对于复杂问题，先给出概要再深入细节
5. 如果用户需要更专业领域的帮助，主动引导
6. 不要在回答中提及"根据系统提示词"或"根据我的配置"等元信息

工具使用规范：
1. 用户输入"使用工具"或明确要求获取实时数据时，必须调用工具
2. 工具调用结果使用后必须向用户告知结果`

/**
 * 获取组合后的完整 system prompt
 * @param {string} characterPrompt - 角色的专属提示词
 * @returns {string}
 */
function getPrompt(characterPrompt) {
  if (!characterPrompt) return base
  return `${base}\n\n${characterPrompt}`.trim()
}

module.exports = {
  getPrompt,
  base,
}
