/**
 * 基金从业资格刷题网站 - 本地存储管理
 * 统一管理 localStorage 读写、导入导出、清空
 */

/**
 * 从 localStorage 读取指定科目的答题记录
 * @param {string} storageKey
 * @returns {Object}
 */
function loadSavedData(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

/**
 * 保存单条答题记录
 * @param {string} storageKey
 * @param {Object} record - { selected: number[], correct: boolean, timestamp: number }
 */
function saveAnswerRecord(storageKey, record) {
  const data = loadSavedData(storageKey);
  data[record.id] = {
    selected:  record.selected,
    correct:    record.correct,
    timestamp:  record.timestamp || Date.now()
  };
  localStorage.setItem(storageKey, JSON.stringify(data));
  flashSaveIndicator();
}

/**
 * 读取某道题的保存记录
 * @param {string} storageKey
 * @param {string} questionId
 * @returns {Object|null}
 */
function getSavedAnswer(storageKey, questionId) {
  const data = loadSavedData(storageKey);
  return data[questionId] || null;
}

/**
 * 获取科目统计信息
 * @param {string} storageKey
 * @param {number} totalQuestions - 该科目总题数
 * @returns {{done: number, correct: number, rate: number}}
 */
function getSubjectStats(storageKey, totalQuestions) {
  const data = loadSavedData(storageKey);
  const entries = Object.values(data);
  const done    = entries.length;
  const correct = entries.filter(e => e.correct).length;
  const rate    = done > 0 ? Math.round(correct / done * 100) : 0;
  return { done, correct, rate };
}

/**
 * 闪烁「已保存」提示
 */
function flashSaveIndicator() {
  const el = document.getElementById('saveIndicator');
  if (!el) return;
  el.classList.add('show');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('show'), 2000);
}

/**
 * 导出答题记录为 JSON 文件
 * @param {string} storageKey
 * @param {string} subjectId
 * @param {string} subjectName
 */
function exportAnswers(storageKey, subjectId, subjectName) {
  const data = loadSavedData(storageKey);
  if (Object.keys(data).length === 0) {
    alert('当前没有答题记录可导出');
    return;
  }
  const exportObj = {
    app:        '基金从业资格刷题网站',
    subjectId:   subjectId,
    subjectName: subjectName,
    exportTime: new Date().toISOString(),
    version:    '1.0.0',
    answers:    data
  };
  const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `基金刷题记录_${subjectId}_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * 导入答题记录 JSON 文件
 * @param {Event} event
 * @param {string} storageKey
 * @param {Function} onSuccess - 导入成功后回调
 */
function importAnswers(event, storageKey, onSuccess) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const imported  = JSON.parse(e.target.result);
      const answers   = imported.answers || imported;
      if (typeof answers !== 'object') throw new Error('格式错误');
      const existing  = loadSavedData(storageKey);
      const merged    = { ...existing, ...answers };
      localStorage.setItem(storageKey, JSON.stringify(merged));
      const newCount  = Object.keys(answers).length;
      alert(`导入成功！共导入 ${newCount} 条记录（已与现有记录合并）`);
      if (onSuccess) onSuccess();
    } catch (err) {
      alert('导入失败：文件格式不正确。请使用本应用导出的 JSON 文件。');
    }
  };
  reader.readAsText(file);
  event.target.value = ''; // 允许重复导入同一文件
}

/**
 * 清除指定科目的全部答题记录
 * @param {string} storageKey
 * @param {Function} onSuccess - 成功后回调
 */
function clearSavedData(storageKey, onSuccess) {
  if (!confirm('确定清除所有本地答题记录？此操作不可恢复。')) return;
  localStorage.removeItem(storageKey);
  alert('答题记录已清除');
  if (onSuccess) onSuccess();
}
