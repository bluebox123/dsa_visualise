/* ============================================================
   Viz: Longest Substring Without Repeating Characters (LC 3)
   Letter tiles in a row. A translucent window box spans
   [left..right]. The right edge expands one tile at a time;
   when the new letter already lives inside the window, the
   left edge slides forward (dropping letters from the "seen"
   set) until the duplicate is gone. A copper ghost marks the
   longest clean window found so far.
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["longest-substring"] = {
  samples: [
    { label: "\"abcabcbb\"", s: "abcabcbb" },
    { label: "\"bbbbb\"", s: "bbbbb" },
    { label: "\"pwwkew\"", s: "pwwkew" },
    { label: "\"abba\"", s: "abba" }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const str = this.samples[sampleIndex].s;
    const n = str.length;

    const spacing = Math.min(2.0, 15 / n);
    const tileW = Math.min(1.5, spacing * 0.86);
    const tileH = 1.5, depth = 1.5;
    const xAt = (i) => (i - (n - 1) / 2) * spacing;

    // ---- letter tiles ----
    const tiles = [];
    for (let i = 0; i < n; i++) {
      const tile = DSAV.makeBar(tileW, tileH, depth, C.bar);
      tile.position.set(xAt(i), tileH / 2, 0);
      tile.userData = {
        baseColor: new T.Color(C.bar),
        targetColor: new T.Color(C.bar),
        emissiveColor: new T.Color(0x000000),
        active: false
      };
      const glyph = DSAV.makeLabel(str[i], { fontSize: 96, color: "#1c0d07", scale: 1.5 });
      glyph.position.set(0, 0, depth / 2 + 0.01);
      tile.add(glyph);
      S.world.add(tile);
      tiles.push(tile);

      const idx = DSAV.makeLabel(String(i), { fontSize: 34, color: "#8f7a5e", scale: 0.72 });
      idx.position.set(xAt(i), 0.14, depth / 2 + 0.55);
      S.world.add(idx);
    }

    // ---- window box ----
    const winBox = new T.Mesh(
      new T.BoxGeometry(1, tileH + 0.7, depth + 0.5),
      new T.MeshStandardMaterial({
        color: C.good, transparent: true, opacity: 0.16,
        roughness: 0.3, metalness: 0.1, emissive: C.good, emissiveIntensity: 0.18
      })
    );
    winBox.userData = { tgtX: 0, tgtW: 1 };
    winBox.visible = false;
    S.world.add(winBox);

    // ---- best-window ghost ----
    const ghost = new T.Mesh(
      new T.BoxGeometry(1, tileH + 1.0, depth + 0.8),
      new T.MeshBasicMaterial({ color: C.hot, wireframe: true, transparent: true, opacity: 0.7 })
    );
    ghost.userData = { tgtX: 0, tgtW: 1 };
    ghost.visible = false;
    S.world.add(ghost);

    // ---- pointers ----
    const zFront = depth / 2 + 1.0;
    const pL = DSAV.makePointer(C.left, "L");
    const pR = DSAV.makePointer(C.right, "R");
    [pL, pR].forEach((p) => { p.position.set(0, 0.55, zFront); p.userData.tgt = new T.Vector3(0, 0.55, zFront); S.world.add(p); });

    // ---- best readout ----
    const topY = tileH + 2.2;
    const bestLbl = DSAV.makeLabel("best = 0", { fontSize: 50, color: "#1c0d07", bg: DSAV.rgbHex(C.hot), scale: 1.15, noDepth: true });
    bestLbl.position.set(0, topY, 0);
    S.world.add(bestLbl);

    S.controls.target.set(0, topY * 0.5, 0);
    S.camera.position.set(0, topY * 0.5 + 3.5, Math.max(14, n * 2.0));

    // ---- compute steps ----
    const steps = [];
    const seen = new Set();
    let left = 0, best = 0, bestL = 0, bestR = -1;
    for (let right = 0; right < n; right++) {
      const c = str[right];
      const dup = seen.has(c);
      steps.push({ type: "read", left, right, c, dup, set: [...seen], best, bestL, bestR });
      while (seen.has(c)) {
        seen.delete(str[left]);
        left++;
        steps.push({ type: "shrink", left, right, c, removed: str[left - 1], set: [...seen], best, bestL, bestR });
      }
      seen.add(c);
      const len = right - left + 1;
      if (len > best) { best = len; bestL = left; bestR = right; }
      steps.push({ type: "settle", left, right, c, len, set: [...seen], best, bestL, bestR });
    }
    steps.push({ type: "done", left, right: n - 1, best, bestL, bestR, set: [...seen] });

    // ---- decorate ----
    steps.forEach((s) => {
      const len = s.right - s.left + 1;
      s.vars = [
        { k: "left", v: s.left },
        { k: "right", v: Math.max(0, s.right) },
        { k: "window", v: `"${str.slice(s.left, s.right + 1)}"` },
        { k: "len", v: len, cls: "hot" },
        { k: "best", v: s.best, cls: "good" }
      ];
      switch (s.type) {
        case "read":
          s.note = s.dup
            ? `Right reaches '<b>${s.c}</b>' (index ${s.right}) — but '${s.c}' is <b>already in the window</b>. Must shrink from the left first.`
            : `Right reaches '<b>${s.c}</b>' (index ${s.right}) — not in the window yet, so the window can safely grow.`;
          break;
        case "shrink":
          s.note = `Drop '<b>${s.removed}</b>' from the left and <b>left++</b>. Keep shrinking until the duplicate '${s.c}' is gone.`;
          break;
        case "settle":
          s.note = `Window "<b>${str.slice(s.left, s.right + 1)}</b>" is now repeat-free — length ${len}.` +
            (len === s.best && s.bestR === s.right ? " New longest!" : ` Best stays ${s.best}.`);
          break;
        case "done":
          s.note = `Scan complete. Longest substring without repeats has length <b>${s.best}</b>` +
            (s.bestR >= 0 ? ` — "${str.slice(s.bestL, s.bestR + 1)}".` : ".");
          s.results = [`best = ${s.best}`].concat(s.bestR >= 0 ? [`"${str.slice(s.bestL, s.bestR + 1)}"`] : []);
          break;
      }
    });

    // ---- apply step ----
    function goTo(k) {
      const s = steps[k];
      const inWin = (i) => i >= s.left && i <= s.right;
      const done = s.type === "done";

      tiles.forEach((tile, i) => {
        let col = new T.Color(C.dim), em = 0x000000, active = false;
        if (inWin(i)) { col = new T.Color(C.hot); active = true; em = 0x3a1c05; }
        if (s.type === "read" && i === s.right && s.dup) { em = C.bad; active = true; col = new T.Color(C.bad); }
        else if (i === s.right && s.right >= 0 && !done) { em = C.right; active = true; }
        tile.userData.targetColor = col;
        tile.userData.emissiveColor.set(em);
        tile.userData.active = active;
      });

      const showWin = s.right >= 0 && s.left <= s.right;
      winBox.visible = showWin;
      if (showWin) {
        winBox.userData.tgtX = (xAt(s.left) + xAt(s.right)) / 2;
        winBox.userData.tgtW = (s.right - s.left) * spacing + tileW + 0.4;
      }

      const showGhost = s.bestR >= 0;
      ghost.visible = showGhost;
      if (showGhost) {
        ghost.userData.tgtX = (xAt(s.bestL) + xAt(s.bestR)) / 2;
        ghost.userData.tgtW = (s.bestR - s.bestL) * spacing + tileW + 0.7;
      }

      pL.userData.tgt.set(xAt(s.left), 0.55, zFront);
      pR.userData.tgt.set(xAt(Math.max(0, s.right)), 0.55, zFront);
      pL.visible = !done; pR.visible = !done;

      bestLbl.userData.setText(`best = ${s.best}`);
      bestLbl.position.x = showGhost ? (xAt(s.bestL) + xAt(s.bestR)) / 2 : 0;
    }

    // ---- tick ----
    S.onTick(() => {
      const t = performance.now() * 0.004;
      tiles.forEach((tile) => {
        const m = tile.material;
        m.color.lerp(tile.userData.targetColor, 0.14);
        m.emissive.lerp(new T.Color(tile.userData.emissiveColor), 0.18);
        m.emissiveIntensity = tile.userData.active ? (0.35 + Math.sin(t) * 0.18) : 0.0;
      });
      lerpBoxX(winBox, 0.16);
      lerpBoxX(ghost, 0.16);
      winBox.material.emissiveIntensity = 0.18 + Math.sin(t) * 0.06;
      DSAV.lerpToTarget(pL, 0.16);
      DSAV.lerpToTarget(pR, 0.16);
    });

    function lerpBoxX(box, sp) {
      box.position.x += (box.userData.tgtX - box.position.x) * sp;
      box.scale.x += (box.userData.tgtW - box.scale.x) * sp;
      box.position.y = tileH / 2;
    }

    goTo(0);
    return { steps, goTo, dispose: S.dispose };
  }
};
