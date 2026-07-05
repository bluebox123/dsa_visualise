/* ============================================================
   Viz: Longest Common Subsequence (LC 1143)
   A grid DP over prefixes of the two strings (string A down the left,
   B across the top). dp[i][j] = LCS of A[0..i) and B[0..j). If the
   two current letters match, we extend the diagonal: dp[i-1][j-1]+1;
   otherwise we inherit the better of the cell above or to the left.
   The chosen source cells light amber; the final LCS path glows green.
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["longest-common-subsequence"] = {
  samples: [
    { label: '"abcde" / "ace"', a: "abcde", b: "ace" },
    { label: '"AGGTAB" / "GXTXAYB"', a: "AGGTAB", b: "GXTXAYB" },
    { label: '"abc" / "abc"', a: "abc", b: "abc" },
    { label: '"abc" / "def"', a: "abc", b: "def" }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const cfg = this.samples[sampleIndex];
    const A = cfg.a, B = cfg.b, m = A.length, n = B.length;

    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
      dp[i][j] = A[i - 1] === B[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
    // trace one LCS path
    const path = new Set();
    { let i = m, j = n; while (i > 0 && j > 0) { if (A[i - 1] === B[j - 1]) { path.add(i + "," + j); i--; j--; } else if (dp[i - 1][j] >= dp[i][j - 1]) i--; else j--; } }

    const cs = Math.min(1.5, 12 / Math.max(m + 1, n + 1));
    const xAt = (j) => (j - n / 2) * cs;
    const yAt = (i) => (m / 2 - i) * cs + 2.5;

    const cells = [];
    for (let i = 0; i <= m; i++) {
      cells.push([]);
      for (let j = 0; j <= n; j++) {
        const isBase = i === 0 || j === 0;
        const tile = DSAV.makeBar(cs * 0.9, 0.3, cs * 0.9, isBase ? C.dim : C.bar);
        tile.position.set(xAt(j), 0.15, -yAt(i) + yAt(0));
        // lay the grid flat: use XY plane instead (front-facing)
        tile.position.set(xAt(j), yAt(i), 0);
        tile.userData = { targetColor: new T.Color(isBase ? C.dim : C.bar), emissiveColor: new T.Color(0x000000), active: false, base: isBase };
        S.world.add(tile);
        cells[i].push(tile);
        const val = DSAV.makeLabel(isBase ? "0" : "", { fontSize: 34, color: "#fbf6ee", scale: 0.66 });
        val.position.set(xAt(j), yAt(i), 0.25); S.world.add(val);
        tile.userData.valLbl = val;
      }
    }
    // headers
    for (let i = 1; i <= m; i++) { const h = DSAV.makeLabel(A[i - 1], { fontSize: 38, color: "#f4c884", scale: 0.72 }); h.position.set(xAt(0) - cs, yAt(i), 0.25); S.world.add(h); }
    for (let j = 1; j <= n; j++) { const h = DSAV.makeLabel(B[j - 1], { fontSize: 38, color: "#f4c884", scale: 0.72 }); h.position.set(xAt(j), yAt(0) + cs, 0.25); S.world.add(h); }

    const banner = DSAV.makeLabel("LCS length = ?", { fontSize: 40, color: "#1c0d07", bg: DSAV.rgbHex(C.hot), scale: 1.0, noDepth: true });
    banner.position.set(0, yAt(0) + cs * 2.4, 0);
    S.world.add(banner);
    S.controls.target.set(0, yAt(m) + (yAt(0) - yAt(m)) / 2, 0);
    S.camera.position.set(0, yAt(0), Math.max(15, Math.max(m, n) * 2.6));

    // ---- steps (row-major fill) ----
    const steps = [];
    steps.push({ i: 0, j: 0, order: -1, init: true });
    for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
      const match = A[i - 1] === B[j - 1];
      steps.push({ i, j, order: (i - 1) * n + (j - 1), match });
    }
    steps.push({ i: -1, j: -1, order: m * n, done: true });

    steps.forEach((s) => {
      s.vars = [
        { k: "cell", v: s.i < 0 ? "-" : "(" + s.i + "," + s.j + ")" },
        { k: "dp", v: s.i < 0 ? dp[m][n] : (s.init ? 0 : dp[s.i][s.j]), cls: "good" },
        { k: "LCS", v: dp[m][n], cls: "hot" }
      ];
      if (s.init) s.note = "Base row and column are all <b>0</b> (an empty prefix shares nothing).";
      else if (s.done) { s.note = "Longest common subsequence has length <b>" + dp[m][n] + "</b> (green diagonal path)."; s.results = ["length = " + dp[m][n]]; }
      else if (s.match) s.note = "A[" + (s.i - 1) + "]='" + A[s.i - 1] + "' = B[" + (s.j - 1) + "]='" + B[s.j - 1] + "' - extend the diagonal: dp = dp[" + (s.i - 1) + "][" + (s.j - 1) + "] + 1 = <b>" + dp[s.i][s.j] + "</b>.";
      else s.note = "'" + A[s.i - 1] + "' != '" + B[s.j - 1] + "' - inherit the better neighbour: dp = max(up " + dp[s.i - 1][s.j] + ", left " + dp[s.i][s.j - 1] + ") = <b>" + dp[s.i][s.j] + "</b>.";
    });

    function goTo(k) {
      const s = steps[k];
      const showPath = !!s.done;
      let sources = new Set();
      if (!s.init && !s.done) {
        if (s.match) sources.add((s.i - 1) + "," + (s.j - 1));
        else { sources.add((s.i - 1) + "," + s.j); sources.add(s.i + "," + (s.j - 1)); }
      }
      for (let i = 0; i <= m; i++) for (let j = 0; j <= n; j++) {
        const tile = cells[i][j];
        const base = tile.userData.base;
        const revealed = base || (i - 1) * n + (j - 1) <= s.order;
        let col = base ? C.dim : (revealed ? C.bar : C.dim), em = 0x000000, active = false;
        if (revealed && !base) tile.userData.valLbl.userData.setText(String(dp[i][j]));
        else if (!base) tile.userData.valLbl.userData.setText("");
        if (sources.has(i + "," + j)) { col = C.left; em = C.left; active = true; }
        if (i === s.i && j === s.j) { col = s.match ? C.good : C.hot; em = s.match ? C.good : C.hot; active = true; }
        if (showPath && path.has(i + "," + j)) { col = C.good; em = C.good; active = true; }
        tile.userData.targetColor.set(col);
        tile.userData.emissiveColor.set(em);
        tile.userData.active = active;
      }
      banner.userData.setText(s.done ? "LCS length = " + dp[m][n] : "filling grid...");
    }

    S.onTick(() => {
      const t = performance.now() * 0.004;
      for (let i = 0; i <= m; i++) for (let j = 0; j <= n; j++) {
        const tile = cells[i][j], mt = tile.material;
        mt.color.lerp(tile.userData.targetColor, 0.16);
        mt.emissive.lerp(tile.userData.emissiveColor, 0.2);
        mt.emissiveIntensity = tile.userData.active ? (0.45 + Math.sin(t) * 0.2) : 0.0;
      }
    });

    goTo(0);
    return { steps, goTo, dispose: S.dispose };
  }
};
