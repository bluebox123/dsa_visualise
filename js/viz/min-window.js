/* ============================================================
   Viz: Minimum Window Substring (LC 76)
   String s laid out as tiles. We chase a "have / need" counter:
   grow the window on the right until it contains every letter of
   t (all needs met → the window turns valid/green), then greedily
   contract from the left to squeeze out slack while it stays
   valid. The smallest valid window ever seen is kept as a copper
   ghost — that's the answer.
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["min-window"] = {
  samples: [
    { label: "s=\"ADOBECODEBANC\" t=\"ABC\"", s: "ADOBECODEBANC", t: "ABC" },
    { label: "s=\"AA\" t=\"AA\"", s: "AA", t: "AA" },
    { label: "s=\"a\" t=\"a\"", s: "a", t: "a" },
    { label: "s=\"a\" t=\"aa\"  (none)", s: "a", t: "aa" }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const data = this.samples[sampleIndex];
    const str = data.s, t = data.t, n = str.length;

    // need counts
    const need = {};
    for (const ch of t) need[ch] = (need[ch] || 0) + 1;
    const required = Object.keys(need).length;
    const isTarget = (ch) => need[ch] !== undefined;

    const spacing = Math.min(2.0, 15 / n);
    const tileW = Math.min(1.5, spacing * 0.86);
    const tileH = 1.5, depth = 1.5;
    const xAt = (i) => (i - (n - 1) / 2) * spacing;

    // ---- letter tiles (target letters get a faint underline marker) ----
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

      if (isTarget(str[i])) {
        const mark = DSAV.makeBar(tileW * 0.7, 0.12, 0.12, C.anchor);
        mark.position.set(xAt(i), 0.06, depth / 2 + 0.2);
        S.world.add(mark);
      }
      const idx = DSAV.makeLabel(String(i), { fontSize: 34, color: "#8f7a5e", scale: 0.72 });
      idx.position.set(xAt(i), 0.14, depth / 2 + 0.55);
      S.world.add(idx);
    }

    // ---- window box + best ghost ----
    const winBox = new T.Mesh(
      new T.BoxGeometry(1, tileH + 0.7, depth + 0.5),
      new T.MeshStandardMaterial({
        color: C.right, transparent: true, opacity: 0.15,
        roughness: 0.3, metalness: 0.1, emissive: C.right, emissiveIntensity: 0.16
      })
    );
    winBox.userData = { tgtX: 0, tgtW: 1, tgtColor: new T.Color(C.right) };
    winBox.visible = false;
    S.world.add(winBox);

    const ghost = new T.Mesh(
      new T.BoxGeometry(1, tileH + 1.0, depth + 0.8),
      new T.MeshBasicMaterial({ color: C.hot, wireframe: true, transparent: true, opacity: 0.75 })
    );
    ghost.userData = { tgtX: 0, tgtW: 1 };
    ghost.visible = false;
    S.world.add(ghost);

    // ---- pointers ----
    const zFront = depth / 2 + 1.0;
    const pL = DSAV.makePointer(C.left, "L");
    const pR = DSAV.makePointer(C.right, "R");
    [pL, pR].forEach((p) => { p.position.set(0, 0.55, zFront); p.userData.tgt = new T.Vector3(0, 0.55, zFront); S.world.add(p); });

    // ---- readouts ----
    const topY = tileH + 2.2;
    const haveLbl = DSAV.makeLabel(`have 0 / ${required}`, { fontSize: 46, color: "#1c0d07", bg: DSAV.rgbHex(C.right), scale: 1.05, noDepth: true });
    haveLbl.position.set(0, topY, 0);
    S.world.add(haveLbl);

    S.controls.target.set(0, topY * 0.5, 0);
    S.camera.position.set(0, topY * 0.5 + 3.5, Math.max(14, n * 2.1));

    // ---- compute steps ----
    const steps = [];
    const wc = {};
    let left = 0, formed = 0;
    let bestLen = Infinity, bestL = 0, bestR = -1;

    for (let right = 0; right < n; right++) {
      const c = str[right];
      wc[c] = (wc[c] || 0) + 1;
      if (isTarget(c) && wc[c] === need[c]) formed++;
      steps.push({ type: "expand", left, right, formed, valid: formed === required, bestL, bestR, bestLen });

      while (formed === required) {
        if (right - left + 1 < bestLen) {
          bestLen = right - left + 1; bestL = left; bestR = right;
          steps.push({ type: "record", left, right, formed, valid: true, bestL, bestR, bestLen });
        }
        const d = str[left];
        wc[d]--;
        if (isTarget(d) && wc[d] < need[d]) formed--;
        left++;
        steps.push({ type: "contract", left, right, formed, valid: formed === required, dropped: d, bestL, bestR, bestLen });
      }
    }
    steps.push({ type: "done", left, right: n - 1, formed, valid: false, bestL, bestR, bestLen });

    const answer = bestR >= 0 ? str.slice(bestL, bestR + 1) : "";

    // ---- decorate ----
    steps.forEach((s) => {
      const winStr = s.right >= s.left ? str.slice(s.left, s.right + 1) : "";
      s.vars = [
        { k: "left", v: s.left },
        { k: "right", v: Math.max(0, s.right) },
        { k: "window", v: `"${winStr}"` },
        { k: "have/need", v: `${s.formed} / ${required}`, cls: s.valid ? "good" : "hot" },
        { k: "best", v: s.bestR >= 0 ? `"${str.slice(s.bestL, s.bestR + 1)}"` : "—", cls: "hot" }
      ];
      switch (s.type) {
        case "expand":
          s.note = `Expand right to '<b>${str[s.right]}</b>' (index ${s.right}). Covered ${s.formed} of ${required} required letters` +
            (s.valid ? " — <b>window is now valid!</b> Time to squeeze from the left." : ".");
          break;
        case "record":
          s.note = `Valid window "<b>${str.slice(s.left, s.right + 1)}</b>" of length ${s.bestLen} — smallest so far. Save it, then keep trimming.`;
          break;
        case "contract":
          s.note = `Drop '<b>${s.dropped}</b>' and <b>left++</b> to ${s.left}. ` +
            (s.valid ? "Still valid — keep trimming." : "That broke coverage — expand the right again.");
          break;
        case "done":
          s.note = answer
            ? `Done. The minimum window containing all of "${t}" is <b>"${answer}"</b> (length ${bestLen}).`
            : `Done. No window of s contains every letter of "${t}" — answer is the empty string.`;
          s.results = answer ? [`"${answer}"`, `len = ${bestLen}`] : [`"" (none)`];
          break;
      }
    });

    // ---- apply step ----
    function goTo(idx) {
      const s = steps[idx];
      const inWin = (i) => i >= s.left && i <= s.right;
      const done = s.type === "done";

      tiles.forEach((tile, i) => {
        let col = new T.Color(C.dim), em = 0x000000, active = false;
        if (inWin(i) && !done) {
          if (isTarget(str[i])) { col = new T.Color(C.good); em = C.good; active = true; }
          else { col = new T.Color(C.bar); active = true; }
        }
        if (i === s.right && s.right >= 0 && !done) { em = C.right; active = true; }
        tile.userData.targetColor = col;
        tile.userData.emissiveColor.set(em);
        tile.userData.active = active;
      });

      const showWin = s.right >= s.left && !done;
      winBox.visible = showWin;
      if (showWin) {
        winBox.userData.tgtX = (xAt(s.left) + xAt(s.right)) / 2;
        winBox.userData.tgtW = (s.right - s.left) * spacing + tileW + 0.4;
        winBox.userData.tgtColor.set(s.valid ? C.good : C.right);
      }

      const showGhost = s.bestR >= 0;
      ghost.visible = showGhost;
      if (showGhost) {
        ghost.userData.tgtX = (xAt(s.bestL) + xAt(s.bestR)) / 2;
        ghost.userData.tgtW = (s.bestR - s.bestL) * spacing + tileW + 0.7;
      }

      pL.userData.tgt.set(xAt(Math.min(s.left, n - 1)), 0.55, zFront);
      pR.userData.tgt.set(xAt(Math.max(0, s.right)), 0.55, zFront);
      pL.visible = !done; pR.visible = !done;

      haveLbl.userData.setText(`have ${s.formed} / ${required}`);
    }

    // ---- tick ----
    S.onTick(() => {
      const t2 = performance.now() * 0.004;
      tiles.forEach((tile) => {
        const m = tile.material;
        m.color.lerp(tile.userData.targetColor, 0.14);
        m.emissive.lerp(tile.userData.emissiveColor, 0.18);
        m.emissiveIntensity = tile.userData.active ? (0.35 + Math.sin(t2) * 0.18) : 0.0;
      });
      lerpBoxX(winBox, 0.16);
      lerpBoxX(ghost, 0.16);
      winBox.material.color.lerp(winBox.userData.tgtColor, 0.12);
      winBox.material.emissive.lerp(winBox.userData.tgtColor, 0.12);
      winBox.material.emissiveIntensity = 0.16 + Math.sin(t2) * 0.06;
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
