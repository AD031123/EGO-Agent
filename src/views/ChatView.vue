<template>
  <div class="chat-layout">
    <!-- ====== Navbar ====== -->
    <nav class="navbar-glass px-4 py-3 d-flex align-items-center justify-content-between">
      <div class="d-flex align-items-center gap-3">
        <div class="navbar-brand d-flex align-items-center gap-2">
          <span class="brand-icon">✦</span>
          <span class="brand-text fw-semibold">EGO Agent</span>
        </div>
        <span class="badge badge-accent px-2 py-1 d-none d-sm-inline-flex align-items-center gap-1">
          <span class="status-dot" :class="{ offline: !backendOnline }"></span>
          {{ backendOnline ? 'Online' : '离线' }}
        </span>
      </div>

      <div class="d-flex align-items-center gap-2">
        <div class="model-select-mini d-none d-md-flex position-relative">
          <select v-model="selectedModel" class="select-glass-mini">
            <option v-for="m in modelList" :key="m.id" :value="m">{{ m.name }}</option>
          </select>
          <svg class="select-chevron" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
        </div>
        <button class="btn-icon" title="角色管理" @click="openSettings">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.32 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
        </button>
      </div>
    </nav>

    <!-- ====== Main Layout ====== -->
    <div class="d-flex flex-grow-1 overflow-hidden">
      <!-- ====== Sidebar ====== -->
      <aside class="sidebar glass-card m-3 me-0 d-none d-md-flex flex-column" style="width: 260px; min-width: 260px;">
        <!-- Tab Switcher -->
        <div class="d-flex border-bottom" style="border-color: var(--glass-border) !important;">
          <button
            class="sidebar-tab flex-grow-1 px-3 py-2"
            :class="{ active: sidebarTab === 'characters' }"
            @click="sidebarTab = 'characters'"
          >角色</button>
          <button
            class="sidebar-tab flex-grow-1 px-3 py-2"
            :class="{ active: sidebarTab === 'history' }"
            @click="sidebarTab = 'history'"
          >对话</button>
        </div>

        <!-- Characters Tab -->
        <div v-if="sidebarTab === 'characters'" class="p-3 flex-grow-1 overflow-hidden d-flex flex-column">
          <button class="btn-create-char w-100 mb-2" @click="openSettings">
            + 创建角色
          </button>
          <div class="d-flex flex-column gap-1 overflow-y-auto flex-grow-1">
            <div
              v-for="c in characters"
              :key="c.name"
              class="sidebar-item d-flex align-items-center gap-2 px-2 py-1"
              :class="{ active: agentName === c.name }"
              @click="selectAgent(c.name)"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" class="flex-shrink-0"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span class="text-truncate flex-grow-1">{{ c.character || c.description || c.name }}</span>
            </div>
          </div>
        </div>

        <!-- History Tab -->
        <div v-else class="p-3 flex-grow-1 overflow-hidden d-flex flex-column">
          <button class="btn-create-char w-100 mb-2" @click="newChat">
            + 新对话
          </button>
          <div class="d-flex flex-column gap-1 overflow-y-auto flex-grow-1" v-if="conversations.length > 0">
            <div
              v-for="item in conversations"
              :key="item.id"
              class="sidebar-item d-flex align-items-center gap-2 px-2 py-1"
              :class="{ active: currentConvId === item.id }"
              @click="loadConversation(item.id)"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" class="flex-shrink-0"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span class="text-truncate flex-grow-1">{{ item.title }}</span>
              <button class="btn-delete-icon flex-shrink-0" title="删除" @click.stop="deleteConversation(item.id)">
                <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          </div>
          <div v-else class="text-secondary" style="font-size:0.8rem;">暂无历史记录</div>
        </div>
      </aside>

      <!-- ====== Chat Area ====== -->
      <main class="chat-main d-flex flex-column flex-grow-1 overflow-hidden">
        <!-- Messages -->
        <div class="messages-container flex-grow-1 overflow-y-auto p-4" ref="messagesContainer">
          <!-- Welcome -->
          <div v-if="messages.length === 0" class="welcome d-flex flex-column align-items-center justify-content-center h-100 text-center px-4">
            <div class="avatar avatar-lg mb-4" style="width:72px;height:72px;background:linear-gradient(135deg,var(--accent),#b388ff);font-size:2rem;">
              ✦
            </div>
            <h4 class="fw-bold mb-2" style="color:var(--text-primary);">你好，我是 EGO Agent</h4>
            <p class="text-secondary mb-4" style="max-width: 440px;">
              你的 AI 智能助手，可以帮助你完成代码编写、问题解答、创意生成等任务。有什么我可以帮你的吗？
            </p>

            <div class="suggestion-list d-flex flex-wrap gap-2 justify-content-center" style="max-width: 500px;">
              <button
                v-for="s in suggestions"
                :key="s"
                class="glass-card-hover px-3 py-2"
                style="background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:20px;font-size:0.85rem;color:var(--text-secondary);cursor:pointer;transition:all 0.25s ease;"
                @click="sendMessage(s)"
              >
                {{ s }}
              </button>
            </div>
          </div>

          <!-- Message List -->
          <div v-for="(msg, index) in messages" :key="index" class="message-row mb-4" :class="msg.role === 'user' ? 'd-flex justify-content-end' : 'd-flex'">
            <div v-if="msg.role === 'assistant'" class="avatar avatar-sm me-3 mt-1" style="background:linear-gradient(135deg,var(--accent),#b388ff);">
              E
            </div>

            <div :class="msg.role === 'user' ? 'message-bubble user-bubble' : 'message-bubble assistant-bubble'">
              <div class="message-text" v-html="renderMessage(msg.content)"></div>
              <div v-if="msg.timestamp" class="message-time">
                {{ msg.timestamp }}
              </div>
            </div>

            <div v-if="msg.role === 'user'" class="avatar avatar-sm ms-3 mt-1" style="background:var(--tag-bg);color:var(--accent-light);">
              U
            </div>
          </div>

          <!-- Typing Indicator -->
          <div v-if="isTyping" class="d-flex mb-4">
            <div class="avatar avatar-sm me-3" style="background:linear-gradient(135deg,var(--accent),#b388ff);">E</div>
            <div class="typing-indicator glass-card px-3 py-3 d-flex align-items-center gap-2">
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
            </div>
          </div>
        </div>

        <!-- Input Area -->
        <div class="input-area px-4 py-3">
          <div class="input-wrapper glass-card d-flex align-items-center px-3 py-2">
            <textarea
              ref="inputRef"
              v-model="inputText"
              class="input-field flex-grow-1"
              placeholder="输入消息..."
              rows="1"
              @keydown.enter.exact.prevent="handleSend"
              @input="autoResize"
            ></textarea>
            <div class="d-flex align-items-center gap-1 ms-2">
              <button v-if="!isTyping" class="btn-icon" title="上传文件">
                <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
              </button>
              <button v-if="!isTyping" class="btn-send d-flex align-items-center justify-content-center" :disabled="!inputText.trim()" @click="handleSend">
                <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
              </button>
              <button v-if="isTyping" class="btn-stop d-flex align-items-center justify-content-center" title="终止" @click="stopGeneration">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
              </button>
            </div>
          </div>
          <div class="text-center mt-2">
            <small class="text-secondary" style="font-size:0.65rem;opacity:0.6;">
              AI 回复仅供参考，请验证重要信息
            </small>
          </div>
        </div>
      </main>
    </div>

    <!-- ====== Settings Modal ====== -->
    <div v-if="showSettings" class="modal-overlay" @click.self="showSettings = false">
      <div class="modal-card glass-card modal-card-lg">
        <div class="modal-header d-flex align-items-center justify-content-between px-4 py-3">
          <h5 class="mb-0 fw-semibold">⚙️ 设置</h5>
          <button class="btn-icon" @click="showSettings = false">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div class="modal-body d-flex flex-column p-0">
          <!-- ====== 内容区域 ====== -->
          <div class="d-flex flex-grow-1" style="min-height: 0;">
            <!-- ====== 设置左侧导航 ====== -->
            <div class="settings-nav d-flex flex-column p-3 border-end" style="width: 160px; min-width: 160px; border-color: var(--glass-border) !important;">
              <button
              class="settings-nav-item"
              :class="{ active: settingsTab === 'characters' }"
              @click="settingsTab = 'characters'"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              角色管理
            </button>
            <button
              class="settings-nav-item"
              :class="{ active: settingsTab === 'models' }"
              @click="switchToModelsTab"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              模型管理
            </button>
          </div>

          <!-- ====== 角色管理面板 ====== -->
          <div v-if="settingsTab === 'characters'" class="d-flex flex-grow-1" style="min-width: 0;">
            <div class="settings-sidebar d-flex flex-column p-3" style="width: 180px; min-width: 180px;">
              <div class="d-flex align-items-center justify-content-between mb-2">
                <small class="text-secondary fw-semibold" style="letter-spacing:0.5px;">角色列表</small>
                <button class="btn-sm-add" @click="addCharacter">+</button>
              </div>
              <div class="d-flex flex-column gap-1 flex-grow-1 overflow-y-auto">
                <div
                  v-for="c in characters"
                  :key="c.name"
                  class="settings-item px-2 py-1"
                  :class="{ active: editingChar?.name === c.name }"
                  @click="selectCharacter(c)"
                >
                  <span class="text-truncate">{{ c.name }}</span>
                  <button
                    v-if="c.name !== '聊天助手' && c.name !== '代码专家'"
                    class="btn-delete-icon"
                    title="删除"
                    @click.stop="deleteCharacter(c.name)"
                  >
                    <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              </div>
            </div>

            <div class="d-flex flex-column flex-grow-1 border-start" style="border-color: var(--glass-border) !important; min-width: 0;">
              <div v-if="editingChar" class="settings-editor d-flex flex-column p-3 flex-grow-1 overflow-y-auto">
                <div class="mb-2">
                  <label class="form-label-small">名称</label>
                  <input v-model="editingChar.name" class="form-input-glass w-100" placeholder="角色名称" />
                </div>
                <div class="mb-2">
                  <label class="form-label-small">描述</label>
                  <input v-model="editingChar.description" class="form-input-glass w-100" placeholder="角色描述" />
                </div>
                <div class="mb-2 flex-grow-1 d-flex flex-column">
                  <label class="form-label-small">prompt（系统提示词）</label>
                  <textarea
                    v-model="editingChar.prompt"
                    class="form-input-glass w-100 flex-grow-1"
                    style="min-height: 80px; resize: vertical;"
                    placeholder="角色的系统提示词..."
                  ></textarea>
                </div>
                <div class="mb-2">
                  <label class="form-label-small">允许使用的工具</label>
                  <div v-if="toolList.length > 0" class="d-flex flex-column gap-1 mt-1">
                    <label
                      v-for="t in toolList"
                      :key="t.name"
                      class="tool-checkbox d-flex align-items-center gap-2 px-2 py-1"
                      :class="{ checked: editingChar.tools.includes(t.name) }"
                    >
                      <input
                        type="checkbox"
                        :checked="editingChar.tools.includes(t.name)"
                        @change="toggleTool(t.name)"
                        class="d-none"
                      />
                      <span class="fw-semibold" style="min-width: 160px;">{{ t.name }}</span>
                      <span class="text-secondary" style="font-size:0.78rem;">{{ t.description }}</span>
                    </label>
                  </div>
                  <small v-else class="text-secondary">加载中...</small>
                </div>
              </div>
              <div v-else class="settings-editor d-flex align-items-center justify-content-center flex-grow-1">
                <small class="text-secondary">选择或创建一个角色</small>
              </div>
            </div>
          </div>

          <!-- ====== 模型管理面板 ====== -->
          <div v-if="settingsTab === 'models'" class="d-flex flex-grow-1" style="min-width: 0;">
            <!-- 模型左侧：Provider 列表 -->
            <div class="settings-sidebar d-flex flex-column p-3" style="width: 160px; min-width: 160px;">
              <div class="d-flex align-items-center justify-content-between mb-2">
                <small class="text-secondary fw-semibold" style="letter-spacing:0.5px;">模型提供商</small>
              </div>
              <div class="d-flex flex-column gap-1 flex-grow-1 overflow-y-auto">
                <div
                  v-for="(pConfig, pName) in providerConfigs"
                  :key="pName"
                  class="settings-item px-2 py-1"
                  :class="{ active: selectedProvider === pName }"
                  @click="selectProvider(pName)"
                >
                  <span class="text-truncate">{{ pName }}</span>
                  <span
                    class="provider-status-dot"
                    :class="{ online: pConfig.enabled !== false }"
                  ></span>
                </div>
              </div>
            </div>

            <!-- 模型右侧：Provider 设置 -->
            <div v-if="editingProvider" class="d-flex flex-column flex-grow-1 border-start overflow-y-auto" style="border-color: var(--glass-border) !important; min-width: 0;">
              <!-- 顶部：启用开关 -->
              <div class="d-flex align-items-center justify-content-between px-4 py-3 border-bottom" style="border-color: var(--glass-border) !important;">
                <h6 class="mb-0 fw-semibold" style="color: var(--text-primary);">{{ selectedProvider }}</h6>
                <label class="switch-toggle">
                  <input type="checkbox" v-model="editingProvider.enabled" />
                  <span class="switch-slider"></span>
                  <span class="switch-label ms-2">{{ editingProvider.enabled !== false ? '已启用' : '已禁用' }}</span>
                </label>
              </div>

              <div class="p-4 d-flex flex-column gap-3 flex-grow-1">
                <!-- API 密钥（可选） — Ollama 不需要 -->
                <div v-if="selectedProvider !== 'ollama'">
                  <label class="form-label-small">API 密钥 <span class="text-secondary" style="font-weight:400;">（可选填）</span></label>
                  <div class="d-flex align-items-center gap-2">
                    <input
                      v-model="editingProvider.apiKey"
                      class="form-input-glass w-100"
                      :type="editingProvider.showKey ? 'text' : 'password'"
                      placeholder="输入 API 密钥..."
                    />
                    <button class="btn-icon" @click="editingProvider.showKey = !editingProvider.showKey" title="显示/隐藏">
                      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path v-if="!editingProvider.showKey" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle v-if="!editingProvider.showKey" cx="12" cy="12" r="3"/>
                        <path v-else d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- API 地址 -->
                <div>
                  <label class="form-label-small">API 地址</label>
                  <input v-model="editingProvider.baseUrl" class="form-input-glass w-100" placeholder="https://api.example.com/v1" />
                </div>

                <!-- 模型列表 -->
                <div class="flex-grow-1 d-flex flex-column">
                  <label class="form-label-small">模型列表</label>
                  <div class="d-flex align-items-center gap-2 mb-2">
                    <button class="btn-fetch-models" @click="fetchProviderModelsList" :disabled="isFetchingModels">
                      <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" class="me-1"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      {{ isFetchingModels ? '获取中...' : '获取模型列表' }}
                    </button>
                    <button class="btn-add-model" @click="showAddModelModal = true">
                      <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
                      添加模型
                    </button>
                  </div>
                  <div class="models-list flex-grow-1 overflow-y-auto">
                    <div
                      v-for="(model, idx) in editingProvider.models"
                      :key="idx"
                      class="model-item d-flex align-items-center gap-2 px-2 py-1"
                    >
                      <span class="model-id text-truncate flex-grow-1">{{ model.id }}</span>
                      <span class="text-secondary" style="font-size:0.75rem;">{{ model.name }}</span>
                      <button class="btn-delete-icon" @click="removeModel(idx)" title="删除">
                        <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- 底部操作按钮（移除，放到 outer 层） -->
              </div>
            </div>
            <div v-else class="d-flex align-items-center justify-content-center flex-grow-1">
              <small class="text-secondary">选择一个模型提供商</small>
            </div>
          </div>
        </div>
      </div>

        <!-- ====== 底部全局操作按钮 ====== -->
        <div class="modal-footer d-flex align-items-center justify-content-end px-4 py-3 border-top" style="border-color: var(--glass-border) !important;">
          <button v-if="settingsTab === 'characters'" class="btn-save" @click="saveCharacter">保存</button>
          <button v-if="settingsTab === 'models'" class="btn-save" @click="saveProviderConfig">保存</button>
          <button class="btn-cancel ms-2" @click="showSettings = false">取消</button>
        </div>
      </div>
    </div>

    <!-- ====== 添加模型弹窗 ====== -->
    <div v-if="showAddModelModal" class="modal-overlay" @click.self="showAddModelModal = false">
      <div class="modal-card glass-card" style="width: 440px;">
        <div class="modal-header d-flex align-items-center justify-content-between px-4 py-3">
          <h6 class="mb-0 fw-semibold">添加模型</h6>
          <button class="btn-icon" @click="showAddModelModal = false">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="p-4 d-flex flex-column gap-3">
          <div>
            <label class="form-label-small">模型 ID</label>
            <input v-model="addModelInput.id" class="form-input-glass w-100" placeholder="例如: gpt-4o" />
          </div>
          <div>
            <label class="form-label-small">模型名称</label>
            <input v-model="addModelInput.name" class="form-input-glass w-100" placeholder="例如: GPT-4o（留空则与 ID 相同）" />
          </div>
          <div class="d-flex gap-2 justify-content-end">
            <button class="btn-cancel" @click="showAddModelModal = false">取消</button>
            <button class="btn-save" @click="confirmAddModel">确认添加</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ====== Toast 通知 ====== -->
    <div class="toast-container">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="toast-notification"
        :class="'toast-' + t.type"
      >
        {{ t.message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { marked } from 'marked'
import hljs from 'highlight.js/lib/core'

// Register only commonly used languages to reduce bundle size
import javascript from 'highlight.js/lib/languages/javascript'
import python from 'highlight.js/lib/languages/python'
import css from 'highlight.js/lib/languages/css'
import html from 'highlight.js/lib/languages/xml'
import bash from 'highlight.js/lib/languages/bash'
import json from 'highlight.js/lib/languages/json'
import typescript from 'highlight.js/lib/languages/typescript'
import markdown from 'highlight.js/lib/languages/markdown'
import sql from 'highlight.js/lib/languages/sql'
import java from 'highlight.js/lib/languages/java'
import cpp from 'highlight.js/lib/languages/cpp'
import rust from 'highlight.js/lib/languages/rust'

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('js', javascript)
hljs.registerLanguage('python', python)
hljs.registerLanguage('py', python)
hljs.registerLanguage('css', css)
hljs.registerLanguage('html', html)
hljs.registerLanguage('xml', html)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('sh', bash)
hljs.registerLanguage('shell', bash)
hljs.registerLanguage('json', json)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('ts', typescript)
hljs.registerLanguage('markdown', markdown)
hljs.registerLanguage('md', markdown)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('java', java)
hljs.registerLanguage('cpp', cpp)
hljs.registerLanguage('c', cpp)
hljs.registerLanguage('rust', rust)
hljs.registerLanguage('rs', rust)

// Use marked-highlight plugin for proper syntax highlighting integration
marked.use({
  gfm: true,
  breaks: true,
  renderer: {
    code({ text, lang, escaped }) {
      const langName = (lang || '').match(/^\S*/)?.[0] || ''
      let highlighted

      try {
        if (langName && hljs.getLanguage(langName)) {
          highlighted = hljs.highlight(text, { language: langName }).value
        } else {
          const result = hljs.highlightAuto(text)
          highlighted = result && result.value ? result.value : escapeHtml(text)
        }
      } catch {
        highlighted = escapeHtml(text)
      }

      const langClass = langName
        ? ` class="hljs language-${escapeAttr(langName)}"`
        : ' class="hljs"'
      return `<pre><code${langClass}>${highlighted}\n</code></pre>`
    }
  }
})

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeAttr(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const API_BASE = 'http://localhost:3000/api'

// ====== State ======
const messages = ref([])
const inputText = ref('')
const isTyping = ref(false)
const abortController = ref(null)
const messagesContainer = ref(null)
const inputRef = ref(null)
const conversations = ref([])
const currentConvId = ref(null)
const modelList = ref([])
const selectedModel = ref(null)
const agentList = ref([])
const agentName = ref('聊天助手')
const toolMessages = ref([])
const showSettings = ref(false)
const characters = ref([])
const toolList = ref([])
const editingChar = ref(null)
/** 记录编辑中的原始名称，用于 PUT 请求的路由参数 */
const editingCharOriginalName = ref('')
const sidebarTab = ref('characters')
const settingsTab = ref('characters')

// ====== 模型管理 State ======
const providerConfigs = ref({})
const selectedProvider = ref('')
const editingProvider = ref(null)
const isFetchingModels = ref(false)
const showAddModelModal = ref(false)
const addModelInput = ref({ id: '', name: '' })
const toasts = ref([])
const backendOnline = ref(true)

let toastId = 0
function showToast(message, type = 'error') {
  const id = ++toastId
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    const idx = toasts.value.findIndex((t) => t.id === id)
    if (idx >= 0) toasts.value.splice(idx, 1)
  }, 5000)
}

const quickActions = [
  { label: '代码审查', icon: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M16 18l6-6-6-6"/><path d="M8 6l-6 6 6 6"/></svg>', prompt: '请帮我审查以下代码，检查 Bug、性能问题和代码风格：' },
  { label: '方案设计', icon: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>', prompt: '请帮我设计一个技术方案：' },
  { label: '解释代码', icon: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>', prompt: '请帮我解释以下代码的工作原理：' },
  { label: '头脑风暴', icon: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>', prompt: '我们来一次头脑风暴，主题是：' },
]

const suggestions = [
  '用 Python 写一个快速排序',
  '解释一下 Vue 3 响应式原理',
  '如何优化网站加载速度？',
  '写一首关于 AI 的诗',
]

// ====== Fetch config from backend ======
async function fetchConfig() {
  try {
    const res = await fetch(`${API_BASE}/config`)
    const data = await res.json()
    if (data.models && data.models.length > 0) {
      modelList.value = data.models
      // 保持当前选中模型，如果已不存在则切到第一个可用模型
      const currentId = selectedModel.value?.id
      const currentProvider = selectedModel.value?.provider
      const stillExists = data.models.some(m => m.id === currentId && m.provider === currentProvider)
      selectedModel.value = stillExists ? selectedModel.value : data.models[0]
    }
    if (data.agents && data.agents.length > 0) {
      agentList.value = data.agents
    }
    return data
  } catch (e) {
    console.warn('Failed to fetch config from backend, using defaults:', e)
    const defaults = [
      { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai' },
      { id: 'qwen2.5', name: 'Qwen 2.5 (Local)', provider: 'ollama' },
    ]
    modelList.value = defaults
    selectedModel.value = defaults[0]
  }
}

// ====== Conversation CRUD ======

/** 获取对话列表（摘要） */
async function fetchConversations() {
  try {
    const res = await fetch(`${API_BASE}/conversations`)
    if (res.ok) conversations.value = await res.json()
  } catch (e) {
    console.warn('Failed to fetch conversations:', e)
  }
}

/** 加载指定对话的全部消息 */
async function loadConversation(id) {
  try {
    const res = await fetch(`${API_BASE}/conversations/${id}`)
    if (!res.ok) return
    const data = await res.json()
    currentConvId.value = data.id
    messages.value = typeof data.messages === 'string'
      ? JSON.parse(data.messages)
      : (data.messages || [])
    toolMessages.value = []
    await scrollToBottom()
  } catch (e) {
    console.warn('Failed to load conversation:', e)
  }
}

/** 创建新对话（后台），返回 id */
async function createConversation(title, msgs, model) {
  try {
    const res = await fetch(`${API_BASE}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, messages: msgs, model }),
    })
    if (!res.ok) return null
    const data = await res.json()
    currentConvId.value = data.id
    await fetchConversations()
    return data.id
  } catch (e) {
    console.warn('Failed to create conversation:', e)
    return null
  }
}

/** 更新对话（全量替换 messages） */
async function updateConversation(id, title, msgs, model) {
  try {
    await fetch(`${API_BASE}/conversations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, messages: msgs, model }),
    })
    await fetchConversations()
  } catch (e) {
    console.warn('Failed to update conversation:', e)
  }
}

/** 删除对话 */
async function deleteConversation(id) {
  try {
    await fetch(`${API_BASE}/conversations/${id}`, { method: 'DELETE' })
    if (currentConvId.value === id) {
      currentConvId.value = null
      messages.value = []
      toolMessages.value = []
      selectedModel.value = modelList.value[0] || selectedModel.value
    }
    await fetchConversations()
  } catch (e) {
    console.warn('Failed to delete conversation:', e)
  }
}

// ====== Methods ======
function formatTime() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function renderMessage(content) {
  return marked.parse(content, { gfm: true, breaks: true })
}

async function scrollToBottom() {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

function autoResize(e) {
  const el = e.target
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 150) + 'px'
}

function handleSend() {
  const text = inputText.value.trim()
  if (!text || isTyping.value) return
  sendMessage(text)
}

async function sendMessage(text) {
  if (!text) return

  // Reset input
  inputText.value = ''
  if (inputRef.value) {
    inputRef.value.style.height = 'auto'
  }

  // Add user message
  const userMessage = {
    role: 'user',
    content: text,
    timestamp: formatTime(),
  }
  messages.value.push(userMessage)
  scrollToBottom()

  // Auto-create conversation on first message
  if (!currentConvId.value) {
    const model = selectedModel.value || { provider: 'openai', id: 'gpt-4o' }
    const title = text.length > 30 ? text.slice(0, 30) + '...' : text
    const created = await createConversation(
      title,
      messages.value.map((m) => ({ role: m.role, content: m.content, timestamp: m.timestamp })),
      `${model.provider}/${model.id}`
    )
    if (!created) {
      // If create fails, still allow local chat
      currentConvId.value = -1 // local-only sentinel
    }
  }

  // Call backend API
  isTyping.value = true
  abortController.value = new AbortController()
  scrollToBottom()

  try {
    const model = selectedModel.value || { provider: 'openai', id: 'gpt-4o' }

    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: abortController.value.signal,
      body: JSON.stringify({
        agent: agentName.value,
        model: { provider: model.provider, id: model.id },
        messages: [
          ...messages.value.map((m) => ({ role: m.role, content: m.content })),
        ],
        toolMessages: toolMessages.value.length > 0 ? toolMessages.value : undefined,
        temperature: 0.7,
        conversationId: currentConvId.value > 0 ? currentConvId.value : undefined,
      }),
    })

    if (!res.ok) {
      const errData = await res.json()
      throw new Error(errData.error || `HTTP ${res.status}`)
    }

    const data = await res.json()

    isTyping.value = false

    // 存储工具调用历史，用于后续请求发送给 LLM
    if (data.toolMessages && data.toolMessages.length > 0) {
      toolMessages.value = data.toolMessages
    } else {
      // 本轮没有工具调用，清空历史避免泄漏到下一轮
      toolMessages.value = []
    }

    // 将最后一条 assistant 消息的纯文本内容存入 messages（供 UI 显示，无工具调用时不重复加前缀）
    let displayContent = data.content || ''
    if (!displayContent && toolMessages.value.length > 0) {
      displayContent = '(工具已执行)'
    }

    // 如果有中间步骤（工具调用过程），构建步骤摘要
    if (data.steps && data.steps.length > 0) {
      const stepsSummary = data.steps.map((step) => {
        let resultPreview = ''
        try {
          const parsed = typeof step.result === 'string' ? JSON.parse(step.result) : step.result
          if (parsed.success !== undefined) {
            resultPreview = parsed.success
              ? `✅ 成功${parsed.file_path ? ' | 路径: ' + parsed.file_path : ''}${parsed.size_formatted ? ' | 大小: ' + parsed.size_formatted : ''}`
              : `❌ 失败: ${parsed.error || '-'}`
          } else if (parsed.content) {
            resultPreview = `📄 读取成功 (${parsed.content.length} 字符)`
          } else if (parsed.results) {
            resultPreview = `🔍 找到 ${parsed.results.length} 个结果`
          } else if (parsed.error) {
            resultPreview = `❌ ${parsed.error}`
          } else {
            resultPreview = JSON.stringify(step.result).slice(0, 100)
          }
        } catch {
          resultPreview = String(step.result).slice(0, 100)
        }

        return `> **⚙️ 工具**: ${step.tool}
> 参数: \`${String(step.arguments).slice(0, 150)}\`
> 结果: ${resultPreview}`
      }).join('\n\n')

      displayContent = `## 🛠 操作过程\n\n${stepsSummary}\n\n---\n\n${displayContent}`
    }

    messages.value.push({
      role: 'assistant',
      content: displayContent,
      timestamp: formatTime(),
    })

    // Save to database
    if (currentConvId.value && currentConvId.value > 0) {
      const title = messages.value[0]?.content?.length > 30
        ? messages.value[0].content.slice(0, 30) + '...'
        : messages.value[0]?.content || '新对话'
      const msgsForDb = messages.value.map((m) => ({
        role: m.role, content: m.content, timestamp: m.timestamp,
      }))
      updateConversation(currentConvId.value, title, msgsForDb, `${model.provider}/${model.id}`)
    }
  } catch (e) {
    isTyping.value = false
    // AbortError 是用户主动终止，不显示错误
    if (e.name === 'AbortError') {
      messages.value.push({
        role: 'assistant',
        content: `⏹ 已终止生成`,
        timestamp: formatTime(),
      })
    } else {
      messages.value.push({
        role: 'assistant',
        content: `**请求失败**: ${e.message}\n\n> 请确保后端服务正在运行 (\`npm run server\`)`,
        timestamp: formatTime(),
      })
    }
  }

  isTyping.value = false
  abortController.value = null
  scrollToBottom()
}

function stopGeneration() {
  if (abortController.value) {
    abortController.value.abort()
  }
}

function sendQuickAction(prompt) {
  sendMessage(prompt)
}

async function newChat() {
  messages.value = []
  toolMessages.value = []
  currentConvId.value = null
  selectedModel.value = modelList.value[0] || selectedModel.value
  inputText.value = ''
  if (inputRef.value) {
    inputRef.value.style.height = 'auto'
  }
}

/** 打开设置弹窗时刷新数据 */
async function openSettings() {
  showSettings.value = true
  settingsTab.value = 'characters'
  await Promise.all([fetchCharacters(), fetchTools()])
}

// ====== Character Management ======
async function fetchCharacters() {
  try {
    const res = await fetch(`${API_BASE}/characters`)
    if (res.ok) {
      characters.value = await res.json()
      editingChar.value = null
    }
  } catch (e) {
    console.warn('Failed to fetch characters:', e)
  }
}

async function fetchTools() {
  try {
    const res = await fetch(`${API_BASE}/tools`)
    if (res.ok) toolList.value = await res.json()
  } catch (e) {
    console.warn('Failed to fetch tools:', e)
  }
}

function selectCharacter(c) {
  editingChar.value = { name: c.name, description: c.description || '', prompt: c.rawPrompt || '', tools: [...(c.tools || [])] }
  editingCharOriginalName.value = c.name
}

function selectAgent(name) {
  agentName.value = name
}

function addCharacter() {
  editingChar.value = { name: '', description: '', prompt: '', tools: [] }
  editingCharOriginalName.value = ''
}

function toggleTool(name) {
  if (!editingChar.value) return
  const idx = editingChar.value.tools.indexOf(name)
  if (idx >= 0) {
    editingChar.value.tools.splice(idx, 1)
  } else {
    editingChar.value.tools.push(name)
  }
}

async function saveCharacter() {
  if (!editingChar.value || !editingChar.value.name.trim()) return
  const isNew = !editingCharOriginalName.value
  const url = isNew ? `${API_BASE}/characters` : `${API_BASE}/characters/${editingCharOriginalName.value}`
  const method = isNew ? 'POST' : 'PUT'

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingChar.value),
    })
    if (!res.ok) {
      const err = await res.json()
      alert(err.error || '保存失败')
      return
    }
    await fetchCharacters()
    await fetchConfig()
    showSettings.value = false
  } catch (e) {
    alert('保存失败: ' + e.message)
  }
}

