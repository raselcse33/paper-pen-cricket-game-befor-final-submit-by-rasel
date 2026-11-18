/* ==========================================================
   Notebook Grid Cricket — game.js
   Vanilla JS, no dependencies. Sounds generated with Web Audio.
   ========================================================== */
(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  /* ---------------- Stage scaling (16:9) ---------------- */
  const stage = $('#stage');
  function fit() {
    const s = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
    stage.style.transform = 'translate(-50%, -50%) scale(' + s + ')';
  }
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', fit);
  fit();

  /* ---------------- Sound (Web Audio API) ---------------- */
  const Snd = {
    ctx: null, master: null, nbuf: null, muted: false, adMuted: false,
    init() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return;
      }
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.5;
        this.master.connect(this.ctx.destination);
        const len = this.ctx.sampleRate;
        this.nbuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = this.nbuf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      } catch (e) { this.ctx = null; }
    },
    get off() { return this.muted || this.adMuted || !this.ctx; },
    tone(freq, dur, type, vol, delay, slideTo) {
      if (this.off) return;
      type = type || 'sine'; vol = vol == null ? 0.3 : vol; delay = delay || 0;
      const c = this.ctx, t = c.currentTime + delay;
      const o = c.createOscillator(), g = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(this.master);
      o.start(t); o.stop(t + dur + 0.03);
    },
    noise(dur, opt) {
      if (this.off) return;
      opt = opt || {};
      const c = this.ctx, t = c.currentTime + (opt.delay || 0);
      const src = c.createBufferSource();
      src.buffer = this.nbuf;
      const f = c.createBiquadFilter();
      f.type = opt.type || 'bandpass';
      f.Q.value = opt.q || 1;
      f.frequency.setValueAtTime(opt.f || 3000, t);
      if (opt.f2) f.frequency.exponentialRampToValueAtTime(opt.f2, t + dur);
      const g = c.createGain();
      const vol = opt.vol == null ? 0.3 : opt.vol;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.02, dur / 3));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f); f.connect(g); g.connect(this.master);
      src.start(t, Math.random() * 0.4);
      src.stop(t + dur + 0.03);
    },
    scribble() { for (let i = 0; i < 5; i++) this.noise(0.07, { f: 2500 + Math.random() * 1800, q: 2, vol: 0.22, delay: i * 0.06 }); },
    tap() { this.tone(260, 0.09, 'sine', 0.35, 0, 90); },
    flip() { this.noise(0.45, { type: 'lowpass', f: 5000, f2: 400, vol: 0.35 }); this.noise(0.25, { type: 'highpass', f: 2500, vol: 0.12, delay: 0.05 }); },
    click() { this.tone(520, 0.05, 'square', 0.08); },
    run() { this.tone(440, 0.1, 'triangle', 0.2); },
    four() { [523, 659, 784].forEach((f, i) => this.tone(f, 0.16, 'triangle', 0.3, i * 0.09)); },
    six() { [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.17, 'square', 0.16, i * 0.08)); },
    out() { this.tone(320, 0.55, 'sawtooth', 0.22, 0, 70); this.tone(160, 0.6, 'square', 0.12, 0.1, 50); },
    power() { this.tone(880, 0.12, 'sine', 0.3); this.tone(1320, 0.22, 'sine', 0.3, 0.1); },
    coin() { this.tone(1400, 0.08, 'triangle', 0.2); this.tone(1900, 0.1, 'triangle', 0.2, 0.09); },
    toggleMute() { this.muted = !this.muted; return this.muted; }
  };
  ['pointerdown', 'keydown', 'touchstart'].forEach((ev) =>
    window.addEventListener(ev, () => Snd.init(), { passive: true }));

  /* ---------------- CrazyGames SDK placeholders ---------------- */
  // Every call is wrapped so the game also runs outside CrazyGames (local testing).
  const CG = {
    ready: false,
    get sdk() { return window.CrazyGames && window.CrazyGames.SDK ? window.CrazyGames.SDK : null; },
    async init() {
      try {
        if (this.sdk) { await this.sdk.init(); this.ready = true; }
      } catch (e) { console.warn('[CG] init failed', e); this.ready = false; }
    },
    // PLACEHOLDER: call when a match actually starts
    gameStart() { try { if (this.ready) this.sdk.game.gameplayStart(); else console.log('[CG placeholder] gameplayStart'); } catch (e) {} },
    // PLACEHOLDER: call when a match ends / player leaves to menu
    gameOver() { try { if (this.ready) this.sdk.game.gameplayStop(); else console.log('[CG placeholder] gameplayStop'); } catch (e) {} },
    // PLACEHOLDER: celebratory moment (e.g. player wins)
    happytime() { try { if (this.ready) this.sdk.game.happytime(); else console.log('[CG placeholder] happytime'); } catch (e) {} },
    // PLACEHOLDER: rewarded ad (extra wicket / free hit). onReward only fires after the ad is watched.
    showRewardedAd(onReward, onFail) {
      if (!this.ready) {
        console.log('[CG placeholder] rewarded ad -> reward granted (dev mode)');
        setTimeout(onReward, 300);
        return;
      }
      try {
        this.sdk.ad.requestAd('rewarded', {
          adStarted: () => { Snd.adMuted = true; },
          adFinished: () => { Snd.adMuted = false; onReward(); },
          adError: (err) => { Snd.adMuted = false; console.warn('[CG] ad error', err); onFail(); }
        });
      } catch (e) { Snd.adMuted = false; onFail(); }
    }
  };
  CG.init();

  /* ---------------- Game state ---------------- */
  const cfg = { mode: 'ai', overs: 2, wickets: 3 };
  const S = {
    session: 0,
    batFirst: 0, inn: 0, batter: 0,
    sc: [0, 0], wk: [0, 0], bl: [0, 0],
    target: null, wLimit: 3,
    grid: [], hist: [],
    locked: true, over: false,
    freeHit: false, dbl: false,
    adW: false, adF: false
  };
  let cells = [];

  const names = () => (cfg.mode === 'ai' ? ['You', 'Computer'] : ['Player 1', 'Player 2']);
  const humanBats = () => cfg.mode === 'pvp' || S.batter === 0;
  const totalBalls = () => cfg.overs * 6;
  const ov = (b) => Math.floor(b / 6) + '.' + (b % 6);
  const later = (fn, ms) => { const s = S.session; setTimeout(() => { if (s === S.session) fn(); }, ms); };

  /* ---------------- Screens / modal / UI helpers ---------------- */
  function showScreen(id, silent) {
    $$('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
    if (!silent) Snd.flip();
  }
  function modal(html, buttons) {
    $('#ovText').innerHTML = html;
    const box = $('#ovBtns');
    box.innerHTML = '';
    buttons.forEach((b) => {
      const el = document.createElement('button');
      el.className = 'btn ' + (b.cls || '');
      el.textContent = b.label;
      el.onclick = () => { Snd.click(); closeModal(); if (b.fn) b.fn(); };
      box.appendChild(el);
    });
    $('#overlay').classList.add('active');
  }
  function closeModal() { $('#overlay').classList.remove('active'); }
  function setMsg(text, red) {
    const b = $('#banner');
    b.textContent = text;
    b.classList.toggle('red', !!red);
  }
  let toastTimer = null;
  function toast(text) {
    const t = $('#toast');
    t.textContent = text;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 1600);
  }
  function popup(text, cls) {
    const p = $('#popup');
    p.className = '';
    void p.offsetWidth; // restart animation
    p.textContent = text;
    p.className = 'show ' + cls;
  }

  /* ---------------- Menu & setup ---------------- */
  $$('[data-mode]').forEach((b) => {
    b.onclick = () => {
      Snd.init(); Snd.click();
      cfg.mode = b.dataset.mode;
      $('#setupTitle').textContent = cfg.mode === 'ai' ? 'VS Computer' : '2-Player Pass & Play';
      showScreen('setup');
    };
  });
  $('#howBtn').onclick = () => {
    Snd.click();
    modal(
      '<div class="rules"><b>How to play</b><br>' +
      '&bull; The 10&times;10 grid hides 0, 1, 2, 3, 4, 6 and <b>W</b> (wicket).<br>' +
      '&bull; Tap a box: its number is revealed and added to your score. Every tap = 1 ball.<br>' +
      '&bull; <b>W</b> = out. <b>FH</b> = Free Hit (next ball can\'t get you out). <b>2X</b> = next ball\'s runs are doubled.<br>' +
      '&bull; Power-up boxes don\'t use up a ball!<br>' +
      '&bull; Score more than your rival in the balls and wickets you have to win.</div>',
      [{ label: 'Got it!', cls: 'red' }]
    );
  };

  function markSel() {
    $$('#oversChoices .chip').forEach((c) => c.classList.toggle('sel', +c.dataset.v === cfg.overs));
    $$('#wktChoices .chip').forEach((c) => c.classList.toggle('sel', +c.dataset.v === cfg.wickets));
  }
  $$('#oversChoices .chip').forEach((c) => { c.onclick = () => { cfg.overs = +c.dataset.v; Snd.click(); markSel(); }; });
  $$('#wktChoices .chip').forEach((c) => { c.onclick = () => { cfg.wickets = +c.dataset.v; Snd.click(); markSel(); }; });
  markSel();
  $('#setupBack').onclick = () => { Snd.click(); showScreen('menu'); };
  $('#setupGo').onclick = () => { Snd.click(); openToss(); };

  /* ---------------- Toss ---------------- */
  function openToss() {
    S.session++;
    showScreen('toss');
    renderCall();
  }
  function renderCall() {
    const n = names();
    $('#tossBody').innerHTML =
      '<h2>' + n[0] + ', call the toss!</h2><p>Heads or Tails?</p>' +
      '<div class="row"><button class="btn" data-c="H">Heads</button><button class="btn red" data-c="T">Tails</button></div>';
    $$('#tossBody [data-c]').forEach((b) => { b.onclick = () => flipCoin(b.dataset.c); });
  }
  function flipCoin(call) {
    const res = Math.random() < 0.5 ? 'H' : 'T';
    const winner = call === res ? 0 : 1;
    $('#tossBody').innerHTML = '<div id="coin" class="spin">?</div><h2>Flipping the coin...</h2>';
    Snd.coin();
    later(() => Snd.coin(), 350);
    later(() => Snd.coin(), 700);
    later(() => renderChoice(res, winner), 1300);
  }
  function renderChoice(res, winner) {
    const n = names();
    const label = res === 'H' ? 'Heads' : 'Tails';
    let html = '<div id="coin">' + res + '</div><h2>It\'s ' + label + '! ' + n[winner] + ' won the toss.</h2>';
    if (cfg.mode === 'ai' && winner === 1) {
      const choice = Math.random() < 0.5 ? 'bat' : 'bowl';
      html += '<p>Computer chose to ' + choice + ' first.</p><div class="row"><button class="btn red" id="goBtn">Start Match</button></div>';
      $('#tossBody').innerHTML = html;
      $('#goBtn').onclick = () => { Snd.click(); beginMatch(winner, choice); };
    } else {
      html += '<p>' + n[winner] + ', what do you choose?</p><div class="row"><button class="btn" data-ch="bat">Bat first</button><button class="btn red" data-ch="bowl">Bowl first</button></div>';
      $('#tossBody').innerHTML = html;
      $$('#tossBody [data-ch]').forEach((b) => { b.onclick = () => { Snd.click(); beginMatch(winner, b.dataset.ch); }; });
    }
  }

  /* ---------------- Match flow ---------------- */
  function beginMatch(winner, choice) {
    S.batFirst = choice === 'bat' ? winner : 1 - winner;
    S.sc = [0, 0]; S.wk = [0, 0]; S.bl = [0, 0];
    S.target = null;
    const bat = S.batFirst;
    if (cfg.mode === 'pvp') {
      const n = names();
      modal('<b>' + n[bat] + '</b> will bat first.<br>' + n[1 - bat] + ' is bowling.', [{ label: 'Ready!', cls: 'red', fn: () => startInnings(0) }]);
    } else {
      startInnings(0);
    }
  }

  function buildGrid() {
    const vals = [];
    const add = (v, n) => { for (let i = 0; i < n; i++) vals.push(v); };
    add(0, 22); add(1, 24); add(2, 14); add(3, 5); add(4, 11); add(6, 8);
    add('W', 10); add('FH', 3); add('2X', 3); // = 100 boxes
    for (let i = vals.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = vals[i]; vals[i] = vals[j]; vals[j] = t;
    }
    return vals.map((v) => ({ v, open: false }));
  }

  function buildGridDom() {
    const g = $('#grid');
    g.innerHTML = '';
    cells = [];
    for (let i = 0; i < 100; i++) {
      const b = document.createElement('button');
      b.className = 'cell';
      b.type = 'button';
      b.appendChild(document.createElement('span'));
      g.appendChild(b);
      cells.push(b);
    }
  }
  $('#grid').addEventListener('click', (e) => {
    const el = e.target.closest('.cell');
    if (!el) return;
    Snd.init();
    if (!humanBats()) return;
    pick(cells.indexOf(el));
  });

  function startInnings(n) {
    S.inn = n;
    S.batter = n === 0 ? S.batFirst : 1 - S.batFirst;
    S.grid = buildGrid();
    S.hist = [];
    S.wLimit = cfg.wickets;
    S.freeHit = false; S.dbl = false;
    S.adW = false; S.adF = false;
    S.over = false; S.locked = true;
    S.sc[S.batter] = 0; S.wk[S.batter] = 0; S.bl[S.batter] = 0;
    $('#popup').className = '';
    showScreen('game');
    buildGridDom();
    update();
    if (n === 0) CG.gameStart();
    if (humanBats()) {
      setMsg(names()[S.batter] + (cfg.mode === 'ai' ? ' - tap a box to hit!' : ': tap a box to hit!'));
    } else {
      setMsg('Computer is batting...', true);
    }
    later(() => { S.locked = false; if (!humanBats()) scheduleAI(); }, 700);
  }

  function update() {
    const b = S.batter, n = names(), total = totalBalls();
    $('#bName').textContent = n[b] + ' batting';
    $('#sInn').textContent = 'Innings ' + (S.inn + 1) + ' of 2';
    $('#sRuns').textContent = S.sc[b] + '/' + S.wk[b];
    $('#sOvers').textContent = ov(S.bl[b]) + ' / ' + cfg.overs;
    $('#sLeft').textContent = total - S.bl[b];
    $('#sWk').textContent = Math.max(0, S.wLimit - S.wk[b]) + ' left';
    if (S.inn === 1 && S.target != null) {
      $('#sTarget').textContent = S.target;
      const need = Math.max(0, S.target - S.sc[b]);
      $('#sNeed').textContent = 'Need ' + need + ' from ' + (total - S.bl[b]) + ' balls';
    } else {
      $('#sTarget').textContent = '-';
      $('#sNeed').textContent = 'Set a target!';
    }
    $('#fxFH').classList.toggle('on', S.freeHit);
    $('#fxDB').classList.toggle('on', S.dbl);
    const h = $('#hist');
    h.innerHTML = '';
    S.hist.slice(-10).forEach((x) => {
      const d = document.createElement('div');
      d.className = 'hc ' + x.cls;
      d.textContent = x.t;
      h.appendChild(d);
    });
    $('#adFreeHit').disabled = !humanBats() || S.adF || S.over;
  }

  function labelOf(v) { return String(v); }

  function pick(i) {
    if (S.locked || S.over || !S.grid[i] || S.grid[i].open) return;
    S.locked = true;
    const c = S.grid[i], el = cells[i], b = S.batter;
    c.open = true;
    el.classList.remove('ai');
    el.classList.add('open', 'v-' + c.v);
    el.firstChild.textContent = labelOf(c.v);
    const blot = document.createElement('div');
    blot.className = 'blot';
    el.appendChild(blot);
    setTimeout(() => blot.remove(), 650);
    Snd.tap(); Snd.scribble();

    /* --- power-up boxes: no ball is used --- */
    if (c.v === 'FH' || c.v === '2X') {
      if (c.v === 'FH') { S.freeHit = true; toast('FREE HIT! Next ball is safe'); }
      else { S.dbl = true; toast('2X RUN! Next ball counts double'); }
      S.hist.push({ t: c.v, cls: 'pw' });
      Snd.power();
      update();
      later(() => { S.locked = false; afterMove(); }, 700);
      return;
    }

    /* --- a normal ball --- */
    S.bl[b]++;
    let runs = 0, out = false, saved = false;
    if (c.v === 'W') {
      if (S.freeHit) saved = true; else { out = true; S.wk[b]++; }
    } else {
      runs = c.v * (S.dbl ? 2 : 1);
    }
    const doubled = S.dbl && !out && !saved && c.v !== 0;
    S.sc[b] += runs;
    S.freeHit = false; S.dbl = false;

    S.hist.push({ t: out ? 'W' : String(runs), cls: out ? 'w' : (runs >= 4 ? 'b' : '') });

    if (out) { Snd.out(); popup('OUT!', 'out'); }
    else if (saved) { Snd.power(); popup('SAFE!', 'free'); toast('Free Hit saved the wicket!'); }
    else if (c.v === 6) { Snd.six(); popup('SIX!', 'six'); if (doubled) toast('2X = ' + runs + ' runs!'); }
    else if (c.v === 4) { Snd.four(); popup('FOUR!', 'four'); if (doubled) toast('2X = ' + runs + ' runs!'); }
    else { Snd.run(); if (doubled) toast('2X = ' + runs + ' runs!'); }
    update();

    /* --- check end of innings --- */
    const total = totalBalls();
    if (S.inn === 1 && S.sc[b] >= S.target) { later(endInnings, 1500); return; }
    if (S.bl[b] >= total) { later(endInnings, 1500); return; }
    if (S.wk[b] >= S.wLimit) {
      if (humanBats() && !S.adW) { later(offerExtraWicket, 1300); }
      else { later(endInnings, 1500); }
      return;
    }
    later(() => { S.locked = false; afterMove(); }, 700);
  }

  function offerExtraWicket() {
    modal('<b>ALL OUT!</b><br>Watch a short ad to get 1 extra wicket?', [
      {
        label: 'Watch Ad', cls: 'red',
        fn: () => CG.showRewardedAd(
          () => {
            S.adW = true; S.wLimit++;
            update(); toast('+1 Wicket!');
            S.locked = false; afterMove();
          },
          () => { toast('Ad not available'); later(endInnings, 700); }
        )
      },
      { label: 'No thanks', fn: endInnings }
    ]);
  }

  $('#adFreeHit').onclick = () => {
    if (!humanBats() || S.locked || S.over || S.adF) return;
    Snd.click();
    S.locked = true;
    CG.showRewardedAd(
      () => { S.adF = true; S.freeHit = true; Snd.power(); toast('FREE HIT! Next ball is safe'); update(); S.locked = false; },
      () => { toast('Ad not available'); S.locked = false; }
    );
  };

  /* ---------------- Computer batting ---------------- */
  function afterMove() { if (!S.over && !humanBats()) scheduleAI(); }
  function scheduleAI() {
    later(() => {
      if (S.over || S.locked || humanBats()) return;
      const free = [];
      S.grid.forEach((c, i) => { if (!c.open) free.push(i); });
      if (!free.length) return;
      const i = free[Math.floor(Math.random() * free.length)];
      cells[i].classList.add('ai');
      later(() => pick(i), 450);
    }, 900 + Math.random() * 500);
  }

  /* ---------------- Innings / match end ---------------- */
  function endInnings() {
    S.over = true; S.locked = true;
    const b = S.batter, n = names();
    if (S.inn === 0) {
      S.target = S.sc[b] + 1;
      Snd.flip();
      const next = 1 - b;
      const passMsg = cfg.mode === 'pvp' ? '<br>Pass the device to <b>' + n[next] + '</b>.' : '';
      modal(
        '<b>Innings break!</b><br>' + n[b] + ' scored <b>' + S.sc[b] + '/' + S.wk[b] + '</b> (' + ov(S.bl[b]) + ' ov).<br>' +
        n[next] + ' needs <b>' + S.target + '</b> from ' + totalBalls() + ' balls.' + passMsg,
        [{ label: '2nd Innings', cls: 'red', fn: () => startInnings(1) }]
      );
    } else {
      finishMatch();
    }
  }

  function finishMatch() {
    CG.gameOver();
    const n = names();
    const chaser = S.batter, defender = 1 - chaser;
    let title, detail, winner = -1;
    if (S.sc[chaser] >= S.target) {
      winner = chaser;
      const w = Math.max(1, S.wLimit - S.wk[chaser]);
      detail = n[chaser] + ' won by ' + w + ' wicket' + (w === 1 ? '' : 's') + '!';
    } else if (S.sc[chaser] === S.target - 1) {
      detail = 'The match is tied!';
    } else {
      winner = defender;
      const r = S.target - 1 - S.sc[chaser];
      detail = n[defender] + ' won by ' + r + ' run' + (r === 1 ? '' : 's') + '!';
    }
    if (winner === -1) title = 'TIE!';
    else if (cfg.mode === 'ai') title = winner === 0 ? 'YOU WIN!' : 'YOU LOST';
    else title = n[winner] + ' WINS!';

    if (winner === 0 || (cfg.mode === 'pvp' && winner !== -1)) { CG.happytime(); Snd.six(); }
    else if (winner === 1) Snd.out();
    else Snd.four();

    const line = (t) => '<div class="sc">' + n[t] + ': <b>' + S.sc[t] + '/' + S.wk[t] + '</b> (' + ov(S.bl[t]) + ' ov)</div>';
    $('#resultBody').innerHTML =
      '<h1>' + title + '</h1><h2>' + detail + '</h2>' +
      line(S.batFirst) + line(1 - S.batFirst) +
      '<div class="row"><button class="btn red" id="againBtn">Play Again</button><button class="btn" id="menuBtn">Main Menu</button></div>';
    $('#againBtn').onclick = () => { Snd.click(); openToss(); };
    $('#menuBtn').onclick = () => { Snd.click(); S.session++; showScreen('menu'); };
    showScreen('result');
  }

  /* ---------------- Side buttons ---------------- */
  $('#muteBtn').onclick = () => {
    Snd.init();
    const m = Snd.toggleMute();
    $('#muteBtn').textContent = 'Sound: ' + (m ? 'OFF' : 'ON');
    if (!m) Snd.click();
  };
  $('#quitBtn').onclick = () => {
    Snd.click();
    modal('Leave this match?', [
      { label: 'Keep playing', cls: 'red' },
      { label: 'Quit', fn: () => { CG.gameOver(); S.session++; S.over = true; showScreen('menu'); } }
    ]);
  };
})();
