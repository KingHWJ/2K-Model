import { createSession } from '../lib/builderState'
import { createTemplatePosterDataUrl } from '../lib/templateArt'
import type {
  AppState,
  AttributeCategory,
  NumberDrawField,
  NumberDrawSession,
  PlayerProfile,
  RecommendedTemplate,
  TagDefinition,
} from '../types'

export const defaultCategories: AttributeCategory[] = [
  {
    id: 'meta',
    name: '元数据',
    fields: [
      { key: 'templateArchetype', label: '模板定位', defaultValue: '全能锋线引擎' },
      { key: 'note', label: '备注', defaultValue: '默认融合描述' },
    ],
  },
  {
    id: 'body',
    name: '身体尺寸',
    fields: [
      { key: 'height', label: '身高', defaultValue: '198cm' },
      { key: 'weight', label: '体重', defaultValue: '98kg' },
      { key: 'wingspan', label: '臂展', defaultValue: '214cm' },
      { key: 'frame', label: '肩宽/体型', defaultValue: '宽肩' },
    ],
  },
  {
    id: 'athleticism',
    name: '运动能力',
    fields: [
      { key: 'speed', label: '速度', defaultValue: 88 },
      { key: 'acceleration', label: '加速', defaultValue: 86 },
      { key: 'vertical', label: '弹跳', defaultValue: 84 },
      { key: 'strength', label: '力量', defaultValue: 82 },
    ],
  },
  {
    id: 'finishing',
    name: '终结',
    fields: [
      { key: 'layup', label: '上篮', defaultValue: 88 },
      { key: 'drivingDunk', label: '扣篮', defaultValue: 90 },
      { key: 'closeShot', label: '近框终结', defaultValue: 86 },
    ],
  },
  {
    id: 'shooting',
    name: '投篮',
    fields: [
      { key: 'midRange', label: '中投', defaultValue: 88 },
      { key: 'threePoint', label: '三分', defaultValue: 86 },
      { key: 'freeThrow', label: '罚球', defaultValue: 82 },
    ],
  },
  {
    id: 'playmaking',
    name: '组织',
    fields: [
      { key: 'ballHandle', label: '控球', defaultValue: 86 },
      { key: 'passAccuracy', label: '传球', defaultValue: 84 },
    ],
  },
  {
    id: 'defense',
    name: '防守',
    fields: [
      { key: 'perimeterDefense', label: '外防', defaultValue: 88 },
      { key: 'interiorDefense', label: '内防', defaultValue: 76 },
      { key: 'steal', label: '抢断', defaultValue: 85 },
      { key: 'block', label: '盖帽', defaultValue: 72 },
    ],
  },
  {
    id: 'rebounding',
    name: '篮板',
    fields: [
      { key: 'defensiveRebound', label: '后场篮板', defaultValue: 82 },
      { key: 'boxout', label: '卡位', defaultValue: 84 },
    ],
  },
]

export const defaultFieldOrder = [
  'body.height',
  'body.weight',
  'body.wingspan',
  'body.frame',
  'athleticism.speed',
  'athleticism.acceleration',
  'athleticism.vertical',
  'athleticism.strength',
  'finishing.layup',
  'finishing.drivingDunk',
  'shooting.midRange',
  'shooting.threePoint',
  'playmaking.ballHandle',
  'playmaking.passAccuracy',
  'defense.perimeterDefense',
  'defense.interiorDefense',
  'defense.steal',
  'defense.block',
  'rebounding.defensiveRebound',
] as const

