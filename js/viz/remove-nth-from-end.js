/* ============================================================
   Viz: Remove Nth Node From End of List (LC 19)
   Node row with a dummy node prepended. Two pointers start at
   the dummy: "fast" races ahead n+1 hops first (creating the
   fixed gap), then both move together until fast falls off the
   end (null). At that point "slow" sits right before the node to
   delete — bridge its link over the target node.
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["remove-nth-from-end"] = {
  samples: [
    { label: "[1,2,3,4,5]  n=2", vals: [1, 2, 3, 4, 5], n2: 2 },
    { label: "[1]  n=1", vals: [1], n2: 1 },
    { label: "[1,2]  n=1", vals: [1, 2], n2: 1 },
    { label: "[1,2,3,4,5,6]  n=6", vals: [1, 2, 3, 4, 5, 6], n2: 6 }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const data = this.samples[sampleIndex];
    const vals = data.vals, target = data.n2;
    const withDummy = ["∅", ...vals]; // index 0 = dummy
    const n = withDummy.length;

    const spacing = Math.min(2.4, 15 / n);
    const nodeW = 1.3, nodeH = 1.2, depth = 1.0;
    const xAt = (i) => (i - (n - 1) / 2) * spacing;

    const nodes = withDummy.map((v, i) => {
      const isDummy = i === 0;
      const box = DSAV.makeBar(nodeW, nodeH, depth, isDummy ? C.dim : C.bar);
      box.position.set(xAt(i), nodeH / 2 + 0.5, 0);
      box.userData = { targetColor: new T.Color(isDummy ? C.dim : C.bar), emissiveColor: new T.Color(0x000000), active: false };
      const g = DSAV.makeLabel(String(v), { fontSize: isDummy ? 34 : 48, color: "#1c0d07", scale: isDummy ? 0.75 : 1.0 });
      g.position.set(0, 0, depth / 2 + 0.01); box.add(g);
      S.world.add(box);
      return box;
    });
    for (let i = 0; i < n - 1; i++) {
      const arrow = DSAV.makeLabel("→", { fontSize: 54, color: "#b6a184", scale: 0.9 });
      arrow.position.set((xAt(i) + xAt(i + 1)) / 2, nodeH / 2 + 0.5, depth / 2 + 0.1);
      S.world.add(arrow);
    }

    const pSlow = DSAV.makePointer(C.left, "slow");
    const pFast = DSAV.makePointer(C.right, "fast");
    [pSlow, pFast].forEach((p) => { p.position.set(xAt(0), nodeH + 1.4, 0); S.world.add(p); });

    S.controls.target.set(0, 1.8, 0);
    S.camera.position.set(0, 4, Math.max(14, n * 2.2));

    // ---- steps: fast runs target+1 ahead first, then both move ----
    const steps = [];
    let slow = 0, fast = 0;
    steps.push({ type: "init", slow, fast });
    for (let i = 0; i < target + 1; i++) {
      fast++;
      steps.push({ type: "lead", slow, fast, remain: target - i });
    }
    while (fast < n) {
      slow++; fast++;
      steps.push({ type: "shift", slow, fast });
    }
    const toDelete = slow + 1;
    steps.push({ type: "delete", slow, toDelete });
    steps.push({ type: "done", removedVal: withDummy[toDelete], toDelete });

    steps.forEach((s) => {
      s.vars = [
        { k: "slow", v: withDummy[s.slow] },
        { k: "fast", v: s.fast < n ? withDummy[s.fast] : "null" }
      ];
      switch (s.type) {
        case "init": s.note = `Prepend a dummy node before the head, both pointers start there. fast needs a head start of <b>${target + 1}</b> hops.`; break;
        case "lead": s.note = `Advance <b>fast</b> ahead (${target + 1 - s.remain} / ${target + 1} lead hops taken) — this fixes a gap of ${target} nodes between slow and fast.`; break;
        case "shift": s.note = `Gap is set — now move <b>both</b> pointers one hop together, preserving the fixed gap.`; break;
        case "delete": s.note = `<b>fast</b> reached the end (null). <b>slow</b> now sits exactly before the node to remove — bridge slow.next past it.`; break;
        case "done": s.note = `Removed node with value <b>${s.removedVal}</b> — the ${target}-th node from the end.`; s.results = [`[${vals.filter((v, i) => i !== vals.length - target).join(", ")}]`]; break;
      }
    });

    function goTo(k) {
      const s = steps[k];
      nodes.forEach((box, i) => {
        let em = 0x000000, active = false, col = i === 0 ? new T.Color(C.dim) : new T.Color(C.bar);
        if (i === s.slow) { em = C.left; active = true; }
        if (i === s.fast) { em = C.right; active = true; }
        if ((s.type === "delete" || s.type === "done") && i === s.toDelete) { col = new T.Color(C.bad); em = C.bad; active = true; }
        box.userData.targetColor = col;
        box.userData.emissiveColor.set(em);
        box.userData.active = active;
      });
      pSlow.visible = true; pSlow.position.x = xAt(s.slow);
      pFast.visible = s.fast < n; if (pFast.visible) pFast.position.x = xAt(s.fast);
    }

    S.onTick(() => {
      const t = performance.now() * 0.004;
      nodes.forEach((box) => {
        const m = box.material;
        m.color.lerp(box.userData.targetColor, 0.15);
        m.emissive.lerp(box.userData.emissiveColor, 0.2);
        m.emissiveIntensity = box.userData.active ? (0.4 + Math.sin(t) * 0.2) : 0.0;
      });
    });

    goTo(0);
    return { steps, goTo, dispose: S.dispose };
  }
};
