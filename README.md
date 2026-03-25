# 2K26 球员融合模板工具

一个基于 `React + Vite + TypeScript` 构建的单页静态网页工具，用来把多名高能力球员的属性大类随机拼装成一个新的 2K26 风格模板。

## 功能概览

- 单页工作台布局：左侧编辑池子，中间转盘抽选，右侧查看融合结果，底部管理模板库。
- 支持先抽候选球员，再按 `身体尺寸 / 运动能力 / 终结 / 投篮 / 组织 / 防守 / 篮板 / 倾向与杂项` 等大类逐项融合。
- 支持 `单项抽取`、`一键全抽`、`手动切换来源球员`、`继续编辑模板`。
- 内置传奇球星示例数据：乔丹、科比、詹姆斯、杜兰特、库里、奥尼尔、罗德曼、约基奇。
- 预设池、球员池、属性池、模板库全部保存到浏览器本地。

## 本地启动

```bash
npm install
npm run dev
```

默认开发地址通常是 [http://localhost:5173](http://localhost:5173)。

## 常用命令

```bash
npm test
npm run lint
npm run build
```

## 项目结构

```text
src/
  components/        # 转盘等可复用界面组件
  data/              # 默认球员数据、默认属性池
  lib/               # 生成逻辑、本地存储逻辑
  test/              # Vitest 测试初始化
  App.tsx            # 单页工作台主界面
docs/
  产品说明.md
  数据结构.md
  默认属性字典.md
```

## 技术说明

- 前端：React 19、TypeScript、Vite
- 测试：Vitest、Testing Library、jsdom
- 数据存储：浏览器 `localStorage`
- UI 语言：中文

## 文档

- [产品说明](./docs/产品说明.md)
- [数据结构](./docs/数据结构.md)
- [默认属性字典](./docs/默认属性字典.md)

## 说明与边界

- 首版示例数据优先满足“好玩、可演示、可编辑”，不承诺和 NBA 2K26 游戏内数值逐项完全一致。
- `Badge / Takeover / Build Specialization / Cap Breakers` 目前只作为后续扩展方向，没有进入首版抽取主流程。
- 自定义中文风格标签是参考 2K Builder / archetype 思路进行建模，不是官方原词复刻。
