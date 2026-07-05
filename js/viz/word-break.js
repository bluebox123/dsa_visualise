/* ============================================================
   Viz: Word Break (LC 139)
   The string sits as a row of letter tiles with a dp marker at every
   boundary (0..len). dp[i] is true if s[0..i) splits into dictionary
   words. Marker 0 starts true; for each boundary i we look back for a
   true marker j such that s[j..i) is a dictionary word - if found, the
   matched word flashes green and marker i turns true. dp[len] decides.
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["word-break"] = {
  samples: [
    { label: '"leetcode" / [leet,code]', s: "leetcode", dict: ["leet", "code"] },
    { label: '"applepenapple"', s: "applepenapple", dict: ["apple", "pen"] },
    { label: '"catsandog" (false)', s: "catsandog", dict: ["cats", "dog", "sand", "and", "cat"] }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const cfg = this.samples[sampleIndex];
    const s = cfg.s, dict = new Set(cfg.dict), len = s.length;

    const dp = new Array(len + 1).fill(false);
    dp[0] = true;
    const breakJ = new Array(len + 1).fill(-1);
    for (let i = 1; i <= len; i++) for (let j = 0; j < i; j++) {
      if (dp[j] && dict.has(s.slice(j, i))) { dp[i] = true; if (breakJ[i] < 0) breakJ[i] = j; }
    }
    // reconstruct a segmentation if possible
    const segChars = new Set();
    if (dp[len]) { let i = len; while (i > 0) { const j = breakJ[i]; for (let c = j; c < i; c++) segChars.add(c); i = j; } }

    const spacing = Math.min(1.7, 15 / len);
    const xAt = (i) => (i - (len - 1) / 2) * spacing;
    const bxAt = (i) => (i - len / 2) * spacing;   // boundary positions 0..len

    const tiles = [];
    for (let i = 0; i < len; i++) {
      const tile = DSAV.makeBar(spacing * 0.82, 1.0, 1.2, C.bar);
      tile.position.set(xAt(i), 0.5, 0);
      tile.userData = { targetColor: new T.Color(C.bar), emissiveColor: new T.Color(0x000000), active: false };
      S.world.add(tile);
      tiles.push(tile);
      const lbl = DSAV.makeLabel(s[i], { fontSize: 44, color: "#1c0d07", scale: 0.82 });
      lbl.position.set(xAt(i), 0.5, 0.63); S.world.add(lbl);
    }

    const markers = [];
    for (let i = 0; i <= len; i++) {
      const mk = new T.Mesh(new T.SphereGeometry(0.16, 16, 16), new T.MeshStandardMaterial({ color: C.dim, roughness: 0.5 }));
      mk.position.set(bxAt(i), 1.35, 0);
      mk.userData = { targetColor: new T.Color(C.dim) };
      S.world.add(mk);
      markers.push(mk);
    }

    const banner = DSAV.makeLabel("dict: " + cfg.dict.join(", "), { fontSize: 34, color: "#1c0d07", bg: DSAV.rgbHex(C.hot), scale: 1.0, noDepth: true });
    banner.position.set(0, 3.0, 0);
    S.world.add(banner);
    S.controls.target.set(0, 0.7, 0);
    S.camera.position.set(0, 3.5, Math.max(14, len * 1.8));

    // ---- steps ----
    const steps = [];
    steps.push({ i: 0, j: -1, word: "", filled: 1, init: true });
    for (let i = 1; i <= len; i++) steps.push({ i, j: breakJ[i], word: breakJ[i] >= 0 ? s.slice(breakJ[i], i) : "", filled: i + 1, ok: dp[i] });
    steps.push({ i: -1, j: -1, word: "", filled: len + 1, done: true });

    steps.forEach((st) => {
      st.vars = [
        { k: "boundary i", v: st.i < 0 ? "-" : st.i },
        { k: "dp[i]", v: st.i < 0 ? (dp[len] ? "true" : "false") : (dp[st.i] ? "true" : "false"), cls: (st.i < 0 ? dp[len] : dp[st.i]) ? "good" : "hot" }
      ];
      if (st.init) st.note = "dp[0] = <b>true</b> - the empty prefix is trivially segmentable.";
      else if (st.done) { st.note = dp[len] ? 'The whole string splits into dictionary words - <b>true</b>.' : 'No split covers "' + s + '" - <b>false</b>.'; st.results = [dp[len] ? "true" : "false"]; }
      else if (st.ok) st.note = 'dp[' + st.i + '] = true: dp[' + st.j + '] is true and "<b>' + st.word + '</b>" is in the dictionary.';
      else st.note = "Boundary " + st.i + ": no true dp[j] with s[j.." + st.i + ") in the dictionary - dp[" + st.i + "] stays false.";
    });

    function goTo(k) {
      const st = steps[k];
      const showSeg = !!st.done && dp[len];
      const wordRange = (st.j >= 0 && st.i >= 0) ? [st.j, st.i] : null;
      tiles.forEach((tile, i) => {
        let col = C.bar, em = 0x000000, active = false;
        if (showSeg && segChars.has(i)) { col = C.good; em = C.good; active = true; }
        if (wordRange && i >= wordRange[0] && i < wordRange[1]) { col = st.ok ? C.good : C.hot; em = st.ok ? C.good : C.hot; active = true; }
        tile.userData.targetColor.set(col);
        tile.userData.emissiveColor.set(em);
        tile.userData.active = active;
      });
      markers.forEach((mk, i) => {
        const revealed = i < st.filled;
        const on = revealed && dp[i];
        mk.userData.targetColor.set(on ? C.good : C.dim);
        if (st.i === i) mk.userData.targetColor.set(C.hot);
      });
      banner.userData.setText(st.done ? (dp[len] ? "segmentable = true" : "false") : "dict: " + cfg.dict.join(", "));
    }

    S.onTick(() => {
      const t = performance.now() * 0.004;
      tiles.forEach((tile) => {
        const m = tile.material;
        m.color.lerp(tile.userData.targetColor, 0.16);
        m.emissive.lerp(tile.userData.emissiveColor, 0.2);
        m.emissiveIntensity = tile.userData.active ? (0.45 + Math.sin(t) * 0.2) : 0.0;
      });
      markers.forEach((mk) => mk.material.color.lerp(mk.userData.targetColor, 0.16));
    });

    goTo(0);
    return { steps, goTo, dispose: S.dispose };
  }
};
