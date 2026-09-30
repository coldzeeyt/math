// Grade / topic / time picker used by the solo and host setup screens.
import { GRADES, topicsForGrade } from './questions.js';
import { esc, store, fmt, sound } from './ui.js';

const DURATIONS = {
  solo: [[60, '1 min'], [120, '2 min'], [180, '3 min'], [300, '5 min'], [0, '∞ Zen']],
  host: [[120, '2 min'], [180, '3 min'], [300, '5 min'], [420, '7 min'], [600, '10 min'], [900, '15 min'], [0, 'No limit']],
};
const GOALS = [5000, 10000, 25000, 50000, 100000, 250000];

export function renderSetup(root, mode) {
  const saved = store.get(`mb:setup:${mode}`, {});
  const state = {
    grade: saved.grade ?? 3,
    topics: saved.topics ?? null,
    duration: saved.duration ?? (mode === 'solo' ? 120 : 300),
    goal: saved.goal ?? 25000,
  };

  root.innerHTML = `
    <div class="field"><span class="label">1. Pick a grade level</span><div class="grades">
      ${GRADES.map(g => `<button type="button" class="grade-btn" data-grade="${g.id}"><span class="e">${g.emoji}</span><span class="g">${g.short}</span><span class="n">${g.id === 0 ? 'Kinder' : 'Grade'}</span></button>`).join('')}
    </div></div>
    <div class="field"><span class="label">2. Choose topics <span class="muted" style="font-weight:600;font-size:.9rem">(tap to turn on/off)</span></span><div class="chips" id="topicChips"></div></div>
    <div class="field"><span class="label">3. How long?</span><div class="seg" id="durSeg">
      ${DURATIONS[mode].map(([v, l]) => `<button type="button" data-v="${v}">${l}</button>`).join('')}
    </div></div>
    ${mode === 'host' ? `<div class="field"><span class="label">4. Class goal 🚀 <span class="muted" style="font-weight:600;font-size:.9rem">(points everyone earns together)</span></span><div class="seg" id="goalSeg">
      ${GOALS.map(v => `<button type="button" data-v="${v}">${fmt(v)}</button>`).join('')}
    </div></div>` : ''}`;

  const paintTopics = () => {
    const all = topicsForGrade(state.grade);
    if (!state.topics || !state.topics.some(id => all.some(t => t.id === id))) state.topics = all.map(t => t.id);
    root.querySelector('#topicChips').innerHTML = all.map(t =>
      `<button type="button" class="chip ${state.topics.includes(t.id) ? 'on' : ''}" data-id="${t.id}">${t.icon} ${esc(t.name)}</button>`).join('');
  };
  const paint = () => {
    root.querySelectorAll('.grade-btn').forEach(b => b.classList.toggle('on', Number(b.dataset.grade) === state.grade));
    root.querySelectorAll('#durSeg button').forEach(b => b.classList.toggle('on', Number(b.dataset.v) === state.duration));
    root.querySelectorAll('#goalSeg button').forEach(b => b.classList.toggle('on', Number(b.dataset.v) === state.goal));
    paintTopics();
  };

  root.addEventListener('click', e => {
    const g = e.target.closest('.grade-btn');
    if (g) { state.grade = Number(g.dataset.grade); state.topics = null; sound('pop'); }
    const chip = e.target.closest('.chip');
    if (chip) {
      const id = chip.dataset.id;
      state.topics = state.topics.includes(id) ? state.topics.filter(t => t !== id) : [...state.topics, id];
      if (!state.topics.length) state.topics = [id]; // always keep at least one
    }
    const d = e.target.closest('#durSeg button');
    if (d) state.duration = Number(d.dataset.v);
    const goal = e.target.closest('#goalSeg button');
    if (goal) state.goal = Number(goal.dataset.v);
    if (g || chip || d || goal) paint();
  });
  paint();

  return {
    get() {
      store.set(`mb:setup:${mode}`, state);
      return { ...state, topics: [...state.topics] };
    },
  };
}
