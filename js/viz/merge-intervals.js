/* ============================================================
   Viz: Merge Intervals (LC 56)
   Intervals drawn as horizontal bars along a number line, one
   row per interval, sorted by start. We sweep left to right; when
   the current interval's start is ≤ the running merged end, it
   fuses into the merged bar (glows green and grows); otherwise
   the merged bar is finalized and a new one begins.
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["merge-intervals"] = {
  samples: [
    { label: "[[1,3],[2,6],[8,10],[15,18]]", intervals: [[1, 3], [2, 6], [8, 10], [15, 18]] },
    { label: "[[1,4],[4,5]]", intervals: [[1, 4], [4, 5]] },
    { label: "[[1,4],[0,4]]", intervals: [[1, 4], [0, 4]] },
    { label: "[[1,4],[2,3]]", intervals: [[1, 4], [2, 3]] }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const raw = this.samples[sampleIndex].intervals;
    const sorted = [...raw].sort((a, b) => a[0] - b[0]);
    const n = sorted.length;

    const maxEnd = Math.max(...raw.map((iv) => iv[1]));
    const scaleX = 13 / maxEnd;
    const xAt = (v) => v * scaleX - 6.5;
    const rowH = 1.4, barH = 0.9, depth = 1.0;

    const rows = sorted.map((iv, r) => {
      const w = Math.max(0.3, (iv[1] - iv[0]) * scaleX);
      const bar = DSAV.makeBar(w, barH, depth, C.bar);
      bar.position.set(xAt(iv[0]) + w / 2, (n - 1 - r) * rowH + 1, 0);
      bar.userData = { targetColor: new T.Color(C.bar), emissiveColor: new T.Color(0x000000), active: false, tgtX: bar.position.x, tgtW: w };
      S.world.add(bar);
      const lbl = DSAV.makeLabel(`[${iv[0]},${iv[1]}]`, { fontSize: 36, color: "#fbf6ee", scale: 0.75 });
      lbl.position.set(0, 0.75, depth / 2 + 0.1);
      bar.add(lbl);
      return bar;
    });

    // merged result bars (grow on top)
    const mergedY = n * rowH + 2.0;
    const mergedBars = sorted.map(() => {
      const b = DSAV.makeBar(0.3, barH, depth, C.good);
      b.visible = false;
      const lbl = DSAV.makeLabel("", { fontSize: 36, color: "#1c0d07", scale: 0.75 });
      lbl.position.set(0, 0, depth / 2 + 0.1); b.add(lbl); b.lbl = lbl;
      b.userData = { tgtX: 0, tgtW: 0.3 };
      S.world.add(b);
      return b;
    });
    const mergedLbl = DSAV.makeLabel("merged intervals", { fontSize: 34, color: "#8f7a5e", scale: 0.72 });
    mergedLbl.position.set(0, mergedY + 1.0, 0);
    S.world.add(mergedLbl);

    S.controls.target.set(0, mergedY * 0.45, 0);
    S.camera.position.set(0, mergedY * 0.55 + 3, 16);

    // ---- steps ----
    const steps = [];
    const merged = [];
    for (let i = 0; i < n; i++) {
      const iv = sorted[i];
      if (!merged.length || iv[0] > merged[merged.length - 1][1]) {
        merged.push([...iv]);
        steps.push({ type: "new", i, merged: merged.map((m) => [...m]) });
      } else {
        const last = merged[merged.length - 1];
        const oldEnd = last[1];
        last[1] = Math.max(last[1], iv[1]);
        steps.push({ type: "fuse", i, oldEnd, newEnd: last[1], merged: merged.map((m) => [...m]) });
      }
    }
    steps.push({ type: "done", merged: merged.map((m) => [...m]) });

    steps.forEach((s) => {
      s.vars = [
        { k: "interval", v: s.i !== undefined ? `[${sorted[s.i][0]}, ${sorted[s.i][1]}]` : "—" },
        { k: "merged so far", v: `[${s.merged.map((m) => `[${m[0]},${m[1]}]`).join(", ")}]`, cls: "good" }
      ];
      switch (s.type) {
        case "new": s.note = `Interval [${sorted[s.i][0]}, ${sorted[s.i][1]}] starts after the last merged interval ends — begin a <b>new</b> merged group.`; break;
        case "fuse": s.note = `Interval [${sorted[s.i][0]}, ${sorted[s.i][1]}] overlaps the current group (start ≤ ${s.oldEnd}) — extend its end to <b>${s.newEnd}</b>.`; break;
        case "done": s.note = `Done. Sorting by start turns overlap-checking into one linear sweep.`; s.results = s.merged.map((m) => `[${m[0]}, ${m[1]}]`); break;
      }
    });

    function goTo(k) {
      const s = steps[k];
      rows.forEach((bar, i) => {
        let col = new T.Color(C.bar), em = 0x000000, active = false;
        if (s.i !== undefined && i === s.i) { col = new T.Color(s.type === "new" ? C.left : C.good); em = col.getHex(); active = true; }
        else if (s.i !== undefined && i < s.i) { col = new T.Color(C.dim); }
        bar.userData.targetColor = col;
        bar.userData.emissiveColor.set(em);
        bar.userData.active = active;
      });
      mergedBars.forEach((mb, i) => {
        if (i < s.merged.length) {
          const [a, b] = s.merged[i];
          const w = Math.max(0.3, (b - a) * scaleX);
          mb.visible = true;
          mb.userData.tgtX = xAt(a) + w / 2;
          mb.userData.tgtW = w;
          mb.position.y = mergedY - (s.merged.length - 1 - i) * rowH;
          mb.lbl.userData.setText(`[${a},${b}]`);
        } else mb.visible = false;
      });
    }

    S.onTick(() => {
      const t = performance.now() * 0.004;
      rows.forEach((bar) => {
        const m = bar.material;
        m.color.lerp(bar.userData.targetColor, 0.14);
        m.emissive.lerp(bar.userData.emissiveColor, 0.18);
        m.emissiveIntensity = bar.userData.active ? (0.35 + Math.sin(t) * 0.18) : 0.0;
      });
      mergedBars.forEach((mb) => {
        if (!mb.visible) return;
        mb.position.x += (mb.userData.tgtX - mb.position.x) * 0.2;
        mb.scale.x += (mb.userData.tgtW - mb.scale.x) * 0.2;
      });
    });

    goTo(0);
    return { steps, goTo, dispose: S.dispose };
  }
};
