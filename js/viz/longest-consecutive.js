/* ============================================================
   Viz: Longest Consecutive Sequence (LC 128)
   Bars laid out in ORIGINAL array order (unsorted), each labeled
   with its value. A hash set holds every number. We only ever
   START counting from a "sequence head" — a value whose (v-1) is
   NOT in the set. From a head we walk v, v+1, v+2... as long as
   each is present, lighting up that chain. The longest chain
   found is kept glowing green.
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["longest-consecutive"] = {
  samples: [
    { label: "[100,4,200,1,3,2]", nums: [100, 4, 200, 1, 3, 2] },
    { label: "[0,3,7,2,5,8,4,6,0,1]", nums: [0, 3, 7, 2, 5, 8, 4, 6, 0, 1] },
    { label: "[1,2,0,1]", nums: [1, 2, 0, 1] },
    { label: "[9,1,4,7,3,-1,0,5,8,-1,6]", nums: [9, 1, 4, 7, 3, -1, 0, 5, 8, -1, 6] }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const nums = this.samples[sampleIndex].nums, n = nums.length;
    const set = new Set(nums);

    const spacing = Math.min(2.3, 15 / n);
    const depth = 1.2, barH = 1.3;
    const xAt = (i) => (i - (n - 1) / 2) * spacing;

    const bars = [];
    nums.forEach((v, i) => {
      const bar = DSAV.makeBar(1.3, barH, depth, C.bar);
      bar.position.set(xAt(i), barH / 2, 0);
      bar.userData = { targetColor: new T.Color(C.bar), emissiveColor: new T.Color(0x000000), active: false };
      const val = DSAV.makeLabel(String(v), { fontSize: 48, color: "#1c0d07", scale: 1.0 });
      val.position.set(0, 0, depth / 2 + 0.01);
      bar.add(val);
      S.world.add(bar);
      bars.push(bar);
    });

    const zFront = depth / 2 + 1.1;
    const pCur = DSAV.makePointer(C.left, "v");
    pCur.position.y = 0.55; pCur.userData.tgt = new T.Vector3(0, 0.55, zFront);
    S.world.add(pCur);

    const topY = barH + 2.0;
    const bestLbl = DSAV.makeLabel("best = 0", { fontSize: 46, color: "#1c0d07", bg: DSAV.rgbHex(C.good), scale: 1.05, noDepth: true });
    bestLbl.position.set(0, topY, 0);
    S.world.add(bestLbl);
    S.controls.target.set(0, topY * 0.45, 0);
    S.camera.position.set(0, topY * 0.5 + 3, Math.max(15, n * 2.2));

    // index lookup: first index in the array holding value v (for highlighting)
    const idxOf = new Map();
    nums.forEach((v, i) => { if (!idxOf.has(v)) idxOf.set(v, i); });

    // ---- steps ----
    const steps = [];
    const uniqueVals = [...set];
    let best = 0, bestChain = [];
    for (const v of uniqueVals) {
      const isHead = !set.has(v - 1);
      steps.push({ type: "check", v, isHead });
      if (!isHead) continue;
      let len = 1, cur = v;
      const chain = [v];
      while (set.has(cur + 1)) { cur++; len++; chain.push(cur); steps.push({ type: "extend", v, cur, len, chain: [...chain], best, bestChain }); }
      steps.push({ type: "chainDone", v, len, chain, best, bestChain });
      if (len > best) { best = len; bestChain = chain; }
    }
    steps.push({ type: "done", best, bestChain });

    steps.forEach((s) => {
      s.vars = [
        { k: "value", v: s.v !== undefined ? s.v : "—" },
        { k: "is head?", v: s.isHead !== undefined ? (s.isHead ? "yes (v−1 absent)" : "no (v−1 present)") : "—" },
        { k: "chain len", v: s.len !== undefined ? s.len : "—", cls: "hot" },
        { k: "best", v: s.best !== undefined ? s.best : best, cls: "good" }
      ];
      switch (s.type) {
        case "check":
          s.note = s.isHead
            ? `${s.v} has no <b>${s.v - 1}</b> before it in the set → it's a <b>sequence head</b>. Start counting from here.`
            : `${s.v} − 1 = ${s.v - 1} <b>is</b> in the set, so ${s.v} is the middle of some chain, not its start. Skip — it'll be counted from its head.`;
          break;
        case "extend":
          s.note = `${s.cur} is in the set → chain grows to length <b>${s.len}</b>: [${s.chain.join(", ")}].`;
          break;
        case "chainDone":
          s.note = `Chain from ${s.v} stops at length <b>${s.len}</b> (next value ${s.chain[s.chain.length - 1] + 1} is absent).` +
            (s.len > s.best ? " New longest!" : ` Best stays ${s.best}.`);
          break;
        case "done":
          s.note = `Every value checked once. Longest consecutive run has length <b>${s.best}</b>` +
            (s.bestChain.length ? ` — [${s.bestChain.join(", ")}].` : ".");
          s.results = [`best = ${s.best}`].concat(s.bestChain.length ? [`[${s.bestChain.join(", ")}]`] : []);
          break;
      }
    });

    function goTo(k) {
      const s = steps[k];
      const done = s.type === "done";
      const chainSet = new Set(done ? s.bestChain : (s.chain || []));
      bars.forEach((bar, i) => {
        const v = nums[i];
        let col = new T.Color(C.bar), em = 0x000000, active = false;
        if (chainSet.has(v) && idxOf.get(v) === i) {
          col = new T.Color(done ? C.good : C.hot);
          em = done ? C.good : C.hot;
          active = true;
        }
        if (!done && s.v === v && idxOf.get(v) === i && (s.type === "check")) {
          col = new T.Color(C.left); em = C.left; active = true;
        }
        bar.userData.targetColor = col;
        bar.userData.emissiveColor.set(em);
        bar.userData.active = active;
      });

      const focusVal = s.type === "extend" ? s.cur : s.v;
      pCur.visible = !done && focusVal !== undefined && idxOf.has(focusVal);
      if (pCur.visible) pCur.userData.tgt.set(xAt(idxOf.get(focusVal)), 0.55, zFront);

      bestLbl.userData.setText(`best = ${done ? s.best : (s.best !== undefined ? s.best : best)}`);
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
    });

    goTo(0);
    return { steps, goTo, dispose: S.dispose };
  }
};
