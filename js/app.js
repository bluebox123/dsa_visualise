/* ============================================================
   DSA Arsenal — app controller
   Builds the sidebar, renders the detail view for a chosen
   question, and drives the 3D visualisation playback engine.
   ============================================================ */
(function () {
  const patterns = DSAV.patterns;

  const els = {
    nav: document.getElementById("patternNav"),
    content: document.getElementById("content"),
    search: document.getElementById("searchInput"),
    sidebar: document.getElementById("sidebar"),
    menuToggle: document.getElementById("menuToggle"),
    progressCount: document.getElementById("progressCount")
  };

  els.progressCount.textContent = DSAV.builtCount;

  // ---- playback state ----
  const state = {
    player: null,
    step: 0,
    playing: false,
    timer: null,
    speed: 1000,
    sampleIndex: 0,
    question: null
  };

  /* ============================================================
     Sidebar
     ============================================================ */
  function buildSidebar() {
    els.nav.innerHTML = "";
    patterns.forEach((p) => {
      const group = document.createElement("div");
      group.className = "pattern-group";
      group.dataset.pid = p.id;
      if (p.questions.some((q) => q.built)) group.classList.add("open");

      const header = document.createElement("div");
      header.className = "pattern-header";
      header.innerHTML =
        `<span class="chev">▶</span>` +
        `<span class="pattern-index">${p.index}</span>` +
        `<span class="pattern-name">${p.name}</span>` +
        `<span class="pattern-count">${p.questions.filter(q => q.built).length}/${p.questions.length}</span>`;
      header.addEventListener("click", () => group.classList.toggle("open"));
      group.appendChild(header);

      const qs = document.createElement("div");
      qs.className = "pattern-questions";
      p.questions.forEach((q) => {
        const item = document.createElement("div");
        item.className = "q-item" + (q.built ? "" : " locked");
        item.dataset.num = q.num;
        item.dataset.search = (q.title + " " + p.name + " " + q.num).toLowerCase();
        item.innerHTML =
          `<span class="q-num">#${q.num}</span>` +
          `<span class="q-title">${q.title}</span>` +
          (q.built
            ? `<span class="q-badge tier-${q.tier}">${q.tier[0]}</span>`
            : `<span class="q-lock">🔒</span>`);
        item.addEventListener("click", () => selectQuestion(q.num));
        qs.appendChild(item);
      });
      group.appendChild(qs);
      els.nav.appendChild(group);
    });
  }

  function setActiveItem(num) {
    document.querySelectorAll(".q-item").forEach((el) =>
      el.classList.toggle("active", Number(el.dataset.num) === num));
  }

  // search filter
  els.search.addEventListener("input", (e) => {
    const term = e.target.value.trim().toLowerCase();
    document.querySelectorAll(".pattern-group").forEach((group) => {
      let anyVisible = false;
      group.querySelectorAll(".q-item").forEach((item) => {
        const match = !term || item.dataset.search.includes(term);
        item.style.display = match ? "" : "none";
        if (match) anyVisible = true;
      });
      group.style.display = anyVisible ? "" : "none";
      if (term && anyVisible) group.classList.add("open");
    });
  });

  els.menuToggle.addEventListener("click", () => els.sidebar.classList.toggle("open"));

  /* ============================================================
     Welcome screen
     ============================================================ */
  function renderWelcome() {
    const built = patterns.flatMap((p) => p.questions).filter((q) => q.built);
    els.content.innerHTML = `
      <div class="welcome">
        <div class="welcome-kicker">Batches 1–2 · ${built.length} simulations live</div>
        <h2>See the algorithm move.</h2>
        <p>Pick a problem on the left. Each one gives you the LeetCode link, the problem in plain
        English, the small Java solution, and — the important part — a <strong>3D simulation</strong>
        you can orbit with your mouse and step through frame by frame. Watch the pointers converge,
        the bars light up, and the answer fall out.</p>
        <div class="welcome-cards">
          ${built.map((q) => `
            <div class="welcome-card" data-num="${q.num}">
              <div class="wc-num">LC ${q.num} · ${q.patternName}</div>
              <h3>${q.title}</h3>
              <p>${q.trigger}</p>
            </div>`).join("")}
        </div>
      </div>`;
    els.content.querySelectorAll(".welcome-card").forEach((c) =>
      c.addEventListener("click", () => selectQuestion(Number(c.dataset.num))));
  }

  /* ============================================================
     Selecting a question
     ============================================================ */
  function selectQuestion(num) {
    const q = DSAV.findQuestion(num);
    if (!q) return;
    setActiveItem(num);
    els.sidebar.classList.remove("open");
    teardownViz();
    if (!q.built) return renderLocked(q);
    renderDetail(q);
  }

  function renderLocked(q) {
    els.content.innerHTML = `
      <div class="locked-view">
        <div class="lock-ico">🔒</div>
        <h2>${q.title}</h2>
        <p>This one lives in the <strong>${q.patternName}</strong> pattern. Its trigger:</p>
        <p class="trigger-quote" style="text-align:left;display:inline-block;">${q.trigger}</p>
        <p>The full walkthrough + 3D simulation arrives in an upcoming batch.</p>
        <a class="lc-link" href="${q.url}" target="_blank" rel="noopener">
          <span class="lc-ico">↗</span> Open #${q.num} on LeetCode
        </a>
        <div class="batch-tag">Coming in a future batch</div>
      </div>`;
  }

  function renderDetail(q) {
    state.question = q;
    state.sampleIndex = 0;

    const simplified = q.simplified.map((s) => `<p>${s}</p>`).join("");
    const approach = q.approach.map((s) => `<li>${s}</li>`).join("");

    els.content.innerHTML = `
      <div class="detail">
        <div class="detail-crumbs">${q.patternName}<span class="sep">/</span>LeetCode #${q.num}</div>
        <div class="detail-head">
          <div>
            <div class="detail-title-row">
              <h1 class="detail-title">${q.title}</h1>
              <span class="q-badge tier-${q.tier} detail-tier">${q.tier}</span>
            </div>
          </div>
          <a class="lc-link" href="${q.url}" target="_blank" rel="noopener">
            <span class="lc-ico">↗</span> Open on LeetCode
          </a>
        </div>

        <div class="detail-grid">
          <!-- ===== info column ===== -->
          <div class="info-col">
            <div class="card">
              <div class="card-label"><span class="ico">✦</span> In plain English</div>
              ${simplified}
            </div>

            <div class="card">
              <div class="card-label"><span class="ico">⚑</span> Pattern trigger</div>
              <p class="trigger-quote">${q.trigger}</p>
            </div>

            <div class="card">
              <div class="card-label"><span class="ico">↳</span> The plan</div>
              <ul>${approach}</ul>
            </div>

            <div class="card code-card">
              <div class="code-head">
                <div class="card-label"><span class="ico">☕</span> Java solution</div>
                <div style="display:flex;align-items:center;gap:10px;">
                  <span class="code-lang">Java</span>
                  <button class="copy-btn" id="copyBtn">Copy</button>
                </div>
              </div>
              <pre><code class="language-java">${escapeHtml(q.code)}</code></pre>
            </div>

            <div class="card">
              <div class="card-label"><span class="ico">◷</span> Complexity</div>
              <div class="complexity-row">
                <div class="cx"><div class="cx-k">Time</div><div class="cx-v">${q.complexity.time}</div></div>
                <div class="cx"><div class="cx-k">Space</div><div class="cx-v">${q.complexity.space}</div></div>
              </div>
            </div>

            <div class="card">
              <div class="card-label"><span class="ico">✓</span> Result</div>
              <div class="result-list" id="resultList"></div>
            </div>
          </div>

          <!-- ===== viz column ===== -->
          <div class="viz-col">
            <div class="viz-shell">
              <div class="viz-stage-head">
                <div class="card-label"><span class="ico">◉</span> 3D Simulation</div>
                <div class="viz-sample">
                  <label>Input</label>
                  <select id="sampleSelect"></select>
                </div>
              </div>
              <div class="canvas-wrap" id="canvasWrap">
                <div class="hud">
                  <div class="hud-note" id="hudNote"></div>
                  <div class="hud-vars" id="hudVars"></div>
                </div>
                <div class="hud-hint">drag to orbit · scroll to zoom · right-drag to pan</div>
              </div>
              <div class="viz-controls">
                <button class="ctrl-btn" id="btnReset" title="Reset">⟲</button>
                <button class="ctrl-btn" id="btnPrev" title="Previous step">◄</button>
                <button class="ctrl-btn primary" id="btnPlay" title="Play / Pause">▶</button>
                <button class="ctrl-btn" id="btnNext" title="Next step">►</button>
                <div class="progress-track" id="progressTrack"><div class="progress-fill" id="progressFill"></div></div>
                <span class="step-count" id="stepCount">0 / 0</span>
                <div class="speed-ctrl">
                  <label>Speed</label>
                  <select id="speedSelect">
                    <option value="1600">0.5×</option>
                    <option value="1000" selected>1×</option>
                    <option value="550">2×</option>
                    <option value="300">4×</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>`;

    const codeEl = els.content.querySelector("code.language-java");
    if (window.hljs && codeEl) window.hljs.highlightElement(codeEl);

    document.getElementById("copyBtn").addEventListener("click", (e) => {
      navigator.clipboard.writeText(q.code).then(() => {
        e.target.textContent = "Copied!";
        setTimeout(() => (e.target.textContent = "Copy"), 1400);
      }).catch(() => {});
    });

    const sampleSelect = document.getElementById("sampleSelect");
    const viz = DSAV.viz[q.vizId];
    viz.samples.forEach((s, i) => {
      const opt = document.createElement("option");
      opt.value = i; opt.textContent = s.label;
      sampleSelect.appendChild(opt);
    });
    sampleSelect.addEventListener("change", (e) => {
      state.sampleIndex = Number(e.target.value);
      buildViz(q);
    });

    document.getElementById("btnPlay").addEventListener("click", togglePlay);
    document.getElementById("btnNext").addEventListener("click", () => { pause(); stepBy(1); });
    document.getElementById("btnPrev").addEventListener("click", () => { pause(); stepBy(-1); });
    document.getElementById("btnReset").addEventListener("click", () => { pause(); goToStep(0); });
    document.getElementById("speedSelect").addEventListener("change", (e) => {
      state.speed = Number(e.target.value);
      if (state.playing) { pause(); play(); }
    });
    document.getElementById("progressTrack").addEventListener("click", (e) => {
      if (!state.player) return;
      pause();
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      goToStep(Math.round(ratio * (state.player.steps.length - 1)));
    });

    buildViz(q);
  }

  /* ============================================================
     Viz lifecycle
     ============================================================ */
  function teardownViz() {
    pause();
    if (state.player && state.player.dispose) {
      try { state.player.dispose(); } catch (e) { /* noop */ }
    }
    state.player = null;
    state.step = 0;
  }

  function buildViz(q) {
    pause();
    if (state.player && state.player.dispose) { try { state.player.dispose(); } catch (e) {} }
    const wrap = document.getElementById("canvasWrap");
    wrap.querySelectorAll("canvas").forEach((c) => c.remove());

    requestAnimationFrame(() => {
      state.player = DSAV.viz[q.vizId].build(wrap, state.sampleIndex);
      state.step = 0;
      goToStep(0);
    });
  }

  /* ============================================================
     Playback
     ============================================================ */
  function goToStep(i) {
    if (!state.player) return;
    const steps = state.player.steps;
    state.step = Math.max(0, Math.min(i, steps.length - 1));
    state.player.goTo(state.step);
    renderStep(steps[state.step]);
    updateProgress();
    if (state.step >= steps.length - 1) pause();
  }

  function stepBy(d) { goToStep(state.step + d); }

  function renderStep(s) {
    const note = document.getElementById("hudNote");
    const vars = document.getElementById("hudVars");
    const resultList = document.getElementById("resultList");
    if (note) note.innerHTML = `<span class="hud-step">Step ${state.step + 1}</span>${s.note || ""}`;
    if (vars) {
      vars.innerHTML = (s.vars || []).map((v) =>
        `<div class="hud-var ${v.cls ? "hv-" + v.cls : ""}"><span class="hv-k">${v.k}</span> = <span class="hv-v">${v.v}</span></div>`
      ).join("");
    }
    if (resultList) {
      const res = s.found || s.results || [];
      resultList.innerHTML = res.length
        ? res.map((r) => `<span class="result-chip">${r}</span>`).join("")
        : `<span style="color:var(--text-dim);font-size:12.5px;">— nothing collected yet —</span>`;
    }
  }

  function updateProgress() {
    if (!state.player) return;
    const total = state.player.steps.length;
    const fill = document.getElementById("progressFill");
    const count = document.getElementById("stepCount");
    if (fill) fill.style.width = (total <= 1 ? 100 : (state.step / (total - 1)) * 100) + "%";
    if (count) count.textContent = `${state.step + 1} / ${total}`;
  }

  function play() {
    if (!state.player) return;
    if (state.step >= state.player.steps.length - 1) goToStep(0);
    state.playing = true;
    setPlayIcon();
    state.timer = setInterval(() => {
      if (state.step >= state.player.steps.length - 1) { pause(); return; }
      stepBy(1);
    }, state.speed);
  }

  function pause() {
    state.playing = false;
    if (state.timer) { clearInterval(state.timer); state.timer = null; }
    setPlayIcon();
  }

  function togglePlay() { state.playing ? pause() : play(); }

  function setPlayIcon() {
    const btn = document.getElementById("btnPlay");
    if (btn) btn.textContent = state.playing ? "❚❚" : "▶";
  }

  /* ============================================================
     Utils
     ============================================================ */
  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* ============================================================
     Boot
     ============================================================ */
  buildSidebar();
  renderWelcome();
})();
