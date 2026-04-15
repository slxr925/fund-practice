/**
 * 练习页逻辑：加载题库、渲染题目、处理答题
 */

// 全局状态
let state       = null;   // 来自 quiz-core.js
let subjectId   = null;
let storageKey  = null;
let currentData = null;   // 整个题库 JSON

// ============================================================
// 初始化
// ============================================================
async function init() {
  const params = new URLSearchParams(location.search);
  subjectId = params.get('subject');
  if (!subjectId) {
    document.getElementById('appContainer').innerHTML =
      '<div class="result-box"><h2>⚠️ 未指定科目</h2><p>请从首页进入</p><a href="./index.html">返回首页</a></div>';
    return;
  }

  try {
    // 1. 加载科目配置
    const subRes = await fetch('./data/subjects.json');
    const subJson = await subRes.json();
    const subj = subJson.subjects.find(s => s.id === subjectId);
    if (!subj) throw new Error('科目不存在');
    storageKey = subj.storageKey;

    // 2. 加载题库
    const qRes  = await fetch(subj.dataFile);
    currentData = await qRes.json();

    // 3. 渲染页面骨架
    renderAppShell(subj, currentData);

    // 4. 绑定控制栏事件
    bindControls();

    // 5. 初始化答题状态
    startQuiz();
  } catch (e) {
    console.error(e);
    document.getElementById('appContainer').innerHTML =
      `<div class="result-box"><h2>⚠️ 加载失败</h2><p>${e.message}</p><a href="./index.html">返回首页</a></div>`;
  }
}

// ============================================================
// 渲染页面骨架
// ============================================================
function renderAppShell(subj, data) {
  const container = document.getElementById('appContainer');
  const letters   = CONFIG.optionLetters;

  container.innerHTML = `
    <header class="app-header">
      <a href="./index.html" class="home-btn" title="返回首页">🏠 首页</a>
      <h1>${subj.icon} ${subj.name}</h1>
      <p>${subj.examInfo}</p>
    </header>

    <div class="controls">
      <label>章节：</label>
      <select id="chapterSelect">
        <option value="all">全部章节</option>
        ${data.chapters.map(ch =>
          `<option value="${ch.id}">第${ch.id}章 ${ch.name}</option>`
        ).join('')}
      </select>

      <label>题型：</label>
      <select id="typeSelect">
        <option value="all">全部题型</option>
        <option value="single">单选题</option>
        <option value="multi">多选题</option>
        <option value="tf">判断题</option>
      </select>

      <button class="primary" id="startBtn">🔄 开始/重置</button>
      <button id="orderBtn">🔀 <span id="orderLabel">顺序</span></button>

      <div class="jump-group">
        <label>跳转：</label>
        <input type="number" id="jumpInput" min="1" placeholder="题号">
        <button id="jumpBtn">GO</button>
      </div>

      <div class="stats">
        进度：<span id="progress">0</span> / <span id="total">0</span>
        正确率：<span id="accuracy">0</span>%
      </div>
    </div>

    <div class="progress-bar"><div class="progress-fill" id="progressFill" style="width:0%"></div></div>

    <div class="quiz-area" id="quizArea">
      <p style="color:#888;text-align:center;margin-top:60px">
        点击「开始/重置」按钮开始练习
      </p>
    </div>

    <div class="footer">
      <div class="footer-left">
        <a href="https://github.com/slxr925/fund-practice" target="_blank" rel="noopener">
          <svg class="gh-icon" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          fund-practice
        </a>
        <a class="star-btn" href="https://github.com/slxr925/fund-practice" target="_blank" rel="noopener">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/>
          </svg>
          Star
        </a>
        <span class="save-indicator" id="saveIndicator">已自动保存</span>
      </div>
      <div class="footer-right">
        <button onclick="exportAnswers(storageKey,'${subjectId}','${subj.name}')" title="导出答题记录">📤 导出记录</button>
        <button onclick="document.getElementById('importFile').click()" title="导入答题记录">📥 导入记录</button>
        <button onclick="clearSavedData(storageKey, startQuiz)" title="清除所有本地答题数据">🗑️ 清除记录</button>
        <input type="file" id="importFile" accept=".json" style="display:none" onchange="importAnswers(event, storageKey, startQuiz)">
      </div>
    </div>
  `;
}

