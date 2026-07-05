/* ============================================================
   Viz: K Closest Points to Origin (LC 973)
   Points plotted on the ground plane (x,z), origin marked with a
   pillar. A max-heap of size k holds the current best k
   candidates — its worst (farthest) member is shown with a ring.
   Each new point either joins (heap not full), evicts the worst
   member (closer than it), or is discarded.
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["k-closest-points"] = {
  samples: [
    { label: "[[1,3],[-2,2]]  k=1", points: [[1, 3], [-2, 2]], k: 1 },
    { label: "[[3,3],[5,-1],[-2,4]]  k=2", points: [[3, 3], [5, -1], [-2, 4]], k: 2 },
    { label: "[[0,1],[1,0],[2,2],[-1,-1]]  k=2", points: [[0, 1], [1, 0], [2, 2], [-1, -1]], k: 2 },
    { label: "[[1,1],[2,2],[3,3],[0,0.5]]  k=2", points: [[1, 1], [2, 2], [3, 3], [0, 0.5]], k: 2 }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const data = this.samples[sampleIndex];
    const points = data.points, k = data.k, n = points.length;
    const dist2 = (p) => p[0] * p[0] + p[1] * p[1];

    const maxCoord = Math.max(...points.flat().map(Math.abs), 1);
    const scale = 4.5 / maxCoord;
    const toWorld = (p) => new T.Vector3(p[0] * scale, 0, p[1] * scale);

    // origin marker
    const origin = DSAV.makeBar(0.4, 1.6, 0.4, C.anchor);
    origin.position.set(0, 0.8, 0);
    S.world.add(origin);
    const oLbl = DSAV.makeLabel("origin", { fontSize: 34, color: "#8f7a5e", scale: 0.7 });
    oLbl.position.set(0, 2.1, 0);
    S.world.add(oLbl);

    const dots = [];
    points.forEach((p, i) => {
      const pos = toWorld(p);
      const dot = new T.Mesh(new T.SphereGeometry(0.45, 24, 24), new T.MeshStandardMaterial({ color: C.bar, emissive: 0x000000, roughness: 0.4, metalness: 0.2 }));
      dot.position.copy(pos).setY(0.45);
      dot.userData = { targetColor: new T.Color(C.bar), emissiveColor: new T.Color(0x000000), active: false };
      S.world.add(dot);
      dots.push(dot);
      const lbl = DSAV.makeLabel(`(${p[0]},${p[1]})`, { fontSize: 32, color: "#b6a184", scale: 0.65 });
      lbl.position.copy(pos).setY(1.2);
      S.world.add(lbl);
      // line from origin to point
      const geo = new T.BufferGeometry().setFromPoints([new T.Vector3(0, 0.05, 0), pos.clone().setY(0.05)]);
      const line = new T.Line(geo, new T.LineBasicMaterial({ color: C.grid, transparent: true, opacity: 0.5 }));
      S.world.add(line);
    });

    S.controls.target.set(0, 0.5, 0);
    S.camera.position.set(0, 9, Math.max(12, maxCoord * scale * 2 + 6));

    const topY = 4;
    const heapLbl = DSAV.makeLabel(`heap: 0 / ${k}`, { fontSize: 42, color: "#1c0d07", bg: DSAV.rgbHex(C.hot), scale: 1.0, noDepth: true });
    heapLbl.position.set(0, topY, 0);
    S.world.add(heapLbl);

    // ---- steps: max-heap of size k (simulate via sorted array) ----
    const steps = [];
    let heap = []; // holds indices, kept sorted descending by dist2 (heap[0] = farthest)
    for (let i = 0; i < n; i++) {
      const d = dist2(points[i]);
      if (heap.length < k) {
        heap.push(i); heap.sort((a, b) => dist2(points[b]) - dist2(points[a]));
        steps.push({ type: "add", i, heap: [...heap] });
      } else if (d < dist2(points[heap[0]])) {
        const evicted = heap[0];
        heap[0] = i; heap.sort((a, b) => dist2(points[b]) - dist2(points[a]));
        steps.push({ type: "swap", i, evicted, heap: [...heap] });
      } else {
        steps.push({ type: "reject", i, heap: [...heap] });
      }
    }
    steps.push({ type: "done", heap: [...heap] });

    steps.forEach((s) => {
      s.vars = [
        { k: "point", v: s.i !== undefined ? `(${points[s.i][0]}, ${points[s.i][1]})` : "—" },
        { k: "dist²", v: s.i !== undefined ? dist2(points[s.i]) : "—", cls: "hot" },
        { k: "heap size", v: `${s.heap.length} / ${k}` }
      ];
      switch (s.type) {
        case "add": s.note = `Heap has room — keep point (${points[s.i][0]}, ${points[s.i][1]}), dist²=${dist2(points[s.i])}.`; break;
        case "swap": s.note = `Heap full; farthest kept point had dist²=${dist2(points[s.evicted])}. New point is closer (dist²=${dist2(points[s.i])}) — swap it in.`; break;
        case "reject": s.note = `Heap full; new point (dist²=${dist2(points[s.i])}) is farther than everything already kept — discard.`; break;
        case "done": s.note = `Done. The ${k} closest points to the origin have been kept.`; s.results = s.heap.map((idx) => `(${points[idx][0]}, ${points[idx][1]})`); break;
      }
    });

    function goTo(idx) {
      const s = steps[idx];
      const heapSet = new Set(s.heap);
      dots.forEach((dot, i) => {
        let col = new T.Color(C.dim), em = 0x000000, active = false;
        if (heapSet.has(i)) { col = new T.Color(C.good); em = C.good; active = true; }
        if (i === s.i) { col = new T.Color(s.type === "reject" ? C.bad : C.left); em = col.getHex(); active = true; }
        dot.userData.targetColor = col;
        dot.userData.emissiveColor.set(em);
        dot.userData.active = active;
      });
      heapLbl.userData.setText(`heap: ${s.heap.length} / ${k}`);
    }

    S.onTick(() => {
      const t = performance.now() * 0.004;
      dots.forEach((dot) => {
        const m = dot.material;
        m.color.lerp(dot.userData.targetColor, 0.14);
        m.emissive.lerp(dot.userData.emissiveColor, 0.2);
        m.emissiveIntensity = dot.userData.active ? (0.4 + Math.sin(t) * 0.2) : 0.0;
      });
    });

    goTo(0);
    return { steps, goTo, dispose: S.dispose };
  }
};
