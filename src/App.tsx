import { useEffect, useMemo, useRef, useState } from 'react'

import './App.css'
import { WheelDisplay } from './components/WheelDisplay'
import {
  createDefaultAppState,
  defaultBuildSettings,
  defaultNumberFields,
  defaultRecommendedTemplates,
} from './data/defaults'
import {
  createBuilderFields,
  createSession,
  drawFieldAssignment,
  openTemplateSession,
  saveTemplateFromSession,
} from './lib/builderState'
import { parse2KRatingsPlayerText } from './lib/import2kRatings'
import { applyPositionPresetToFields, defaultPositionPresets, getPositionPreset } from './lib/positionPresets'
import { loadAppState, saveAppState } from './lib/storage'
import { createSpinSequence, getTargetWheelRotation } from './lib/wheel'
import type {
  AttributeValue,
  AppState,
  BuilderFieldDefinition,
  BuilderSession,
  NumberDrawField,
  PlayerProfile,
  RecommendedTemplate,
  SavedTemplate,
} from './types'

type PageView = 'home' | 'builder' | 'number-draw' | 'settings' | 'tags' | 'library'

// 抽取结果先进入弹窗确认，关闭后才推进到下一字段。
interface DrawResultModalState {
  isOpen: boolean
  mode: 'builder' | 'number' | null
  fieldLabel: string
  valueText: string
  detailLabel: string
  detailText: string
  noteText: string
  nextButtonLabel: string
  pendingBuilderFieldIndex: number | null
  pendingNumberFieldId: string | null
}

const emptyDrawResultModal: DrawResultModalState = {
  isOpen: false,
  mode: null,
  fieldLabel: '',
  valueText: '',
  detailLabel: '',
  detailText: '',
  noteText: '',
  nextButtonLabel: '下一项',
  pendingBuilderFieldIndex: null,
  pendingNumberFieldId: null,
}

