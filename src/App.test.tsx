import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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

  it('模板创建会先弹出结果窗，关闭后才进入下一字段', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getAllByRole('button', { name: '基于此模板创建' })[0])
    await user.click(screen.getByRole('button', { name: '抽取当前字段' }))
    const resultModal = await screen.findByRole('dialog', { name: '抽取结果' }, { timeout: 5000 })

    const resultTable = document.querySelector('.result-table')

    expect(resultTable).not.toBeNull()
    expect(within(resultTable as HTMLElement).getByText('身高')).toBeInTheDocument()
    expect(within(resultTable as HTMLElement).getByText('198cm')).toBeInTheDocument()
    expect(within(resultTable as HTMLElement).getByText('迈克尔·乔丹')).toBeInTheDocument()
    expect(within(resultModal).getByText('来源球员')).toBeInTheDocument()
    expect(within(resultModal).getByText('迈克尔·乔丹')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: '体重' }, { timeout: 5000 })).toBeInTheDocument()
  }, 12000)

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
    expect(screen.getAllByText('肩宽/体型').length).toBeGreaterThan(0)
    expect(screen.queryByText('体型指数')).not.toBeInTheDocument()
    expect(screen.getAllByText('170 - 224 cm').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: '开始抽取' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '抽取当前字段' })).toBeInTheDocument()
  }, 10000)

  it('数值直抽可以修改当前字段的默认值和范围', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '数值直抽' }))

    fireEvent.change(screen.getByLabelText('最小值'), { target: { value: '175' } })
    fireEvent.change(screen.getByLabelText('最大值'), { target: { value: '230' } })
    fireEvent.change(screen.getByLabelText('默认值'), { target: { value: '200' } })

    expect(screen.getAllByText('175 - 230 cm').length).toBeGreaterThan(0)
    expect(screen.getAllByText('200 cm').length).toBeGreaterThan(0)
  }, 12000)

  it('数值直抽可以清空结果并恢复当前字段默认值', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '数值直抽' }))
    fireEvent.change(screen.getByLabelText('最小值'), { target: { value: '175' } })
    fireEvent.change(screen.getByLabelText('最大值'), { target: { value: '230' } })
    fireEvent.change(screen.getByLabelText('默认值'), { target: { value: '200' } })

    await user.click(screen.getByRole('button', { name: '恢复当前' }))
    expect(screen.getAllByText('170 - 224 cm').length).toBeGreaterThan(0)
    expect(screen.getAllByText('198 cm').length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: '开始抽取' }))
    await screen.findByRole('dialog', { name: '抽取结果' }, { timeout: 5000 })
    await screen.findAllByRole('heading', { name: '体重' }, { timeout: 5000 })

    expect(document.querySelectorAll('.number-result-table .result-value-cell').length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: '清空全部结果' }))
    expect(screen.getAllByText('等待抽取').length).toBeGreaterThan(0)
  }, 15000)

  it('数值直抽会先弹出结果窗，关闭后才进入下一字段', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '数值直抽' }))
    await user.click(screen.getByRole('button', { name: '开始抽取' }))

    const resultModal = await screen.findByRole('dialog', { name: '抽取结果' }, { timeout: 5000 })
    expect((await screen.findAllByText('170 cm', {}, { timeout: 5000 })).length).toBeGreaterThan(0)
    expect(screen.getAllByText('贴近 2K Builder 的身高范围').length).toBeGreaterThan(0)
    expect(within(resultModal).getByText('范围')).toBeInTheDocument()
    expect(document.querySelectorAll('.number-result-table .result-value-cell').length).toBeGreaterThan(0)
    expect((await screen.findAllByRole('heading', { name: '体重' }, { timeout: 5000 })).length).toBeGreaterThan(0)
  }, 12000)

  it('模板创建可以调整当前候选球员池', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getAllByRole('button', { name: '基于此模板创建' })[0])

    expect(screen.getByText('当前候选 4 人')).toBeInTheDocument()
    await user.type(screen.getByLabelText('搜索球员'), '杜兰特')
    await user.click(screen.getByRole('button', { name: '加入候选球员 凯文·杜兰特' }))
    expect(screen.getByText('当前候选 5 人')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '移除候选球员 杰森·塔图姆' }))
    expect(screen.getByText('当前候选 4 人')).toBeInTheDocument()
  }, 10000)

  it('模板创建可以导入 2KRatings 文本并加入候选球员库', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getAllByRole('button', { name: '基于此模板创建' })[0])

    await user.type(
      screen.getByLabelText('粘贴 2KRatings 文本'),
      `Kevin Durant
Position PF / SF
Archetype 3-Level-Scoring Point Forward
Height 6'11"
Weight 240 lbs
Wingspan 7'5"
Overall Rating 96
Close Shot 95
Driving Layup 92
Driving Dunk 90
Mid-Range Shot 94
Three-Point Shot 92
Free Throw 89
Pass Accuracy 80
Ball Handle 88
Speed 84
Agility 82
Strength 74
Vertical 82
Interior Defense 78
Perimeter Defense 85
Steal 74
Block 86
Offensive Rebound 65
Defensive Rebound 79`,
    )
    await user.click(screen.getByRole('button', { name: '导入 2KRatings 球员' }))

    expect(await screen.findByText('已导入：凯文·杜兰特')).toBeInTheDocument()
    await user.clear(screen.getByLabelText('搜索球员'))
    await user.type(screen.getByLabelText('搜索球员'), '杜兰特')
    expect(screen.getByRole('button', { name: '加入候选球员 凯文·杜兰特' })).toBeInTheDocument()
  }, 10000)

  it('保存模板后会在我的模板里显示结果', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getAllByRole('button', { name: '基于此模板创建' })[0])
    await user.click(screen.getByRole('button', { name: '抽取当前字段' }))
    await screen.findByRole('dialog', { name: '抽取结果' }, { timeout: 5000 })
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
