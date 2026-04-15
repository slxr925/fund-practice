/**
 * 基金从业资格刷题网站 - 全局配置
 * 统一管理科目配置、题型映射、默认设置
 */

const CONFIG = {
  appName: '基金从业资格刷题网站',
  appVersion: '1.0.0',
  examYear: '2026',
  storagePrefix: 'fund_practice',
  storageSuffix: '_answers',

  // 题型映射
  questionTypes: {
    single: { label: '单选题', tagClass: 'tag-single', score: 0.5 },
    multi:  { label: '多选题', tagClass: 'tag-multi',  score: 1.0 },
    tf:     { label: '判断题', tagClass: 'tag-tf',     score: 1.0 }
  },

  // 选项字母
  optionLetters: ['A', 'B', 'C', 'D', 'E'],

  // 答案标签映射
  answerLabels: {
    single: '单选题',
    multi:  '多选题',
    tf:     '判断题'
  },

  // 考试信息
  examInfo: {
    totalScore: 100,
    timeLimit:  120,   // 分钟
    questionCount: {
      single: 40,
      multi:  40,
      tf:     30,
      comp:   10   // 综合题
    },
    scorePerType: {
      single: 0.5,
      multi:  1.0,
      tf:     1.0,
      comp:   1.0
    }
  }
};

/**
 * 根据科目ID生成存储key
 * @param {string} subjectId
 * @returns {string}
 */
function getStorageKey(subjectId) {
  return `${CONFIG.storagePrefix}_${subjectId}${CONFIG.storageSuffix}`;
}

/**
 * 获取题型标签CSS类
 * @param {string} type
 * @returns {string}
 */
function getTypeTagClass(type) {
  return CONFIG.questionTypes[type]?.tagClass || 'tag-single';
}

/**
 * 获取题型中文名
 * @param {string} type
 * @returns {string}
 */
function getTypeLabel(type) {
  return CONFIG.questionTypes[type]?.label || '单选题';
}

/**
 * 获取选项字母
 * @param {number} index
 * @returns {string}
 */
function getOptionLetter(index) {
  return CONFIG.optionLetters[index] || String.fromCharCode(65 + index);
}
