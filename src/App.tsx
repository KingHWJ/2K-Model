import { useEffect, useState } from 'react'

import { defaultPreset, createDefaultAppState } from './data/defaults'
import { WheelDisplay } from './components/WheelDisplay'
import {
  clampCandidateCount,
  createSession,
  drawAllCategories,
  drawCandidatePlayerIds,
  drawCategoryAssignment,
  openTemplateSession,
  saveTemplateFromSession,
} from './lib/builderState'
import { loadAppState, saveAppState } from './lib/storage'
import type {
  AppState,
  AttributeCategory,
  AttributeValue,
  CategoryAssignment,
  GenerationSession,
  PlayerProfile,
  Preset,
  SavedTemplate,
} from './types'
import './App.css'

function App() {
  const [appState, setAppState] = useState<AppState>(() =>
    loadAppState(window.localStorage, createDefaultAppState()),
  )
  const [candidateRotation, setCandidateRotation] = useState(0)
  const [categoryRotation, setCategoryRotation] = useState(0)
  const [selectedPlayerId, setSelectedPlayerId] = useState(appState.players[0]?.id ?? '')
  const [selectedCategoryId, setSelectedCategoryId] = useState(appState.categories[0]?.id ?? '')
  const [tagDraft, setTagDraft] = useState('')
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null)

  useEffect(() => {
    saveAppState(window.localStorage, appState)
  }, [appState])

  useEffect(() => {
    if (!appState.players.some((player) => player.id === selectedPlayerId)) {
      setSelectedPlayerId(appState.players[0]?.id ?? '')
    }
  }, [appState.players, selectedPlayerId])

  useEffect(() => {
    if (!appState.categories.some((category) => category.id === selectedCategoryId)) {
      setSelectedCategoryId(appState.categories[0]?.id ?? '')
    }
  }, [appState.categories, selectedCategoryId])

  const activePreset = appState.presets.find((preset) => preset.id === appState.session.presetId) ?? appState.presets[0]
  const availablePlayers = appState.players.filter((player) =>
    activePreset.availablePlayerIds.includes(player.id),
  )
  const availableCategories = appState.categories.filter((category) =>
    activePreset.availableCategoryIds.includes(category.id),
  )
  const selectedPlayer =
    appState.players.find((player) => player.id === selectedPlayerId) ??
    appState.players[0]
  const selectedCategory =
    appState.categories.find((category) => category.id === selectedCategoryId) ??
    appState.categories[0]
  const candidatePlayers = appState.session.candidatePlayerIds
    .map((playerId) => appState.players.find((player) => player.id === playerId))
    .filter((player): player is PlayerProfile => Boolean(player))
  const liveSummary = buildLiveSummary(
    appState.session,
    appState.players,
    appState.categories,
  )

  return (
    <div className="app-shell">
      <header className="hero-banner">
        <div>
          <p className="eyebrow">NBA 2K26 / 球员融合实验台</p>
          <h1>2K26 球员融合模板工作台</h1>
          <p className="hero-text">
            从传奇球星里抽候选、按属性大类拼装模板，再把你喜欢的融合结果保存成长期可编辑的配置。
          </p>
        </div>

        <div className="hero-stats">
          <div className="stat-card">
            <span className="stat-label">当前预设</span>
            <strong>{activePreset.name}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">候选人数</span>
            <strong>{appState.session.candidateCount}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">已存模板</span>
            <strong>{appState.templates.length}</strong>
          </div>
        </div>
      </header>

      <main className="workbench-grid">
        <section className="panel stack">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Workbench A</p>
              <h2>池子配置区</h2>
            </div>
            <button className="ghost-button" type="button" onClick={handleRestoreDefaults}>
              恢复默认池
            </button>
          </div>

          <div className="subpanel">
            <label className="field">
              <span>预设池</span>
              <select
                value={activePreset.id}
                onChange={(event) => handlePresetChange(event.target.value)}
              >
                {appState.presets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>候选人数</span>
              <input
                type="number"
                min={1}
                max={availablePlayers.length || 1}
                value={appState.session.candidateCount}
                onChange={(event) =>
                  updateSession({
                    ...appState.session,
                    candidateCount: clampCandidateCount(
                      Number(event.target.value),
                      availablePlayers.length,
                    ),
                  })
                }
              />
            </label>
            <p className="muted">{activePreset.description}</p>
          </div>

          <div className="subpanel">
            <div className="subpanel-title-row">
              <h3>球员池管理</h3>
              <div className="inline-actions">
                <button type="button" onClick={handleAddPlayer}>
                  新增球员
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => selectedPlayer && handleDeletePlayer(selectedPlayer.id)}
                  disabled={!selectedPlayer}
                >
                  删除当前球员
                </button>
              </div>
            </div>

            <div className="list-selector">
              {appState.players.map((player) => (
                <button
                  key={player.id}
                  type="button"
                  className={player.id === selectedPlayer?.id ? 'pill active' : 'pill'}
                  onClick={() => setSelectedPlayerId(player.id)}
                >
                  {player.name}
                </button>
              ))}
            </div>

            {selectedPlayer ? (
              <div className="editor-grid">
                <label className="field">
                  <span>姓名</span>
                  <input
                    value={selectedPlayer.name}
                    onChange={(event) =>
                      updatePlayer(selectedPlayer.id, 'name', event.target.value)
                    }
                  />
                </label>
                <label className="field">
                  <span>位置</span>
                  <input
                    value={selectedPlayer.position}
                    onChange={(event) =>
                      updatePlayer(selectedPlayer.id, 'position', event.target.value)
                    }
                  />
                </label>
                <label className="field">
                  <span>总评</span>
                  <input
                    type="number"
                    min={60}
                    max={99}
                    value={selectedPlayer.overall}
                    onChange={(event) =>
                      updatePlayer(
                        selectedPlayer.id,
                        'overall',
                        Number(event.target.value),
                      )
                    }
                  />
                </label>
                <label className="field">
                  <span>年代/版本</span>
                  <input
                    value={selectedPlayer.era}
                    onChange={(event) =>
                      updatePlayer(selectedPlayer.id, 'era', event.target.value)
                    }
                  />
                </label>
                <label className="field field-span">
                  <span>风格标签（逗号分隔）</span>
                  <input
                    value={selectedPlayer.tags.join(', ')}
                    onChange={(event) =>
                      updatePlayer(
                        selectedPlayer.id,
                        'tags',
                        event.target.value
                          .split(',')
                          .map((item) => item.trim())
                          .filter(Boolean),
                      )
                    }
                  />
                </label>
              </div>
            ) : null}

            {selectedPlayer ? (
              <div className="category-editor-list">
                {availableCategories.map((category) => (
                  <details key={`${selectedPlayer.id}-${category.id}`} className="detail-card">
                    <summary>
                      <strong>{category.name}</strong>
                      <span>{renderCategoryPreview(selectedPlayer, category)}</span>
                    </summary>
                    <div className="field-list">
                      {category.fields.map((field) => (
                        <label className="field" key={field.key}>
                          <span>{field.label}</span>
                          <input
                            value={String(
                              selectedPlayer.categories[category.id]?.[field.key] ?? field.defaultValue,
                            )}
                            onChange={(event) =>
                              updatePlayerCategoryValue(
                                selectedPlayer.id,
                                category.id,
                                field.key,
                                coerceValue(event.target.value, field.defaultValue),
                              )
                            }
                          />
                        </label>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            ) : null}
          </div>

          <div className="subpanel">
            <div className="subpanel-title-row">
              <h3>属性池管理</h3>
              <div className="inline-actions">
                <button type="button" onClick={handleAddCategory}>
                  新增属性组
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  disabled={!selectedCategory}
                  onClick={() => selectedCategory && handleDeleteCategory(selectedCategory.id)}
                >
                  删除当前属性组
                </button>
              </div>
            </div>

            <div className="list-selector">
              {appState.categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={category.id === selectedCategory?.id ? 'pill active' : 'pill'}
                  onClick={() => setSelectedCategoryId(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {selectedCategory ? (
              <>
                <label className="field">
                  <span>属性组名称</span>
                  <input
                    value={selectedCategory.name}
                    onChange={(event) =>
                      updateCategoryName(selectedCategory.id, event.target.value)
                    }
                  />
                </label>

                <div className="field-list">
                  {selectedCategory.fields.map((field) => (
                    <div className="field-row" key={field.key}>
                      <label className="field">
                        <span>字段名</span>
                        <input
                          value={field.label}
                          onChange={(event) =>
                            updateCategoryField(
                              selectedCategory.id,
                              field.key,
                              'label',
                              event.target.value,
                            )
                          }
                        />
                      </label>
                      <label className="field">
                        <span>默认值</span>
                        <input
                          value={String(field.defaultValue)}
                          onChange={(event) =>
                            updateCategoryField(
                              selectedCategory.id,
                              field.key,
                              'defaultValue',
                              coerceValue(event.target.value, field.defaultValue),
                            )
                          }
                        />
                      </label>
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() => removeCategoryField(selectedCategory.id, field.key)}
                      >
                        删除字段
                      </button>
                    </div>
                  ))}
                </div>

                <button type="button" onClick={() => addCategoryField(selectedCategory.id)}>
                  新增字段
                </button>
              </>
            ) : null}
          </div>

          <div className="subpanel">
            <div className="subpanel-title-row">
              <h3>标签库管理</h3>
              <div className="inline-actions">
                <input
                  className="inline-input"
                  value={tagDraft}
                  placeholder="新增风格标签"
                  onChange={(event) => setTagDraft(event.target.value)}
                />
                <button type="button" onClick={handleAddTag}>
                  添加
                </button>
              </div>
            </div>

            <div className="list-selector">
              {activePreset.tagLibrary.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="pill"
                  onClick={() => handleRemoveTag(tag)}
                >
                  {tag} ×
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="panel stack">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Workbench B</p>
              <h2>转盘抽选区</h2>
            </div>
            <div className="inline-actions">
              <button type="button" onClick={handleDrawCandidates}>
                抽取候选球员
              </button>
              <button
                type="button"
                className="accent-button"
                onClick={handleDrawAll}
                disabled={candidatePlayers.length === 0}
              >
                一键全抽
              </button>
            </div>
          </div>

          <WheelDisplay
            title="候选球员轮盘"
            subtitle="从预设球员池中抽取融合候选"
            items={availablePlayers.map((player) => player.name)}
            accent="gold"
            rotation={candidateRotation}
            highlightText={candidatePlayers.map((player) => player.name).join(' / ')}
          />

          <div className="candidate-bar">
            {candidatePlayers.length > 0 ? (
              candidatePlayers.map((player) => (
                <article key={player.id} className="candidate-card">
                  <span className="candidate-overall">{player.overall}</span>
                  <strong>{player.name}</strong>
                  <span>{player.position}</span>
                  <small>{player.tags.join(' / ')}</small>
                </article>
              ))
            ) : (
              <p className="empty-state">先抽出候选球员，再开始融合属性。</p>
            )}
          </div>

          <WheelDisplay
            title="属性大类轮盘"
            subtitle="决定下一步要融合的属性方向"
            items={availableCategories.map((category) => category.name)}
            accent="red"
            rotation={categoryRotation}
            highlightText={
              liveSummary.categorySources.at(-1)?.categoryName
                ? `${liveSummary.categorySources.at(-1)?.categoryName} / ${liveSummary.categorySources.at(-1)?.playerName}`
                : undefined
            }
          />

          <div className="draw-list">
            {availableCategories.map((category) => {
              const assignment = appState.session.assignments[category.id]

              return (
                <div key={category.id} className="draw-row">
                  <div>
                    <strong>{category.name}</strong>
                    <p className="muted">
                      {assignment
                        ? `当前来源：${findPlayerName(appState.players, assignment.playerId)}`
                        : '尚未抽取'}
                    </p>
                  </div>
                  <div className="inline-actions">
                    <select
                      value={assignment?.playerId ?? ''}
                      onChange={(event) =>
                        handleManualAssignment(category.id, event.target.value)
                      }
                      disabled={candidatePlayers.length === 0}
                    >
                      <option value="">手动指定来源</option>
                      {candidatePlayers.map((player) => (
                        <option key={`${category.id}-${player.id}`} value={player.id}>
                          {player.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleDrawCategory(category.id)}
                      disabled={candidatePlayers.length === 0}
                    >
                      抽取 {category.name}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="panel stack">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Workbench C</p>
              <h2>融合结果区</h2>
            </div>
            <span className="status-chip">
              已融合 {Object.keys(appState.session.assignments).length}/{availableCategories.length}
            </span>
          </div>

          <div className="summary-card">
            <div>
              <p className="eyebrow">模板概览</p>
              <h3>{appState.session.templateName}</h3>
              <p className="muted">
                综合总评 {liveSummary.overall} / 位置 {liveSummary.position}
              </p>
            </div>
            <div className="list-selector">
              {liveSummary.tags.length > 0 ? (
                liveSummary.tags.map((tag) => (
                  <span key={tag} className="pill static">
                    {tag}
                  </span>
                ))
              ) : (
                <span className="muted">等待属性来源完成后生成标签画像</span>
              )}
            </div>
          </div>

          <div className="subpanel">
            <label className="field">
              <span>模板名称</span>
              <input
                aria-label="模板名称"
                value={appState.session.templateName}
                onChange={(event) =>
                  updateSession({
                    ...appState.session,
                    templateName: event.target.value,
                  })
                }
              />
            </label>
            <button type="button" className="accent-button" onClick={handleSaveTemplate}>
              保存模板
            </button>
          </div>

          <div className="subpanel">
            <div className="subpanel-title-row">
              <h3>来源球员一览</h3>
              <span className="muted">抽到哪位球星，表格就立即更新。</span>
            </div>
            <div className="result-table" role="table">
              <div className="result-row result-row-head" role="row">
                <span>属性大类</span>
                <span>来源球员</span>
                <span>字段预览</span>
              </div>
              {availableCategories.map((category) => {
                const assignment = appState.session.assignments[category.id]
                const player = assignment
                  ? appState.players.find((item) => item.id === assignment.playerId)
                  : undefined

                return (
                  <div className="result-row" key={category.id} role="row">
                    <span>{category.name}</span>
                    <span>{player ? player.name : '未抽取'}</span>
                    <span>{player ? renderCategoryPreview(player, category) : '等待结果'}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </main>

      <section className="template-library panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Workbench D</p>
            <h2>模板库</h2>
          </div>
          <p className="muted">保存后的模板支持继续编辑、复制和删除。</p>
        </div>

        <div className="template-grid">
          {appState.templates.length > 0 ? (
            appState.templates.map((template) => (
              <article key={template.id} className="template-card">
                <div>
                  <p className="eyebrow">模板档案</p>
                  <h3>{template.name}</h3>
                  <p className="muted">
                    总评 {template.summary.overall} / {template.summary.position}
                  </p>
                </div>
                <div className="list-selector">
                  {template.summary.tags.map((tag) => (
                    <span key={`${template.id}-${tag}`} className="pill static">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="inline-actions">
                  <button type="button" onClick={() => handleOpenTemplate(template)}>
                    继续编辑
                  </button>
                  <button type="button" className="ghost-button" onClick={() => handleDuplicateTemplate(template)}>
                    复制模板
                  </button>
                  <button type="button" className="ghost-button" onClick={() => handleDeleteTemplate(template.id)}>
                    删除
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="empty-state template-empty">
              还没有保存模板。完成一次融合后，点击“保存模板”即可归档到这里。
            </div>
          )}
        </div>
      </section>
    </div>
  )

  function updateSession(nextSession: GenerationSession) {
    setAppState((currentState) => ({
      ...currentState,
      session: {
        ...nextSession,
        candidateCount: clampCandidateCount(
          nextSession.candidateCount,
          availablePlayers.length,
        ),
        updatedAt: new Date().toISOString(),
      },
    }))
  }

  function handlePresetChange(presetId: string) {
    const preset = appState.presets.find((item) => item.id === presetId) ?? defaultPreset
    const nextSession = createSession(preset, appState.categories)

    setAppState((currentState) => ({
      ...currentState,
      session: nextSession,
    }))
    setActiveTemplateId(null)
  }

  function handleDrawCandidates() {
    const nextCandidateIds = drawCandidatePlayerIds(
      availablePlayers.map((player) => player.id),
      appState.session.candidateCount,
      Math.random,
    )
    const now = new Date().toISOString()
    const candidateLogs = nextCandidateIds.map((playerId) => ({
      type: 'candidate' as const,
      targetId: 'candidate-pool',
      playerId,
      createdAt: now,
    }))

    setCandidateRotation((value) => value + 360 + Math.random() * 240)
    updateSession({
      ...appState.session,
      candidatePlayerIds: nextCandidateIds,
      assignments: {},
      drawLog: [...appState.session.drawLog, ...candidateLogs],
      updatedAt: now,
    })
  }

  function handleDrawCategory(categoryId: string) {
    setCategoryRotation((value) => value + 360 + Math.random() * 180)
    updateSession(drawCategoryAssignment(appState.session, categoryId, Math.random))
  }

  function handleDrawAll() {
    setCategoryRotation((value) => value + 540 + Math.random() * 180)
    updateSession(
      drawAllCategories(
        appState.session,
        availableCategories.map((category) => category.id),
        Math.random,
      ),
    )
  }

  function handleSaveTemplate() {
    const normalizedName = appState.session.templateName.trim() || '未命名模板'
    const nextTemplate = saveTemplateFromSession(
      {
        ...appState.session,
        templateName: normalizedName,
      },
      appState.players,
      appState.categories,
      normalizedName,
      () => activeTemplateId ?? createId('template'),
    )

    setAppState((currentState) => {
      const templates = activeTemplateId
        ? currentState.templates.map((template) =>
            template.id === activeTemplateId ? nextTemplate : template,
          )
        : [nextTemplate, ...currentState.templates]

      return {
        ...currentState,
        templates,
        session: {
          ...currentState.session,
          templateName: normalizedName,
        },
      }
    })

    setActiveTemplateId(nextTemplate.id)
  }

  function handleOpenTemplate(template: SavedTemplate) {
    setActiveTemplateId(template.id)
    setAppState((currentState) => ({
      ...currentState,
      session: openTemplateSession(template),
    }))
  }

  function handleDuplicateTemplate(template: SavedTemplate) {
    const duplicatedTemplate: SavedTemplate = {
      ...template,
      id: createId('template'),
      name: `${template.name} 副本`,
      updatedAt: new Date().toISOString(),
    }

    setAppState((currentState) => ({
      ...currentState,
      templates: [duplicatedTemplate, ...currentState.templates],
    }))
  }

  function handleDeleteTemplate(templateId: string) {
    setAppState((currentState) => ({
      ...currentState,
      templates: currentState.templates.filter((template) => template.id !== templateId),
    }))

    if (activeTemplateId === templateId) {
      setActiveTemplateId(null)
    }
  }

  function handleManualAssignment(categoryId: string, playerId: string) {
    if (!playerId) {
      return
    }

    const assignment: CategoryAssignment = {
      playerId,
      createdAt: new Date().toISOString(),
    }

    updateSession({
      ...appState.session,
      assignments: {
        ...appState.session.assignments,
        [categoryId]: assignment,
      },
    })
  }

  function handleRestoreDefaults() {
    setAppState(createDefaultAppState())
    setActiveTemplateId(null)
    setTagDraft('')
  }

  function handleAddPlayer() {
    const nextPlayerId = createId('player')
    const fallbackCategories = Object.fromEntries(
      appState.categories.map((category) => [
        category.id,
        Object.fromEntries(
          category.fields.map((field) => [field.key, field.defaultValue]),
        ),
      ]),
    )
    const nextPlayer: PlayerProfile = {
      id: nextPlayerId,
      name: '新球员',
      position: 'SG',
      overall: 85,
      era: '自定义',
      tags: [],
      categories: fallbackCategories,
    }

    setAppState((currentState) => normalizeState({
      ...currentState,
      players: [nextPlayer, ...currentState.players],
    }))
    setSelectedPlayerId(nextPlayerId)
  }

  function handleDeletePlayer(playerId: string) {
    setAppState((currentState) =>
      normalizeState({
        ...currentState,
        players: currentState.players.filter((player) => player.id !== playerId),
      }),
    )
  }

  function updatePlayer<K extends keyof Omit<PlayerProfile, 'categories' | 'id'>>(
    playerId: string,
    key: K,
    value: PlayerProfile[K],
  ) {
    setAppState((currentState) => ({
      ...currentState,
      players: currentState.players.map((player) =>
        player.id === playerId ? { ...player, [key]: value } : player,
      ),
    }))
  }

  function updatePlayerCategoryValue(
    playerId: string,
    categoryId: string,
    fieldKey: string,
    value: AttributeValue,
  ) {
    setAppState((currentState) => ({
      ...currentState,
      players: currentState.players.map((player) =>
        player.id === playerId
          ? {
              ...player,
              categories: {
                ...player.categories,
                [categoryId]: {
                  ...player.categories[categoryId],
                  [fieldKey]: value,
                },
              },
            }
          : player,
      ),
    }))
  }

  function handleAddCategory() {
    const categoryId = createId('category')
    const nextCategory: AttributeCategory = {
      id: categoryId,
      name: '新属性组',
      fields: [{ key: 'field_1', label: '字段1', defaultValue: 80 }],
    }

    setAppState((currentState) =>
      normalizeState({
        ...currentState,
        categories: [...currentState.categories, nextCategory],
        players: currentState.players.map((player) => ({
          ...player,
          categories: {
            ...player.categories,
            [categoryId]: { field_1: 80 },
          },
        })),
      }),
    )
    setSelectedCategoryId(categoryId)
  }

  function handleDeleteCategory(categoryId: string) {
    setAppState((currentState) =>
      normalizeState({
        ...currentState,
        categories: currentState.categories.filter((category) => category.id !== categoryId),
        players: currentState.players.map((player) => {
          const nextCategories = { ...player.categories }
          delete nextCategories[categoryId]

          return {
            ...player,
            categories: nextCategories,
          }
        }),
      }),
    )
  }

  function updateCategoryName(categoryId: string, name: string) {
    setAppState((currentState) => ({
      ...currentState,
      categories: currentState.categories.map((category) =>
        category.id === categoryId ? { ...category, name } : category,
      ),
    }))
  }

  function updateCategoryField(
    categoryId: string,
    fieldKey: string,
    key: 'label' | 'defaultValue',
    value: AttributeValue,
  ) {
    setAppState((currentState) => ({
      ...currentState,
      categories: currentState.categories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              fields: category.fields.map((field) =>
                field.key === fieldKey ? { ...field, [key]: value } : field,
              ),
            }
          : category,
      ),
    }))
  }

  function addCategoryField(categoryId: string) {
    const fieldKey = createId('field')

    setAppState((currentState) => ({
      ...currentState,
      categories: currentState.categories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              fields: [
                ...category.fields,
                {
                  key: fieldKey,
                  label: `字段${category.fields.length + 1}`,
                  defaultValue: 75,
                },
              ],
            }
          : category,
      ),
      players: currentState.players.map((player) =>
        player.categories[categoryId]
          ? {
              ...player,
              categories: {
                ...player.categories,
                [categoryId]: {
                  ...player.categories[categoryId],
                  [fieldKey]: 75,
                },
              },
            }
          : player,
      ),
    }))
  }

  function removeCategoryField(categoryId: string, fieldKey: string) {
    setAppState((currentState) => ({
      ...currentState,
      categories: currentState.categories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              fields: category.fields.filter((field) => field.key !== fieldKey),
            }
          : category,
      ),
      players: currentState.players.map((player) => {
        const nextCategoryValues = { ...player.categories[categoryId] }
        delete nextCategoryValues[fieldKey]

        return {
          ...player,
          categories: {
            ...player.categories,
            [categoryId]: nextCategoryValues,
          },
        }
      }),
    }))
  }

  function handleAddTag() {
    const nextTag = tagDraft.trim()

    if (!nextTag) {
      return
    }

    setAppState((currentState) => ({
      ...currentState,
      presets: currentState.presets.map((preset) =>
        preset.id === activePreset.id
          ? {
              ...preset,
              tagLibrary: [...new Set([...preset.tagLibrary, nextTag])],
            }
          : preset,
      ),
    }))
    setTagDraft('')
  }

  function handleRemoveTag(tag: string) {
    setAppState((currentState) => ({
      ...currentState,
      presets: currentState.presets.map((preset) =>
        preset.id === activePreset.id
          ? {
              ...preset,
              tagLibrary: preset.tagLibrary.filter((item) => item !== tag),
            }
          : preset,
      ),
    }))
  }
}

export default App

function buildLiveSummary(
  session: GenerationSession,
  players: PlayerProfile[],
  categories: AttributeCategory[],
) {
  // 复用模板摘要逻辑，确保预览和最终保存看到的是同一套结果。
  return saveTemplateFromSession(
    session,
    players,
    categories,
    session.templateName,
    () => 'preview',
    () => session.updatedAt,
  ).summary
}

function renderCategoryPreview(player: PlayerProfile, category: AttributeCategory) {
  return category.fields
    .slice(0, 3)
    .map((field) => `${field.label}:${player.categories[category.id]?.[field.key] ?? '-'}`)
    .join(' / ')
}

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function findPlayerName(players: PlayerProfile[], playerId: string) {
  return players.find((player) => player.id === playerId)?.name ?? '未知球员'
}

function coerceValue(input: string, sample: AttributeValue): AttributeValue {
  if (typeof sample === 'number') {
    const nextNumber = Number(input)

    return Number.isNaN(nextNumber) ? sample : nextNumber
  }

  return input
}

function normalizeState(state: AppState): AppState {
  // 当用户编辑球员池或属性池时，顺手把预设引用和当前会话清洗到可用状态。
  const playerIds = state.players.map((player) => player.id)
  const categoryIds = state.categories.map((category) => category.id)
  const nextPresets: Preset[] = state.presets.map((preset) => ({
    ...preset,
    availablePlayerIds: playerIds,
    availableCategoryIds: categoryIds,
  }))
  const activePreset = nextPresets.find((preset) => preset.id === state.session.presetId) ?? nextPresets[0]
  const filteredAssignments = Object.fromEntries(
    Object.entries(state.session.assignments).filter(
      ([categoryId, assignment]) =>
        categoryIds.includes(categoryId) && playerIds.includes(assignment.playerId),
    ),
  )

  return {
    ...state,
    presets: nextPresets,
    session: {
      ...state.session,
      presetId: activePreset.id,
      candidateCount: clampCandidateCount(
        state.session.candidateCount,
        playerIds.length,
      ),
      candidatePlayerIds: state.session.candidatePlayerIds.filter((playerId) =>
        playerIds.includes(playerId),
      ),
      assignments: filteredAssignments,
    },
  }
}
