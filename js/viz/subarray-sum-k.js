/* ============================================================
   Viz: Subarray Sum Equals K (LC 560)
   Value bars. A running prefix-sum readout floats above the
   current index. A hash map tallies how many times each prefix
   sum has occurred. At index i, we need prefix[i] - k to have
   occurred before: the moment it has, every one of those earlier
   occurrences names a subarray ending at i that sums to k — each
   gets a brief highlighted bridge. Running count of matches is
   the answer.
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["subarray-sum-k"] = {
  samples: [
    { label: "[1,1,1]  k=2", nums: [1, 1, 1], k: 2 },
    { label: "[1,2,3]  k=3", nums: [1, 2, 3], k: 3 },
    { label: "[1,-1,0]  k=0", nums: [1, -1, 0], k: 0 },
    { label: "[3,4,7,2,-3,1,4,2]  k=7", nums: [3, 4, 7, 2, -3, 1, 4, 2], k: 7 }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const data = this.samples[sampleIndex];
    const nums = data.nums, k = data.k, n = nums.length;

    const spacing = Math.min(2.3, 15 / n);
    const depth = 1.2;
    const maxAbs = Math.max(...nums.map((v) => Math.abs(v)), 1);
    const unit = 4.2 / maxAbs;
    const xAt = (i) => (i - (n - 1) / 2) * spacing;
    const hAt = (v) => Math.max(0.5, Math.abs(v) * unit);

    const bars = [];
    nums.forEach((v, i) => {
      const h = hAt(v);
      const base = v >= 0 ? C.barPos : C.barNeg;
      const bar = DSAV.makeBar(1.3, h, depth, base);
      bar.position.set(xAt(i), h / 2, 0);
      bar.userData = { targetColor: new T.Color(base), emissiveColor: new T.Color(0x000000), active: false };
      S.world.add(bar);
      bars.push(bar);
      const val = DSAV.makeLabel(String(v), { fontSize: 46, color: "#fbf6ee", scale: 1.0 });
      val.position.set(xAt(i), h + 0.45, depth / 2);
      S.world.add(val);
    });

    const zFront = depth / 2 + 1.1;
    const pCur = DSAV.makePointer(C.left, "i");
    pCur.position.y = 0.55; pCur.userData.tgt = new T.Vector3(0, 0.55, zFront);
    S.world.add(pCur);

    const topY = maxAbs * unit + 2.2;
    const prefixLbl = DSAV.makeLabel("prefix = 0", { fontSize: 44, color: "#1c0d07", bg: DSAV.rgbHex(C.hot), scale: 1.0, noDepth: true });
    prefixLbl.position.set(0, topY, 0);
    S.world.add(prefixLbl);
    const countLbl = DSAV.makeLabel(`count = 0  (k=${k})`, { fontSize: 42, color: "#1c0d07", bg: DSAV.rgbHex(C.good), scale: 0.95, noDepth: true });
    countLbl.position.set(0, topY + 1.1, 0);
    S.world.add(countLbl);

    S.controls.target.set(0, topY * 0.45, 0);
    S.camera.position.set(0, topY * 0.5 + 3, Math.max(15, n * 2.2));

    // bridge to show the matched subarray span
    const bridge = new T.Mesh(
      new T.BoxGeometry(1, hAt(1) + 0.6, depth + 0.4),
      new T.MeshStandardMaterial({ color: C.good, transparent: true, opacity: 0.18, emissive: C.good, emissiveIntensity: 0.2 })
    );
    bridge.userData = { tgtX: 0, tgtW: 1 };
    bridge.visible = false;
    S.world.add(bridge);

    // ---- steps ----
    const steps = [];
    const freq = new Map([[0, 1]]);
    let prefix = 0, count = 0;
    for (let i = 0; i < n; i++) {
      prefix += nums[i];
      const need = prefix - k;
      const matches = freq.get(need) || 0;
      steps.push({ type: "prefix", i, prefix, need, matches, count });
      count += matches;
      steps.push({ type: "tally", i, prefix, need, matches, count });
      freq.set(prefix, (freq.get(prefix) || 0) + 1);
      steps.push({ type: "store", i, prefix, count, freqSize: freq.size });
    }
    steps.push({ type: "done", count });

    steps.forEach((s) => {
      s.vars = [
        { k: "i", v: s.i !== undefined ? s.i : "—" },
        { k: "prefix", v: s.prefix !== undefined ? s.prefix : "—", cls: "hot" },
        { k: "need (prefix−k)", v: s.need !== undefined ? s.need : "—" },
        { k: "count", v: s.count, cls: "good" }
      ];
      switch (s.type) {
        case "prefix":
          s.note = `Running sum through index ${s.i} is <b>${s.prefix}</b>. A subarray ending here sums to k=${k} if an earlier prefix equalled <b>${s.need}</b> — seen ${s.matches} time${s.matches === 1 ? "" : "s"} before.`;
          break;
        case "tally":
          s.note = s.matches > 0
            ? `Found ${s.matches} earlier prefix${s.matches === 1 ? "" : "es"} equal to ${s.need} → that many new subarrays sum to k. <b>count = ${s.count}</b>.`
            : `No earlier prefix equals ${s.need} — no new subarray ending here sums to k.`;
          break;
        case "store":
          s.note = `Record that prefix sum <b>${s.prefix}</b> has now occurred (for future indices to match against).`;
          break;
        case "done":
          s.note = `Scan complete. <b>${s.count}</b> subarray${s.count === 1 ? "" : "s"} sum to k=${k}.`;
          s.results = [`count = ${s.count}`];
          break;
      }
    });

    function goTo(idx) {
      const s = steps[idx];
      const i = s.i !== undefined ? s.i : n - 1;
      bars.forEach((bar, bi) => {
        const base = nums[bi] >= 0 ? C.barPos : C.barNeg;
        let col = new T.Color(base), em = 0x000000, active = false;
        if (s.i !== undefined && bi <= s.i) { active = bi === s.i; if (bi === s.i) em = C.left; }
        if (s.i !== undefined && bi > s.i) { col = new T.Color(C.dim); }
        bar.userData.targetColor = col;
        bar.userData.emissiveColor.set(em);
        bar.userData.active = active;
      });
      pCur.visible = s.i !== undefined;
      if (s.i !== undefined) pCur.userData.tgt.set(xAt(s.i), 0.55, zFront);

      prefixLbl.userData.setText(s.prefix !== undefined ? `prefix = ${s.prefix}` : "prefix = 0");
      countLbl.userData.setText(`count = ${s.count}  (k=${k})`);

      bridge.visible = s.type === "tally" && s.matches > 0;
      if (bridge.visible) {
        bridge.userData.tgtX = xAt(i) - (spacing * 0.6);
        bridge.userData.tgtW = spacing * 1.6;
      }
    }

    S.onTick(() => {
      const t = performance.now() * 0.004;
      bars.forEach((bar) => {
        const m = bar.material;
        m.color.lerp(bar.userData.targetColor, 0.13);
        m.emissive.lerp(bar.userData.emissiveColor, 0.18);
        m.emissiveIntensity = bar.userData.active ? (0.35 + Math.sin(t) * 0.18) : 0.0;
      });
      DSAV.lerpToTarget(pCur, 0.16);
      bridge.position.x += (bridge.userData.tgtX - bridge.position.x) * 0.2;
      bridge.scale.x += (bridge.userData.tgtW - bridge.scale.x) * 0.2;
    });

    goTo(0);
    return { steps, goTo, dispose: S.dispose };
  }
};
