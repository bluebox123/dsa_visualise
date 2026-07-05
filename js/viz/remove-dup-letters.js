/* ============================================================
   Viz: Remove Duplicate Letters (LC 316)
   Letter tiles in scan order. A "result stack" column builds the
   answer left-to-right. For each new letter: if it's already in
   the result, skip it. Otherwise, while the stack's top letter is
   larger than the current one AND that top letter still appears
   later in the string, pop it (we can afford to drop it now and
   re-add it later) — this keeps the result lexicographically
   smallest. Then push the current letter.
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["remove-dup-letters"] = {
  samples: [
    { label: '"bcabc"', s: "bcabc" },
    { label: '"cbacdcbc"', s: "cbacdcbc" },
    { label: '"ecbacba"', s: "ecbacba" },
    { label: '"abacb"', s: "abacb" }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const str = this.samples[sampleIndex].s, n = str.length;

    const lastIdx = {};
    for (let i = 0; i < n; i++) lastIdx[str[i]] = i;

    const spacing = Math.min(2.0, 15 / n);
    const tileW = Math.min(1.4, spacing * 0.86);
    const tileH = 1.4, depth = 1.3;
    const xAt = (i) => (i - (n - 1) / 2) * spacing;

    const tiles = [];
    for (let i = 0; i < n; i++) {
      const tile = DSAV.makeBar(tileW, tileH, depth, C.bar);
      tile.position.set(xAt(i), tileH / 2, 0);
      tile.userData = { targetColor: new T.Color(C.bar), emissiveColor: new T.Color(0x000000), active: false };
      const glyph = DSAV.makeLabel(str[i], { fontSize: 88, color: "#1c0d07", scale: 1.4 });
      glyph.position.set(0, 0, depth / 2 + 0.01);
      tile.add(glyph);
      S.world.add(tile);
      tiles.push(tile);
    }

    const zFront = depth / 2 + 1.1;
    const pCur = DSAV.makePointer(C.left, "i");
    pCur.position.y = 0.55; pCur.userData.tgt = new T.Vector3(0, 0.55, zFront);
    S.world.add(pCur);

    // result stack tiles, laid out above, growing left to right
    const stackY = tileH + 2.4;
    const stackTiles = [];
    for (let i = 0; i < n; i++) {
      const st = DSAV.makeBar(tileW, tileH * 0.85, depth * 0.85, C.good);
      st.position.set(0, stackY, 0);
      st.visible = false;
      const glyph = DSAV.makeLabel("", { fontSize: 80, color: "#1c0d07", scale: 1.3 });
      glyph.position.set(0, 0, depth * 0.85 / 2 + 0.01);
      st.add(glyph);
      st.glyph = glyph;
      S.world.add(st);
      stackTiles.push(st);
    }
    const stackLbl = DSAV.makeLabel("result: (empty)", { fontSize: 40, color: "#1c0d07", bg: DSAV.rgbHex(C.good), scale: 0.95, noDepth: true });
    stackLbl.position.set(0, stackY + 1.4, 0);
    S.world.add(stackLbl);

    S.controls.target.set(0, (stackY) * 0.55, 0);
    S.camera.position.set(0, stackY * 0.6 + 3, Math.max(15, n * 2.2));

    // ---- steps ----
    const steps = [];
    const stack = [];
    const inStack = new Set();
    for (let i = 0; i < n; i++) {
      const c = str[i];
      if (inStack.has(c)) { steps.push({ type: "skip", i, c, stack: [...stack] }); continue; }
      steps.push({ type: "consider", i, c, stack: [...stack] });
      while (stack.length && stack[stack.length - 1] > c && lastIdx[stack[stack.length - 1]] > i) {
        const popped = stack.pop();
        inStack.delete(popped);
        steps.push({ type: "pop", i, c, popped, stack: [...stack] });
      }
      stack.push(c);
      inStack.add(c);
      steps.push({ type: "push", i, c, stack: [...stack] });
    }
    steps.push({ type: "done", stack: [...stack] });

    steps.forEach((s) => {
      s.vars = [
        { k: "i", v: s.i !== undefined ? s.i : "—" },
        { k: "char", v: s.c || "—" },
        { k: "result", v: `"${s.stack.join("")}"`, cls: "good" }
      ];
      switch (s.type) {
        case "skip": s.note = `'<b>${s.c}</b>' is already in the result — using it again can't help, skip.`; break;
        case "consider": s.note = `'<b>${s.c}</b>' isn't in the result yet. Check if we can pop a larger letter off the top to make things smaller.`; break;
        case "pop": s.note = `Top of result is '<b>${s.popped}</b>' — bigger than '${s.c}', and '${s.popped}' appears again later (index ${lastIdx[s.popped]}), so it's safe to drop now and re-add later.`; break;
        case "push": s.note = `Push '<b>${s.c}</b>' onto the result: "${s.stack.join("")}".`; break;
        case "done": s.note = `Done. The lexicographically smallest subsequence using every distinct letter once is <b>"${s.stack.join("")}"</b>.`; s.results = [`"${s.stack.join("")}"`]; break;
      }
    });

    function goTo(k) {
      const s = steps[k];
      tiles.forEach((tile, i) => {
        let col = new T.Color(C.dim), em = 0x000000, active = false;
        if (i < s.i || (s.i !== undefined && i === s.i)) { col = new T.Color(C.bar); }
        if (i === s.i) { col = new T.Color(s.type === "skip" ? C.bad : C.left); em = C.left; active = true; }
        tile.userData.targetColor = col;
        tile.userData.emissiveColor.set(em);
        tile.userData.active = active;
      });
      pCur.visible = s.i !== undefined;
      if (s.i !== undefined) pCur.userData.tgt.set(xAt(s.i), 0.55, zFront);

      stackTiles.forEach((st, idx) => {
        if (idx < s.stack.length) {
          st.visible = true;
          st.glyph.userData.setText(s.stack[idx]);
          st.userData.tgtX = (idx - (s.stack.length - 1) / 2) * spacing;
        } else st.visible = false;
      });
      stackLbl.userData.setText(`result: "${s.stack.join("")}"` || "result: (empty)");
    }

    S.onTick(() => {
      const t = performance.now() * 0.004;
      tiles.forEach((tile) => {
        const m = tile.material;
        m.color.lerp(tile.userData.targetColor, 0.13);
        m.emissive.lerp(tile.userData.emissiveColor, 0.18);
        m.emissiveIntensity = tile.userData.active ? (0.35 + Math.sin(t) * 0.18) : 0.0;
      });
      stackTiles.forEach((st) => {
        if (st.visible && st.userData.tgtX !== undefined) {
          st.position.x += (st.userData.tgtX - st.position.x) * 0.2;
        }
      });
      DSAV.lerpToTarget(pCur, 0.16);
    });

    goTo(0);
    return { steps, goTo, dispose: S.dispose };
  }
};
