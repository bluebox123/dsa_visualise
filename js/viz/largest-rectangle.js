/* ============================================================
   Viz: Largest Rectangle in Histogram (LC 84)
   Histogram bars. An increasing stack of indices tracks bars
   still waiting to know their right boundary. When a shorter bar
   arrives, we pop the taller one and know its rectangle: height
   = popped bar, width = distance between the new stack top and
   the current index. The biggest rectangle seen glows and stays
   as a ghost outline.
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["largest-rectangle"] = {
  samples: [
    { label: "[2,1,5,6,2,3]", heights: [2, 1, 5, 6, 2, 3] },
    { label: "[2,4]", heights: [2, 4] },
    { label: "[6,2,5,4,5,1,6]", heights: [6, 2, 5, 4, 5, 1, 6] },
    { label: "[1,1,1,1]", heights: [1, 1, 1, 1] }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const heights = this.samples[sampleIndex].heights, n = heights.length;

    const spacing = Math.min(2.0, 15 / n);
    const barW = spacing * 0.95, depth = 1.3;
    const maxH = Math.max(...heights);
    const unit = 4.8 / maxH;
    const xAt = (i) => (i - (n - 1) / 2) * spacing;
    const hAt = (v) => Math.max(0.3, v * unit);

    const bars = [];
    heights.forEach((v, i) => {
      const h = hAt(v);
      const bar = DSAV.makeBar(barW, h, depth, C.bar);
      bar.position.set(xAt(i), h / 2, 0);
      bar.userData = { targetColor: new T.Color(C.bar), emissiveColor: new T.Color(0x000000), active: false };
      S.world.add(bar);
      bars.push(bar);
      const val = DSAV.makeLabel(String(v), { fontSize: 40, color: "#fbf6ee", scale: 0.85 });
      val.position.set(xAt(i), h + 0.4, depth / 2);
      S.world.add(val);
    });

    const zFront = depth / 2 + 1.1;
    const pCur = DSAV.makePointer(C.left, "i");
    pCur.position.y = 0.55; pCur.userData.tgt = new T.Vector3(0, 0.55, zFront);
    S.world.add(pCur);

    // rectangle ghost (best so far)
    const ghost = new T.Mesh(
      new T.BoxGeometry(1, 1, depth + 0.3),
      new T.MeshBasicMaterial({ color: C.hot, wireframe: true, transparent: true, opacity: 0.8 })
    );
    ghost.userData = { tgtX: 0, tgtW: 1, tgtH: 1 };
    ghost.visible = false;
    S.world.add(ghost);

    // current candidate rectangle (translucent fill)
    const cand = new T.Mesh(
      new T.BoxGeometry(1, 1, depth + 0.1),
      new T.MeshStandardMaterial({ color: C.good, transparent: true, opacity: 0.28, emissive: C.good, emissiveIntensity: 0.25 })
    );
    cand.userData = { tgtX: 0, tgtW: 1, tgtH: 1 };
    cand.visible = false;
    S.world.add(cand);

    const topY = maxH * unit + 2.2;
    const bestLbl = DSAV.makeLabel("best = 0", { fontSize: 44, color: "#1c0d07", bg: DSAV.rgbHex(C.hot), scale: 1.0, noDepth: true });
    bestLbl.position.set(0, topY, 0);
    S.world.add(bestLbl);
    S.controls.target.set(0, topY * 0.4, 0);
    S.camera.position.set(0, topY * 0.5 + 3, Math.max(15, n * 2.2));

    // ---- steps: increasing stack, sentinel 0 at the end ----
    const steps = [];
    const stack = [];
    const h2 = [...heights, 0];
    let best = 0, bestRect = null;
    for (let i = 0; i < h2.length; i++) {
      steps.push({ type: "arrive", i, stack: [...stack], best, bestRect });
      while (stack.length && h2[stack[stack.length - 1]] >= h2[i]) {
        const top = stack.pop();
        const width = stack.length ? i - stack[stack.length - 1] - 1 : i;
        const area = h2[top] * width;
        const left = stack.length ? stack[stack.length - 1] + 1 : 0;
        const rect = { left, right: i - 1, height: h2[top], area };
        steps.push({ type: "pop", i, top, width, area, rect, stack: [...stack], best, bestRect });
        if (area > best) { best = area; bestRect = rect; }
      }
      stack.push(i);
      if (i < n) steps.push({ type: "push", i, stack: [...stack], best, bestRect });
    }
    steps.push({ type: "done", best, bestRect });

    steps.forEach((s) => {
      s.vars = [
        { k: "i", v: s.i !== undefined && s.i < n ? s.i : "end" },
        { k: "stack (indices)", v: `[${s.stack ? s.stack.join(", ") : ""}]`, cls: "hot" },
        { k: "best area", v: s.best, cls: "good" }
      ];
      switch (s.type) {
        case "arrive": s.note = h2[s.i] !== undefined && s.i < n ? `Bar ${s.i} = ${heights[s.i]}. While it's shorter than the stack's top bar, that top bar's right boundary is settled.` : `Sentinel: force-pop everything remaining.`; break;
        case "pop": s.note = `Pop bar ${s.top} (height ${h2[s.top]}). Its rectangle spans [${s.rect.left}, ${s.rect.right}] → width ${s.width} × height ${h2[s.top]} = <b>${s.area}</b>.` + (s.area > s.best ? " New best!" : ""); break;
        case "push": s.note = `Push bar ${s.i} — taller than the new stack top (or stack empty), so its left boundary isn't settled yet.`; break;
        case "done": s.note = `All bars resolved. Largest rectangle has area <b>${s.best}</b>.`; s.results = [`area = ${s.best}`]; break;
      }
    });

    function goTo(k) {
      const s = steps[k];
      const stackSet = new Set(s.stack || []);
      bars.forEach((bar, i) => {
        let col = new T.Color(C.bar), em = 0x000000, active = false;
        if (stackSet.has(i)) { col = new T.Color(C.hot); em = 0x3a1c05; active = true; }
        if (i === s.i) { col = new T.Color(C.left); em = C.left; active = true; }
        if (i === s.top) { col = new T.Color(C.good); em = C.good; active = true; }
        bar.userData.targetColor = col;
        bar.userData.emissiveColor.set(em);
        bar.userData.active = active;
      });
      pCur.visible = s.i !== undefined && s.i < n;
      if (pCur.visible) pCur.userData.tgt.set(xAt(s.i), 0.55, zFront);

      cand.visible = s.type === "pop";
      if (cand.visible) {
        const r = s.rect;
        const h = hAt(r.height);
        cand.userData.tgtX = (xAt(r.left) + xAt(r.right)) / 2;
        cand.userData.tgtW = (r.right - r.left) * spacing + barW;
        cand.userData.tgtH = h;
        cand.position.y = h / 2;
      }

      const rect = s.bestRect;
      ghost.visible = !!rect;
      if (rect) {
        const h = hAt(rect.height);
        ghost.userData.tgtX = (xAt(rect.left) + xAt(rect.right)) / 2;
        ghost.userData.tgtW = (rect.right - rect.left) * spacing + barW;
        ghost.userData.tgtH = h;
        ghost.position.y = h / 2;
      }
      bestLbl.userData.setText(`best = ${s.best}`);
    }

    S.onTick(() => {
      const t = performance.now() * 0.004;
      bars.forEach((bar) => {
        const m = bar.material;
        m.color.lerp(bar.userData.targetColor, 0.13);
        m.emissive.lerp(bar.userData.emissiveColor, 0.18);
        m.emissiveIntensity = bar.userData.active ? (0.35 + Math.sin(t) * 0.18) : 0.0;
      });
      DSAV.lerpToTarget(pCur, 0.16);
      [ghost, cand].forEach((box) => {
        box.position.x += (box.userData.tgtX - box.position.x) * 0.18;
        box.scale.x += (box.userData.tgtW - box.scale.x) * 0.18;
        box.scale.y += (box.userData.tgtH - box.scale.y) * 0.18;
      });
    });

    goTo(0);
    return { steps, goTo, dispose: S.dispose };
  }
};