async function deleteCharacter(name) {
  if (!confirm(`确定删除角色 "${name}" ？`)) return
  try {
    const res = await fetch(`${API_BASE}/characters/${name}`, { method: 'DELETE' })
    if (!res.ok) {
      const err = await res.json()
      alert(err.error || '删除失败')
      return
    }
    if (editingChar.value?.name === name) editingChar.value = null
    await fetchCharacters()
    await fetchConfig()
  } catch (e) {
    alert('删除失败: ' + e.message)
  }
}

// ====== 模型管理 Methods ======
async function fetchProviderConfigs() {
  try {
    const res = await fetch(`${API_BASE}/llm-config`)
    if (res.ok) {
      providerConfigs.value = await res.json()
    }
  } catch (e) {
    console.warn('Failed to fetch LLM config:', e)
  }
}

function selectProvider(name) {
  selectedProvider.value = name
  const config = providerConfigs.value[name]
  if (config) {
    editingProvider.value = JSON.parse(JSON.stringify(config))
    editingProvider.value.showKey = false
  } else {
    editingProvider.value = { enabled: true, baseUrl: '', apiKey: '', defaultModel: '', models: [], showKey: false }
  }
}

async function fetchProviderModelsList() {
  if (!editingProvider.value) return
  const baseUrl = editingProvider.value.baseUrl
  const apiKey = editingProvider.value.apiKey || ''
  const providerName = selectedProvider.value

  if (!baseUrl) {
    showToast('请先填写 API 地址')
    return
  }

  isFetchingModels.value = true
  try {
    const res = await fetch(`${API_BASE}/llm-config/${providerName}/fetch-models`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baseUrl, apiKey }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || '请求失败')
    }
    const data = await res.json()
    if (data.models && data.models.length > 0) {
      editingProvider.value.models = data.models
    } else {
      showToast('未获取到模型列表')
    }
  } catch (e) {
    const msg = e.message
    if (/api.?[Kk]ey|API.?[Kk]ey|apikey|api_key|401|403|unauthorized|Unauthorized/i.test(msg)) {
      showToast('请填写 API 密钥')
    } else {
      showToast('设置有误: ' + msg)
    }
  } finally {
    isFetchingModels.value = false
  }
}

