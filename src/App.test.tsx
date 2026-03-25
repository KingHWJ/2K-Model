import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App'

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    cleanup()
  })

  it('默认进入模板推荐首页并展示创建入口', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: '选择一个模板方向' }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: '基于此模板创建' }).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: '标签页' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '我的模板' })).toBeInTheDocument()
  }, 10000)

  it('点击创建模板后会进入单转盘创建页', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getAllByRole('button', { name: '基于此模板创建' })[0])

    expect(screen.getByRole('heading', { name: '创建模板' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '抽取当前字段' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '开始抽取' })).toBeInTheDocument()
    expect(screen.getByText('当前字段')).toBeInTheDocument()
  }, 10000)

  it('抽取身高后会把结果写入表格并进入下一字段', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getAllByRole('button', { name: '基于此模板创建' })[0])
    await user.click(screen.getByRole('button', { name: '抽取当前字段' }))
    await screen.findByRole('heading', { name: '体重' }, { timeout: 5000 })

    const resultTable = document.querySelector('.result-table')

    expect(resultTable).not.toBeNull()
    expect(within(resultTable as HTMLElement).getByText('身高')).toBeInTheDocument()
    expect(within(resultTable as HTMLElement).getByText('198cm')).toBeInTheDocument()
    expect(within(resultTable as HTMLElement).getByText('迈克尔·乔丹')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '体重' })).toBeInTheDocument()
  }, 10000)

  it('可以进入标签页查看模板风格说明', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '标签页' }))

    expect(screen.getByRole('heading', { name: '模板风格标签' })).toBeInTheDocument()
    expect(screen.getByText('双向分卫')).toBeInTheDocument()
  }, 10000)

  it('可以进入数值直抽标签页并看到字段列表', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '数值直抽' }))

    expect(screen.getByRole('heading', { name: '数值直抽' })).toBeInTheDocument()
    expect(screen.getAllByText('身高').length).toBeGreaterThan(0)
    expect(screen.getAllByText('170 - 224 cm').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: '开始抽取' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '抽取当前字段' })).toBeInTheDocument()
  }, 10000)

  it('数值直抽会在字段范围内抽出最终数字并写入结果表', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '数值直抽' }))
    await user.click(screen.getByRole('button', { name: '开始抽取' }))

    expect((await screen.findAllByText('170 cm', {}, { timeout: 5000 })).length).toBeGreaterThan(0)
    expect(screen.getAllByText('贴近 2K Builder 的身高范围').length).toBeGreaterThan(0)
  }, 10000)

  it('保存模板后会在我的模板里显示结果', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getAllByRole('button', { name: '基于此模板创建' })[0])
    await user.click(screen.getByRole('button', { name: '抽取当前字段' }))
    await screen.findByRole('heading', { name: '体重' }, { timeout: 5000 })
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '保存模板' })).toBeEnabled()
    }, { timeout: 3000 })
    await user.clear(screen.getByLabelText('模板名称'))
    await user.type(screen.getByLabelText('模板名称'), '乔丹实验版')
    await user.click(screen.getByRole('button', { name: '保存模板' }))

    expect(screen.getByRole('heading', { name: '我的模板' })).toBeInTheDocument()
    expect(screen.getByText('乔丹实验版')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '继续编辑' })).toBeInTheDocument()
  }, 15000)
})
