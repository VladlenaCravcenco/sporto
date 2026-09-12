import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(import.meta.dirname, '..');
const docs = [
  ['plan', 'План', '02_MIGRATION_PLAN.md'],
  ['current', 'Текущая архитектура', '00_CURRENT_STATE.md'],
  ['target', 'Целевая архитектура', '01_TARGET_ARCHITECTURE.md'],
  ['decisions', 'Решения', '03_DECISIONS.md'],
  ['supabase-audit', 'Supabase', 'audits/2026-08-10_SUPABASE_LIVE_AUDIT.md'],
  ['changelog', 'История', '04_CHANGELOG.md'],
];

const escapeHtml = (value) => value
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#39;');

const inline = (value) => escapeHtml(value)
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

function taskId(text) {
  return crypto.createHash('sha1').update(text).digest('hex').slice(0, 12);
}

function renderMarkdown(markdown, key) {
  const lines = markdown.split(/\r?\n/);
  let html = '';
  let list = false;
  let code = false;
  let codeLang = '';
  let codeLines = [];
  let table = false;
  let phaseOpen = false;
  let phaseIndex = 0;
  let taskCount = 0;

  const closeList = () => { if (list) { html += '</ul>'; list = false; } };
  const closeTable = () => { if (table) { html += '</tbody></table></div>'; table = false; } };
  const closePhase = () => { if (phaseOpen) { closeList(); closeTable(); html += '</section>'; phaseOpen = false; } };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('```')) {
      if (!code) {
        closeList(); closeTable(); code = true; codeLang = line.slice(3).trim(); codeLines = [];
      } else {
        const body = escapeHtml(codeLines.join('\n'));
        html += codeLang === 'mermaid'
          ? `<div class="diagram-source"><span>Mermaid source</span><pre>${body}</pre></div>`
          : `<pre>${body}</pre>`;
        code = false;
      }
      continue;
    }
    if (code) { codeLines.push(line); continue; }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      closeList(); closeTable();
      const level = heading[1].length;
      const title = inline(heading[2]);
      if (level === 1) html += `<header class="doc-head"><h1>${title}</h1></header>`;
      else if (level === 2) {
        closePhase();
        phaseIndex++;
        const phaseAttrs = key === 'plan' ? ` id="phase-${phaseIndex - 1}" data-phase="${phaseIndex - 1}"` : '';
        html += `<section class="phase"${phaseAttrs}><h2>${title}</h2>`;
        phaseOpen = true;
      } else html += `<h3>${title}</h3>`;
      continue;
    }

    if (/^\|.+\|$/.test(line) && /^\|[-: |]+\|$/.test(lines[i + 1] || '')) {
      closeList();
      const heads = line.slice(1, -1).split('|').map(x => x.trim());
      html += '<div class="table-wrap"><table><thead><tr>' + heads.map(x => `<th>${inline(x)}</th>`).join('') + '</tr></thead><tbody>';
      table = true; i++;
      continue;
    }
    if (table && /^\|.+\|$/.test(line)) {
      const cells = line.slice(1, -1).split('|').map(x => x.trim());
      html += '<tr>' + cells.map(x => `<td>${inline(x)}</td>`).join('') + '</tr>';
      continue;
    }
    if (table) closeTable();

    const task = line.match(/^- \[([ x])\] (.+)$/);
    if (task) {
      closeList(); taskCount++;
      const text = task[2];
      const id = taskId(`${key}:${text}`);
      html += `<label class="task" data-search="${escapeHtml(text.toLowerCase())}"><input type="checkbox" data-task="${id}" ${task[1] === 'x' ? 'checked data-fixed="true"' : ''}><span>${inline(text)}</span></label>`;
      continue;
    }

    const bullet = line.match(/^\s*- (.+)$/);
    if (bullet) {
      if (!list) { html += '<ul>'; list = true; }
      html += `<li>${inline(bullet[1])}</li>`;
      continue;
    }
    closeList();
    if (!line.trim()) continue;
    html += `<p>${inline(line.trim())}</p>`;
  }
  closeList(); closeTable(); closePhase();
  return { html, taskCount };
}

const rendered = docs.map(([key, label, file]) => {
  const markdown = fs.readFileSync(path.join(import.meta.dirname, file), 'utf8');
  const result = renderMarkdown(markdown, key);
  return { key, label, ...result };
});

