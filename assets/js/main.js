// Lister landing: reveals, the live timer, the command list and the "Novo quadro" dialog.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// Reveal once on scroll; siblings stagger.
const io = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
$$('.reveal').forEach((el) => {
  const sibs = $$(':scope > .reveal', el.parentElement);
  el.style.setProperty('--d', Math.max(0, sibs.indexOf(el)));
  io.observe(el);
});

// h:mm:ss like the app's clock.
const clock = (ms) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

// ---- the live timer (the app's placar component) ----
const input = $('#task-input');
const measure = $('.type-measure');
const caret = $('.type-caret');
const placar = $('[data-placar]');
const nameEl = $('[data-placar-name]');
const clockEl = $('[data-placar-clock]');
const statusEl = $('[data-placar-status]');
const toggle = $('[data-placar-toggle]');
let logged = 0, startedAt = Date.now(), running = true;

const elapsed = () => logged + (running ? Date.now() - startedAt : 0);
const placeCaret = () => {
  measure.textContent = input.value.slice(0, input.selectionEnd ?? input.value.length);
  const x = Math.min(measure.offsetWidth - input.scrollLeft, input.offsetWidth - 4);
  caret.style.left = `${Math.max(0, x)}px`;
};
const setName = (v) => { nameEl.textContent = v.trim() || 'Sem nome'; };
const restart = () => {
  logged = 0; startedAt = Date.now(); running = true; render();
  placar.classList.remove('wipe'); void placar.offsetWidth; placar.classList.add('wipe');
};
function render() {
  placar.classList.toggle('paused', !running);
  statusEl.textContent = running ? 'Contando' : 'Pausado';
  toggle.setAttribute('aria-label', running ? 'Pausar' : 'Retomar');
  toggle.querySelector('path').setAttribute('d', running ? 'M8 5v14M16 5v14' : 'M8 5.5v13l10-6.5z');
  toggle.querySelector('svg').style.fill = running ? 'none' : 'currentColor';
  clockEl.textContent = clock(elapsed());
}
input.addEventListener('input', () => { setName(input.value); placeCaret(); });
['keyup', 'click', 'focus', 'scroll'].forEach((ev) => input.addEventListener(ev, placeCaret));
input.addEventListener('keydown', (e) => { if (e.key === 'Enter') restart(); });
toggle.addEventListener('click', () => {
  if (running) logged += Date.now() - startedAt; else startedAt = Date.now();
  running = !running; render();
});
$$('[data-example]').forEach((b) => b.addEventListener('click', () => {
  input.value = b.textContent; setName(input.value); placeCaret(); restart();
}));
document.fonts?.ready.then(placeCaret);
addEventListener('resize', placeCaret);
placeCaret();

setInterval(() => {
  if (running) clockEl.textContent = clock(elapsed());
}, 1000);

// ---- command list ----
const list = $('[data-cmd-list]');
const items = $$('li', list);
const cmdInput = $('[data-cmd-input]');
const empty = $('[data-cmd-empty]');
const select = (li) => {
  if (!li) return;
  items.forEach((x) => x.setAttribute('aria-selected', String(x === li)));
  $$('[data-shot-img]').forEach((img) => img.classList.toggle('on', img.dataset.shotImg === li.dataset.shot));
};
const visible = () => items.filter((li) => !li.hidden);
items.forEach((li) => {
  li.tabIndex = 0;
  li.addEventListener('mouseenter', () => select(li));
  li.addEventListener('click', () => select(li));
  li.addEventListener('focus', () => select(li));
});
cmdInput.addEventListener('input', () => {
  const q = cmdInput.value.trim().toLowerCase();
  items.forEach((li) => { li.hidden = !li.textContent.toLowerCase().includes(q); });
  empty.hidden = visible().length > 0;
  if (visible().length && visible().every((li) => li.getAttribute('aria-selected') !== 'true')) select(visible()[0]);
});
const move = (d) => {
  const v = visible(), i = v.findIndex((li) => li.getAttribute('aria-selected') === 'true');
  select(v[Math.max(0, Math.min(v.length - 1, i + d))]);
};
[cmdInput, list].forEach((el) => el.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
  if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
}));

