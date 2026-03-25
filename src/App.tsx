import { useEffect, useMemo, useState } from 'react'

import './App.css'
import { WheelDisplay } from './components/WheelDisplay'
import { createDefaultAppState } from './data/defaults'
import {
  createBuilderFields,
  createSession,
  drawFieldAssignment,
  openTemplateSession,
  saveTemplateFromSession,
} from './lib/builderState'
import { loadAppState, saveAppState } from './lib/storage'
import { createSpinSequence, getTargetWheelRotation } from './lib/wheel'
import type {
  AppState,
  BuilderFieldDefinition,
  BuilderSession,
  NumberDrawField,
  PlayerProfile,
  RecommendedTemplate,
  SavedTemplate,
} from './types'

type PageView = 'home' | 'builder' | 'number-draw' | 'tags' | 'library'

function App() {
  const [appState, setAppState] = useState<AppState>(() =>
    loadAppState(window.localStorage, createDefaultAppState()),
  )
  const [activeView, setActiveView] = useState<PageView>('home')
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null)
  const [wheelRotation, setWheelRotation] = useState(0)
  const [wheelHighlight, setWheelHighlight] = useState('')
  const [wheelSelectedItem, setWheelSelectedItem] = useState('')
  const [isWheelSpinning, setIsWheelSpinning] = useState(false)
  const [numberWheelRotation, setNumberWheelRotation] = useState(0)
  const [numberWheelHighlight, setNumberWheelHighlight] = useState('')
  const [numberWheelSelectedItem, setNumberWheelSelectedItem] = useState('')
  const [isNumberWheelSpinning, setIsNumberWheelSpinning] = useState(false)

  useEffect(() => {
    saveAppState(window.localStorage, appState)
  }, [appState])

  const activeRecommendedTemplate =
    appState.recommendedTemplates.find(
      (template) => template.id === appState.session.recommendedTemplateId,
    ) ?? null
  const builderFields = useMemo(
    () => createBuilderFields(appState.categories, appState.session.fieldOrder),
    [appState.categories, appState.session.fieldOrder],
  )
  const currentField =
    builderFields[appState.session.currentFieldIndex] ?? builderFields[0] ?? null
  const activeNumberField =
    appState.numberFields.find((field) => field.id === appState.numberSession.activeFieldId) ??
    appState.numberFields[0] ??
    null
  const numberWheelItems = activeNumberField ? createNumberWheelItems(activeNumberField) : []
  const activeNumberResult = activeNumberField
    ? appState.numberSession.results[activeNumberField.id]
    : undefined
  const numberResultRows = appState.numberFields.map((field) =>
    createNumberResultRow(field, appState.numberSession),
  )
  const candidatePlayers = appState.session.candidatePlayerIds
    .map((playerId) => appState.players.find((player) => player.id === playerId))
    .filter((player): player is PlayerProfile => Boolean(player))
  const resultRows = builderFields.map((field) =>
    createFieldRow(field, appState.session, appState.players),
  )

  return (
    <div className="app-shell minimal-shell">
      <header className="topbar">
        <button
          type="button"
          className={activeView === 'home' ? 'nav-button active' : 'nav-button'}
          onClick={() => setActiveView('home')}
        >
          首页
        </button>
        <button
          type="button"
          className={activeView === 'builder' ? 'nav-button active' : 'nav-button'}
          onClick={() => setActiveView('builder')}
        >
          模板创建
        </button>
        <button
          type="button"
          className={activeView === 'number-draw' ? 'nav-button active' : 'nav-button'}
          onClick={() => setActiveView('number-draw')}
        >
          数值直抽
        </button>
        <button
          type="button"
          className={activeView === 'tags' ? 'nav-button active' : 'nav-button'}
          onClick={() => setActiveView('tags')}
        >
          标签页
        </button>
        <button
          type="button"
          className={activeView === 'library' ? 'nav-button active' : 'nav-button'}
          onClick={() => setActiveView('library')}
        >
          我的模板
        </button>
      </header>

      {activeView === 'home' ? renderHomeView() : null}
      {activeView === 'builder' ? renderBuilderView() : null}
      {activeView === 'number-draw' ? renderNumberDrawView() : null}
      {activeView === 'tags' ? renderTagsView() : null}
      {activeView === 'library' ? renderLibraryView() : null}
    </div>
  )

  function renderHomeView() {
    return (
      <main className="home-view">
        <section className="hero-card">
          <p className="eyebrow">NBA 2K26 Template Board</p>
          <h1>选择一个模板方向</h1>
          <p className="hero-copy">
            先从推荐模板里选择风格，再进入单个大转盘页面，按身高、体重、臂展、肩宽和核心能力逐项抽取。
          </p>
        </section>

        <section className="recommend-section">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Recommended</p>
              <h2>模板推荐</h2>
            </div>
            <span className="muted">默认封面可直接使用，也支持上传你自己的球星图片。</span>
          </div>

          <div className="template-grid">
            {appState.recommendedTemplates.map((template) => (
              <article key={template.id} className="recommended-card">
                <img
                  src={template.customCover ?? template.defaultCover}
                  alt={`${template.name} 模板封面`}
                  className="cover-image"
                />
                <div className="recommended-body">
                  <div>
                    <p className="eyebrow">{template.subtitle}</p>
                    <h3>{template.name}</h3>
                    <p className="muted">{template.description}</p>
                  </div>

                  <div className="meta-list">
                    <div>
                      <span className="meta-label">代表球员</span>
                      <strong>{template.featuredPlayers.join(' / ')}</strong>
                    </div>
                    <div className="chip-row">
                      {template.tags.map((tag) => (
                        <span key={`${template.id}-${tag}`} className="soft-chip">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="card-actions">
                    <button type="button" onClick={() => handleCreateTemplate(template)}>
                      基于此模板创建
                    </button>
                    <label className="upload-button">
                      <span>上传模板封面</span>
                      <input
                        aria-label="上传模板封面"
                        type="file"
                        accept="image/*"
                        onChange={(event) =>
                          handleCoverUpload(template.id, event.target.files?.[0] ?? null)
                        }
                      />
                    </label>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    )
  }

  function renderBuilderView() {
    if (!activeRecommendedTemplate || !currentField) {
      return (
        <main className="builder-view">
          <section className="empty-card">
            <h1>创建模板</h1>
            <p className="muted">先回到首页选择一个模板方向，再进入单转盘创建页。</p>
            <button type="button" onClick={() => setActiveView('home')}>
              返回首页
            </button>
          </section>
        </main>
      )
    }

    const currentRow = resultRows.find((row) => row.field.id === currentField.id)

    return (
      <main className="builder-view">
        <section className="builder-header-card">
          <img
            src={activeRecommendedTemplate.customCover ?? activeRecommendedTemplate.defaultCover}
            alt={`${activeRecommendedTemplate.name} 模板封面`}
            className="builder-cover"
          />
          <div className="builder-header-copy">
            <p className="eyebrow">Builder</p>
            <h1>创建模板</h1>
            <h2>{activeRecommendedTemplate.name}</h2>
            <p className="muted">{activeRecommendedTemplate.description}</p>
            <div className="chip-row">
              {activeRecommendedTemplate.tags.map((tag) => (
                <span key={tag} className="soft-chip">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="builder-layout">
          <div className="builder-main-card">
            <div className="section-title-row">
              <div>
                <p className="eyebrow">当前字段</p>
                <h3>{currentField.label}</h3>
              </div>
              <span className="status-pill">
                已完成 {Object.keys(appState.session.fieldAssignments).length}/{builderFields.length}
              </span>
            </div>

            <div className="field-progress">
              {builderFields.map((field, index) => (
                <button
                  key={field.id}
                  type="button"
                  className={index === appState.session.currentFieldIndex ? 'field-chip active' : 'field-chip'}
                  onClick={() => handleSelectField(index)}
                >
                  {field.label}
                </button>
              ))}
            </div>

            <div className="builder-wheel-stage">
              <WheelDisplay
                title="候选球员转盘"
                subtitle="每一块只代表一位球员，指针停到谁就继承当前字段的真实值"
                items={candidatePlayers.map((player) => player.name)}
                accent="gold"
                rotation={wheelRotation}
                isSpinning={isWheelSpinning}
                highlightText={wheelHighlight || currentRow?.sourceText}
                selectedItem={wheelSelectedItem || currentRow?.sourceText}
                size="large"
              />

              <div className="builder-wheel-side-actions">
                <button
                  type="button"
                  onClick={handleDrawCurrentField}
                  disabled={candidatePlayers.length === 0 || isWheelSpinning}
                >
                  {isWheelSpinning ? '抽取中...' : '抽取当前字段'}
                </button>
              </div>
            </div>

            <article className="current-result-card">
              <p className="eyebrow">即时结果</p>
              <div className="result-stat-row">
                <span>字段名称</span>
                <strong>{currentField.label}</strong>
              </div>
              <div className="result-stat-row">
                <span>最终值</span>
                <strong>{currentRow?.valueText ?? '等待抽取'}</strong>
              </div>
              <div className="result-stat-row">
                <span>来源球员</span>
                <strong>{currentRow?.sourceText ?? '等待抽取'}</strong>
              </div>
              <div className="result-stat-row">
                <span>备注</span>
                <strong>{currentRow?.noteText ?? '等待抽取'}</strong>
              </div>
            </article>

            <div className="draw-actions">
              <button
                type="button"
                onClick={handleDrawCurrentField}
                disabled={candidatePlayers.length === 0 || isWheelSpinning}
              >
                {isWheelSpinning ? '抽取中...' : '开始抽取'}
              </button>
              <button type="button" className="ghost-button" onClick={() => setActiveView('home')}>
                返回首页
              </button>
            </div>
          </div>

          <aside className="builder-side-card">
            <div className="section-title-row">
              <div>
                <p className="eyebrow">Template Name</p>
                <h3>保存当前模板</h3>
              </div>
            </div>
            <label className="field">
              <span>模板名称</span>
              <input
                aria-label="模板名称"
                value={appState.session.templateName}
                onChange={(event) => updateSession({
                  ...appState.session,
                  templateName: event.target.value,
                })}
              />
            </label>
            <button
              type="button"
              className="accent-button"
              onClick={handleSaveTemplate}
              disabled={Object.keys(appState.session.fieldAssignments).length === 0}
            >
              保存模板
            </button>

            <div className="result-table">
              <div className="result-row result-row-head">
                <span>字段</span>
                <span>最终值</span>
                <span>来源</span>
                <span>备注</span>
              </div>
              {resultRows.map((row) => (
                <div className="result-row" key={row.field.id}>
                  <span>{row.field.label}</span>
                  <span>{row.valueText}</span>
                  <span>{row.sourceText}</span>
                  <span>{row.noteText}</span>
                </div>
              ))}
            </div>
          </aside>
        </section>
      </main>
    )
  }

  function renderTagsView() {
    return (
      <main className="simple-page">
        <section className="section-title-card">
          <p className="eyebrow">Tag Guide</p>
          <h1>模板风格标签</h1>
          <p className="muted">标签页只负责解释模板方向，不打断你的主抽取流程。</p>
        </section>

        <div className="tag-grid">
          {appState.tagDefinitions.map((tag) => (
            <article key={tag.id} className="tag-card">
              <p className="eyebrow">{tag.featuredPlayers.join(' / ')}</p>
              <h3>{tag.label}</h3>
              <p>{tag.description}</p>
              <div className="chip-row">
                {tag.focusFields.map((field) => (
                  <span key={`${tag.id}-${field}`} className="soft-chip">
                    {field}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </main>
    )
  }

  function renderNumberDrawView() {
    return (
      <main className="builder-view">
        <section className="section-title-card">
          <p className="eyebrow">Number Draw</p>
          <h1>数值直抽</h1>
          <p className="muted">不基于推荐模板，直接通过数字转盘决定字段的最终值。</p>
        </section>

        <section className="number-draw-layout">
          <aside className="builder-side-card">
            <div className="section-title-row">
              <div>
                <p className="eyebrow">字段列表</p>
                <h3>默认数值范围</h3>
              </div>
            </div>
            <div className="number-field-list">
              {appState.numberFields.map((field) => (
                <button
                  key={field.id}
                  type="button"
                  className={
                    field.id === activeNumberField?.id ? 'number-field-card active' : 'number-field-card'
                  }
                  onClick={() => handleSelectNumberField(field.id)}
                >
                  <strong>{field.label}</strong>
                  <span>
                    {field.min} - {field.max}
                    {field.unit ? ` ${field.unit}` : ''}
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <section className="builder-main-card">
            <div className="section-title-row">
              <div>
                <p className="eyebrow">当前字段</p>
                <h3>{activeNumberField?.label ?? '等待字段'}</h3>
              </div>
            </div>

            <div className="number-draw-stage">
              <WheelDisplay
                title="数字转盘"
                subtitle="每个数字都是一格，指针会停在某一个明确数值上"
                items={numberWheelItems.map(String)}
                accent="red"
                rotation={numberWheelRotation}
                isSpinning={isNumberWheelSpinning}
                highlightText={numberWheelHighlight || formatNumberRange(activeNumberField)}
                selectedItem={numberWheelSelectedItem}
                variant="numbers"
                size="large"
              />

              <div className="number-draw-side-actions">
                <button
                  type="button"
                  onClick={handleDrawNumberField}
                  disabled={!activeNumberField || isNumberWheelSpinning}
                >
                  {isNumberWheelSpinning ? '抽取中...' : '抽取当前字段'}
                </button>
              </div>
            </div>

            <article className="current-result-card">
              <p className="eyebrow">即时结果</p>
              <div className="result-stat-row">
                <span>字段名称</span>
                <strong>{activeNumberField?.label ?? '等待字段'}</strong>
              </div>
              <div className="result-stat-row">
                <span>默认值</span>
                <strong>
                  {activeNumberField
                    ? formatNumberValue(activeNumberField, activeNumberField.defaultValue)
                    : '等待字段'}
                </strong>
              </div>
              <div className="result-stat-row">
                <span>最终值</span>
                <strong>
                  {activeNumberField && activeNumberResult
                    ? formatNumberValue(activeNumberField, activeNumberResult.value)
                    : '等待抽取'}
                </strong>
              </div>
              <div className="result-stat-row">
                <span>备注</span>
                <strong>{activeNumberField?.note ?? '等待字段'}</strong>
              </div>
            </article>

            <div className="draw-actions">
              <button
                type="button"
                onClick={handleDrawNumberField}
                disabled={!activeNumberField || isNumberWheelSpinning}
              >
                {isNumberWheelSpinning ? '抽取中...' : '开始抽取'}
              </button>
            </div>

            <div className="result-table number-result-table">
              <div className="result-row result-row-head">
                <span>字段</span>
                <span>默认值</span>
                <span>最终值</span>
                <span>范围</span>
                <span>备注</span>
              </div>
              {numberResultRows.map((row) => (
                <div className="result-row" key={row.id}>
                  <span>{row.label}</span>
                  <span>{row.defaultValueText}</span>
                  <span>{row.resultValueText}</span>
                  <span>{row.rangeText}</span>
                  <span>{row.noteText}</span>
                </div>
              ))}
            </div>
          </section>
        </section>
      </main>
    )
  }

  function renderLibraryView() {
    return (
      <main className="simple-page">
        <section className="section-title-card">
          <p className="eyebrow">Saved Templates</p>
          <h1>我的模板</h1>
          <p className="muted">保存后的模板可以继续编辑，也可以直接删除重来。</p>
        </section>

        <div className="template-grid">
          {appState.templates.length > 0 ? (
            appState.templates.map((template) => (
              <article key={template.id} className="saved-template-card">
                <img src={template.coverImage} alt={`${template.name} 模板封面`} className="cover-image" />
                <div className="recommended-body">
                  <div>
                    <p className="eyebrow">{template.summary.recommendedTemplateName}</p>
                    <h3>{template.name}</h3>
                    <p className="muted">
                      已完成 {template.summary.completedFields} 项 / 综合总评 {template.summary.overall}
                    </p>
                  </div>
                  <div className="chip-row">
                    {template.summary.tags.map((tag) => (
                      <span key={`${template.id}-${tag}`} className="soft-chip">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="card-actions">
                    <button type="button" onClick={() => handleOpenTemplate(template)}>
                      继续编辑
                    </button>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      删除
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <section className="empty-card">
              <h2>还没有保存模板</h2>
              <p className="muted">先从首页选择推荐模板，再到创建页抽出你的第一版结果。</p>
            </section>
          )}
        </div>
      </main>
    )
  }

  function updateSession(nextSession: BuilderSession) {
    setAppState((currentState) => ({
      ...currentState,
      session: {
        ...nextSession,
        updatedAt: new Date().toISOString(),
      },
    }))
  }

  function handleCreateTemplate(template: RecommendedTemplate) {
    setActiveTemplateId(null)
    setWheelRotation(0)
    setWheelHighlight('')
    setWheelSelectedItem('')
    setAppState((currentState) => ({
      ...currentState,
      session: createSession(template, template.featuredFieldIds),
    }))
    setActiveView('builder')
  }

  async function handleDrawCurrentField() {
    if (!currentField || candidatePlayers.length === 0 || isWheelSpinning) {
      return
    }

    const selectedIndex = Math.floor(Math.random() * candidatePlayers.length)
    const selectedPlayer = candidatePlayers[selectedIndex]
    const nextRotation = getTargetWheelRotation(
      candidatePlayers.length,
      selectedIndex,
      wheelRotation,
      6,
    )
    const spinSequence = createSpinSequence(
      candidatePlayers.map((player) => player.name),
      selectedIndex,
      3,
    )

    setIsWheelSpinning(true)
    setWheelRotation(nextRotation)

    for (const [index, label] of spinSequence.entries()) {
      setWheelSelectedItem(label)
      setWheelHighlight(`${currentField.label} / ${label}`)
      await sleep(54 + index * 12)
    }

    const nextSession = drawFieldAssignment(
      appState.session,
      currentField.id,
      appState.players,
      createIndexRng(selectedIndex, candidatePlayers.length),
    )
    const assignment = nextSession.fieldAssignments[currentField.id]
    const player = appState.players.find((item) => item.id === assignment?.playerId)

    setAppState((currentState) => ({
      ...currentState,
      session: nextSession,
    }))
    setWheelHighlight(
      player
        ? `${currentField.label} / ${player.name} / ${String(assignment.value)}`
        : currentField.label,
    )
    setWheelSelectedItem(player?.name ?? selectedPlayer?.name ?? '')
    await sleep(180)
    setIsWheelSpinning(false)
  }

  function handleSaveTemplate() {
    const normalizedName = appState.session.templateName.trim() || '未命名模板'
    const nextTemplate = saveTemplateFromSession(
      {
        ...appState.session,
        templateName: normalizedName,
      },
      appState.recommendedTemplates,
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
    setActiveView('library')
  }

  function handleOpenTemplate(template: SavedTemplate) {
    const nextSession = openTemplateSession(template)

    setActiveTemplateId(template.id)
    setWheelRotation(0)
    setWheelHighlight('')
    setWheelSelectedItem(resolveAssignedPlayerName(nextSession, appState.players) ?? '')
    setAppState((currentState) => ({
      ...currentState,
      session: nextSession,
    }))
    setActiveView('builder')
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

  function handleSelectNumberField(fieldId: string) {
    const field = appState.numberFields.find((item) => item.id === fieldId)
    const result = field ? appState.numberSession.results[field.id] : undefined

    setNumberWheelRotation(0)
    setNumberWheelHighlight(field ? formatNumberRange(field) : '')
    setNumberWheelSelectedItem(
      field && result ? String(result.value) : '',
    )
    setAppState((currentState) => ({
      ...currentState,
      numberSession: {
        ...currentState.numberSession,
        activeFieldId: fieldId,
        updatedAt: new Date().toISOString(),
      },
    }))
  }

  async function handleDrawNumberField() {
    if (!activeNumberField || isNumberWheelSpinning) {
      return
    }

    const values = createNumberWheelItems(activeNumberField)
    const selectedIndex = Math.floor(Math.random() * values.length)
    const value = values[selectedIndex]
    const spinSequence = createCompactSpinSequence(values.map(String), selectedIndex, 8)
    const nextRotation = getTargetWheelRotation(
      values.length,
      selectedIndex,
      numberWheelRotation,
      4,
    )
    const createdAt = new Date().toISOString()

    setIsNumberWheelSpinning(true)
    setNumberWheelRotation(nextRotation)

    for (const [index, label] of spinSequence.entries()) {
      setNumberWheelSelectedItem(label)
      setNumberWheelHighlight(`${activeNumberField.label} / ${label}`)
      await sleep(24 + index * 18)
    }

    // 数值直抽结果单独写入 numberSession，避免和模板创建会话互相覆盖。
    setAppState((currentState) => ({
      ...currentState,
      numberSession: {
        ...currentState.numberSession,
        results: {
          ...currentState.numberSession.results,
          [activeNumberField.id]: {
            fieldId: activeNumberField.id,
            value,
            createdAt,
          },
        },
        updatedAt: createdAt,
      },
    }))
    setNumberWheelSelectedItem(String(value))
    setNumberWheelHighlight(
      `${activeNumberField.label} / ${formatNumberValue(activeNumberField, value)}`,
    )
    await sleep(120)
    setIsNumberWheelSpinning(false)
  }

  function handleSelectField(index: number) {
    const nextSession = {
      ...appState.session,
      currentFieldIndex: index,
    }

    setWheelSelectedItem(resolveAssignedPlayerName(nextSession, appState.players) ?? '')
    setWheelHighlight('')
    updateSession(nextSession)
  }

  function handleCoverUpload(templateId: string, file: File | null) {
    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null

      if (!result) {
        return
      }

      setAppState((currentState) => ({
        ...currentState,
        recommendedTemplates: currentState.recommendedTemplates.map((template) =>
          template.id === templateId
            ? { ...template, customCover: result }
            : template,
        ),
      }))
    }
    reader.readAsDataURL(file)
  }
}

export default App

function createFieldRow(
  field: BuilderFieldDefinition,
  session: BuilderSession,
  players: PlayerProfile[],
) {
  const assignment = session.fieldAssignments[field.id]
  const player = assignment
    ? players.find((item) => item.id === assignment.playerId)
    : undefined

  return {
    field,
    valueText: assignment ? String(assignment.value) : '等待抽取',
    sourceText: player ? player.name : '等待抽取',
    noteText: player
      ? String(
          player.categories.meta?.note ??
            player.categories.meta?.templateArchetype ??
            `来自 ${player.name}`,
        )
      : '等待抽取',
  }
}

function createNumberResultRow(
  field: NumberDrawField,
  session: AppState['numberSession'],
) {
  const result = session.results[field.id]

  return {
    id: field.id,
    label: field.label,
    defaultValueText: formatNumberValue(field, field.defaultValue),
    resultValueText: result ? formatNumberValue(field, result.value) : '等待抽取',
    rangeText: formatNumberRange(field),
    noteText: field.note,
  }
}

function sleep(duration: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, duration)
  })
}

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function createIndexRng(index: number, itemCount: number) {
  return () => {
    if (itemCount <= 1) {
      return 0
    }

    return Math.min((index + 0.001) / itemCount, 0.999999)
  }
}

function resolveAssignedPlayerName(
  session: BuilderSession,
  players: PlayerProfile[],
) {
  const fieldId = session.fieldOrder[session.currentFieldIndex]
  const assignment = fieldId ? session.fieldAssignments[fieldId] : undefined

  return players.find((player) => player.id === assignment?.playerId)?.name
}

function createNumberWheelItems(field: NumberDrawField) {
  return Array.from(
    { length: field.max - field.min + 1 },
    (_, index) => field.min + index,
  )
}

function formatNumberRange(field: NumberDrawField | null) {
  if (!field) {
    return '等待字段'
  }

  return `${field.min} - ${field.max}${field.unit ? ` ${field.unit}` : ''}`
}

function formatNumberValue(field: NumberDrawField, value: number) {
  if (field.id === 'body.frameIndex') {
    return `${value} / ${resolveFrameLabel(value)}`
  }

  return `${value}${field.unit ? ` ${field.unit}` : ''}`
}

function createCompactSpinSequence(
  items: string[],
  selectedIndex: number,
  leadSize: number,
) {
  if (items.length <= leadSize) {
    return items
  }

  return Array.from({ length: leadSize }, (_, offset) => {
    const index = selectedIndex - leadSize + 1 + offset

    return items[(index + items.length) % items.length]
  })
}

function resolveFrameLabel(value: number) {
  if (value <= 3) {
    return '瘦长'
  }

  if (value <= 7) {
    return '标准'
  }

  return '宽肩'
}
