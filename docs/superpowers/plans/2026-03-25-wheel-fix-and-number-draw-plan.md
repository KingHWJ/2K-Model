# 转盘修正与数值直抽 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修正模板创建页的饼图转盘停靠逻辑，并新增独立的数值直抽标签页，让用户可以直接通过数字转盘生成字段值。

**Architecture:** 保留现有首页、模板创建、标签页和模板库结构，扩展 `AppState` 为“双会话”模型：一个用于推荐模板字段抽取，一个用于数值直抽。转盘组件升级为通用饼图组件，统一处理指针朝向、目标扇区停靠、命中高亮和旁侧/底部双按钮布局。

**Tech Stack:** React 19、TypeScript、Vite、Vitest、Testing Library、localStorage

---

### Task 1: 为数值直抽状态与默认字段写失败测试

**Files:**
- Modify: `src/types.ts`
- Modify: `src/data/defaults.ts`
- Modify: `src/lib/storage.ts`
- Modify: `src/lib/storage.test.ts`

- [ ] **Step 1: 写失败测试，覆盖数值直抽默认状态和持久化**

```ts
it('会提供数值直抽默认字段和当前会话', () => {
  const state = createDefaultAppState()

  expect(state.numberFields.length).toBeGreaterThan(5)
  expect(state.numberSession.activeFieldId).toBe('body.height')
})

it('会保存并恢复数值直抽结果', () => {
  saveAppState(storage, nextState)
  const restored = loadAppState(storage, createDefaultAppState())

  expect(restored.numberSession.results['body.height']?.value).toBe(198)
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/lib/storage.test.ts`
Expected: FAIL，提示缺少新版数值直抽状态

- [ ] **Step 3: 最小实现新版类型、默认字段和存储归一化**

```ts
interface NumberDrawField {
  id: string
  label: string
  min: number
  max: number
  defaultValue: number
  unit: string
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/lib/storage.test.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/types.ts src/data/defaults.ts src/lib/storage.ts src/lib/storage.test.ts
git commit -m "补充数值直抽状态模型"
```

### Task 2: 用 TDD 增加数值直抽标签页入口与主流程

**Files:**
- Modify: `src/App.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.css`

- [ ] **Step 1: 写失败测试，覆盖导航与数值直抽页面**

```ts
it('可以进入数值直抽标签页并看到字段列表', async () => {
  const user = userEvent.setup()
  render(<App />)

  await user.click(screen.getByRole('button', { name: '数值直抽' }))

  expect(screen.getByRole('heading', { name: '数值直抽' })).toBeInTheDocument()
  expect(screen.getByText('身高')).toBeInTheDocument()
  expect(screen.getAllByRole('button', { name: /开始抽取|抽取当前字段/ }).length).toBeGreaterThan(1)
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/App.test.tsx -t "可以进入数值直抽标签页并看到字段列表"`
Expected: FAIL，当前还没有数值直抽标签页

- [ ] **Step 3: 最小实现导航和数值直抽页面壳**

```tsx
type PageView = 'home' | 'builder' | 'number-draw' | 'tags' | 'library'
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/App.test.tsx -t "可以进入数值直抽标签页并看到字段列表"`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/App.tsx src/App.css src/App.test.tsx
git commit -m "新增数值直抽标签页入口"
```

### Task 3: 用 TDD 修正通用饼图转盘停靠与指针方向

**Files:**
- Modify: `src/lib/wheel.ts`
- Modify: `src/lib/wheel.test.ts`
- Modify: `src/components/WheelDisplay.tsx`
- Modify: `src/App.css`

- [ ] **Step 1: 写失败测试，覆盖顶部向下指针对应的扇区中心停靠**

```ts
it('会把目标扇区中心对齐到顶部向下指针', () => {
  const nextRotation = getTargetWheelRotation(4, 0, 0, 3)

  expect(normalizeRotation(nextRotation)).toBe(315)
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/lib/wheel.test.ts`
Expected: FAIL，当前停靠在扇区起点而不是扇区中心

- [ ] **Step 3: 最小实现按扇区中心停靠并更新指针样式**

```ts
const pointerAngle = -90
const segmentCenter = selectedIndex * step + step / 2
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/lib/wheel.test.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/lib/wheel.ts src/lib/wheel.test.ts src/components/WheelDisplay.tsx src/App.css
git commit -m "修正饼图转盘停靠与指针方向"
```

### Task 4: 用 TDD 打通数值直抽抽取与结果表

**Files:**
- Modify: `src/App.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.css`
- Modify: `src/lib/wheel.ts`

- [ ] **Step 1: 写失败测试，覆盖数字范围切换与抽取结果**

```ts
it('数值直抽会在字段范围内抽出最终数字并写入结果表', async () => {
  const user = userEvent.setup()
  render(<App />)

  await user.click(screen.getByRole('button', { name: '数值直抽' }))
  await user.click(screen.getByRole('button', { name: '开始抽取' }))

  expect(await screen.findByText('198 cm')).toBeInTheDocument()
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/App.test.tsx -t "数值直抽会在字段范围内抽出最终数字并写入结果表"`
Expected: FAIL，当前没有数字结果写入逻辑

- [ ] **Step 3: 最小实现数值字段转盘、结果卡和结果表**

```ts
interface NumberDrawResult {
  fieldId: string
  value: number
  createdAt: string
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/App.test.tsx`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/App.tsx src/App.css src/App.test.tsx src/lib/wheel.ts
git commit -m "实现数值直抽转盘与结果表"
```

### Task 5: 用 TDD 补齐模板创建页按钮与停靠反馈

**Files:**
- Modify: `src/App.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.css`

- [ ] **Step 1: 写失败测试，覆盖模板页双按钮与抽取推进**

```ts
it('模板创建页会在转盘旁和转盘下方都显示抽取按钮', async () => {
  const user = userEvent.setup()
  render(<App />)

  await user.click(screen.getAllByRole('button', { name: '基于此模板创建' })[0])

  expect(screen.getByRole('button', { name: '开始抽取' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '抽取当前字段' })).toBeInTheDocument()
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/App.test.tsx -t "模板创建页会在转盘旁和转盘下方都显示抽取按钮"`
Expected: FAIL，当前按钮布局还不符合设计

- [ ] **Step 3: 最小实现模板页按钮布局与停靠高亮**

```tsx
<div className="builder-wheel-actions-side">
  <button>抽取当前字段</button>
</div>
<div className="builder-wheel-actions-bottom">
  <button>开始抽取</button>
</div>
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/App.test.tsx`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/App.tsx src/App.css src/App.test.tsx
git commit -m "调整模板页转盘按钮布局"
```

### Task 6: 同步中文文档并完成整体验证

**Files:**
- Modify: `README.md`
- Modify: `docs/产品说明.md`
- Modify: `docs/数据结构.md`
- Modify: `docs/默认属性字典.md`

- [ ] **Step 1: 更新中文文档，补充数值直抽和新版转盘规则**

- [ ] **Step 2: 运行整体验证**

Run: `npm test`
Expected: PASS

Run: `npm run lint`
Expected: PASS

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: 提交**

```bash
git add README.md docs/产品说明.md docs/数据结构.md docs/默认属性字典.md
git commit -m "同步转盘修正与数值直抽文档"
```