const panels = rendered.map((doc, index) => `<main id="${doc.key}" class="panel ${index === 0 ? 'active' : ''}" data-panel="${doc.key}">${doc.html}</main>`).join('\n');
const tabs = rendered.map((doc, index) => `<button class="tab ${index === 0 ? 'active' : ''}" data-tab="${doc.key}">${doc.label}</button>`).join('');
const planSource = fs.readFileSync(path.join(import.meta.dirname, '02_MIGRATION_PLAN.md'), 'utf8');
const phaseTitles = [...planSource.matchAll(/^## (Phase .+)$/gm)].map(match => match[1]);
const phaseRoad = phaseTitles.map((title, index) => `<a href="#phase-${index}" class="road-step" data-road="${index}"><i></i><span>${escapeHtml(title.replace(/Phase \d+ — /, ''))}</span><small>0 / 0</small></a>`).join('');

const html = `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>SPORTO.MD — Project Dashboard</title>
<style>
:root{--paper:#f4f3ee;--ink:#383936;--muted:#858680;--line:#d8d7d0;--soft:#ebeae4;--done:#6f8170}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--paper);color:var(--ink);font:14px/1.55 Inter,ui-sans-serif,system-ui,-apple-system,sans-serif}button,input{font:inherit}.top{position:sticky;top:0;z-index:30;border-bottom:1px solid var(--line);background:rgba(244,243,238,.96)}.topline{display:flex;align-items:center;gap:24px;padding:14px 24px}.brand{font-weight:650;letter-spacing:.08em}.tabs{display:flex;gap:18px;overflow:auto}.tab{padding:5px 0;border:0;border-bottom:1px solid transparent;background:none;color:var(--muted);cursor:pointer;white-space:nowrap}.tab.active{color:var(--ink);border-color:var(--ink)}.tools{display:flex;align-items:center;gap:12px;margin-left:auto}.progress{width:150px;height:3px;background:var(--line)}.progress>i{display:block;height:100%;background:var(--done)}.count{color:var(--muted);font-size:11px;white-space:nowrap}.search{width:220px;padding:6px 0;border:0;border-bottom:1px solid var(--line);outline:none;background:none;color:var(--ink)}.sheet{width:min(1800px,calc(100% - 40px));margin:34px auto 90px}.panel{display:none}.panel.active{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:22px}.doc-head{grid-column:1/-1;padding-bottom:18px}.doc-head h1{margin:0;font-size:clamp(30px,4vw,58px);font-weight:420;letter-spacing:-.045em}.phase{grid-column:span 6;padding:22px 0;border-top:1px solid var(--line);break-inside:avoid}.phase h2{margin:0 0 18px;font-size:22px;font-weight:480;letter-spacing:-.02em}.phase h3{margin:24px 0 10px;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)}p{max-width:850px;color:#666762}code{font:12px ui-monospace,SFMono-Regular,Menlo,monospace;color:#555650}.task{display:flex;align-items:flex-start;gap:11px;padding:8px 3px;border-bottom:1px solid rgba(216,215,208,.65);cursor:pointer}.task input{width:16px;height:16px;margin-top:3px;accent-color:var(--done);flex:none}.task input:checked+span{color:#92938e;text-decoration:line-through}.task.hidden{display:none}.task+ul{margin:4px 0 10px 31px;color:var(--muted);font-size:12px}ul{padding-left:20px;color:#666762}.table-wrap{overflow:visible;border-top:1px solid var(--line)}table{width:100%;border-collapse:collapse;table-layout:auto;font-size:12px}th,td{padding:9px 10px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}th{color:var(--muted);font-weight:550}.diagram-source pre,pre{white-space:pre-wrap;overflow-wrap:anywhere;padding:14px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line);font:11px/1.6 ui-monospace,monospace;color:#666}.diagram-source>span{display:block;margin-top:12px;color:var(--muted);font-size:10px;text-transform:uppercase}.architecture{grid-column:1/-1;display:grid;grid-template-columns:1fr 70px 1fr;align-items:center;gap:20px;padding:28px 0 42px;border-top:1px solid var(--line)}.arch{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.node{display:flex;align-items:center;justify-content:center;min-height:76px;padding:12px;border:1px solid var(--line);text-align:center}.arrow{text-align:center;color:var(--muted);font-size:24px}.arch-label{margin-bottom:10px;color:var(--muted);font-size:10px;text-transform:uppercase;letter-spacing:.1em}.overview{display:none;grid-template-columns:repeat(12,minmax(0,1fr));gap:22px;margin-bottom:30px}.overview.visible{display:grid}.overview h2{grid-column:1/-1;margin:0;font-size:22px;font-weight:480}.legend{grid-column:1/-1;color:var(--muted);font-size:12px}.fixed-note{color:var(--muted);font-size:10px}@media(max-width:1000px){.topline{align-items:flex-start;flex-wrap:wrap}.tools{width:100%;margin:0}.search{flex:1}.panel.active{grid-template-columns:1fr}.phase{grid-column:1/-1}.architecture{grid-template-columns:1fr}.arrow{transform:rotate(90deg)}.arch{grid-template-columns:repeat(2,1fr)}}@media(max-width:620px){.sheet{width:calc(100% - 24px)}.topline{padding:12px}.progress{width:80px}.arch{grid-template-columns:1fr}.tools{flex-wrap:wrap}.search{width:100%;flex-basis:100%}table,thead,tbody,tr,th,td{display:block}thead{display:none}tr{padding:8px 0;border-bottom:1px solid var(--line)}td{border:0;padding:3px 0}}
.panel>p,.panel>ul,.panel>.task{grid-column:1/-1}
.story{grid-column:1/-1;padding:24px 0 34px;border-top:1px solid var(--line)}.story-title{margin:0 0 18px;font-size:21px;font-weight:480}.story-note{margin:8px 0 0;color:var(--muted);font-size:12px}.three-state{display:grid;grid-template-columns:1fr 44px 1fr 44px 1fr;align-items:stretch;gap:10px}.state{padding:18px;border:1px solid var(--line)}.state b{display:block;margin-bottom:8px;font-size:11px;letter-spacing:.09em;text-transform:uppercase}.state p{margin:0;font-size:13px}.state-arrow{display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:20px}.journeys{display:grid;grid-template-columns:1fr 1fr;gap:24px}.journey{padding:16px 0;border-top:1px solid var(--line)}.journey h3{margin:0 0 14px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.08em}.flowline{display:flex;align-items:center;gap:7px}.flowbox{flex:1;min-height:62px;display:flex;align-items:center;justify-content:center;padding:9px;border:1px solid var(--line);text-align:center;font-size:12px}.flowarrow{color:var(--muted)}.fate{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.fate-card{padding:14px;border-top:2px solid var(--line);background:rgba(255,255,255,.18)}.fate-card small{display:block;margin-bottom:6px;color:var(--muted);font-size:9px;letter-spacing:.09em;text-transform:uppercase}.fate-card b{font-size:13px}.fate-card p{margin:5px 0 0;font-size:11px}.fate-card.keep{border-color:#879788}.fate-card.move{border-color:#b1a587}.fate-card.replace{border-color:#9a939f}.fate-card.remove{border-color:#b59a91}.road{display:grid;grid-template-columns:repeat(11,1fr);gap:0;overflow:visible}.road-step{position:relative;min-width:0;padding:0 8px;text-decoration:none;color:var(--ink);text-align:center}.road-step:before{content:'';position:absolute;top:7px;left:0;right:0;height:1px;background:var(--line)}.road-step:first-child:before{left:50%}.road-step:last-child:before{right:50%}.road-step i{position:relative;z-index:1;display:block;width:15px;height:15px;margin:0 auto 10px;border:1px solid #aaa;background:var(--paper);border-radius:50%}.road-step.started i{background:#c5c9be}.road-step.done i{background:var(--done);border-color:var(--done)}.road-step span{display:block;font-size:10px;line-height:1.25}.road-step small{display:block;margin-top:4px;color:var(--muted);font-size:9px}
@media(max-width:1000px){.three-state{grid-template-columns:1fr}.state-arrow{transform:rotate(90deg)}.journeys{grid-template-columns:1fr}.fate{grid-template-columns:repeat(2,1fr)}.road{grid-template-columns:1fr;text-align:left}.road-step{display:grid;grid-template-columns:22px 1fr auto;align-items:center;text-align:left;padding:7px 0}.road-step:before{top:0;bottom:0;left:7px;right:auto;width:1px;height:auto}.road-step:first-child:before{top:50%;left:7px}.road-step:last-child:before{right:auto;bottom:50%}.road-step i{margin:0}.road-step small{margin:0}}
@media(max-width:620px){.fate{grid-template-columns:1fr}.flowline{display:grid;grid-template-columns:1fr}.flowarrow{text-align:center;transform:rotate(90deg)}}
@media print{.top{position:static}.tools{display:none}.sheet{width:100%;margin:20px}.panel{display:none!important}.panel.active{display:grid!important}.phase{break-inside:avoid}}
</style></head><body>
<header class="top"><div class="topline"><div class="brand">SPORTO.MD</div><nav class="tabs">${tabs}</nav><div class="tools"><input id="search" class="search" placeholder="Найти задачу"><div class="progress"><i id="bar"></i></div><span id="count" class="count"></span></div></div></header>
<div class="sheet">
<section id="architecture" class="overview visible">
  <h2>Что происходит с проектом</h2>
  <div class="story"><h3 class="story-title">Миграция проходит безопасно в три шага</h3><div class="three-state"><div class="state"><b>1 · Сейчас</b><p>Рабочий сайт находится на Vercel. Пользователи продолжают им пользоваться.</p></div><div class="state-arrow">→</div><div class="state"><b>2 · Параллельно</b><p>Новая версия строится на закрытом Host.md staging. Старый production не меняется.</p></div><div class="state-arrow">→</div><div class="state"><b>3 · После проверки</b><p>DNS переключается на Host.md. Vercel остаётся временным rollback, затем отключается.</p></div></div></div>
  <div class="story"><h3 class="story-title">Как открывается страница товара</h3><div class="journeys"><div class="journey"><h3>Сейчас — два разных пути</h3><div class="flowline"><div class="flowbox">Человек</div><span class="flowarrow">→</span><div class="flowbox">React SPA</div><span class="flowarrow">→</span><div class="flowbox">JavaScript загружает данные</div></div><div class="flowline" style="margin-top:8px"><div class="flowbox">Google / соцсеть</div><span class="flowarrow">→</span><div class="flowbox">Vercel SEO Function</div><span class="flowarrow">→</span><div class="flowbox">Упрощённый HTML</div></div></div><div class="journey"><h3>После — один понятный путь</h3><div class="flowline"><div class="flowbox">Любой посетитель</div><span class="flowarrow">→</span><div class="flowbox">Next.js на Host.md</div><span class="flowarrow">→</span><div class="flowbox">Готовая полная HTML-страница</div><span class="flowarrow">→</span><div class="flowbox">Supabase</div></div><p class="story-note">Человек и поисковик получают одинаковый полноценный контент.</p></div></div></div>
  <div class="story"><h3 class="story-title">Что останется, а что изменится</h3><div class="fate"><div class="fate-card keep"><small>Остаётся</small><b>Supabase</b><p>Database, Auth, Storage, Realtime и RPC остаются backend проекта.</p></div><div class="fate-card move"><small>Переносится</small><b>Страницы и админка</b><p>Контент, каталог, формы и CRUD переезжают в Next.js.</p></div><div class="fate-card replace"><small>Заменяется</small><b>React Router и AuthContext</b><p>App Router заменяет маршруты, cookies заменяют browser-only Auth session.</p></div><div class="fate-card remove"><small>Удаляется после проверки</small><b>Vercel SEO layer</b><p>SEO Functions и SPA rewrites больше не нужны после полноценного SSR.</p></div></div></div>
  <div class="story"><h3 class="story-title">Дорога проекта</h3><div class="road">${phaseRoad}</div><p class="story-note">Нажмите на этап, чтобы перейти к его настоящему чек-листу. Кружки обновляются по отмеченным задачам.</p></div>
</section>
${panels}
</div>
<script>
const key='sporto-migration-dashboard-v2';let saved={};try{saved=JSON.parse(localStorage.getItem(key)||'{}')}catch{}
const boxes=[...document.querySelectorAll('[data-task]')];boxes.forEach(box=>{if(!box.dataset.fixed)box.checked=saved[box.dataset.task]===true;box.addEventListener('change',()=>{if(box.dataset.fixed){box.checked=true;return}saved[box.dataset.task]=box.checked;localStorage.setItem(key,JSON.stringify(saved));update()})});
function update(){const done=boxes.filter(x=>x.checked).length;document.getElementById('bar').style.width=(done/boxes.length*100)+'%';document.getElementById('count').textContent=done+' / '+boxes.length;document.querySelectorAll('[data-phase]').forEach(phase=>{const items=[...phase.querySelectorAll('[data-task]')];const finished=items.filter(x=>x.checked).length;const step=document.querySelector('[data-road="'+phase.dataset.phase+'"]');if(!step)return;step.classList.toggle('started',finished>0&&finished<items.length);step.classList.toggle('done',items.length>0&&finished===items.length);step.querySelector('small').textContent=finished+' / '+items.length})}
document.querySelectorAll('[data-tab]').forEach(tab=>tab.addEventListener('click',()=>{document.querySelectorAll('.tab,.panel').forEach(x=>x.classList.remove('active'));tab.classList.add('active');document.querySelector('[data-panel="'+tab.dataset.tab+'"]').classList.add('active');document.getElementById('architecture').classList.toggle('visible',tab.dataset.tab==='plan');document.getElementById('search').value='';document.querySelectorAll('.task').forEach(x=>x.classList.remove('hidden'));scrollTo({top:0,behavior:'smooth'})}));
document.getElementById('search').addEventListener('input',e=>{const q=e.target.value.trim().toLowerCase();document.querySelectorAll('.panel.active .task').forEach(x=>x.classList.toggle('hidden',q&&!x.dataset.search.includes(q)))});update();
</script></body></html>`;

fs.writeFileSync(path.join(root, 'PROJECT-HANDBOOK.html'), html);
console.log(`Built PROJECT-HANDBOOK.html from ${docs.length} docs; ${rendered.reduce((sum, doc) => sum + doc.taskCount, 0)} tasks.`);
