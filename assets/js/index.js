/**
 * 首页逻辑：加载科目配置、渲染卡片、读取统计
 */

let subjectsData = null;

async function loadSubjects() {
  try {
    const res  = await fetch('./data/subjects.json');
    const json = await res.json();
    subjectsData = json.subjects;
    renderSubjectCards(subjectsData);
  } catch (e) {
    console.error('加载科目配置失败', e);
    document.getElementById('subjectCards').innerHTML =
      '<p style="color:#fff;text-align:center">加载失败，请刷新重试</p>';
  }
}

function renderSubjectCards(subjects) {
  const container = document.getElementById('subjectCards');
  container.innerHTML = subjects.map(subj => {
    const stats = getSubjectStats(subj.storageKey, 0);
    return `
      <a class="card ${subj.cardClass}" href="./app.html?subject=${subj.id}">
        <span class="card-icon">${subj.icon}</span>
        <h2>${subj.name}</h2>
        <p>${subj.description}</p>
        <span class="badge">${subj.shortName}</span>
        <div class="stats-row">
          <div class="stat">
            <span class="stat-num" id="total-${subj.id}">-</span>
            <span class="stat-label">题目总数</span>
          </div>
          <div class="stat">
            <span class="stat-num" id="done-${subj.id}">${stats.done}</span>
            <span class="stat-label">已完成</span>
          </div>
          <div class="stat">
            <span class="stat-num" id="rate-${subj.id}">${stats.rate}%</span>
            <span class="stat-label">正确率</span>
          </div>
        </div>
      </a>
    `;
  }).join('');

  // 异步加载各科目实际题量
  subjects.forEach(loadSubjectTotal);
}

async function loadSubjectTotal(subj) {
  try {
    const res  = await fetch(subj.dataFile);
    const json = await res.json();
    const total = json.questions ? json.questions.length : 0;
    const el = document.getElementById(`total-${subj.id}`);
    if (el) el.textContent = total;
  } catch (e) {
    // 忽略
  }
}

document.addEventListener('DOMContentLoaded', loadSubjects);
