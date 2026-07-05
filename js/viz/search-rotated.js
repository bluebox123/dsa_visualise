/* ============================================================
   Viz: Search in Rotated Sorted Array (LC 33)
   Value bars for the rotated array. Three pointers — lo (amber),
   mid (green), hi (rust). Each step we find mid, decide which
   half is genuinely sorted (that half glows), test whether the
   target falls inside it, and dim away the half we discard.
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["search-rotated"] = {
  samples: [
    { label: "[4,5,6,7,0,1,2]  t=0", nums: [4, 5, 6, 7, 0, 1, 2], target: 0 },
    { label: "[4,5,6,7,0,1,2]  t=3", nums: [4, 5, 6, 7, 0, 1, 2], target: 3 },
    { label: "[6,7,8,1,2,3,4,5]  t=3", nums: [6, 7, 8, 1, 2, 3, 4, 5], target: 3 },
    { label: "[1]  t=0", nums: [1], target: 0 }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const data = this.samples[sampleIndex];
    const nums = data.nums, target = data.target, n = nums.length;

    const spacing = Math.min(2.2, 15 / n);
    const depth = 1.2;
    const maxAbs = Math.max(...nums.map((v) => Math.abs(v)), 1);
    const unit = 4.6 / maxAbs;
    const xAt = (i) => (i - (n - 1) / 2) * spacing;
    const hAt = (v) => Math.max(0.5, Math.abs(v) * unit);

    // ---- bars ----
    const bars = [];
    nums.forEach((v, i) => {
      const h = hAt(v);
      const bar = DSAV.makeBar(1.35, h, depth, C.bar);
      bar.position.set(xAt(i), h / 2, 0);
      bar.userData = { baseColor: new T.Color(C.bar), targetColor: new T.Color(C.bar), emissiveColor: new T.Color(0x000000), active: false, h };
      S.world.add(bar);
      bars.push(bar);

      const val = DSAV.makeLabel(String(v), { fontSize: 54, color: "#fbf6ee", scale: 1.1 });
      val.position.set(xAt(i), h + 0.5, depth / 2);
      S.world.add(val);
      const idx = DSAV.makeLabel(String(i), { fontSize: 38, color: "#8f7a5e", scale: 0.8 });
      idx.position.set(xAt(i), 0.2, depth / 2 + 0.5);
      S.world.add(idx);
    });

    // ---- pointers ----
    const zFront = depth / 2 + 1.1;
    const pLo = DSAV.makePointer(C.left, "lo");
    const pHi = DSAV.makePointer(C.right, "hi");
    const pMid = DSAV.makePointer(C.anchor, "mid");
    [pLo, pHi, pMid].forEach((p) => { p.position.y = 0.55; p.userData.tgt = new T.Vector3(0, 0.55, zFront); S.world.add(p); });
    pMid.position.y = 1.4;

    const topY = maxAbs * unit + 2.0;
    const tLbl = DSAV.makeLabel(`target = ${target}`, { fontSize: 48, color: "#1c0d07", bg: DSAV.rgbHex(C.hot), scale: 1.1, noDepth: true });
    tLbl.position.set(0, topY, 0);
    S.world.add(tLbl);

    S.controls.target.set(0, topY * 0.45, 0);
    S.camera.position.set(0, topY * 0.5 + 3, Math.max(15, n * 2.1));

    // ---- compute steps ----
    const steps = [];
    let lo = 0, hi = n - 1, guard = 0;
    steps.push({ type: "init", lo, hi, mid: -1 });
    while (lo <= hi && guard++ < 100) {
      const mid = (lo + hi) >> 1;
      if (nums[mid] === target) { steps.push({ type: "found", lo, hi, mid }); break; }
      let leftSorted = nums[lo] <= nums[mid];
      let goLeft;
      if (leftSorted) goLeft = nums[lo] <= target && target < nums[mid];
      else goLeft = !(nums[mid] < target && target <= nums[hi]);
      steps.push({ type: "probe", lo, hi, mid, leftSorted, goLeft });
      if (goLeft) { hi = mid - 1; } else { lo = mid + 1; }
      steps.push({ type: "move", lo, hi, mid, leftSorted, goLeft });
      if (lo > hi) { steps.push({ type: "notfound", lo, hi, mid: -1 }); break; }
    }
    if (steps.length === 1) steps.push({ type: "notfound", lo, hi, mid: -1 });

    // ---- decorate ----
    steps.forEach((s) => {
      s.vars = [
        { k: "lo", v: s.lo },
        { k: "hi", v: s.hi },
        { k: "mid", v: s.mid >= 0 ? s.mid : "—" },
        { k: "nums[mid]", v: s.mid >= 0 ? nums[s.mid] : "—", cls: s.type === "found" ? "good" : "hot" },
        { k: "target", v: target }
      ];
      switch (s.type) {
        case "init": s.note = "Rotated but made of two sorted runs. Search with lo / hi and probe the middle."; break;
        case "probe":
          s.note = (s.leftSorted
            ? `nums[lo..mid] = [${nums[s.lo]}..${nums[s.mid]}] is <b>sorted</b>. `
            : `nums[mid..hi] = [${nums[s.mid]}..${nums[s.hi]}] is <b>sorted</b>. `) +
            (s.goLeft ? "Target lies inside that run → keep the left half." : "Target isn't in that run → keep the other half.");
          break;
        case "move":
          s.note = s.goLeft ? `Discard the right: <b>hi = mid − 1 = ${s.hi}</b>.` : `Discard the left: <b>lo = mid + 1 = ${s.lo}</b>.`;
          break;
        case "found":
          s.note = `nums[${s.mid}] = <b>${target}</b> — found at index ${s.mid}.`;
          s.results = [`index = ${s.mid}`];
          break;
        case "notfound":
          s.note = `lo passed hi — <b>${target}</b> is not in the array.`;
          s.results = [`-1 (absent)`];
          break;
      }
    });

    // ---- apply ----
    function goTo(k) {
      const s = steps[k];
      const done = s.type === "found" || s.type === "notfound";
      bars.forEach((bar, i) => {
        let col = new T.Color(C.dim), em = 0x000000, active = false;
        if (i >= s.lo && i <= s.hi) {
          col = new T.Color(C.bar); active = true;
          // glow the provably-sorted half during a probe
          if (s.type === "probe") {
            const inLeft = i >= s.lo && i <= s.mid;
            if ((s.leftSorted && inLeft) || (!s.leftSorted && !inLeft)) { col = new T.Color(C.good); em = 0x24401c; }
          }
        }
        if (i === s.mid) { col = new T.Color(s.type === "found" ? C.good : C.anchor); em = s.type === "found" ? C.good : C.anchor; active = true; }
        bar.userData.targetColor = col;
        bar.userData.emissiveColor.set(em);
        bar.userData.active = active;
      });

      pLo.userData.tgt.set(xAt(Math.min(s.lo, n - 1)), 0.55, zFront);
      pHi.userData.tgt.set(xAt(Math.max(s.hi, 0)), 0.55, zFront);
      pLo.visible = !done && s.lo <= s.hi;
      pHi.visible = !done && s.lo <= s.hi;
      if (s.mid >= 0) { pMid.visible = true; pMid.userData.tgt.set(xAt(s.mid), 1.4, zFront); }
      else pMid.visible = false;
    }

    S.onTick(() => {
      const t = performance.now() * 0.004;
      bars.forEach((bar) => {
        const m = bar.material;
        m.color.lerp(bar.userData.targetColor, 0.12);
        m.emissive.lerp(bar.userData.emissiveColor, 0.18);
        m.emissiveIntensity = bar.userData.active ? (0.4 + Math.sin(t) * 0.2) : 0.0;
      });
      DSAV.lerpToTarget(pLo, 0.16);
      DSAV.lerpToTarget(pHi, 0.16);
      DSAV.lerpToTarget(pMid, 0.16);
    });

    goTo(0);
    return { steps, goTo, dispose: S.dispose };
  }
};
