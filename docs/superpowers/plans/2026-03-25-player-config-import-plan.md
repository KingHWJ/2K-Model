# 球员配置与导入 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为数值直抽和模板创建补齐字段配置、候选球员池编辑与 2KRatings 文本导入能力。

**Architecture:** 继续沿用单页 React 状态管理，不引入后端。把数值字段配置、候选球员池和导入逻辑拆成独立的纯函数与局部 UI 区块，尽量避免继续放大 `App.tsx` 的耦合。

**Tech Stack:** React 19、TypeScript、Vite、Vitest、Testing Library

---

### Task 1: 为字段配置和导入写失败测试

**Files:**
- Modify: `src/App.test.tsx`
- Modify: `src/lib/storage.test.ts`
- Create: `src/lib/import2kRatings.test.ts`

- [ ] **Step 1: 写失败测试，覆盖数值直抽字段配置**
- [ ] **Step 2: 写失败测试，覆盖候选球员池调整**
- [ ] **Step 3: 写失败测试，覆盖 2KRatings 文本解析**
- [ ] **Step 4: 跑测试确认红灯**

### Task 2: 实现数值字段配置和持久化

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/lib/storage.ts`

- [ ] **Step 1: 实现数值字段配置区**
- [ ] **Step 2: 实现恢复默认和清空结果**
- [ ] **Step 3: 实现本地存储归一化，保留用户配置**
- [ ] **Step 4: 跑相关测试确认通过**

### Task 3: 实现候选球员池和 2KRatings 导入

**Files:**
- Modify: `src/App.tsx`
- Create: `src/lib/import2kRatings.ts`

- [ ] **Step 1: 实现球员搜索和候选池增删**
- [ ] **Step 2: 实现恢复默认候选池**
- [ ] **Step 3: 实现 2KRatings 文本解析与导入**
- [ ] **Step 4: 跑相关测试确认通过**

### Task 4: 调整抽取反馈和补齐文档

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.css`
- Modify: `README.md`
- Modify: `docs/产品说明.md`
- Modify: `docs/数据结构.md`
- Modify: `docs/默认属性字典.md`

- [ ] **Step 1: 实现“先停留结果，再延迟弹窗，再自动下一项”**
- [ ] **Step 2: 增加回到顶部按钮**
- [ ] **Step 3: 同步中文文档**
- [ ] **Step 4: 运行 `npm test`、`npm run lint`、`npm run build`**
