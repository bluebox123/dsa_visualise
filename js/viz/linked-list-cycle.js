/* ============================================================
   Viz: Linked List Cycle (LC 141)
   Nodes laid out in a row; if a cycle exists, the last node's
   arrow bends back to the pos-th node instead of pointing to
   null. Two pointers race: slow (amber) moves one hop per step,
   fast (rust) moves two. If fast ever laps slow inside the loop,
   they collide — cycle detected. If fast falls off the end
   (hits null), there's no cycle.
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["linked-list-cycle"] = {
  samples: [
    { label: "[3,2,0,-4]  pos=1 (cycle)", vals: [3, 2, 0, -4], pos: 1 },
    { label: "[1,2]  pos=0 (cycle)", vals: [1, 2], pos: 0 },
    { label: "[1]  pos=-1 (no cycle)", vals: [1], pos: -1 },
    { label: "[1,2,3,4,5]  pos=2 (cycle)", vals: [1, 2, 3, 4, 5], pos: 2 }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const data = this.samples[sampleIndex];
    const vals = data.vals, pos = data.pos, n = vals.length;
    const hasCycle = pos >= 0;
    const next = (i) => (i + 1 < n ? i + 1 : (hasCycle ? pos : -1));

    const spacing = Math.min(2.6, 15 / n);
    const nodeW = 1.3, nodeH = 1.2, depth = 1.0;
    const xAt = (i) => (i - (n - 1) / 2) * spacing;

    const nodes = vals.map((v, i) => {
      const box = DSAV.makeBar(nodeW, nodeH, depth, C.bar);
      box.position.set(xAt(i), nodeH / 2 + 0.5, 0);
      box.userData = { targetColor: new T.Color(C.bar), emissiveColor: new T.Color(0x000000), active: false };
      const g = DSAV.makeLabel(String(v), { fontSize: 48, color: "#1c0d07", scale: 1.0 });
      g.position.set(0, 0, depth / 2 + 0.01); box.add(g);
      S.world.add(box);
      return box;
    });

    for (let i = 0; i < n - 1; i++) {
      const arrow = DSAV.makeLabel("→", { fontSize: 56, color: "#b6a184", scale: 0.95 });
      arrow.position.set((xAt(i) + xAt(i + 1)) / 2, nodeH / 2 + 0.5, depth / 2 + 0.1);
      S.world.add(arrow);
    }
    if (hasCycle) {
      const from = new T.Vector3(xAt(n - 1), nodeH + 0.8, 0);
      const to = new T.Vector3(xAt(pos), nodeH + 0.8, 0);
      const mid = from.clone().add(to).multiplyScalar(0.5).setY(nodeH + 2.4);
      const curve = new T.QuadraticBezierCurve3(from, mid, to);
      const geo = new T.BufferGeometry().setFromPoints(curve.getPoints(30));
      const line = new T.Line(geo, new T.LineBasicMaterial({ color: DSAV.rgbHex(C.hot) }));
      S.world.add(line);
      const cycleLbl = DSAV.makeLabel("cycle back here", { fontSize: 30, color: "#8f7a5e", scale: 0.6 });
      cycleLbl.position.set((xAt(pos) + xAt(n - 1)) / 2, nodeH + 2.9, 0);
      S.world.add(cycleLbl);
    } else {
      const nullLbl = DSAV.makeLabel("null", { fontSize: 34, color: "#8f7a5e", scale: 0.7 });
      nullLbl.position.set(xAt(n - 1) + spacing * 0.7, nodeH / 2 + 0.5, 0);
      S.world.add(nullLbl);
    }

    const pSlow = DSAV.makePointer(C.left, "slow");
    const pFast = DSAV.makePointer(C.right, "fast");
    [pSlow, pFast].forEach((p) => { p.position.y = nodeH + 1.4; S.world.add(p); });

    S.controls.target.set(0, 1.8, 0);
    S.camera.position.set(0, hasCycle ? 6 : 4, Math.max(14, n * 2.3));

    // ---- steps: Floyd's cycle detection ----
    const steps = [];
    let slow = 0, fast = 0, guard = 0;
    steps.push({ type: "init", slow, fast });
    let met = false;
    while (guard++ < 100) {
      slow = next(slow);
      if (slow === -1) { steps.push({ type: "nullhit", slow, fast }); break; }
      fast = next(fast); if (fast >= 0) fast = next(fast);
      if (fast === -1) { steps.push({ type: "nullhit", slow, fast }); break; }
      steps.push({ type: "step", slow, fast });
      if (slow === fast) { met = true; steps.push({ type: "meet", slow, fast }); break; }
    }
    steps.push({ type: "done", cycle: met });

    steps.forEach((s) => {
      s.vars = [
        { k: "slow", v: s.slow >= 0 && s.slow < n ? vals[s.slow] : "null" },
        { k: "fast", v: s.fast >= 0 && s.fast < n ? vals[s.fast] : "null" }
      ];
      switch (s.type) {
        case "init": s.note = `Both pointers start at the head. <b>slow</b> moves 1 hop per step, <b>fast</b> moves 2.`; break;
        case "step": s.note = `slow → ${vals[s.slow]}, fast → ${vals[s.fast]}. No collision yet — keep going.`; break;
        case "meet": s.note = `slow and fast landed on the <b>same node</b> — fast lapped slow inside a loop. <b>Cycle detected.</b>`; break;
        case "nullhit": s.note = `fast fell off the end and hit <b>null</b> — a cycle would loop forever, so this proves there's <b>no cycle</b>.`; break;
        case "done": s.note = s.cycle ? `Confirmed: this list has a cycle.` : `Confirmed: this list has no cycle.`; s.results = [s.cycle ? "true (cycle)" : "false (no cycle)"]; break;
      }
    });

    function goTo(k) {
      const s = steps[k];
      nodes.forEach((box, i) => {
        let em = 0x000000, active = false;
        if (i === s.slow && i === s.fast) { em = C.hot; active = true; }
        else if (i === s.slow) { em = C.left; active = true; }
        else if (i === s.fast) { em = C.right; active = true; }
        box.userData.emissiveColor.set(em);
        box.userData.active = active;
      });
      pSlow.visible = s.slow >= 0 && s.slow < n;
      if (pSlow.visible) pSlow.position.x = xAt(s.slow);
      pFast.visible = s.fast >= 0 && s.fast < n;
      if (pFast.visible) pFast.position.x = xAt(s.fast);
    }

    S.onTick(() => {
      const t = performance.now() * 0.004;
      nodes.forEach((box) => {
        const m = box.material;
        m.emissive.lerp(box.userData.emissiveColor, 0.2);
        m.emissiveIntensity = box.userData.active ? (0.4 + Math.sin(t) * 0.2) : 0.0;
      });
    });

    goTo(0);
    return { steps, goTo, dispose: S.dispose };
  }
};