// ============================================================
// 绑定控制栏事件
// ============================================================
function bindControls() {
  document.getElementById('startBtn').addEventListener('click', startQuiz);
  document.getElementById('orderBtn').addEventListener('click', toggleOrder);
  document.getElementById('jumpBtn').addEventListener('click', jumpTo);
  document.getElementById('jumpInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') jumpTo();
  });
}

// ============================================================
// 开始/重置练习
// ============================================================
function startQuiz() {
  const chapterFilter = document.getElementById('chapterSelect').value;
  const typeFilter    = document.getElementById('typeSelect').value;
  const random        = document.getElementById('orderLabel').textContent === '随机';

  const questions = filterQuestions(currentData.questions, {
    chapter: chapterFilter,
    type:    typeFilter
  }, random);

  const saved = loadSavedData(storageKey);
  state      = initQuizState(questions, saved);

  document.getElementById('total').textContent = questions.length;
  document.querySelector('.progress-bar').style.display = '';

  renderQuestion();
}

// ============================================================
// 切换顺序/随机
// ============================================================
function toggleOrder() {
  const label = document.getElementById('orderLabel');
  label.textContent = label.textContent === '顺序' ? '随机' : '顺序';
  startQuiz();
}

// ============================================================
// 题号跳转
// ============================================================
function jumpTo() {
  const input = document.getElementById('jumpInput');
  const num   = parseInt(input.value, 10);
  if (isNaN(num) || num < 1 || num > state.questions.length) {
    alert('请输入有效题号（1 ~ ' + state.questions.length + '）');
    input.focus();
    return;
  }
  state.index = num - 1;
  renderQuestion();
  input.value = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
// 渲染当前题目
// ============================================================
function renderQuestion() {
  const area = document.getElementById('quizArea');

  if (state.questions.length === 0) {
    area.innerHTML = '<div class="result-box"><h2>😕 无可用题目</h2><p>请调整筛选条件</p></div>';
    updateStats(state);
    return;
  }
  if (state.index >= state.questions.length) {
    renderResult(state);
    return;
  }

  const q        = state.questions[state.index];
  const typeTag  = getTypeTagClass(q.type);
  const typeName = getTypeLabel(q.type);
  const chMap    = {};
  currentData.chapters.forEach(ch => { chMap[ch.id] = ch.name; });

  state.selected = new Set();
  const alreadyAnswered = state.answered[state.index];

  area.innerHTML = `
    <div class="question-meta">
      <span>
        <span class="q-type-tag ${typeTag}">${typeName}</span>
        ${chMap[q.ch] ? '第' + q.ch + '章 ' + chMap[q.ch] : '第' + q.ch + '章'}
      </span>
      <span>第 ${state.index + 1} / ${state.questions.length} 题</span>
    </div>
    <div class="question">${q.q}</div>
    <div class="options" id="optionsList">
      ${q.opts.map((o, i) => `
        <div class="option" data-idx="${i}" onclick="handleOptionClick(${i})">
          <span class="option-letter">${CONFIG.optionLetters[i]}</span>${o}
        </div>
      `).join('')}
    </div>
    <div class="explanation" id="explanation">
      <strong>【答案】</strong>${q.ans.map(i => CONFIG.optionLetters[i]).join('')}<br>
      <strong>【解析】</strong>${q.exp}
    </div>
    <div class="actions">
      <button onclick="prevQuestion()" ${state.index === 0 ? 'disabled' : ''}>← 上一题</button>
      <div class="actions-right">
        <button id="submitBtn" class="primary" onclick="handleSubmit()">提交答案</button>
        <button onclick="nextQuestion()">下一题 →</button>
      </div>
    </div>
  `;

  if (alreadyAnswered) {
    restoreQuestionState(state);
  }

  updateStats(state);
}

// ============================================================
// 选项点击处理（暴露到全局供 onclick 调用）
// ============================================================
window.handleOptionClick = function(optionIndex) {
  selectOption(state, optionIndex);
};

// ============================================================
// 提交答案（暴露到全局）
// ============================================================
window.handleSubmit = function() {
  submitAnswer(state, storageKey);
  updateStats(state);
};

// ============================================================
// 上一题 / 下一题（暴露到全局供 onclick 调用）
// ============================================================
window.prevQuestion = function() {
  if (state.index > 0) {
    state.index--;
    renderQuestion();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

window.nextQuestion = function() {
  state.index++;
  renderQuestion();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ============================================================
// 启动
// ============================================================
document.addEventListener('DOMContentLoaded', init);