export const defaultPlayers: PlayerProfile[] = [
  createPlayer('jordan', '迈克尔·乔丹', 'SG/SF', 99, '1996-97', ['三威胁得分手', '外线锁防核心'], ['michael jordan', 'mj', 'air jordan'], {
    meta: { templateArchetype: '攻防一体王牌', note: '关键时刻终结能力顶级' },
    body: { height: '198cm', weight: '98kg', wingspan: '211cm', frame: '紧凑宽肩' },
    athleticism: { speed: 94, acceleration: 93, vertical: 96, strength: 83 },
    finishing: { layup: 98, drivingDunk: 94, closeShot: 95 },
    shooting: { midRange: 97, threePoint: 85, freeThrow: 88 },
    playmaking: { ballHandle: 90, passAccuracy: 86 },
    defense: { perimeterDefense: 97, interiorDefense: 72, steal: 98, block: 79 },
    rebounding: { defensiveRebound: 82, boxout: 80 },
  }),
  createPlayer('kobe', '科比·布莱恩特', 'SG/SF', 98, '2005-06', ['持球得分机器', '三威胁得分手'], ['kobe bryant', 'black mamba'], {
    meta: { templateArchetype: '高难度单打专家', note: '背身和中投都很强' },
    body: { height: '198cm', weight: '96kg', wingspan: '211cm', frame: '修长肩线' },
    athleticism: { speed: 91, acceleration: 90, vertical: 92, strength: 81 },
    finishing: { layup: 96, drivingDunk: 92, closeShot: 94 },
    shooting: { midRange: 98, threePoint: 87, freeThrow: 87 },
    playmaking: { ballHandle: 91, passAccuracy: 82 },
    defense: { perimeterDefense: 93, interiorDefense: 68, steal: 91, block: 72 },
    rebounding: { defensiveRebound: 76, boxout: 72 },
  }),
  createPlayer('lebron', '勒布朗·詹姆斯', 'SF/PF', 99, '2012-13', ['全能控锋', '推进组织核心'], ['lebron james', 'king james', 'lbj'], {
    meta: { templateArchetype: '全能推进核心', note: '身体与视野的双重压制' },
    body: { height: '206cm', weight: '113kg', wingspan: '214cm', frame: '重型宽肩' },
    athleticism: { speed: 92, acceleration: 91, vertical: 93, strength: 94 },
    finishing: { layup: 97, drivingDunk: 96, closeShot: 94 },
    shooting: { midRange: 86, threePoint: 83, freeThrow: 78 },
    playmaking: { ballHandle: 91, passAccuracy: 95 },
    defense: { perimeterDefense: 91, interiorDefense: 83, steal: 88, block: 84 },
    rebounding: { defensiveRebound: 84, boxout: 85 },
  }),
  createPlayer('durant', '凯文·杜兰特', 'SF/PF', 97, '2013-14', ['持球投射核心', '侧翼持投核心'], ['kevin durant', 'kd'], {
    meta: { templateArchetype: '高点错位得分手', note: '臂展与投射兼具' },
    body: { height: '211cm', weight: '109kg', wingspan: '225cm', frame: '修长高臂展' },
    athleticism: { speed: 88, acceleration: 87, vertical: 85, strength: 78 },
    finishing: { layup: 92, drivingDunk: 90, closeShot: 93 },
    shooting: { midRange: 97, threePoint: 92, freeThrow: 91 },
    playmaking: { ballHandle: 88, passAccuracy: 79 },
    defense: { perimeterDefense: 85, interiorDefense: 79, steal: 78, block: 82 },
    rebounding: { defensiveRebound: 78, boxout: 76 },
  }),
  createPlayer('curry', '斯蒂芬·库里', 'PG', 97, '2015-16', ['三分重力核心', '持球投射核心'], ['stephen curry', 'steph curry'], {
    meta: { templateArchetype: '超远射程持球核', note: '外线重力极强' },
    body: { height: '188cm', weight: '84kg', wingspan: '191cm', frame: '灵巧控卫' },
    athleticism: { speed: 91, acceleration: 94, vertical: 78, strength: 60 },
    finishing: { layup: 92, drivingDunk: 55, closeShot: 86 },
    shooting: { midRange: 96, threePoint: 99, freeThrow: 99 },
    playmaking: { ballHandle: 96, passAccuracy: 92 },
    defense: { perimeterDefense: 78, interiorDefense: 48, steal: 87, block: 42 },
    rebounding: { defensiveRebound: 62, boxout: 50 },
  }),
  createPlayer('shaq', '沙奎尔·奥尼尔', 'C', 98, '1999-00', ['禁区终结怪兽', '篮板清道夫'], ['shaquille oneal', "shaquille o'neal", 'shaq'], {
    meta: { templateArchetype: '低位怪兽', note: '绝对力量碾压' },
    body: { height: '216cm', weight: '147kg', wingspan: '229cm', frame: '巨兽级宽肩' },
    athleticism: { speed: 73, acceleration: 68, vertical: 82, strength: 99 },
    finishing: { layup: 95, drivingDunk: 99, closeShot: 99 },
    shooting: { midRange: 45, threePoint: 25, freeThrow: 45 },
    playmaking: { ballHandle: 52, passAccuracy: 64 },
    defense: { perimeterDefense: 46, interiorDefense: 92, steal: 50, block: 91 },
    rebounding: { defensiveRebound: 97, boxout: 99 },
  }),
  createPlayer('rodman', '丹尼斯·罗德曼', 'PF', 94, '1995-96', ['篮板清道夫', '防守工兵'], ['dennis rodman'], {
    meta: { templateArchetype: '防守篮板疯狗', note: '能量感和机动性爆棚' },
    body: { height: '201cm', weight: '95kg', wingspan: '218cm', frame: '强硬瘦长' },
    athleticism: { speed: 84, acceleration: 83, vertical: 90, strength: 86 },
    finishing: { layup: 75, drivingDunk: 78, closeShot: 80 },
    shooting: { midRange: 58, threePoint: 38, freeThrow: 63 },
    playmaking: { ballHandle: 58, passAccuracy: 66 },
    defense: { perimeterDefense: 95, interiorDefense: 91, steal: 89, block: 78 },
    rebounding: { defensiveRebound: 99, boxout: 97 },
  }),
  createPlayer('jokic', '尼古拉·约基奇', 'C', 97, '2023-24', ['高位策应中枢', '节奏组织核心'], ['nikola jokic', 'joker'], {
    meta: { templateArchetype: '高位策应中枢', note: '节奏感和传球视野顶级' },
    body: { height: '211cm', weight: '129kg', wingspan: '221cm', frame: '厚重中锋' },
    athleticism: { speed: 72, acceleration: 68, vertical: 72, strength: 91 },
    finishing: { layup: 88, drivingDunk: 70, closeShot: 97 },
    shooting: { midRange: 89, threePoint: 83, freeThrow: 83 },
    playmaking: { ballHandle: 82, passAccuracy: 98 },
    defense: { perimeterDefense: 62, interiorDefense: 81, steal: 78, block: 73 },
    rebounding: { defensiveRebound: 96, boxout: 95 },
  }),
  createPlayer('shai', '谢伊·吉尔杰斯-亚历山大', 'PG/SG', 98, '2025-26', ['节奏组织核心', '持球得分机器'], ['shai gilgeous-alexander', 'shai gilgeous alexander', 'sga'], {
    meta: { templateArchetype: '节奏型持球核心', note: '中距离和造犯规能力极强' },
    body: { height: '198cm', weight: '88kg', wingspan: '211cm', frame: '修长后卫' },
    athleticism: { speed: 92, acceleration: 94, vertical: 84, strength: 72 },
    finishing: { layup: 97, drivingDunk: 83, closeShot: 92 },
    shooting: { midRange: 94, threePoint: 86, freeThrow: 91 },
    playmaking: { ballHandle: 95, passAccuracy: 89 },
    defense: { perimeterDefense: 84, interiorDefense: 58, steal: 92, block: 55 },
    rebounding: { defensiveRebound: 62, boxout: 48 },
  }),
  createPlayer('giannis', '扬尼斯·阿德托昆博', 'PF/C', 97, '2025-26', ['禁区终结怪兽', '协防扫荡者'], ['giannis antetokounmpo', 'greek freak'], {
    meta: { templateArchetype: '推进型攻框巨兽', note: '转身一步和护框覆盖兼备' },
    body: { height: '211cm', weight: '110kg', wingspan: '224cm', frame: '超长臂展' },
    athleticism: { speed: 90, acceleration: 89, vertical: 91, strength: 94 },
    finishing: { layup: 96, drivingDunk: 98, closeShot: 94 },
    shooting: { midRange: 74, threePoint: 69, freeThrow: 71 },
    playmaking: { ballHandle: 84, passAccuracy: 79 },
    defense: { perimeterDefense: 86, interiorDefense: 92, steal: 79, block: 93 },
    rebounding: { defensiveRebound: 92, boxout: 90 },
  }),
  createPlayer('luka', '卢卡·东契奇', 'PG/SG', 96, '2025-26', ['节奏组织核心', '持球得分机器'], ['luka doncic'], {
    meta: { templateArchetype: '慢节奏持球大核', note: '节奏控制和错位点名顶级' },
    body: { height: '201cm', weight: '104kg', wingspan: '209cm', frame: '重型后卫' },
    athleticism: { speed: 78, acceleration: 77, vertical: 72, strength: 78 },
    finishing: { layup: 94, drivingDunk: 76, closeShot: 93 },
    shooting: { midRange: 91, threePoint: 90, freeThrow: 83 },
    playmaking: { ballHandle: 96, passAccuracy: 94 },
    defense: { perimeterDefense: 72, interiorDefense: 60, steal: 70, block: 56 },
    rebounding: { defensiveRebound: 84, boxout: 72 },
  }),
  createPlayer('tatum', '杰森·塔图姆', 'SF/PF', 95, '2025-26', ['侧翼持投核心', '外线锁防核心'], ['jayson tatum'], {
    meta: { templateArchetype: '双向持投侧翼', note: '攻防两端稳定的明星锋线' },
    body: { height: '203cm', weight: '95kg', wingspan: '211cm', frame: '标准锋线' },
    athleticism: { speed: 86, acceleration: 85, vertical: 84, strength: 79 },
    finishing: { layup: 90, drivingDunk: 88, closeShot: 90 },
    shooting: { midRange: 91, threePoint: 89, freeThrow: 87 },
    playmaking: { ballHandle: 86, passAccuracy: 79 },
    defense: { perimeterDefense: 88, interiorDefense: 73, steal: 78, block: 72 },
    rebounding: { defensiveRebound: 82, boxout: 76 },
  }),
  createPlayer('wembanyama', '维克托·文班亚马', 'PF/C', 96, '2025-26', ['机动型内线', '护筐终结内线'], ['victor wembanyama', 'wemby'], {
    meta: { templateArchetype: '护筐独角兽', note: '臂展、护筐和错位投射都很离谱' },
    body: { height: '224cm', weight: '107kg', wingspan: '244cm', frame: '超长独角兽' },
    athleticism: { speed: 82, acceleration: 79, vertical: 86, strength: 75 },
    finishing: { layup: 88, drivingDunk: 90, closeShot: 93 },
    shooting: { midRange: 84, threePoint: 82, freeThrow: 80 },
    playmaking: { ballHandle: 74, passAccuracy: 76 },
    defense: { perimeterDefense: 82, interiorDefense: 95, steal: 78, block: 98 },
    rebounding: { defensiveRebound: 92, boxout: 86 },
  }),
  createPlayer('anthony-davis', '安东尼·戴维斯', 'PF/C', 95, '2025-26', ['护筐终结内线', '协防扫荡者'], ['anthony davis', 'ad'], {
    meta: { templateArchetype: '双向护筐终结者', note: '近框终结和协防补位都很强' },
    body: { height: '208cm', weight: '115kg', wingspan: '227cm', frame: '修长内线' },
    athleticism: { speed: 80, acceleration: 77, vertical: 82, strength: 84 },
    finishing: { layup: 88, drivingDunk: 87, closeShot: 92 },
    shooting: { midRange: 80, threePoint: 73, freeThrow: 78 },
    playmaking: { ballHandle: 70, passAccuracy: 71 },
    defense: { perimeterDefense: 79, interiorDefense: 94, steal: 76, block: 95 },
    rebounding: { defensiveRebound: 90, boxout: 88 },
  }),
]

