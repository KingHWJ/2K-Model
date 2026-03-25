# 统一抽取结果弹窗 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为模板创建页和数值直抽页增加统一的抽取结果弹窗，只有关闭弹窗后才跳到下一字段。

**Architecture:** 在 `App.tsx` 内新增一组通用结果弹窗状态，分别承接模板抽取结果和数值抽取结果。转盘完成后先写入结果，再打开弹窗；字段跳转从“抽取完成时”改到“关闭弹窗时”。

**Tech Stack:** React 19、TypeScript、Vite、Vitest、Testing Library

---

### Task 1: 写失败测试覆盖新的弹窗节奏

**Files:**
- Modify: `src/App.test.tsx`

- [ ] **Step 1: 写模板创建页失败测试**

```ts
it('模板创建会先弹出结果窗，关闭后才进入下一字段', async () => {
  expect(await screen.findByText('来源球员')).toBeInTheDocument()
})
```

- [ ] **Step 2: 写数值直抽失败测试**

```ts
it('数值直抽会先弹出结果窗，关闭后才进入下一字段', async () => {
  expect(await screen.findByText('范围')).toBeInTheDocument()
})
```

- [ ] **Step 3: 运行测试确认失败**

Run: `npx vitest run src/App.test.tsx`
Expected: FAIL，当前仍然是转完直接推进字段

### Task 2: 最小实现统一结果弹窗状态和关闭后推进

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.css`

- [ ] **Step 1: 增加结果弹窗状态**
- [ ] **Step 2: 模板创建改成“抽完弹窗，关闭后推进”**
- [ ] **Step 3: 数值直抽改成“抽完弹窗，关闭后推进”**
- [ ] **Step 4: 加入结果弹窗 UI 与按钮文案**
- [ ] **Step 5: 跑测试确认通过**

Run: `npx vitest run src/App.test.tsx`
Expected: PASS

### Task 3: 同步文档并完成验证

**Files:**
- Modify: `README.md`
- Modify: `docs/产品说明.md`

- [ ] **Step 1: 写明弹窗后的推进节奏**
- [ ] **Step 2: 跑完整验证**

Run:
- `npm test`
- `npm run lint`
- `npm run build`

Expected: 全部通过