interface NumberFieldDraft {
  minText: string
  maxText: string
  defaultText: string
  optionsText: string
}

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
  const [drawResultModal, setDrawResultModal] = useState<DrawResultModalState>(emptyDrawResultModal)
  const [isResultTransitioning, setIsResultTransitioning] = useState(false)
  const [numberFieldDraft, setNumberFieldDraft] = useState<NumberFieldDraft>(
    createNumberFieldDraft(null),
  )
  const [playerSearchQuery, setPlayerSearchQuery] = useState('')
  const [importText, setImportText] = useState('')
  const [importFeedback, setImportFeedback] = useState('')
  const [showBackToTop, setShowBackToTop] = useState(false)
  const resultFlowTokenRef = useRef(0)

  useEffect(() => {
    saveAppState(window.localStorage, appState)
  }, [appState])

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 240)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      resultFlowTokenRef.current += 1
    }
  }, [])

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
  const currentPositionPreset = getPositionPreset(appState.settings.positionPresetId)
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
  const filteredPlayers = useMemo(
    () => searchPlayers(appState.players, playerSearchQuery),
    [appState.players, playerSearchQuery],
  )
  const resultRows = builderFields.map((field) =>
    createFieldRow(field, appState.session, appState.players),
  )

  useEffect(() => {
    setNumberFieldDraft(createNumberFieldDraft(activeNumberField))
  }, [activeNumberField])

  return (
    <div className="app-shell minimal-shell">
      <header className="topbar">
        <button
          type="button"
          className={activeView === 'home' ? 'nav-button active' : 'nav-button'}
          onClick={() => handleChangeView('home')}
        >
          首页
        </button>
        <button
          type="button"
          className={activeView === 'builder' ? 'nav-button active' : 'nav-button'}
          onClick={() => handleChangeView('builder')}
        >
          模板创建
        </button>
        <button
          type="button"
          className={activeView === 'number-draw' ? 'nav-button active' : 'nav-button'}
          onClick={() => handleChangeView('number-draw')}
        >
          数值直抽
        </button>
        <button
          type="button"
          className={activeView === 'settings' ? 'nav-button active' : 'nav-button'}
          onClick={() => handleChangeView('settings')}
        >
          设置
        </button>
        <button
          type="button"
          className={activeView === 'tags' ? 'nav-button active' : 'nav-button'}
          onClick={() => handleChangeView('tags')}
        >
          标签页
        </button>
        <button
          type="button"
          className={activeView === 'library' ? 'nav-button active' : 'nav-button'}
          onClick={() => handleChangeView('library')}
        >
          我的模板
        </button>
      </header>

      {activeView === 'home' ? renderHomeView() : null}
      {activeView === 'builder' ? renderBuilderView() : null}
      {activeView === 'number-draw' ? renderNumberDrawView() : null}
      {activeView === 'settings' ? renderSettingsView() : null}
      {activeView === 'tags' ? renderTagsView() : null}
      {activeView === 'library' ? renderLibraryView() : null}
      {drawResultModal.isOpen ? renderDrawResultModal() : null}
      {showBackToTop ? (
        <button
          type="button"
          className="back-to-top-button"
          aria-label="回到顶部"
          onClick={handleBackToTop}
        >
          回到顶部
        </button>
      ) : null}
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
            <button type="button" onClick={() => handleChangeView('home')}>
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
              <div className="inline-action-group">
                <span className="status-pill">
                  已完成 {Object.keys(appState.session.fieldAssignments).length}/{builderFields.length}
                </span>
                <button
                  type="button"
                  className="ghost-button compact-button"
                  onClick={handleDrawCurrentField}
                  disabled={
                    candidatePlayers.length === 0 ||
                    isWheelSpinning ||
                    drawResultModal.isOpen ||
                    isResultTransitioning
                  }
                >
                  {isWheelSpinning ? '抽取中...' : '开始抽取'}
                </button>
              </div>
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
                  className="compact-button"
                  onClick={handleDrawCurrentField}
                  disabled={
                    candidatePlayers.length === 0 ||
                    isWheelSpinning ||
                    drawResultModal.isOpen ||
                    isResultTransitioning
                  }
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
          </div>

          <aside className="builder-side-card">
            <section className="side-panel-section">
              <div className="section-title-row">
                <div>
                  <p className="eyebrow">候选球员池</p>
                  <h3>{`当前候选 ${candidatePlayers.length} 人`}</h3>
                </div>
              </div>

              <label className="field">
                <span>搜索球员</span>
                <input
                  aria-label="搜索球员"
                  value={playerSearchQuery}
                  placeholder="可搜中文名、英文名、缩写或标签"
                  onChange={(event) => setPlayerSearchQuery(event.target.value)}
                />
              </label>

              <div className="compact-action-row">
                <button type="button" className="ghost-button" onClick={() => setPlayerSearchQuery('')}>
                  清空搜索
                </button>
                <button type="button" className="ghost-button" onClick={handleResetCandidatePool}>
                  恢复默认候选池
                </button>
              </div>

              <div className="candidate-chip-list">
                {candidatePlayers.map((player) => (
                  <button
                    key={player.id}
                    type="button"
                    className="soft-chip removable-chip"
                    aria-label={`移除候选球员 ${player.name}`}
                    onClick={() => handleRemoveCandidatePlayer(player.id)}
                    disabled={candidatePlayers.length <= 1}
                  >
                    {player.name}
                  </button>
                ))}
              </div>

              <div className="player-search-list">
                {filteredPlayers.slice(0, 8).map((player) => {
                  const isSelected = appState.session.candidatePlayerIds.includes(player.id)

                  return (
                    <div key={player.id} className="player-search-card">
                      <div>
                        <strong>{player.name}</strong>
                        <p className="muted">
                          {player.position} / 总评 {player.overall}
                        </p>
                      </div>
                      <button
                        type="button"
                        className={isSelected ? 'ghost-button' : ''}
                        aria-label={`加入候选球员 ${player.name}`}
                        onClick={() => handleAddCandidatePlayer(player.id)}
                        disabled={isSelected}
                      >
                        {isSelected ? '已加入' : '加入'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="side-panel-section">
              <div className="section-title-row">
                <div>
                  <p className="eyebrow">Template Name</p>
                  <h3>保存当前模板</h3>
                </div>
                <button
                  type="button"
                  className="ghost-button compact-button"
                  onClick={() => handleChangeView('home')}
                >
                  返回首页
                </button>
              </div>
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
              <button
                type="button"
                className="accent-button compact-button"
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
                    <span className="result-value-cell">{row.valueText}</span>
                    <span>{row.sourceText}</span>
                    <span>{row.noteText}</span>
                  </div>
                ))}
              </div>
            </section>
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
              <button
                type="button"
                className="ghost-button compact-button"
                onClick={() => handleChangeView('settings')}
              >
                前往设置
              </button>
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
                  <span>{formatNumberRange(field)}</span>
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
              <button
                type="button"
                className="ghost-button compact-button"
                onClick={handleDrawNumberField}
                disabled={
                  !activeNumberField ||
                  isNumberWheelSpinning ||
                  drawResultModal.isOpen ||
                  isResultTransitioning
                }
              >
                {isNumberWheelSpinning ? '抽取中...' : '开始抽取'}
              </button>
            </div>

            <div className="number-draw-stage">
              <WheelDisplay
                title="数字转盘"
                subtitle={
                  activeNumberField?.kind === 'options'
                    ? '每一格都是一个体型选项，指针会停在某一个明确结果上'
                    : '每个数字都是一格，指针会停在某一个明确数值上'
                }
                items={numberWheelItems.map(formatWheelItem)}
                accent="red"
                rotation={numberWheelRotation}
                isSpinning={isNumberWheelSpinning}
                highlightText={numberWheelHighlight || formatNumberRange(activeNumberField)}
                selectedItem={numberWheelSelectedItem}
                variant={activeNumberField?.kind === 'options' ? 'players' : 'numbers'}
                size="large"
              />

              <div className="number-draw-side-actions">
                <button
                  type="button"
                  className="compact-button"
                  onClick={handleDrawNumberField}
                  disabled={
                    !activeNumberField ||
                    isNumberWheelSpinning ||
                    drawResultModal.isOpen ||
                    isResultTransitioning
                  }
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
                  <span className="result-value-cell">{row.resultValueText}</span>
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

  function renderSettingsView() {
    return (
      <main className="builder-view">
        <section className="section-title-card">
          <p className="eyebrow">Settings</p>
          <h1>设置</h1>
          <p className="muted">
            默认值、范围、位置预设和 2KRatings 导入都集中在这里管理，抽取页只保留抽盘本身。
          </p>
        </section>

        <section className="settings-layout">
          <aside className="builder-side-card">
            <section className="side-panel-section">
              <div className="section-title-row">
                <div>
                  <p className="eyebrow">Position Preset</p>
                  <h3>位置预设</h3>
                </div>
              </div>
              <label className="field">
                <span>当前位置预设</span>
                <select
                  aria-label="当前位置预设"
                  value={appState.settings.positionPresetId}
                  onChange={(event) => handlePositionPresetChange(event.target.value)}
                >
                  {defaultPositionPresets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </label>
              <p className="muted">{currentPositionPreset.description}</p>
            </section>

            <section className="side-panel-section">
              <div className="section-title-row">
                <div>
                  <p className="eyebrow">字段列表</p>
                  <h3>默认字段范围</h3>
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
                    <span>{formatNumberRange(field)}</span>
                  </button>
                ))}
              </div>
            </section>
          </aside>

          <section className="builder-main-card settings-main-card">
            {activeNumberField ? (
              <section className="settings-section-card">
                <div className="section-title-row">
                  <div>
                    <p className="eyebrow">当前字段配置</p>
                    <h3>{activeNumberField.label}</h3>
                  </div>
                  <div className="inline-action-group">
                    <button
                      type="button"
                      className="ghost-button compact-button"
                      onClick={() => handleResetNumberField(activeNumberField.id)}
                    >
                      恢复当前
                    </button>
                    <button
                      type="button"
                      className="ghost-button compact-button"
                      onClick={handleResetAllNumberFields}
                    >
                      全部恢复
                    </button>
                  </div>
                </div>

                {activeNumberField.kind === 'range' ? (
                  <div className="number-config-grid">
                    <label className="field">
                      <span>最小值</span>
                      <input
                        aria-label="最小值"
                        inputMode="numeric"
                        value={numberFieldDraft.minText}
                        onChange={(event) =>
                          handleRangeFieldDraftChange('min', event.target.value)
                        }
                      />
                    </label>
                    <label className="field">
                      <span>最大值</span>
                      <input
                        aria-label="最大值"
                        inputMode="numeric"
                        value={numberFieldDraft.maxText}
                        onChange={(event) =>
                          handleRangeFieldDraftChange('max', event.target.value)
                        }
                      />
                    </label>
                    <label className="field">
                      <span>默认值</span>
                      <input
                        aria-label="默认值"
                        inputMode="numeric"
                        value={numberFieldDraft.defaultText}
                        onChange={(event) =>
                          handleRangeFieldDraftChange('defaultValue', event.target.value)
                        }
                      />
                    </label>
                  </div>
                ) : (
                  <div className="number-config-grid">
                    <label className="field number-config-span">
                      <span>可选项</span>
                      <textarea
                        aria-label="可选项"
                        rows={5}
                        value={numberFieldDraft.optionsText}
                        onChange={(event) => handleOptionListChange(event.target.value)}
                      />
                    </label>
                    <label className="field">
                      <span>默认值</span>
                      <select
                        aria-label="默认值"
                        value={String(activeNumberField.defaultValue)}
                        onChange={(event) => handleOptionDefaultChange(event.target.value)}
                      >
                        {(activeNumberField.options ?? []).map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}

                <div className="settings-stat-grid">
                  <article className="current-result-card">
                    <p className="eyebrow">配置预览</p>
                    <div className="result-stat-row">
                      <span>范围</span>
                      <strong>{formatNumberRange(activeNumberField)}</strong>
                    </div>
                    <div className="result-stat-row">
                      <span>默认值</span>
                      <strong>
                        {formatNumberValue(activeNumberField, activeNumberField.defaultValue)}
                      </strong>
                    </div>
                    <div className="result-stat-row">
                      <span>当前结果</span>
                      <strong>
                        {appState.numberSession.results[activeNumberField.id]
                          ? formatNumberValue(
                              activeNumberField,
                              appState.numberSession.results[activeNumberField.id].value,
                            )
                          : '等待抽取'}
                      </strong>
                    </div>
                  </article>

                  <article className="current-result-card">
                    <p className="eyebrow">结果操作</p>
                    <div className="compact-action-column">
                      <button
                        type="button"
                        className="ghost-button compact-button"
                        onClick={() => handleClearNumberFieldResult(activeNumberField.id)}
                      >
                        清空当前结果
                      </button>
                      <button
                        type="button"
                        className="ghost-button compact-button"
                        onClick={handleClearAllNumberResults}
                      >
                        清空全部结果
                      </button>
                    </div>
                  </article>
                </div>
              </section>
            ) : null}

            <section className="settings-section-card">
              <div className="section-title-row">
                <div>
                  <p className="eyebrow">2KRatings</p>
                  <h3>导入球员数值</h3>
                </div>
                <button
                  type="button"
                  className="ghost-button compact-button"
                  onClick={() => {
                    setImportText('')
                    setImportFeedback('')
                  }}
                >
                  清空文本
                </button>
              </div>

              <label className="field">
                <span>粘贴 2KRatings 文本</span>
                <textarea
                  aria-label="粘贴 2KRatings 文本"
                  rows={10}
                  placeholder="把 2KRatings 球员页复制后粘贴到这里"
                  value={importText}
                  onChange={(event) => setImportText(event.target.value)}
                />
              </label>

              <div className="compact-action-row">
                <button type="button" className="compact-button" onClick={handleImport2KRatingsPlayer}>
                  导入 2KRatings 球员
                </button>
                <button
                  type="button"
                  className="ghost-button compact-button"
                  onClick={() => handleChangeView(activeRecommendedTemplate ? 'builder' : 'home')}
                >
                  回到模板创建
                </button>
              </div>

              {importFeedback ? <p className="muted success-note">{importFeedback}</p> : null}
            </section>
          </section>
        </section>
      </main>
    )
  }

  function renderDrawResultModal() {
    return (
      <div className="result-modal-backdrop" role="presentation">
        <section
          className="result-modal-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="draw-result-title"
        >
          <div className="result-modal-header">
            <div>
              <p className="eyebrow">本次抽取</p>
              <h2 id="draw-result-title">抽取结果</h2>
            </div>
            <button
              type="button"
              className="modal-close-button"
              aria-label="关闭弹窗"
              onClick={handleCloseResultModal}
            >
              ×
            </button>
          </div>

          <div className="result-modal-body">
            <div className="result-stat-row">
              <span>字段</span>
              <strong>{drawResultModal.fieldLabel}</strong>
            </div>
            <div className="result-stat-row">
              <span>最终值</span>
              <strong className="result-value-cell">{drawResultModal.valueText}</strong>
            </div>
            <div className="result-stat-row">
              <span>{drawResultModal.detailLabel}</span>
              <strong>{drawResultModal.detailText}</strong>
            </div>
            <div className="result-stat-row">
              <span>备注</span>
              <strong>{drawResultModal.noteText}</strong>
            </div>
          </div>

          <div className="result-modal-actions">
            <button type="button" className="ghost-button" onClick={handleCloseResultModal}>
              {drawResultModal.nextButtonLabel}
            </button>
          </div>
        </section>
      </div>
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

  function handleChangeView(view: PageView) {
    cancelResultFlow()
    setActiveView(view)
  }

  function handleCreateTemplate(template: RecommendedTemplate) {
    setActiveTemplateId(null)
    setWheelRotation(0)
    setWheelHighlight('')
    setWheelSelectedItem('')
    cancelResultFlow()
    setPlayerSearchQuery('')
    setImportText('')
    setImportFeedback('')
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
    const pendingBuilderFieldIndex =
      nextSession.currentFieldIndex !== appState.session.currentFieldIndex
        ? nextSession.currentFieldIndex
        : null

    setAppState((currentState) => ({
      ...currentState,
      session: {
        ...nextSession,
        currentFieldIndex: currentState.session.currentFieldIndex,
      },
    }))
    setWheelHighlight(
      player
        ? `${currentField.label} / ${player.name} / ${String(assignment.value)}`
        : currentField.label,
    )
    setWheelSelectedItem(player?.name ?? selectedPlayer?.name ?? '')
    await sleep(180)
    setIsWheelSpinning(false)
    await runResultFlow({
      isOpen: true,
      mode: 'builder',
      fieldLabel: currentField.label,
      valueText: String(assignment?.value ?? '等待抽取'),
      detailLabel: '来源球员',
      detailText: player?.name ?? '等待抽取',
      noteText: player
        ? String(
            player.categories.meta?.note ??
              player.categories.meta?.templateArchetype ??
              `来自 ${player.name}`,
          )
        : '等待抽取',
      nextButtonLabel: pendingBuilderFieldIndex !== null ? '下一项' : '完成',
      pendingBuilderFieldIndex,
      pendingNumberFieldId: null,
    })
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
    handleChangeView('library')
  }

  function handleOpenTemplate(template: SavedTemplate) {
    const nextSession = openTemplateSession(template)

    setActiveTemplateId(template.id)
    setWheelRotation(0)
    setWheelHighlight('')
    setWheelSelectedItem(resolveAssignedPlayerName(nextSession, appState.players) ?? '')
    cancelResultFlow()
    setPlayerSearchQuery('')
    setImportText('')
    setImportFeedback('')
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

    setNumberWheelHighlight(field ? formatNumberRange(field) : '')
    setNumberWheelSelectedItem(field && result ? formatWheelItem(result.value) : '')
    cancelResultFlow()
    setAppState((currentState) => ({
      ...currentState,
      numberSession: {
        ...currentState.numberSession,
        activeFieldId: fieldId,
        updatedAt: new Date().toISOString(),
      },
    }))
  }

  function handleRangeFieldDraftChange(
    key: 'min' | 'max' | 'defaultValue',
    value: string,
  ) {
    setNumberWheelHighlight('')
    setNumberWheelSelectedItem('')
    setNumberFieldDraft((currentDraft) => ({
      ...currentDraft,
      [`${key}Text`]: value,
    }))

    if (!activeNumberField || activeNumberField.kind !== 'range') {
      return
    }

    const parsedValue = Number(value)

    if (Number.isNaN(parsedValue)) {
      return
    }

    setAppState((currentState) => {
      const nextFields = currentState.numberFields.map((field) => {
        if (field.id !== activeNumberField.id || field.kind !== 'range') {
          return field
        }

        const nextField = { ...field, [key]: parsedValue }
        const min = Math.min(nextField.min ?? 0, nextField.max ?? nextField.min ?? 0)
        const max = Math.max(nextField.min ?? nextField.max ?? 0, nextField.max ?? 0)
        const defaultValue = clampNumber(
          Number(nextField.defaultValue ?? min),
          min,
          max,
        )

        return {
          ...nextField,
          min,
          max,
          defaultValue,
        }
      })

      return {
        ...currentState,
        numberFields: nextFields,
        numberSession: normalizeNumberSessionResults(
          currentState.numberSession,
          nextFields,
        ),
      }
    })
  }

  function handleOptionListChange(value: string) {
    setNumberWheelHighlight('')
    setNumberWheelSelectedItem('')
    setNumberFieldDraft((currentDraft) => ({
      ...currentDraft,
      optionsText: value,
    }))

    if (!activeNumberField || activeNumberField.kind !== 'options') {
      return
    }

    const nextOptions = value
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)

    if (nextOptions.length === 0) {
      return
    }

    setAppState((currentState) => {
      const nextFields = currentState.numberFields.map((field) => {
        if (field.id !== activeNumberField.id || field.kind !== 'options') {
          return field
        }

        return {
          ...field,
          options: nextOptions,
          defaultValue: nextOptions.includes(String(field.defaultValue))
            ? field.defaultValue
            : nextOptions[0],
        }
      })

      return {
        ...currentState,
        numberFields: nextFields,
        numberSession: normalizeNumberSessionResults(
          currentState.numberSession,
          nextFields,
        ),
      }
    })
  }

  function handleOptionDefaultChange(value: string) {
    if (!activeNumberField || activeNumberField.kind !== 'options') {
      return
    }

    setNumberWheelHighlight('')
    setNumberWheelSelectedItem('')
    setAppState((currentState) => ({
      ...currentState,
      numberFields: currentState.numberFields.map((field) =>
        field.id === activeNumberField.id && field.kind === 'options'
          ? {
              ...field,
              defaultValue: value,
            }
          : field,
      ),
    }))
  }

  function handleResetNumberField(fieldId: string) {
    const fallbackField = getPresetScopedDefaultFields(appState.settings.positionPresetId).find(
      (field) => field.id === fieldId,
    )

    if (!fallbackField) {
      return
    }

    setNumberWheelHighlight('')
    setNumberWheelSelectedItem('')
    setAppState((currentState) => {
      const nextFields = currentState.numberFields.map((field) =>
        field.id === fieldId ? structuredClone(fallbackField) : field,
      )

      return {
        ...currentState,
        numberFields: nextFields,
        numberSession: normalizeNumberSessionResults(
          currentState.numberSession,
          nextFields,
        ),
      }
    })
  }

  function handleResetAllNumberFields() {
    const nextFields = getPresetScopedDefaultFields(appState.settings.positionPresetId)

    setNumberWheelHighlight('')
    setNumberWheelSelectedItem('')
    setAppState((currentState) => ({
      ...currentState,
      numberFields: nextFields,
      numberSession: normalizeNumberSessionResults(
        currentState.numberSession,
        nextFields,
      ),
    }))
  }

  function handleClearNumberFieldResult(fieldId: string) {
    setNumberWheelHighlight('')
    setNumberWheelSelectedItem('')
    setAppState((currentState) => ({
      ...currentState,
      numberSession: {
        ...currentState.numberSession,
        results: Object.fromEntries(
          Object.entries(currentState.numberSession.results).filter(([id]) => id !== fieldId),
        ),
        updatedAt: new Date().toISOString(),
      },
    }))
  }

  function handleClearAllNumberResults() {
    setNumberWheelHighlight('')
    setNumberWheelSelectedItem('')
    setAppState((currentState) => ({
      ...currentState,
      numberSession: {
        ...currentState.numberSession,
        results: {},
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
    const spinSequence = createCompactSpinSequence(values.map(formatWheelItem), selectedIndex, 8)
    const nextRotation = getTargetWheelRotation(
      values.length,
      selectedIndex,
      numberWheelRotation,
      4,
    )
    const createdAt = new Date().toISOString()
    const nextField = getNextNumberField(appState.numberFields, activeNumberField.id)

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
    setNumberWheelSelectedItem(formatWheelItem(value))
    setNumberWheelHighlight(
      `${activeNumberField.label} / ${formatNumberValue(activeNumberField, value)}`,
    )

    await sleep(120)
    setIsNumberWheelSpinning(false)
    await runResultFlow({
      isOpen: true,
      mode: 'number',
      fieldLabel: activeNumberField.label,
      valueText: formatNumberValue(activeNumberField, value),
      detailLabel: '范围',
      detailText: formatNumberRange(activeNumberField),
      noteText: activeNumberField.note,
      nextButtonLabel: nextField ? '下一项' : '完成',
      pendingBuilderFieldIndex: null,
      pendingNumberFieldId: nextField?.id ?? null,
    })
  }

  function handleCloseResultModal() {
    if (!drawResultModal.isOpen) {
      return
    }

    resultFlowTokenRef.current += 1
    setIsResultTransitioning(false)
    finalizeResultFlow(drawResultModal)
  }

  function finalizeResultFlow(modalState: DrawResultModalState) {
    if (modalState.mode === 'builder' && modalState.pendingBuilderFieldIndex !== null) {
      const nextFieldIndex = modalState.pendingBuilderFieldIndex

      setWheelSelectedItem('')
      setWheelHighlight('')
      setAppState((currentState) => ({
        ...currentState,
        session: {
          ...currentState.session,
          currentFieldIndex: nextFieldIndex,
          updatedAt: new Date().toISOString(),
        },
      }))
    }

    if (modalState.mode === 'number' && modalState.pendingNumberFieldId) {
      const nextFieldId = modalState.pendingNumberFieldId
      const nextField = appState.numberFields.find((field) => field.id === nextFieldId) ?? null

      setNumberWheelHighlight(nextField ? formatNumberRange(nextField) : '')
      setNumberWheelSelectedItem('')
      setAppState((currentState) => ({
        ...currentState,
        numberSession: {
          ...currentState.numberSession,
          activeFieldId: nextFieldId,
          updatedAt: new Date().toISOString(),
        },
      }))
    }

    setDrawResultModal(emptyDrawResultModal)
  }

  function handleSelectField(index: number) {
    const nextSession = {
      ...appState.session,
      currentFieldIndex: index,
    }

    cancelResultFlow()
    setWheelSelectedItem(resolveAssignedPlayerName(nextSession, appState.players) ?? '')
    setWheelHighlight('')
    updateSession(nextSession)
  }

  function handleAddCandidatePlayer(playerId: string) {
    if (appState.session.candidatePlayerIds.includes(playerId)) {
      return
    }

    updateCandidatePlayers([...appState.session.candidatePlayerIds, playerId])
  }

  function handleRemoveCandidatePlayer(playerId: string) {
    if (appState.session.candidatePlayerIds.length <= 1) {
      return
    }

    updateCandidatePlayers(
      appState.session.candidatePlayerIds.filter((candidateId) => candidateId !== playerId),
    )
  }

  function updateCandidatePlayers(candidatePlayerIds: string[]) {
    setAppState((currentState) => {
      const nextSession = {
        ...currentState.session,
        candidatePlayerIds,
        updatedAt: new Date().toISOString(),
      }

      return {
        ...currentState,
        session: nextSession,
        recommendedTemplates: currentState.recommendedTemplates.map((template) =>
          template.id === currentState.session.recommendedTemplateId
            ? {
                ...template,
                candidatePlayerIds,
              }
            : template,
        ),
      }
    })
  }

  function handleResetCandidatePool() {
    const fallbackTemplate = defaultRecommendedTemplates.find(
      (template) => template.id === activeRecommendedTemplate?.id,
    )

    if (!fallbackTemplate) {
      return
    }

    updateCandidatePlayers([...fallbackTemplate.candidatePlayerIds])
    setPlayerSearchQuery('')
  }

  function handleImport2KRatingsPlayer() {
    if (!importText.trim()) {
      setImportFeedback('请先粘贴 2KRatings 球员页文本。')
      return
    }

    try {
      const importedPlayer = parse2KRatingsPlayerText(importText)

      setAppState((currentState) => ({
        ...currentState,
        players: upsertPlayer(currentState.players, importedPlayer),
      }))
      setImportFeedback(`已导入：${importedPlayer.name}`)
      setPlayerSearchQuery(importedPlayer.name)
      setImportText('')
    } catch {
      setImportFeedback('导入失败，请确认粘贴的是完整的 2KRatings 球员页文本。')
    }
  }

  async function runResultFlow(modalState: DrawResultModalState) {
    const token = resultFlowTokenRef.current + 1
    resultFlowTokenRef.current = token
    setIsResultTransitioning(true)

    await sleep(500)

    if (resultFlowTokenRef.current !== token) {
      return
    }

    setDrawResultModal(modalState)
    setIsResultTransitioning(false)
  }

  function cancelResultFlow() {
    resultFlowTokenRef.current += 1
    setIsResultTransitioning(false)
    setDrawResultModal(emptyDrawResultModal)
  }

  function handleBackToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
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

  function handlePositionPresetChange(presetId: string) {
    setNumberWheelHighlight('')
    setNumberWheelSelectedItem('')
    setAppState((currentState) => {
      const nextFields = applyPositionPresetToFields(
        structuredClone(currentState.numberFields),
        presetId,
      )

      return {
        ...currentState,
        settings: {
          ...currentState.settings,
          positionPresetId: presetId,
        },
        numberFields: nextFields,
        numberSession: normalizeNumberSessionResults(currentState.numberSession, nextFields),
      }
    })
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
    const scaledDuration =
      import.meta.env.MODE === 'test' ? Math.max(0, duration * 0.1) : duration

    window.setTimeout(resolve, scaledDuration)
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
  if (field.kind === 'options') {
    return field.options ?? []
  }

  const min = field.min ?? 0
  const max = field.max ?? min

  return Array.from({ length: max - min + 1 }, (_, index) => min + index)
}

function formatNumberRange(field: NumberDrawField | null) {
  if (!field) {
    return '等待字段'
  }

  if (field.kind === 'options') {
    return (field.options ?? []).join(' / ')
  }

  return `${field.min} - ${field.max}${field.unit ? ` ${field.unit}` : ''}`
}

function formatNumberValue(field: NumberDrawField, value: AttributeValue) {
  if (field.kind === 'options') {
    return String(value)
  }

  return `${value}${field.unit ? ` ${field.unit}` : ''}`
}

function formatWheelItem(value: AttributeValue) {
  return String(value)
}

function searchPlayers(players: PlayerProfile[], query: string) {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return players
  }

  return players.filter((player) =>
    [
      player.name,
      player.position,
      player.era,
      ...player.aliases,
      ...player.tags,
    ].some((value) => value.toLowerCase().includes(normalizedQuery)),
  )
}

function upsertPlayer(players: PlayerProfile[], nextPlayer: PlayerProfile) {
  const existingIndex = players.findIndex((player) =>
    player.id === nextPlayer.id ||
    player.name === nextPlayer.name ||
    player.aliases.some((alias) => nextPlayer.aliases.includes(alias)),
  )

  if (existingIndex === -1) {
    return [nextPlayer, ...players]
  }

  return players.map((player, index) => (index === existingIndex ? nextPlayer : player))
}

function createNumberFieldDraft(field: NumberDrawField | null): NumberFieldDraft {
  if (!field) {
    return {
      minText: '',
      maxText: '',
      defaultText: '',
      optionsText: '',
    }
  }

  return {
    minText: field.kind === 'range' ? String(field.min ?? '') : '',
    maxText: field.kind === 'range' ? String(field.max ?? '') : '',
    defaultText: String(field.defaultValue ?? ''),
    optionsText: field.kind === 'options' ? (field.options ?? []).join('\n') : '',
  }
}

function getPresetScopedDefaultFields(positionPresetId: string) {
  return applyPositionPresetToFields(
    structuredClone(defaultNumberFields),
    positionPresetId || defaultBuildSettings.positionPresetId,
  )
}

function normalizeNumberSessionResults(
  session: AppState['numberSession'],
  fields: NumberDrawField[],
) {
  const fieldMap = new Map(fields.map((field) => [field.id, field]))

  return {
    ...session,
    results: Object.fromEntries(
      Object.entries(session.results).map(([fieldId, result]) => {
        const field = fieldMap.get(fieldId)

        if (!field) {
          return [fieldId, result]
        }

        if (field.kind === 'range' && typeof result.value === 'number') {
          return [
            fieldId,
            {
              ...result,
              value: clampNumber(result.value, field.min ?? result.value, field.max ?? result.value),
            },
          ]
        }

        if (field.kind === 'options') {
          const options = field.options ?? []
          return [
            fieldId,
            {
              ...result,
              value: options.includes(String(result.value)) ? result.value : field.defaultValue,
            },
          ]
        }

        return [fieldId, result]
      }),
    ),
    updatedAt: new Date().toISOString(),
  }
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
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

function getNextNumberField(fields: NumberDrawField[], currentFieldId: string) {
  const currentIndex = fields.findIndex((field) => field.id === currentFieldId)

  if (currentIndex === -1 || currentIndex >= fields.length - 1) {
    return null
  }

  return fields[currentIndex + 1]
}
