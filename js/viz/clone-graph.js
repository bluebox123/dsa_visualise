/* ============================================================
   Viz: Clone Graph (LC 133)
   An undirected graph drawn as spheres on a ring. A DFS deep-copies
   it: the first time we reach a node we mint its clone (it turns
   green and joins the "cloned" set), then we walk its edges — an
   edge to an un-cloned neighbour recurses into it, an edge to an
   already-cloned neighbour just re-wires the copy (the visited map
   is what stops cycles from looping forever).
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["clone-graph"] = {
  samples: [
    { label: "square 1-2-3-4", adj: [[1, 3], [0, 2], [1, 3], [0, 2]] },
    { label: "triangle", adj: [[1, 2], [0, 2], [0, 1]] },
    { label: "star (hub 0)", adj: [[1, 2, 3, 4], [0], [0], [0], [0]] },
    { label: "single node", adj: [[]] }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const adj = this.samples[sampleIndex].adj;
    const n = adj.length;

    // ---- circular layout in the XY plane ----
    const R = Math.max(2.6, n * 0.85);
    const cy = R + 2.0;
    const pos = [];
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
      pos.push(new T.Vector3(Math.cos(a) * R, cy + Math.sin(a) * R, 0));
    }

    // edges (undirected, dedup)
    const edgeMap = new Map();
    for (let u = 0; u < n; u++) for (const v of adj[u]) {
      const key = u < v ? `${u}-${v}` : `${v}-${u}`;
      if (!edgeMap.has(key)) {
        const geo = new T.BufferGeometry().setFromPoints([pos[u], pos[v]]);
        const line = new T.Line(geo, new T.LineBasicMaterial({ color: 0x6b331d, transparent: true, opacity: 0.7 }));
        S.world.add(line);
        edgeMap.set(key, line);
      }
    }

    const nodes = [];
    for (let i = 0; i < n; i++) {
      const sphere = new T.Mesh(new T.SphereGeometry(0.6, 26, 26), new T.MeshStandardMaterial({ color: C.bar, roughness: 0.4, metalness: 0.2 }));
      sphere.position.copy(pos[i]);
      sphere.userData = { targetColor: new T.Color(C.bar), emissiveColor: new T.Color(0x000000), active: false };
      S.world.add(sphere);
      const lbl = DSAV.makeLabel(String(i), { fontSize: 44, color: "#1c0d07", scale: 0.9 });
      lbl.position.set(0, 0, 0.62); sphere.add(lbl);
      nodes.push(sphere);
    }

    const banner = DSAV.makeLabel("cloned = 0 / " + n, { fontSize: 40, color: "#1c0d07", bg: DSAV.rgbHex(C.hot), scale: 1.0, noDepth: true });
    banner.position.set(0, cy + R + 1.6, 0);
    S.world.add(banner);
    S.controls.target.set(0, cy, 0);
    S.camera.position.set(0, cy, Math.max(15, n * 3));

    // ---- DFS clone ----
    const steps = [];
    const cloned = new Set();
    (function dfs(u) {
      cloned.add(u);
      steps.push({ type: "clone", node: u, cur: u, clonedSet: [...cloned], edge: null });
      for (const v of adj[u]) {
        const isNew = !cloned.has(v);
        steps.push({ type: "edge", node: u, nb: v, cur: u, isNew, clonedSet: [...cloned], edge: (u < v ? `${u}-${v}` : `${v}-${u}`) });
        if (isNew) dfs(v);
      }
    })(0);
    steps.push({ type: "done", clonedSet: [...cloned], cur: -1, edge: null });

    steps.forEach((s) => {
      s.vars = [
        { k: "at node", v: s.cur < 0 ? "—" : s.cur },
        { k: "cloned", v: s.clonedSet.length + " / " + n, cls: s.clonedSet.length === n ? "good" : "hot" }
      ];
      switch (s.type) {
        case "clone": s.note = `First visit to node <b>${s.node}</b> — create its clone and store it in the visited map so we never copy it twice.`; break;
        case "edge": s.note = s.isNew
          ? `Edge ${s.node}–${s.nb}: neighbour ${s.nb} isn't cloned yet, so <b>recurse into it</b>.`
          : `Edge ${s.node}–${s.nb}: neighbour ${s.nb} is already cloned — just wire the copy's edge (this is what breaks cycles).`;
          break;
        case "done": s.note = `Every node reached and copied once. The clone is a faithful deep copy.`; s.results = [`cloned all ${n} nodes`]; break;
      }
    });

    function goTo(k) {
      const s = steps[k];
      const clonedSet = new Set(s.clonedSet);
      nodes.forEach((node, i) => {
        let col = C.bar, em = 0x000000, active = false;
        if (clonedSet.has(i)) { col = C.good; }
        if (i === s.cur) { em = C.hot; active = true; }
        if (s.type === "edge" && i === s.nb) { em = s.isNew ? C.left : C.good; active = true; }
        node.userData.targetColor.set(col);
        node.userData.emissiveColor.set(em);
        node.userData.active = active;
      });
      edgeMap.forEach((line, key) => {
        const on = s.edge === key;
        line.material.color.set(on ? C.hot : 0x6b331d);
        line.material.opacity = on ? 1.0 : 0.7;
      });
      banner.userData.setText(`cloned = ${s.clonedSet.length} / ${n}`);
    }

    S.onTick(() => {
      const t = performance.now() * 0.004;
      nodes.forEach((node) => {
        const m = node.material;
        m.color.lerp(node.userData.targetColor, 0.16);
        m.emissive.lerp(node.userData.emissiveColor, 0.2);
        m.emissiveIntensity = node.userData.active ? (0.45 + Math.sin(t) * 0.22) : 0.0;
      });
    });

    goTo(0);
    return { steps, goTo, dispose: S.dispose };
  }
};