// ---- the "Novo quadro" dialog ----
const boardName = $('#board-name');
const ctaName = $('[data-cta-name]');
boardName.addEventListener('input', () => { ctaName.textContent = boardName.value.trim() || 'meu quadro'; });
$$('[data-kind]').forEach((b) => b.addEventListener('click', () => {
  $$('[data-kind]').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
}));
$('[data-cta]').addEventListener('submit', (e) => {
  e.preventDefault();
  location.href = e.currentTarget.action;
});

$('[data-year]').textContent = new Date().getFullYear();

// ---- Claude section: a request, the command the skill runs, the board after ----
const ASKS = [
  {
    cmd: 'python lister.py add hoje "a fazer" "Comprar café" --priority high --top',
    out: 'criada: task-1792676112048-0.41',
    reply: 'Pronto: “Comprar café” está no topo de A fazer, no quadro Hoje, com prioridade Alta.',
    col: 'A fazer · Hoje',
    cards: [
      { t: 'Comprar café', p: 'Alta', fresh: true },
      { t: 'Responder e-mails', p: 'Média', time: '35m 00s' },
      { t: 'Treino às 18h', p: 'Baixa' },
    ],
  },
  {
    cmd: 'python lister.py search checkout\npython lister.py done task-demo-4',
    out: 'Clientes / Fazendo:  [ ] Tela de checkout do app  (high; 2/4 sub; 3h36m)\nok',
    reply: 'Feito. “Tela de checkout do app” está concluída e o timer, que estava rodando, parou em 3h 36m.',
    col: 'Fazendo · Clientes',
    cards: [
      { t: 'Tela de checkout do app', p: 'Alta', time: '3h 36m', done: true, fresh: true },
      { t: 'Formulário de contato', p: 'Média', time: '48m 00s' },
    ],
  },
  {
    cmd: 'python lister.py show casa',
    out: '## Comprar\n  [ ] Lâmpadas da cozinha  (medium)\n  [ ] Ração do gato  (high)\n## Consertar\n  [ ] Torneira do banheiro  (medium; 40m)',
    reply: 'No Casa faltam três: Lâmpadas da cozinha e Ração do gato (alta) para comprar, e a torneira do banheiro para consertar.',
    col: 'Comprar · Casa',
    cards: [
      { t: 'Lâmpadas da cozinha', p: 'Média' },
      { t: 'Ração do gato', p: 'Alta', fresh: true },
    ],
  },
];
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const PRIO = { Alta: 'p-high', Média: 'p-mid', Baixa: 'p-low' };
const showAsk = (i) => {
  const a = ASKS[i];
  $$('[data-ask]').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.ask === i)));
  $('[data-term-ask]').textContent = $(`[data-ask="${i}"]`).textContent;
  $('[data-term-cmd]').textContent = a.cmd;
  $('[data-term-out]').textContent = a.out;
  $('[data-term-reply]').textContent = a.reply;
  $('[data-mini-col]').textContent = a.col;
  $('[data-mini-count]').textContent = a.cards.length;
  $('[data-mini-cards]').innerHTML = a.cards.map((c) => `
    <div class="mini-card${c.fresh ? ' fresh' : ''}${c.done ? ' done' : ''}">
      <span class="mini-check" aria-hidden="true"></span>
      <div><p class="mini-title">${esc(c.t)}</p>
      <p class="mini-meta"><span class="${PRIO[c.p]}">${c.p}</span>${c.time ? `<span>${c.time}</span>` : ''}</p></div>
    </div>`).join('');
  const term = $('.term');
  term.classList.remove('typed'); void term.offsetWidth; term.classList.add('typed');
};
$$('[data-ask]').forEach((b) => b.addEventListener('click', () => showAsk(+b.dataset.ask)));
showAsk(0);