export const defaultRecommendedTemplates: RecommendedTemplate[] = [
  createRecommendedTemplate({
    id: 'two-way-guard',
    name: '双向分卫模板',
    subtitle: '乔丹式首发框架',
    description: '强调中距离终结、外线防守和爆发力，适合从经典分卫手感出发。',
    featuredPlayers: ['迈克尔·乔丹', '科比·布莱恩特', '谢伊·吉尔杰斯-亚历山大'],
    candidatePlayerIds: ['jordan', 'kobe', 'shai', 'tatum'],
    tags: ['双向分卫', '中距离终结', '外线压迫'],
    accentA: '#151515',
    accentB: '#B71C1C',
    badgeText: 'MJ',
  }),
  createRecommendedTemplate({
    id: 'tall-shot-creator',
    name: '高个投射核心',
    subtitle: '杜兰特式高点得分',
    description: '强调身高、臂展和高点投篮，适合打造高位错位终结手。',
    featuredPlayers: ['凯文·杜兰特', '杰森·塔图姆', '维克托·文班亚马'],
    candidatePlayerIds: ['durant', 'tatum', 'wembanyama', 'lebron'],
    tags: ['高个投射核心', '高点出手', '错位进攻'],
    accentA: '#101828',
    accentB: '#2F80ED',
    badgeText: 'KD',
  }),
  createRecommendedTemplate({
    id: 'downhill-forward',
    name: '推进攻框前锋',
    subtitle: '詹姆斯式全能冲击',
    description: '强调身体、推进和传导，适合想做持球发动机与攻框核心的模板。',
    featuredPlayers: ['勒布朗·詹姆斯', '扬尼斯·阿德托昆博', '谢伊·吉尔杰斯-亚历山大'],
    candidatePlayerIds: ['lebron', 'giannis', 'shai', 'luka'],
    tags: ['推进攻框前锋', '持球发动机', '身体对抗'],
    accentA: '#2A1A12',
    accentB: '#8C4B24',
    badgeText: 'LBJ',
  }),
  createRecommendedTemplate({
    id: 'paint-dominator',
    name: '禁区统治中锋',
    subtitle: '奥尼尔式低位怪兽',
    description: '强调尺寸、力量和护筐，适合做禁区压制感非常强的中锋模板。',
    featuredPlayers: ['沙奎尔·奥尼尔', '安东尼·戴维斯', '维克托·文班亚马'],
    candidatePlayerIds: ['shaq', 'anthony-davis', 'wembanyama', 'giannis'],
    tags: ['禁区统治中锋', '护筐覆盖', '低位终结'],
    accentA: '#111111',
    accentB: '#7A5120',
    badgeText: '34',
  }),
  createRecommendedTemplate({
    id: 'hub-center',
    name: '高位策应中锋',
    subtitle: '约基奇式进攻枢纽',
    description: '强调传球、节奏和高位终结，适合做进攻轴心类模板。',
    featuredPlayers: ['尼古拉·约基奇', '卢卡·东契奇', '勒布朗·詹姆斯'],
    candidatePlayerIds: ['jokic', 'luka', 'lebron', 'durant'],
    tags: ['高位策应中锋', '进攻枢纽', '节奏控制'],
    accentA: '#171A21',
    accentB: '#5A3FC0',
    badgeText: '15',
  }),
  createRecommendedTemplate({
    id: 'rebound-enforcer',
    name: '篮板防守工兵',
    subtitle: '罗德曼式能量怪',
    description: '强调篮板、外防覆盖和对抗卡位，适合做蓝领防守型模板。',
    featuredPlayers: ['丹尼斯·罗德曼', '安东尼·戴维斯', '扬尼斯·阿德托昆博'],
    candidatePlayerIds: ['rodman', 'anthony-davis', 'giannis', 'wembanyama'],
    tags: ['篮板防守工兵', '协防补位', '卡位能量'],
    accentA: '#0F172A',
    accentB: '#0E7490',
    badgeText: '91',
  }),
]

