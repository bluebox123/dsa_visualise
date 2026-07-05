/* ============================================================
   Viz: Reverse Linked List (LC 206)
   Node boxes in a row connected by arrows. Three pointers — prev
   (green), curr (amber), next (rust) — do the classic three-
   pointer dance. Each step, curr's arrow visually flips to point
   at prev instead of forward, and all three pointers slide one
   step to the right.
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["reverse-linked-list"] = {
  samples: [
    { label: "[1,2,3,4,5]", vals: [1, 2, 3, 4, 5] },
    { label: "[1,2]", vals: [1, 2] },
    { label: "[1]", vals: [1] },
    { label: "[1,2,3,4,5,6,7]", vals: [1, 2, 3, 4, 5, 6, 7] }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const vals = this.samples[sampleIndex].vals, n = vals.length;

    const spacing = Math.min(2.6, 15 / n);
    const nodeW = 1.4, nodeH = 1.2, depth = 1.0;
    const xAt = (i) => (i - (n - 1) / 2) * spacing;

    const nodes = vals.map((v, i) => {
      const box = DSAV.makeBar(nodeW, nodeH, depth, C.bar);
      box.position.set(xAt(i), nodeH / 2 + 0.5, 0);
      box.userData = { targetColor: new T.Color(C.bar), emissiveColor: new T.Color(0x000000), active: false };
      const g = DSAV.makeLabel(String(v), { fontSize: 50, color: "#1c0d07", scale: 1.05 });
      g.position.set(0, 0, depth / 2 + 0.01); box.add(g);
      S.world.add(box);
      return box;
    });

    // arrow sprites between consecutive nodes, flip-able
    const arrows = [];
    for (let i = 0; i < n - 1; i++) {
      const arrow = DSAV.makeLabel("→", { fontSize: 60, color: "#b6a184", scale: 1.0 });
      arrow.position.set((xAt(i) + xAt(i + 1)) / 2, nodeH / 2 + 0.5, depth / 2 + 0.1);
      arrow.userData.i = i;
      S.world.add(arrow);
      arrows.push(arrow);
    }
    const nullEndLbl = DSAV.makeLabel("null", { fontSize: 34, color: "#8f7a5e", scale: 0.7 });
    nullEndLbl.position.set(xAt(n - 1) + spacing * 0.7, nodeH / 2 + 0.5, 0);
    S.world.add(nullEndLbl);
    const nullStartLbl = DSAV.makeLabel("null", { fontSize: 34, color: "#8f7a5e", scale: 0.7 });
    nullStartLbl.position.set(xAt(0) - spacing * 0.7, nodeH / 2 + 0.5, 0);
    nullStartLbl.visible = false;
    S.world.add(nullStartLbl);

    const pPrev = DSAV.makePointer(C.good, "prev");
    const pCurr = DSAV.makePointer(C.left, "curr");
    const pNext = DSAV.makePointer(C.right, "next");
    [pPrev, pCurr, pNext].forEach((p) => { p.position.y = nodeH + 1.5; S.world.add(p); });

    S.controls.target.set(0, 1.6, 0);
    S.camera.position.set(0, 4, Math.max(14, n * 2.3));

    // ---- steps ----
    const steps = [];
    let prev = -1, curr = 0;
    steps.push({ type: "init", prev, curr, next: curr < n ? curr + 1 : -1, flipped: [] });
    const flipped = [];
    while (curr >= 0 && curr < n) {
      const next = curr + 1 < n ? curr + 1 : -1;
      flipped.push(curr);
      steps.push({ type: "flip", prev, curr, next, flipped: [...flipped] });
      prev = curr;
      curr = next;
      steps.push({ type: "advance", prev, curr, next: curr >= 0 && curr < n ? curr + 1 : -1, flipped: [...flipped] });
    }
    steps.push({ type: "done", prev, flipped: [...flipped] });

    steps.forEach((s) => {
      s.vars = [
        { k: "prev", v: s.prev >= 0 ? vals[s.prev] : "null" },
        { k: "curr", v: s.curr >= 0 && s.curr < n ? vals[s.curr] : "null" },
        { k: "next", v: s.next >= 0 && s.next < n ? vals[s.next] : "null" }
      ];
      switch (s.type) {
        case "init": s.note = `Start with <b>prev = null</b>, <b>curr</b> at the head.`; break;
        case "flip": s.note = `Point <b>curr.next</b> backward to <b>prev</b> — reversing this node's link.`; break;
        case "advance": s.note = `Slide the pointers forward: <b>prev = curr</b>, <b>curr = next</b>.`; break;
        case "done": s.note = `curr fell off the end (null). <b>prev</b> now sits at the new head — the list is fully reversed.`; s.results = [`[${vals.slice().reverse().join(", ")}]`]; break;
      }
    });

    function goTo(k) {
      const s = steps[k];
      const flippedSet = new Set(s.flipped);
      nodes.forEach((box, i) => {
        let col = new T.Color(C.bar), em = 0x000000, active = false;
        if (flippedSet.has(i)) { col = new T.Color(C.good); }
        if (i === s.curr) { em = C.left; active = true; }
        if (i === s.prev) { em = C.good; active = true; }
        box.userData.targetColor = col;
        box.userData.emissiveColor.set(em);
        box.userData.active = active;
      });
      arrows.forEach((arrow, i) => {
        const isFlipped = flippedSet.has(i);
        arrow.userData.setText(isFlipped ? "←" : "→");
        arrow.material.color.set(isFlipped ? DSAV.rgbHex(C.good) : "#b6a184");
      });
      nullStartLbl.visible = s.type === "done" || flippedSet.has(0);

      pPrev.visible = s.prev >= 0;
      if (s.prev >= 0) pPrev.position.x = xAt(s.prev);
      pCurr.visible = s.curr >= 0 && s.curr < n;
      if (pCurr.visible) pCurr.position.x = xAt(s.curr);
      pNext.visible = s.next >= 0 && s.next < n;
      if (pNext.visible) pNext.position.x = xAt(s.next);
    }

    S.onTick(() => {
      const t = performance.now() * 0.004;
      nodes.forEach((box) => {
        const m = box.material;
        m.color.lerp(box.userData.targetColor, 0.14);
        m.emissive.lerp(box.userData.emissiveColor, 0.18);
        m.emissiveIntensity = box.userData.active ? (0.35 + Math.sin(t) * 0.18) : 0.0;
      });
    });

    goTo(0);
    return { steps, goTo, dispose: S.dispose };
  }
};
