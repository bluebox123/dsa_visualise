/* ============================================================
   Viz: Insert Interval (LC 57)
   Existing sorted, non-overlapping intervals as bars on a number
   line, plus the new interval being inserted (amber). We sweep
   left to right through three phases: bars fully before the new
   interval (kept as-is), bars overlapping it (merged into a
   growing amber-then-green bar), and bars fully after (kept as-is).
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["insert-interval"] = {
  samples: [
    { label: "[[1,3],[6,9]] + [2,5]", intervals: [[1, 3], [6, 9]], newInterval: [2, 5] },
    { label: "[[1,2],[3,5],[6,7],[8,10],[12,16]] + [4,8]", intervals: [[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]], newInterval: [4, 8] },
    { label: "[] + [5,7]", intervals: [], newInterval: [5, 7] },
    { label: "[[1,5]] + [6,8]", intervals: [[1, 5]], newInterval: [6, 8] }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const data = this.samples[sampleIndex];
    const intervals = data.intervals, newIv = data.newInterval, n = intervals.length;

    const maxEnd = Math.max(newIv[1], ...intervals.map((iv) => iv[1]), 1);
    const scaleX = 13 / maxEnd;
    const xAt = (v) => v * scaleX - 6.5;
    const rowH = 1.4, barH = 0.9, depth = 1.0;

    const rows = intervals.map((iv, r) => {
      const w = Math.max(0.3, (iv[1] - iv[0]) * scaleX);
      const bar = DSAV.makeBar(w, barH, depth, C.bar);
      bar.position.set(xAt(iv[0]) + w / 2, (n - r) * rowH + 1, 0);
      bar.userData = { targetColor: new T.Color(C.bar), emissiveColor: new T.Color(0x000000), active: false };
      S.world.add(bar);
      const lbl = DSAV.makeLabel(`[${iv[0]},${iv[1]}]`, { fontSize: 34, color: "#fbf6ee", scale: 0.72 });
      lbl.position.set(0, 0.75, depth / 2 + 0.1); bar.add(lbl);
      return bar;
    });

    // new interval marker
    const newW = Math.max(0.3, (newIv[1] - newIv[0]) * scaleX);
    const newBar = DSAV.makeBar(newW, barH, depth, C.hot);
    newBar.position.set(xAt(newIv[0]) + newW / 2, (n + 1) * rowH + 1, 0);
    newBar.userData = { targetColor: new T.Color(C.hot), emissiveColor: new T.Color(C.hot), active: true, tgtX: newBar.position.x, tgtW: newW, tgtY: newBar.position.y };
    S.world.add(newBar);
    const newLbl = DSAV.makeLabel(`new [${newIv[0]},${newIv[1]}]`, { fontSize: 34, color: "#1c0d07", scale: 0.72 });
    newLbl.position.set(0, 0.75, depth / 2 + 0.1); newBar.add(newLbl);

    const topY = (n + 2) * rowH + 2.5;
    const noteLbl = DSAV.makeLabel("scanning...", { fontSize: 36, color: "#1c0d07", bg: DSAV.rgbHex(C.hot), scale: 0.85, noDepth: true });
    noteLbl.position.set(0, topY, 0);
    S.world.add(noteLbl);

    S.controls.target.set(0, topY * 0.4, 0);
    S.camera.position.set(0, topY * 0.5 + 3, 16);

    // ---- steps: three phases ----
    const steps = [];
    const result = [];
    let cur = [...newIv];
    let i = 0;
    while (i < n && intervals[i][1] < cur[0]) {
      result.push([...intervals[i]]);
      steps.push({ type: "before", i, result: [...result], cur: [...cur] });
      i++;
    }
    while (i < n && intervals[i][0] <= cur[1]) {
      const oldCur = [...cur];
      cur[0] = Math.min(cur[0], intervals[i][0]);
      cur[1] = Math.max(cur[1], intervals[i][1]);
      steps.push({ type: "overlap", i, oldCur, cur: [...cur], result: [...result] });
      i++;
    }
    result.push([...cur]);
    steps.push({ type: "settle", cur: [...cur], result: [...result] });
    while (i < n) {
      result.push([...intervals[i]]);
      steps.push({ type: "after", i, result: [...result], cur: [...cur] });
      i++;
    }
    steps.push({ type: "done", result: [...result] });

    steps.forEach((s) => {
      s.vars = [
        { k: "phase", v: s.type },
        { k: "working interval", v: `[${s.cur[0]}, ${s.cur[1]}]`, cls: "hot" },
        { k: "result so far", v: `[${s.result.map((r) => `[${r[0]},${r[1]}]`).join(", ")}]`, cls: "good" }
      ];
      switch (s.type) {
        case "before": s.note = `Interval [${intervals[s.i][0]}, ${intervals[s.i][1]}] ends before the new interval starts — keep it untouched.`; break;
        case "overlap": s.note = `Interval [${intervals[s.i][0]}, ${intervals[s.i][1]}] overlaps — fuse it in: [${s.oldCur[0]},${s.oldCur[1]}] → <b>[${s.cur[0]},${s.cur[1]}]</b>.`; break;
        case "settle": s.note = `No more overlaps — drop the fully-merged interval <b>[${s.cur[0]}, ${s.cur[1]}]</b> into the result.`; break;
        case "after": s.note = `Interval [${intervals[s.i][0]}, ${intervals[s.i][1]}] starts after the merged interval ends — keep it untouched.`; break;
        case "done": s.note = `Done — three linear phases (before / overlap-merge / after) build the answer in one pass.`; s.results = s.result.map((r) => `[${r[0]}, ${r[1]}]`); break;
      }
    });

    function goTo(k) {
      const s = steps[k];
      rows.forEach((bar, idx) => {
        let col = new T.Color(C.bar), em = 0x000000, active = false;
        if (s.i === idx && (s.type === "before" || s.type === "after")) { col = new T.Color(C.good); em = C.good; active = true; }
        if (s.i === idx && s.type === "overlap") { col = new T.Color(C.hot); em = C.hot; active = true; }
        bar.userData.targetColor = col;
        bar.userData.emissiveColor.set(em);
        bar.userData.active = active;
      });
      const w = Math.max(0.3, (s.cur[1] - s.cur[0]) * scaleX);
      newBar.userData.tgtX = xAt(s.cur[0]) + w / 2;
      newBar.userData.tgtW = w;
      newBar.userData.targetColor = new T.Color(s.type === "settle" || s.type === "after" || s.type === "done" ? C.good : C.hot);
      noteLbl.userData.setText(s.type);
    }

    S.onTick(() => {
      const t = performance.now() * 0.004;
      rows.forEach((bar) => {
        const m = bar.material;
        m.color.lerp(bar.userData.targetColor, 0.14);
        m.emissive.lerp(bar.userData.emissiveColor, 0.18);
        m.emissiveIntensity = bar.userData.active ? (0.35 + Math.sin(t) * 0.18) : 0.0;
      });
      newBar.position.x += (newBar.userData.tgtX - newBar.position.x) * 0.18;
      newBar.scale.x += (newBar.userData.tgtW - newBar.scale.x) * 0.18;
      newBar.material.color.lerp(newBar.userData.targetColor, 0.15);
      newBar.material.emissive.lerp(newBar.userData.targetColor, 0.15);
      newBar.material.emissiveIntensity = 0.3 + Math.sin(t) * 0.15;
    });

    goTo(0);
    return { steps, goTo, dispose: S.dispose };
  }
};