export const defaultTagDefinitions: TagDefinition[] = [
  {
    id: 'two-way-guard',
    label: '双向分卫',
    description: '兼顾中距离、突破终结和外线压迫，适合作为稳健核心模板。',
    featuredPlayers: ['迈克尔·乔丹', '科比·布莱恩特'],
    focusFields: ['身高', '中投', '外防', '抢断'],
  },
  {
    id: 'tall-shot-creator',
    label: '高个投射核心',
    description: '依靠尺寸和出手点制造错位，强调臂展、身高和中远投。',
    featuredPlayers: ['凯文·杜兰特', '杰森·塔图姆'],
    focusFields: ['身高', '臂展', '中投', '三分'],
  },
  {
    id: 'downhill-forward',
    label: '推进攻框前锋',
    description: '强调身体对抗、推进和传导，是很适合持球发起的前锋模板。',
    featuredPlayers: ['勒布朗·詹姆斯', '扬尼斯·阿德托昆博'],
    focusFields: ['体重', '速度', '控球', '传球'],
  },
  {
    id: 'paint-dominator',
    label: '禁区统治中锋',
    description: '围绕低位、力量和护筐去搭建，是典型的内线终结模板。',
    featuredPlayers: ['沙奎尔·奥尼尔'],
    focusFields: ['体重', '力量', '扣篮', '盖帽'],
  },
  {
    id: 'hub-center',
    label: '高位策应中锋',
    description: '强调高位组织和节奏控制，更偏进攻枢纽而非纯终结点。',
    featuredPlayers: ['尼古拉·约基奇'],
    focusFields: ['传球', '中投', '体重', '后场篮板'],
  },
  {
    id: 'rebound-enforcer',
    label: '篮板防守工兵',
    description: '强调篮板落点、卡位和协防覆盖，是蓝领防守模板的代表。',
    featuredPlayers: ['丹尼斯·罗德曼', '安东尼·戴维斯'],
    focusFields: ['臂展', '力量', '外防', '后场篮板'],
  },
]

