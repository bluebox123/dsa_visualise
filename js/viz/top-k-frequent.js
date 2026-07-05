/* ============================================================
   Viz: Top K Frequent Elements (LC 347)
   First we count frequencies (bars grow to their count, grouped
   by distinct value). Then we bucket by frequency along a second
   axis (bucket[f] = values with that frequency) and walk from the
   highest frequency bucket downward, collecting values until we
   have k — that becomes the answer set, highlighted green.
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["top-k-frequent"] = {
  samples: [
    { label: "[1,1,1,2,2,3]  k=2", nums: [1, 1, 1, 2, 2, 3], k: 2 },
    { label: "[1]  k=1", nums: [1], k: 1 },
    { label: "[4,4,4,6,6,1,1,1,1]  k=2", nums: [4, 4, 4, 6, 6, 1, 1, 1, 1], k: 2 },
    { label: "[5,3,5,3,5,9,9,1]  k=3", nums: [5, 3, 5, 3, 5, 9, 9, 1], k: 3 }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const data = this.samples[sampleIndex];
    const nums = data.nums, k = data.k;

    const freq = new Map();
    nums.forEach((v) => freq.set(v, (freq.get(v) || 0) + 1));
    const values = [...freq.keys()];
    const n = values.length;
    const maxF = Math.max(...freq.values());

    const spacing = Math.min(2.4, 15 / n);
    const depth = 1.2, unit = 4.4 / maxF;
    const xAt = (i) => (i - (n - 1) / 2) * spacing;
    const hAt = (f) => Math.max(0.5, f * unit);

    const bars = [];
    values.forEach((v, i) => {
      const f = freq.get(v);
      const h = hAt(f);
      const bar = DSAV.makeBar(1.4, h, depth, C.bar);
      bar.position.set(xAt(i), h / 2, 0);
      bar.userData = { targetColor: new T.Color(C.bar), emissiveColor: new T.Color(0x000000), active: false };
      S.world.add(bar);
      bars.push(bar);
      const val = DSAV.makeLabel(`${v}`, { fontSize: 44, color: "#fbf6ee", scale: 0.95 });
      val.position.set(xAt(i), h + 0.65, depth / 2);
      S.world.add(val);
      const cntLbl = DSAV.makeLabel(`×${f}`, { fontSize: 34, color: "#8f7a5e", scale: 0.7 });
      cntLbl.position.set(xAt(i), h + 0.22, depth / 2);
      S.world.add(cntLbl);
    });

    const topY = maxF * unit + 2.2;
    const bucketLbl = DSAV.makeLabel("scanning buckets: freq n → 1", { fontSize: 38, color: "#1c0d07", bg: DSAV.rgbHex(C.hot), scale: 0.9, noDepth: true });
    bucketLbl.position.set(0, topY, 0);
    S.world.add(bucketLbl);
    S.controls.target.set(0, topY * 0.42, 0);
    S.camera.position.set(0, topY * 0.5 + 3, Math.max(15, n * 2.2));

    // ---- steps: bucket sort by frequency, scan high to low ----
    const buckets = new Array(nums.length + 1).fill(null).map(() => []);
    values.forEach((v) => buckets[freq.get(v)].push(v));

    const steps = [];
    const result = [];
    for (let f = buckets.length - 1; f >= 1 && result.length < k; f--) {
      if (!buckets[f].length) { steps.push({ type: "empty", f, result: [...result] }); continue; }
      for (const v of buckets[f]) {
        if (result.length >= k) break;
        result.push(v);
        steps.push({ type: "collect", f, v, result: [...result] });
      }
    }
    steps.push({ type: "done", result: [...result] });

    steps.forEach((s) => {
      s.vars = [
        { k: "bucket freq", v: s.f !== undefined ? s.f : "—" },
        { k: "collected", v: `[${s.result.join(", ")}]`, cls: "good" },
        { k: "need", v: `${s.result.length} / ${k}` }
      ];
      switch (s.type) {
        case "empty": s.note = `No value occurs exactly <b>${s.f}</b> time${s.f === 1 ? "" : "s"} — move to the next bucket down.`; break;
        case "collect": s.note = `Value <b>${s.v}</b> occurs ${s.f} times — take it. Collected ${s.result.length} of ${k}.`; break;
        case "done": s.note = `Reached k=${k} elements by scanning buckets from the most frequent down.`; s.results = [`[${s.result.join(", ")}]`]; break;
      }
    });

    function goTo(idx) {
      const s = steps[idx];
      const resultSet = new Set(s.result);
      bars.forEach((bar, i) => {
        const v = values[i];
        let col = new T.Color(C.bar), em = 0x000000, active = false;
        if (resultSet.has(v)) { col = new T.Color(C.good); em = C.good; active = true; }
        if (s.v === v && s.type === "collect") { em = C.hot; active = true; }
        bar.userData.targetColor = col;
        bar.userData.emissiveColor.set(em);
        bar.userData.active = active;
      });
      bucketLbl.userData.setText(s.f !== undefined ? `bucket freq = ${s.f}` : "done");
    }

    S.onTick(() => {
      const t = performance.now() * 0.004;
      bars.forEach((bar) => {
        const m = bar.material;
        m.color.lerp(bar.userData.targetColor, 0.13);
        m.emissive.lerp(bar.userData.emissiveColor, 0.18);
        m.emissiveIntensity = bar.userData.active ? (0.35 + Math.sin(t) * 0.18) : 0.0;
      });
    });

    goTo(0);
    return { steps, goTo, dispose: S.dispose };
  }
};