function confirmAddModel() {
  if (!editingProvider.value) return
  const id = addModelInput.value.id.trim()
  if (!id) return
  const name = addModelInput.value.name.trim() || id
  if (editingProvider.value.models.some((m) => m.id === id)) return
  editingProvider.value.models.push({ id, name })
  addModelInput.value = { id: '', name: '' }
  showAddModelModal.value = false
}

function removeModel(idx) {
  if (!editingProvider.value) return
  editingProvider.value.models.splice(idx, 1)
}

async function saveProviderConfig() {
  if (!selectedProvider.value || !editingProvider.value) return
  try {
    const configToSave = { ...editingProvider.value }
    delete configToSave.showKey
    const res = await fetch(`${API_BASE}/llm-config/${selectedProvider.value}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(configToSave),
    })
    if (!res.ok) {
      const err = await res.json()
      alert(err.error || '保存失败')
      return
    }
    await fetchProviderConfigs()
    rebuildModelListFromProviders()
    showSettings.value = false
  } catch (e) {
    alert('保存失败: ' + e.message)
  }
}

async function switchToModelsTab() {
  settingsTab.value = 'models'
  await fetchProviderConfigs()
  const keys = Object.keys(providerConfigs.value)
  if (keys.length > 0) {
    selectProvider(keys[0])
  }
}

/** 从所有已启用的 Provider 构建模型列表 */
function rebuildModelListFromProviders() {
  const models = []
  for (const [name, config] of Object.entries(providerConfigs.value)) {
    if (config.enabled !== false && config.models) {
      for (const m of config.models) {
        models.push({ id: m.id, name: m.name || m.id, provider: name })
      }
    }
  }
  modelList.value = models
  // 保持当前选中模型，如果已不存在则切到第一个可用模型
  const currentId = selectedModel.value?.id
  const currentProvider = selectedModel.value?.provider
  const stillExists = models.some(m => m.id === currentId && m.provider === currentProvider)
  selectedModel.value = stillExists ? selectedModel.value : models[0] || null
}

/** 检测后端是否在线 */
async function checkBackendHealth() {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    const res = await fetch(`${API_BASE}/config`, { signal: controller.signal })
    clearTimeout(timeout)
    backendOnline.value = res.ok
  } catch {
    backendOnline.value = false
  }
}

// Initialize
onMounted(() => {
  fetchConfig()
  fetchConversations()
  fetchCharacters()
  fetchTools()
  if (inputRef.value) {
    inputRef.value.focus()
  }
  // 每 15 秒检测一次后端连通性
  checkBackendHealth()
  setInterval(checkBackendHealth, 15000)
})
</script>

<style scoped>
/* ====== Layout ====== */
.chat-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, var(--bg-gradient-start), var(--bg-dark) 50%, var(--bg-gradient-end));
}

/* ====== Navbar ====== */
.navbar-brand {
  cursor: default;
}
.brand-icon {
  font-size: 1.4rem;
  color: var(--accent-light);
}
.brand-text {
  font-size: 1.1rem;
  letter-spacing: 0.3px;
}
.status-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  background: var(--success);
  border-radius: 50%;
  animation: pulse 2s infinite;
}
.status-dot.offline {
  background: #ff4757;
  box-shadow: 0 0 6px rgba(255, 71, 87, 0.6);
}

/* ====== Sidebar ====== */
.sidebar {
  overflow-y: auto;
  background: rgba(18, 18, 30, 0.6);
  backdrop-filter: blur(20px);
}
.sidebar::-webkit-scrollbar {
  width: 3px;
}
.sidebar-label {
  font-weight: 600;
  letter-spacing: 0.5px;
}
.sidebar-item {
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--text-secondary);
  position: relative;
}
.sidebar-item:hover {
  background: var(--glass-bg) !important;
  color: var(--text-primary) !important;
}
.sidebar-item.active {
  background: rgba(124, 122, 255, 0.15) !important;
  color: var(--accent-light) !important;
}
.btn-delete-icon {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sidebar-item:hover .btn-delete-icon {
  opacity: 0.6;
}
.btn-delete-icon:hover {
  color: #ff6b6b !important;
  opacity: 1 !important;
  background: rgba(255, 107, 107, 0.1);
}

/* ====== Glass Select ====== */
.form-select-glass {
  position: relative;
  display: flex;
  align-items: center;
}
.select-glass {
  appearance: none;
  -webkit-appearance: none;
  width: 100%;
  padding: 8px 32px 8px 12px;
  font-size: 0.85rem;
  color: var(--text-primary);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 10px;
  outline: none;
  cursor: pointer;
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
  font-family: inherit;
}
.select-glass:hover {
  border-color: var(--glass-hover-border);
}
.select-glass:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow);
}
.select-glass option {
  background: #1a1a2e;
  color: var(--text-primary);
}
.select-arrow {
  position: absolute;
  right: 10px;
  pointer-events: none;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
}

/* ====== Chat Main ====== */
.chat-main {
  background: transparent;
  min-width: 0;
}

/* ====== Messages ====== */
.messages-container {
  scroll-behavior: smooth;
}

/* ====== Welcome ====== */
.welcome {
  animation: fadeInUp 0.6s ease;
}
.suggestion-list button:hover {
  color: var(--accent-light) !important;
  border-color: var(--accent) !important;
  box-shadow: 0 0 16px var(--accent-glow);
}

/* ====== Message Bubble ====== */
.message-row {
  animation: slideUp 0.3s ease;
  width: 100%;
}
.message-row + .message-row {
  margin-top: -8px;
}

.message-bubble {
  padding: 12px 18px;
  border-radius: 16px;
  max-width: 75%;
}
.user-bubble {
  background: rgba(124, 122, 255, 0.2);
  border: 1px solid rgba(124, 122, 255, 0.25);
  border-bottom-right-radius: 4px;
  color: var(--text-primary);
}
.assistant-bubble {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-bottom-left-radius: 4px;
  backdrop-filter: blur(8px);
}
.message-text {
  line-height: 1.7;
  font-size: 0.92rem;
}
.message-text :deep(p) {
  margin-bottom: 0.5rem;
}
.message-text :deep(p:last-child) {
  margin-bottom: 0;
}
.message-text :deep(ul),
.message-text :deep(ol) {
  padding-left: 1.2rem;
  margin-bottom: 0.5rem;
}
.message-text :deep(strong) {
  color: var(--accent-light);
}
.message-text :deep(a) {
  color: var(--accent-light);
  text-decoration: underline;
}
.message-text :deep(blockquote) {
  border-left: 3px solid var(--accent);
  padding-left: 12px;
  margin: 8px 0;
  color: var(--text-secondary);
  font-style: italic;
}
.message-text :deep(hr) {
  border: none;
  border-top: 1px solid var(--glass-border);
  margin: 12px 0;
}
.message-text :deep(pre) {
  background: rgba(0, 0, 0, 0.5) !important;
  border-radius: 8px;
  padding: 14px 16px;
  margin: 8px 0;
  overflow-x: auto;
  border: 1px solid var(--glass-border);
  font-size: 0.82rem;
  line-height: 1.5;
  position: relative;
}
.message-text :deep(pre code) {
  background: none !important;
  padding: 0 !important;
  border-radius: 0 !important;
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', monospace;
  font-size: inherit;
}
.message-text :deep(code) {
  background: rgba(124, 122, 255, 0.15);
  color: var(--accent-light);
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 0.85em;
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', monospace;
}
.message-text :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 8px 0;
  font-size: 0.85rem;
}
.message-text :deep(th),
.message-text :deep(td) {
  border: 1px solid var(--glass-border);
  padding: 6px 10px;
  text-align: left;
}
.message-text :deep(th) {
  background: rgba(124, 122, 255, 0.1);
  color: var(--accent-light);
  font-weight: 600;
}
.message-text :deep(h1),
.message-text :deep(h2),
.message-text :deep(h3),
.message-text :deep(h4) {
  color: var(--text-primary);
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}
.message-text :deep(h1) { font-size: 1.3rem; }
.message-text :deep(h2) { font-size: 1.15rem; }
.message-text :deep(h3) { font-size: 1.05rem; }
.message-text :deep(h4) { font-size: 1rem; }
.message-text :deep(img) {
  max-width: 100%;
  border-radius: 8px;
  margin: 8px 0;
}
.message-text :deep(details) {
  margin: 8px 0;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid var(--glass-border);
}
.message-text :deep(summary) {
  cursor: pointer;
  color: var(--accent-light);
  font-weight: 600;
  font-size: 0.85rem;
}
.message-time {
  font-size: 0.65rem;
  color: var(--text-secondary);
  margin-top: 6px;
  text-align: right;
  opacity: 0.6;
}

/* ====== Typing ====== */
.typing-indicator {
  border-radius: 16px;
  border-bottom-left-radius: 4px;
}
.typing-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent-light);
  animation: pulse 1.4s infinite;
}
.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}
.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

/* ====== Input Area ====== */
.input-wrapper {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(12px);
  outline: 1px solid var(--glass-border);
  outline-offset: -1px;
  transition: outline-color 0.25s ease;
}
.input-wrapper:focus-within {
  outline-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow);
}

.input-field {
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: 0.92rem;
  line-height: 1.5;
  resize: none;
  max-height: 150px;
  font-family: inherit;
}
.input-field::placeholder {
  color: rgba(255, 255, 255, 0.25);
}

.btn-send {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: var(--accent);
  color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}
.btn-send:hover:not(:disabled) {
  background: var(--accent-light);
  box-shadow: 0 0 16px var(--accent-glow);
}
.btn-send:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* ====== Stop Button ====== */
.btn-stop {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: #ff4757;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  animation: pulse 1.4s infinite;
}
.btn-stop:hover {
  background: #ff6b81;
  box-shadow: 0 0 16px rgba(255, 71, 87, 0.6);
}

/* ====== Form switch (Checkbox) ====== */
:deep(.form-switch .form-check-input) {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: var(--glass-border);
  cursor: pointer;
  width: 2.5em;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='3' fill='%23e0e0ff'/%3e%3c/svg%3e");
}
:deep(.form-switch .form-check-input:checked) {
  background-color: var(--accent);
  border-color: var(--accent);
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='3' fill='%23ffffff'/%3e%3c/svg%3e");
  box-shadow: 0 0 8px var(--accent-glow);
}

/* ====== Responsive ====== */
@media (max-width: 767.98px) {
  .message-row {
    max-width: 95%;
  }
}
/* ====== Settings Modal ====== */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease;
}
.modal-card {
  width: 700px;
  max-width: 95vw;
  max-height: 80vh;
  background: #1a1a2e;
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}
.modal-header {
  border-bottom: 1px solid var(--glass-border);
}
.modal-body {
  flex-grow: 1;
  overflow: hidden;
}
.settings-sidebar {
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.15);
}
.settings-item {
  border-radius: 6px;
  font-size: 0.82rem;
  cursor: pointer;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  transition: all 0.15s ease;
}
.settings-item:hover {
  background: var(--glass-bg);
  color: var(--text-primary);
}
.settings-item.active {
  background: rgba(124, 122, 255, 0.15);
  color: var(--accent-light);
}
.settings-item .btn-delete-icon {
  opacity: 0;
}
.settings-item:hover .btn-delete-icon {
  opacity: 0.5;
}
.settings-item .btn-delete-icon:hover {
  opacity: 1;
  color: #ff5252;
}
.settings-editor {
  overflow-y: auto;
}
.form-label-small {
  font-size: 0.75rem;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
  font-weight: 600;
  display: block;
  margin-bottom: 4px;
}
.form-input-glass {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 0.85rem;
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.2s ease;
  font-family: inherit;
}
.form-input-glass:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-glow);
}
.form-input-glass::placeholder {
  color: rgba(255, 255, 255, 0.2);
}
textarea.form-input-glass {
  line-height: 1.5;
}
.tool-checkbox {
  font-size: 0.8rem;
  border-radius: 6px;
  border: 1px solid var(--glass-border);
  cursor: pointer;
  transition: all 0.15s ease;
  color: var(--text-secondary);
}
.tool-checkbox:hover {
  border-color: var(--accent);
  color: var(--text-primary);
}
.tool-checkbox.checked {
  background: rgba(124, 122, 255, 0.15);
  border-color: var(--accent);
  color: var(--accent-light);
}
.btn-sm-add {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: none;
  background: var(--tag-bg);
  color: var(--accent-light);
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}
.btn-sm-add:hover {
  background: var(--accent);
  color: #fff;
}
.btn-save {
  padding: 8px 24px;
  border-radius: 8px;
  border: none;
  background: var(--accent);
  color: #fff;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.15s ease;
}
.btn-save:hover {
  background: var(--accent-light);
  box-shadow: 0 0 12px var(--accent-glow);
}
.btn-cancel {
  padding: 8px 24px;
  border-radius: 8px;
  border: 1px solid var(--glass-border);
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.15s ease;
}
.btn-cancel:hover {
  border-color: var(--text-secondary);
  color: var(--text-primary);
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* ====== Sidebar Tabs ====== */
.sidebar-tab {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 0.82rem;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}
.sidebar-tab:hover {
  color: var(--text-primary);
  background: var(--glass-bg);
}
.sidebar-tab.active {
  color: var(--accent-light);
  background: rgba(124, 122, 255, 0.1);
  border-bottom: 2px solid var(--accent);
}

/* ====== Create Character Button ====== */
.btn-create-char {
  padding: 7px 12px;
  border-radius: 8px;
  border: 1px dashed var(--glass-border);
  background: transparent;
  color: var(--accent-light);
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}
.btn-create-char:hover {
  border-color: var(--accent);
  background: rgba(124, 122, 255, 0.08);
}

/* ====== Mini Model Select in Nav ====== */
.model-select-mini .select-glass-mini {
  appearance: none;
  -webkit-appearance: none;
  padding: 5px 28px 5px 10px;
  font-size: 0.78rem;
  color: var(--text-primary);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s;
  font-family: inherit;
}
.model-select-mini .select-glass-mini:hover {
  border-color: var(--accent);
}
.model-select-mini .select-glass-mini option {
  background: #1a1a2e;
  color: var(--text-primary);
}
.select-chevron {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: var(--text-secondary);
  opacity: 0.6;
}

/* ====== Settings Modal Large ====== */
.modal-card-lg {
  width: 960px;
  max-width: 95vw;
  height: 80vh;
  max-height: 90vh;
}

/* ====== Settings Navigation ====== */
.settings-nav {
  background: rgba(0, 0, 0, 0.15);
  overflow-y: auto;
  gap: 4px;
}
.settings-nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
  text-align: left;
  width: 100%;
}
.settings-nav-item:hover {
  background: var(--glass-bg);
  color: var(--text-primary);
}
.settings-nav-item.active {
  background: rgba(124, 122, 255, 0.15);
  color: var(--accent-light);
}

/* ====== Provider Status Dot ====== */
.provider-status-dot {
  width: 8px;
  height: 8px;
  min-width: 8px;
  border-radius: 50%;
  background: #555;
  transition: background 0.3s ease;
}
.provider-status-dot.online {
  background: #4caf50;
  box-shadow: 0 0 6px rgba(76, 175, 80, 0.5);
}

/* ====== Toggle Switch ====== */
.switch-toggle {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}
.switch-toggle input {
  display: none;
}
.switch-slider {
  position: relative;
  width: 44px;
  height: 24px;
  background: #444;
  border-radius: 12px;
  transition: background 0.3s ease;
}
.switch-slider::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.3s ease;
}
.switch-toggle input:checked + .switch-slider {
  background: var(--accent);
}
.switch-toggle input:checked + .switch-slider::before {
  transform: translateX(20px);
}
.switch-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

/* ====== Model Items ====== */
.model-item {
  border-radius: 6px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  margin-bottom: 4px;
  transition: all 0.15s ease;
}
.model-item:hover {
  border-color: var(--accent);
}
.model-item .btn-delete-icon {
  opacity: 0;
}
.model-item:hover .btn-delete-icon {
  opacity: 0.6;
}
.models-list {
  min-height: 100px;
  max-height: 300px;
}

/* ====== Fetch Models Button ====== */
.btn-fetch-models {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px solid var(--glass-border);
  background: transparent;
  color: var(--accent-light);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}
.btn-fetch-models:hover:not(:disabled) {
  border-color: var(--accent);
  background: rgba(124, 122, 255, 0.08);
}
.btn-fetch-models:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ====== Add Model Button ====== */
.btn-add-model {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px dashed var(--glass-border);
  background: transparent;
  color: var(--accent-light);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}
.btn-add-model:hover {
  border-color: var(--accent);
  background: rgba(124, 122, 255, 0.08);
}

/* ====== Modal Footer ====== */
.modal-footer {
  background: rgba(0, 0, 0, 0.2);
}

/* ====== Toast Notifications ====== */
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 10001;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}
.toast-notification {
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 0.85rem;
  color: #fff;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  pointer-events: auto;
  animation: toastSlideIn 0.3s ease;
  max-width: 360px;
  word-break: break-word;
}
.toast-error {
  background: #d32f2f;
  border: 1px solid #ef5350;
}
.toast-success {
  background: #2e7d32;
  border: 1px solid #4caf50;
}
@keyframes toastSlideIn {
  from {
    opacity: 0;
    transform: translateX(60px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
