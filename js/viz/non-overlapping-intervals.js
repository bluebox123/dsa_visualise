/* ============================================================
   Viz: Non-overlapping Intervals (LC 435)
   Intervals as bars, sorted by END time (the greedy key). Keep a
   "last kept end". Scanning left to right: if the next interval
   starts before the last kept end, it overlaps — remove it.
   Otherwise keep it (green) and update last kept end.
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["non-overlapping-intervals"] = {
  samples: [
    { label: "[[1,2],[2,3],[3,4],[1,3]]", intervals: [[1, 2], [2, 3], [3, 4], [1, 3]] },
    { label: "[[1,2],[1,2],[1,2]]", intervals: [[1, 2], [1, 2], [1, 2]] },
    { label: "[[1,2],[2,3]]", intervals: [[1, 2], [2, 3]] },
    { label: "[[1,100],[11,22],[1,11],[2,12]]", intervals: [[1, 100], [11, 22], [1, 11], [2, 12]] }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const raw = this.samples[sampleIndex].intervals;
    const sorted = [...raw].sort((a, b) => a[1] - b[1]);
    const n = sorted.length;

    const maxEnd = Math.max(...raw.map((iv) => iv[1]));
    const scaleX = 13 / maxEnd;
    const xAt = (v) => v * scaleX - 6.5;
    const rowH = 1.4, barH = 0.9, depth = 1.0;

    const rows = sorted.map((iv, r) => {
      const w = Math.max(0.3, (iv[1] - iv[0]) * scaleX);
      const bar = DSAV.makeBar(w, barH, depth, C.bar);
      bar.position.set(xAt(iv[0]) + w / 2, (n - 1 - r) * rowH + 1, 0);
      bar.userData = { targetColor: new T.Color(C.bar), emissiveColor: new T.Color(0x000000), active: false };
      S.world.add(bar);
      const lbl = DSAV.makeLabel(`[${iv[0]},${iv[1]}]`, { fontSize: 34, color: "#fbf6ee", scale: 0.72 });
      lbl.position.set(0, 0.75, depth / 2 + 0.1); bar.add(lbl);
      return bar;
    });

    const topY = n * rowH + 2.4;
    const cntLbl = DSAV.makeLabel("removed = 0", { fontSize: 42, color: "#1c0d07", bg: DSAV.rgbHex(C.hot), scale: 1.0, noDepth: true });
    cntLbl.position.set(0, topY, 0);
    S.world.add(cntLbl);
    S.controls.target.set(0, topY * 0.42, 0);
    S.camera.position.set(0, topY * 0.5 + 3, 16);

    // ---- steps: greedy, sorted by end ----
    const steps = [];
    let lastEnd = -Infinity, removed = 0;
    for (let i = 0; i < n; i++) {
      const iv = sorted[i];
      if (iv[0] < lastEnd) {
        removed++;
        steps.push({ type: "remove", i, removed, lastEnd });
      } else {
        lastEnd = iv[1];
        steps.push({ type: "keep", i, removed, lastEnd });
      }
    }
    steps.push({ type: "done", removed });

    steps.forEach((s) => {
      s.vars = [
        { k: "interval", v: s.i !== undefined ? `[${sorted[s.i][0]}, ${sorted[s.i][1]}]` : "—" },
        { k: "lastEnd kept", v: s.lastEnd === -Infinity ? "—" : s.lastEnd },
        { k: "removed", v: s.removed, cls: "hot" }
      ];
      switch (s.type) {
        case "remove": s.note = `[${sorted[s.i][0]}, ${sorted[s.i][1]}] starts before the last kept interval ends (${s.lastEnd}) — overlap. Since we sorted by end time, whatever we already kept finishes earliest, so <b>remove this one</b>.`; break;
        case "keep": s.note = `[${sorted[s.i][0]}, ${sorted[s.i][1]}] starts at/after ${s.lastEnd === -Infinity ? "the beginning" : s.lastEnd} — no overlap. <b>Keep it</b>, update lastEnd to ${s.lastEnd}.`; break;
        case "done": s.note = `Done. Sorting by end time and greedily keeping the earliest-finishing option minimizes removals. Removed <b>${s.removed}</b>.`; s.results = [`removed = ${s.removed}`]; break;
      }
    });

    function goTo(k) {
      const s = steps[k];
      rows.forEach((bar, i) => {
        let col = new T.Color(C.dim), em = 0x000000, active = false;
        if (i === s.i) { col = new T.Color(s.type === "remove" ? C.bad : C.good); em = col.getHex(); active = true; }
        else if (s.i !== undefined && i < s.i) { col = new T.Color(C.bar); }
        bar.userData.targetColor = col;
        bar.userData.emissiveColor.set(em);
        bar.userData.active = active;
      });
      cntLbl.userData.setText(`removed = ${s.removed}`);
    }

    S.onTick(() => {
      const t = performance.now() * 0.004;
      rows.forEach((bar) => {
        const m = bar.material;
        m.color.lerp(bar.userData.targetColor, 0.14);
        m.emissive.lerp(bar.userData.emissiveColor, 0.18);
        m.emissiveIntensity = bar.userData.active ? (0.35 + Math.sin(t) * 0.18) : 0.0;
      });
    });

    goTo(0);
    return { steps, goTo, dispose: S.dispose };
  }
};
