import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App'

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it(
    '会渲染工作台的核心区域',
    () => {
      render(<App />)

      expect(screen.getByText('2K26 球员融合模板工作台')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: '池子配置区' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: '转盘抽选区' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: '融合结果区' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: '模板库' })).toBeInTheDocument()
      expect(screen.getByDisplayValue('未命名模板')).toBeInTheDocument()
    },
    10000,
  )

  it(
    '可以完成抽取并保存模板',
    async () => {
      const user = userEvent.setup()
      render(<App />)

      await user.click(screen.getByRole('button', { name: '抽取候选球员' }))
      await user.click(screen.getByRole('button', { name: '一键全抽' }))
      await user.clear(screen.getByLabelText('模板名称'))
      await user.type(screen.getByLabelText('模板名称'), '模板A')
      await user.click(screen.getByRole('button', { name: '保存模板' }))

      expect(screen.getAllByText('模板A').length).toBeGreaterThan(0)
      expect(screen.getAllByText(/来源球员/)[0]).toBeInTheDocument()
    },
    20000,
  )

  it(
    '刷新后会从本地恢复已保存模板',
    async () => {
      const user = userEvent.setup()
      const firstRender = render(<App />)

      await user.click(screen.getByRole('button', { name: '抽取候选球员' }))
      await user.click(screen.getByRole('button', { name: '一键全抽' }))
      await user.clear(screen.getByLabelText('模板名称'))
      await user.type(screen.getByLabelText('模板名称'), '模板恢复测试')
      await user.click(screen.getByRole('button', { name: '保存模板' }))

      firstRender.unmount()
      render(<App />)

      expect(screen.getAllByText('模板恢复测试').length).toBeGreaterThan(0)
    },
    20000,
  )

  it(
    '候选转盘会展示抽取过程再落地结果',
    async () => {
      const user = userEvent.setup()

      render(<App />)
      await user.click(screen.getByRole('button', { name: '抽取候选球员' }))

      expect(screen.getByRole('button', { name: '候选抽选中...' })).toBeDisabled()

      expect(
        await screen.findByRole('button', { name: '抽取候选球员' }, { timeout: 4000 }),
      ).toBeEnabled()
      expect(screen.getAllByText(/迈克尔·乔丹|科比·布莱恩特|勒布朗·詹姆斯|凯文·杜兰特/).length).toBeGreaterThan(0)
    },
    20000,
  )

  it(
    '球员搜索支持中英文关键字匹配',
    async () => {
      const user = userEvent.setup()
      render(<App />)

      await user.type(screen.getByLabelText('搜索球员'), 'jordan')
      expect(screen.getByRole('button', { name: '迈克尔·乔丹' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: '科比·布莱恩特' })).not.toBeInTheDocument()

      await user.clear(screen.getByLabelText('搜索球员'))
      await user.type(screen.getByLabelText('搜索球员'), '约基奇')

      expect(screen.getByRole('button', { name: '尼古拉·约基奇' })).toBeInTheDocument()
    },
    10000,
  )

  it(
    '球员搜索支持常用英文别名和缩写',
    async () => {
      const user = userEvent.setup()
      render(<App />)

      await user.type(screen.getByLabelText('搜索球员'), 'SGA')

      expect(screen.getByRole('button', { name: '谢伊·吉尔杰斯-亚历山大' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: '卢卡·东契奇' })).not.toBeInTheDocument()
    },
    10000,
  )
})