export const defaultNumberFields: NumberDrawField[] = [
  createRangeField('body.height', '身高', 170, 224, 198, 'cm', '贴近 2K Builder 的身高范围'),
  createRangeField('body.weight', '体重', 70, 170, 98, 'kg', '用于控制对抗与机动性的基础体重'),
  createRangeField('body.wingspan', '臂展', 175, 250, 211, 'cm', '长臂展会让护框和干扰更强'),
  createOptionField(
    'body.shoulderBuild',
    '肩宽/体型',
    ['精瘦', '标准', '宽肩', '强壮'],
    '标准',
    '更贴近 2K Builder 的体型描述，而不是纯数字指数',
  ),
  createRangeField('athleticism.speed', '速度', 25, 99, 65, '', '基础能力值区间使用 2K 常见概念'),
  createRangeField('athleticism.acceleration', '加速', 25, 99, 65, '', '第一步和启动爆发的核心指标'),
  createRangeField('athleticism.vertical', '弹跳', 25, 99, 65, '', '影响起跳高度与冲板上限'),
  createRangeField('athleticism.strength', '力量', 25, 99, 65, '', '影响卡位、对抗和低位稳定性'),
  createRangeField('finishing.layup', '上篮', 25, 99, 65, '', '篮下变向与抛投终结基础'),
  createRangeField('finishing.drivingDunk', '扣篮', 25, 99, 65, '', '冲框扣篮和隔扣上限'),
  createRangeField('finishing.closeShot', '近框终结', 25, 99, 65, '', '站桩终结和勾手类近框分数'),
  createRangeField('shooting.midRange', '中投', 25, 99, 65, '', '中距离跳投基础能力'),
  createRangeField('shooting.threePoint', '三分', 25, 99, 65, '', '远投威胁与接投上限'),
  createRangeField('shooting.freeThrow', '罚球', 25, 99, 65, '', '罚球稳定度'),
  createRangeField('playmaking.ballHandle', '控球', 25, 99, 65, '', '持球变化与护球能力'),
  createRangeField('playmaking.passAccuracy', '传球', 25, 99, 65, '', '传导速度与出球质量'),
  createRangeField('defense.perimeterDefense', '外防', 25, 99, 65, '', '外线横移与贴防基础'),
  createRangeField('defense.interiorDefense', '内防', 25, 99, 65, '', '低位顶防与近框抗衡'),
  createRangeField('defense.steal', '抢断', 25, 99, 65, '', '切球与线路预判能力'),
  createRangeField('defense.block', '盖帽', 25, 99, 65, '', '护框干扰与封盖上限'),
  createRangeField('rebounding.defensiveRebound', '后场篮板', 25, 99, 65, '', '保护篮板与终结回合能力'),
]

