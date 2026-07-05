/* ============================================================
   Viz: Reorder List (LC 143)
   Three phases shown on one row of nodes: (1) fast/slow find the
   middle, (2) the second half is reversed, (3) two pointers
   alternately splice front and (reversed) back nodes together —
   shown by nodes sliding down into their new zig-zag order.
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["reorder-list"] = {
  samples: [
    { label: "[1,2,3,4]", vals: [1, 2, 3, 4] },
    { label: "[1,2,3,4,5]", vals: [1, 2, 3, 4, 5] },
    { label: "[1,2]", vals: [1, 2] },
    { label: "[1,2,3,4,5,6]", vals: [1, 2, 3, 4, 5, 6] }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const vals = this.samples[sampleIndex].vals, n = vals.length;

    const spacing = Math.min(2.4, 15 / n);
    const nodeW = 1.3, nodeH = 1.1, depth = 1.0;
    const origY = nodeH + 1.6;
    const xAt = (i) => (i - (n - 1) / 2) * spacing;

    const nodes = vals.map((v, i) => {
      const box = DSAV.makeBar(nodeW, nodeH, depth, C.bar);
      box.position.set(xAt(i), origY, 0);
      box.userData = { targetColor: new T.Color(C.bar), emissiveColor: new T.Color(0x000000), active: false, tgtX: xAt(i), tgtY: origY };
      const g = DSAV.makeLabel(String(v), { fontSize: 46, color: "#1c0d07", scale: 1.0 });
      g.position.set(0, 0, depth / 2 + 0.01); box.add(g);
      S.world.add(box);
      return box;
    });

    const pSlow = DSAV.makePointer(C.left, "slow");
    const pFast = DSAV.makePointer(C.right, "fast");
    [pSlow, pFast].forEach((p) => { p.position.set(xAt(0), origY + 1.6, 0); S.world.add(p); });

    const resultY = 0.7;
    const resLbl = DSAV.makeLabel("result: —", { fontSize: 38, color: "#1c0d07", bg: DSAV.rgbHex(C.good), scale: 0.9, noDepth: true });
    resLbl.position.set(0, resultY - 1.3, 0);
    S.world.add(resLbl);

    S.controls.target.set(0, origY * 0.5, 0);
    S.camera.position.set(0, origY * 0.6 + 3, Math.max(14, n * 2.2));

    // ---- steps ----
    const steps = [];
    let slow = 0, fast = 0;
    steps.push({ type: "findmid", slow, fast });
    while (fast + 1 < n) {
      slow++; fast += 2;
      steps.push({ type: "findmid", slow, fast: Math.min(fast, n - 1) });
    }
    const mid = slow;
    steps.push({ type: "midfound", mid });

    const secondHalf = vals.slice(mid + 1).reverse();
    steps.push({ type: "reverse", mid, secondHalf: [...secondHalf] });

    const firstHalf = vals.slice(0, mid + 1);
    const result = [];
    let i1 = 0, i2 = 0;
    while (i1 < firstHalf.length || i2 < secondHalf.length) {
      if (i1 < firstHalf.length) { result.push(firstHalf[i1]); steps.push({ type: "zip", from: "first", v: firstHalf[i1], result: [...result] }); i1++; }
      if (i2 < secondHalf.length) { result.push(secondHalf[i2]); steps.push({ type: "zip", from: "second", v: secondHalf[i2], result: [...result] }); i2++; }
    }
    steps.push({ type: "done", result: [...result] });

    steps.forEach((s) => {
      s.vars = [
        { k: "phase", v: s.type },
        { k: "result so far", v: `[${(s.result || []).join(", ")}]`, cls: "good" }
      ];
      switch (s.type) {
        case "findmid": s.note = `slow moves 1, fast moves 2 — when fast reaches the end, slow is at the <b>middle</b>.`; break;
        case "midfound": s.note = `Middle found at value <b>${vals[s.mid]}</b>. Split the list here into two halves.`; break;
        case "reverse": s.note = `Reverse the second half in place: [${vals.slice(s.mid + 1).join(", ")}] → <b>[${s.secondHalf.join(", ")}]</b>.`; break;
        case "zip": s.note = `Take the next node from the <b>${s.from}</b> half (value ${s.v}) and append it to the result — alternating first, second, first, second...`; break;
        case "done": s.note = `Done. Zig-zagging front/reversed-back nodes together produces the reordered list.`; s.results = [`[${s.result.join(", ")}]`]; break;
      }
    });

    function goTo(k) {
      const s = steps[k];
      nodes.forEach((box, i) => {
        let em = 0x000000, active = false;
        if (s.type === "findmid") {
          if (i === s.slow) { em = C.left; active = true; }
          if (i === s.fast) { em = C.right; active = true; }
        }
        box.userData.targetColor = new T.Color(C.bar);
        box.userData.emissiveColor.set(em);
        box.userData.active = active;
      });

      // reposition nodes into their zig-zag slot progressively as result builds
      const res = s.result || [];
      const placed = new Set();
      res.forEach((v, idx) => {
        for (let i = 0; i < nodes.length; i++) {
          if (!placed.has(i) && vals[i] === v) {
            nodes[i].userData.tgtX = (idx - (n - 1) / 2) * spacing;
            nodes[i].userData.tgtY = resultY;
            placed.add(i);
            break;
          }
        }
      });
      nodes.forEach((box, i) => {
        if (!placed.has(i)) { box.userData.tgtX = xAt(i); box.userData.tgtY = origY; }
      });

      pSlow.visible = s.type === "findmid"; if (pSlow.visible) pSlow.position.x = xAt(s.slow);
      pFast.visible = s.type === "findmid"; if (pFast.visible) pFast.position.x = xAt(s.fast);
      resLbl.userData.setText(`result: [${res.join(", ")}]`);
    }

    S.onTick(() => {
      const t = performance.now() * 0.004;
      nodes.forEach((box) => {
        const m = box.material;
        m.color.lerp(box.userData.targetColor, 0.14);
        m.emissive.lerp(box.userData.emissiveColor, 0.2);
        m.emissiveIntensity = box.userData.active ? (0.4 + Math.sin(t) * 0.2) : 0.0;
        box.position.x += (box.userData.tgtX - box.position.x) * 0.15;
        box.position.y += (box.userData.tgtY - box.position.y) * 0.15;
      });
    });

    goTo(0);
    return { steps, goTo, dispose: S.dispose };
  }
};
