/**
 * 基金从业资格刷题网站 - 核心答题逻辑
 * 题目过滤、随机、判题、结果计算
 */

/**
 * 根据筛选条件过滤题目
 * @param {Array}  questions - 全部题目
 * @param {Object} filters   - { chapter: string, type: string }
 * @param {boolean} random   - 是否随机
 * @returns {Array}
 */
function filterQuestions(questions, filters, random) {
  let list = questions.filter(q => {
    if (filters.chapter !== 'all' && q.ch != filters.chapter) return false;
    if (filters.type   !== 'all' && q.type !== filters.type)   return false;
    return true;
  });
  if (random) list = [...list].sort(() => Math.random() - 0.5);
  return list;
}

/**
 * 初始化练习状态
 * @param {Array}   questions    - 题目列表
 * @param {Object}  savedData     - 已保存的答题记录 { questionId: { selected, correct, timestamp } }
 * @returns {Object} state
 */
function initQuizState(questions, savedData) {
  const answered      = new Array(questions.length).fill(false);
  const userSelections = new Array(questions.length).fill(null);
  let   correct       = 0;

  questions.forEach((q, i) => {
    const record = savedData[q.id] || null;
    if (record) {
      answered[i]      = true;
      userSelections[i] = record.selected;
      if (record.correct) correct++;
    }
  });

  // 跳到第一道未答题目；若全部已答则从头
  const firstUnanswered = answered.indexOf(false);
  const index = firstUnanswered === -1 ? 0 : firstUnanswered;

  return {
    questions,
    index,
    answered,
    userSelections,
    selected: new Set(),
    correct
  };
}

/**
 * 选中/取消选中选项
 * @param {Object} state
 * @param {number}  optionIndex
 */
function selectOption(state, optionIndex) {
  const q = state.questions[state.index];

  if (state.answered[state.index]) return; // 已提交则不可改

  if (q.type === 'single' || q.type === 'tf') {
    // 单选/判断：直接替换
    state.selected.clear();
    state.selected.add(optionIndex);
    // 更新选项 DOM 高亮
    document.querySelectorAll('.option').forEach((el, idx) => {
      el.classList.remove('selected');
      if (idx === optionIndex) el.classList.add('selected');
    });
  } else {
    // 多选：切换
    if (state.selected.has(optionIndex)) {
      state.selected.delete(optionIndex);
    } else {
      state.selected.add(optionIndex);
    }
    document.querySelectorAll('.option').forEach((el, idx) => {
      if (state.selected.has(idx)) el.classList.add('selected');
      else el.classList.remove('selected');
    });
  }
}

/**
 * 提交当前题答案
 * @param {Object} state
 * @param {string} storageKey
 * @returns {{ isCorrect: boolean }}
 */
function submitAnswer(state, storageKey) {
  if (state.selected.size === 0) {
    alert('请先选择答案');
    return null;
  }

  const q        = state.questions[state.index];
  const correctSet = new Set(q.ans);
  const selectedArr = [...state.selected];
  const isCorrect  = correctSet.size === selectedArr.length &&
                      [...correctSet].every(x => state.selected.has(x));

  if (!state.answered[state.index]) {
    state.answered[state.index]       = true;
    state.userSelections[state.index] = selectedArr;
    if (isCorrect) state.correct++;
    state.questions[state.index]._selected = selectedArr; // 暂存用于恢复显示
  }

  // 高亮选项
  document.querySelectorAll('.option').forEach((el, idx) => {
    el.classList.add('disabled');
    el.classList.remove('selected');
    if (correctSet.has(idx)) el.classList.add('correct');
    else if (state.selected.has(idx)) el.classList.add('wrong');
  });

  document.getElementById('explanation').classList.add('show');
  const submitBtn = document.getElementById('submitBtn');
  if (submitBtn) submitBtn.disabled = true;

  // 持久化
  saveAnswerRecord(storageKey, {
    id:       q.id,
    selected: selectedArr,
    correct:  isCorrect,
    timestamp: Date.now()
  });

  return { isCorrect };
}

/**
 * 恢复已答題目的显示状态
 * @param {Object} state
 */
function restoreQuestionState(state) {
  if (!state.answered[state.index]) return;
  const q    = state.questions[state.index];
  const sel  = state.userSelections[state.index] || [];
  const corr = new Set(q.ans);
  sel.forEach(idx => {
    const el = document.querySelector(`.option[data-idx="${idx}"]`);
    if (el) {
      el.classList.add('disabled');
      if (!corr.has(idx)) el.classList.add('wrong');
    }
  });
  document.querySelectorAll('.option').forEach((el, idx) => {
    if (corr.has(idx)) el.classList.add('correct');
  });
  document.getElementById('explanation').classList.add('show');
  const submitBtn = document.getElementById('submitBtn');
  if (submitBtn) submitBtn.disabled = true;
}

/**
 * 更新顶部进度和正确率
 * @param {Object} state
 */
function updateStats(state) {
  const answeredCount = state.answered.filter(x => x).length;
  const acc = answeredCount === 0 ? 0 : Math.round(state.correct / answeredCount * 100);
  document.getElementById('progress').textContent = state.index + 1;
  document.getElementById('accuracy').textContent = acc;
  const fill = state.questions.length === 0
    ? 0
    : Math.min((state.index + 1) / state.questions.length * 100, 100);
  document.getElementById('progressFill').style.width = fill + '%';
}

/**
 * 渲染结果页
 * @param {Object} state
 * @param {Function} onRestart
 */
function renderResult(state, onRestart) {
  const area  = document.getElementById('quizArea');
  const total = state.questions.length;
  const score = Math.round(state.correct / total * 100);
  let emoji = '🎉', comment = '太棒了！继续保持！';
  if      (score < 60) { emoji = '💪'; comment = '需要再加油，重点复习错题！'; }
  else if (score < 80) { emoji = '👍'; comment = '不错，再接再厉！'; }

  area.innerHTML = `
    <div class="result-box">
      <h2>${emoji} 练习完成</h2>
      <div class="score">${score}分</div>
      <p>共 ${total} 题，答对 ${state.correct} 题</p>
      <p style="margin-top:10px;color:#888">${comment}</p>
      <div style="margin-top:30px">
        <button class="primary" onclick="location.reload()">再来一遍</button>
      </div>
    </div>
  `;
  // 隐藏进度条
  document.querySelector('.progress-bar').style.display = 'none';
}
