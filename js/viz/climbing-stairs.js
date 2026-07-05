/* ============================================================
   Viz: Climbing Stairs (LC 70)
   A staircase of blocks, one per step. dp[i] = ways to reach step i.
   You arrive at step i either from step i-1 (a single step) or step
   i-2 (a double), so dp[i] = dp[i-1] + dp[i-2] - the two contributing
   blocks light up as each new block is filled. It's Fibonacci wearing
   a staircase costume.
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["climbing-stairs"] = {
  samples: [
    { label: "n = 5", n: 5 },
    { label: "n = 7", n: 7 },
    { label: "n = 10", n: 10 }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const n = this.samples[sampleIndex].n;

    const dp = new Array(n + 1).fill(0);
    dp[0] = 1; dp[1] = 1;
    for (let i = 2; i <= n; i++) dp[i] = dp[i - 1] + dp[i - 2];

    const spacing = Math.min(2.2, 15 / (n + 1));
    const xAt = (i) => (i - n / 2) * spacing;
    const yAt = (i) => i * 0.55;

    const cells = [];
    for (let i = 0; i <= n; i++) {
      const cell = DSAV.makeBar(spacing * 0.8, 0.55, 1.2, C.dim);
      cell.position.set(xAt(i), yAt(i) + 0.28, 0);
      cell.userData = { targetColor: new T.Color(C.dim), emissiveColor: new T.Color(0x000000), active: false };
      S.world.add(cell);
      cells.push(cell);
      const idx = DSAV.makeLabel("step " + i, { fontSize: 26, color: "#8f7a5e", scale: 0.5 });
      idx.position.set(xAt(i), yAt(i) - 0.18, 0.7); S.world.add(idx);
      const val = DSAV.makeLabel("", { fontSize: 42, color: "#fbf6ee", scale: 0.85 });
      val.position.set(xAt(i), yAt(i) + 0.95, 0.7); S.world.add(val);
      cell.userData.valLbl = val;
    }

    const banner = DSAV.makeLabel("ways to top = ?", { fontSize: 42, color: "#1c0d07", bg: DSAV.rgbHex(C.hot), scale: 1.0, noDepth: true });
    banner.position.set(0, yAt(n) + 3.0, 0);
    S.world.add(banner);
    S.controls.target.set(0, yAt(n) * 0.5 + 1, 0);
    S.camera.position.set(0, yAt(n) * 0.5 + 4, Math.max(15, n * 2.4));

    // ---- steps ----
    const steps = [];
    steps.push({ i: 0, from: [], filled: 1, note0: true });
    if (n >= 1) steps.push({ i: 1, from: [], filled: 2, note1: true });
    for (let i = 2; i <= n; i++) steps.push({ i, from: [i - 1, i - 2], filled: i + 1 });
    steps.push({ i: -1, from: [], filled: n + 1, done: true });

    steps.forEach((s) => {
      s.vars = [
        { k: "step i", v: s.i < 0 ? "-" : s.i },
        { k: "dp[i]", v: s.i < 0 ? dp[n] : dp[s.i], cls: "good" },
        { k: "answer dp[" + n + "]", v: dp[n], cls: "hot" }
      ];
      if (s.note0) s.note = "Base case: <b>dp[0] = 1</b> - one way to be at the ground (do nothing).";
      else if (s.note1) s.note = "Base case: <b>dp[1] = 1</b> - one way to reach step 1 (a single step).";
      else if (s.done) { s.note = "The top is reachable <b>" + dp[n] + "</b> ways."; s.results = ["ways = " + dp[n]]; }
      else s.note = "dp[" + s.i + "] = dp[" + (s.i - 1) + "] + dp[" + (s.i - 2) + "] = " + dp[s.i - 1] + " + " + dp[s.i - 2] + " = <b>" + dp[s.i] + "</b>.";
    });

    function goTo(k) {
      const s = steps[k];
      const fromSet = new Set(s.from);
      cells.forEach((cell, i) => {
        const isFilled = i < s.filled;
        let col = C.dim, em = 0x000000, active = false;
        if (isFilled) { col = C.bar; cell.userData.valLbl.userData.setText(String(dp[i])); }
        else cell.userData.valLbl.userData.setText("");
        if (fromSet.has(i)) { col = C.left; em = C.left; active = true; }
        if (i === s.i) { col = C.good; em = C.hot; active = true; }
        cell.userData.targetColor.set(col);
        cell.userData.emissiveColor.set(em);
        cell.userData.active = active;
      });
      banner.userData.setText(s.done ? "ways to top = " + dp[n] : "building dp...");
    }

    S.onTick(() => {
      const t = performance.now() * 0.004;
      cells.forEach((cell) => {
        const m = cell.material;
        m.color.lerp(cell.userData.targetColor, 0.16);
        m.emissive.lerp(cell.userData.emissiveColor, 0.2);
        m.emissiveIntensity = cell.userData.active ? (0.45 + Math.sin(t) * 0.2) : 0.0;
      });
    });

    goTo(0);
    return { steps, goTo, dispose: S.dispose };
  }
};