export const defaultNumberSession = createNumberDrawSession(defaultNumberFields)

export function createDefaultAppState(): AppState {
  return {
    version: 2,
    categories: structuredClone(defaultCategories),
    players: structuredClone(defaultPlayers),
    recommendedTemplates: structuredClone(defaultRecommendedTemplates),
    tagDefinitions: structuredClone(defaultTagDefinitions),
    numberFields: structuredClone(defaultNumberFields),
    numberSession: structuredClone(defaultNumberSession),
    templates: [],
    session: createSession(null, [...defaultFieldOrder]),
  }
}

function createRecommendedTemplate({
  id,
  name,
  subtitle,
  description,
  featuredPlayers,
  candidatePlayerIds,
  tags,
  accentA,
  accentB,
  badgeText,
}: {
  id: string
  name: string
  subtitle: string
  description: string
  featuredPlayers: string[]
  candidatePlayerIds: string[]
  tags: string[]
  accentA: string
  accentB: string
  badgeText: string
}): RecommendedTemplate {
  return {
    id,
    name,
    subtitle,
    description,
    featuredPlayers,
    candidatePlayerIds,
    tags,
    defaultCover: createTemplatePosterDataUrl({
      title: name,
      subtitle,
      featuredPlayers,
      accentA,
      accentB,
      badgeText,
    }),
    customCover: null,
    featuredFieldIds: [...defaultFieldOrder],
  }
}

function createPlayer(
  id: string,
  name: string,
  position: string,
  overall: number,
  era: string,
  tags: string[],
  aliases: string[],
  categories: PlayerProfile['categories'],
): PlayerProfile {
  return {
    id,
    name,
    position,
    overall,
    era,
    tags,
    aliases,
    categories,
  }
}

function createRangeField(
  id: string,
  label: string,
  min: number,
  max: number,
  defaultValue: number,
  unit: string,
  note: string,
): NumberDrawField {
  return {
    id,
    label,
    kind: 'range',
    min,
    max,
    defaultValue,
    unit,
    note,
  }
}

function createOptionField(
  id: string,
  label: string,
  options: string[],
  defaultValue: string,
  note: string,
): NumberDrawField {
  return {
    id,
    label,
    kind: 'options',
    options,
    defaultValue,
    note,
  }
}

function createNumberDrawSession(fields: NumberDrawField[]): NumberDrawSession {
  const now = new Date().toISOString()

  return {
    activeFieldId: fields[0]?.id ?? '',
    results: {},
    createdAt: now,
    updatedAt: now,
  }
}
