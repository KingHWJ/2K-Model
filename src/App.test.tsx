import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import App from './App'

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    cleanup()
  })

  it('会渲染工作台的核心区域', () => {
    render(<App />)

    expect(screen.getByText('2K26 球员融合模板工作台')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '池子配置区' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '转盘抽选区' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '融合结果区' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '模板库' })).toBeInTheDocument()
    expect(screen.getByDisplayValue('未命名模板')).toBeInTheDocument()
  })

  it('可以完成抽取并保存模板', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '抽取候选球员' }))
    await user.click(screen.getByRole('button', { name: '一键全抽' }))
    await user.clear(screen.getByLabelText('模板名称'))
    await user.type(screen.getByLabelText('模板名称'), '模板A')
    await user.click(screen.getByRole('button', { name: '保存模板' }))

    expect(screen.getAllByText('模板A').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/来源球员/)[0]).toBeInTheDocument()
  })

  it('刷新后会从本地恢复已保存模板', async () => {
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
  })
})
