/* ============================================================
   Viz: Find Minimum in Rotated Sorted Array (LC 153)
   Value bars. lo / mid / hi pointers. The trick: compare mid
   against hi. If nums[mid] > nums[hi] the dip (minimum) must be
   to the RIGHT of mid, so lo = mid + 1; otherwise mid could be
   the min, so hi = mid. The shrinking [lo..hi] band always
   contains the minimum; a green marker tracks the best candidate.
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["find-min-rotated"] = {
  samples: [
    { label: "[3,4,5,1,2]", nums: [3, 4, 5, 1, 2] },
    { label: "[4,5,6,7,0,1,2]", nums: [4, 5, 6, 7, 0, 1, 2] },
    { label: "[11,13,15,17]", nums: [11, 13, 15, 17] },
    { label: "[2,1]", nums: [2, 1] }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const nums = this.samples[sampleIndex].nums, n = nums.length;

    const spacing = Math.min(2.2, 15 / n);
    const depth = 1.2;
    const maxAbs = Math.max(...nums.map((v) => Math.abs(v)), 1);
    const unit = 4.6 / maxAbs;
    const xAt = (i) => (i - (n - 1) / 2) * spacing;
    const hAt = (v) => Math.max(0.5, Math.abs(v) * unit);

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

    const zFront = depth / 2 + 1.1;
    const pLo = DSAV.makePointer(C.left, "lo");
    const pHi = DSAV.makePointer(C.right, "hi");
    const pMid = DSAV.makePointer(C.anchor, "mid");
    [pLo, pHi, pMid].forEach((p) => { p.position.y = 0.55; p.userData.tgt = new T.Vector3(0, 0.55, zFront); S.world.add(p); });
    pMid.position.y = 1.4;

    const topY = maxAbs * unit + 2.0;
    const minLbl = DSAV.makeLabel("min = ?", { fontSize: 48, color: "#1c0d07", bg: DSAV.rgbHex(C.good), scale: 1.1, noDepth: true });
    minLbl.position.set(0, topY, 0);
    S.world.add(minLbl);
    S.controls.target.set(0, topY * 0.45, 0);
    S.camera.position.set(0, topY * 0.5 + 3, Math.max(15, n * 2.1));

    // ---- steps ----
    const steps = [];
    let lo = 0, hi = n - 1, guard = 0;
    steps.push({ type: "init", lo, hi, mid: -1 });
    while (lo < hi && guard++ < 100) {
      const mid = (lo + hi) >> 1;
      const rightDip = nums[mid] > nums[hi];
      steps.push({ type: "probe", lo, hi, mid, rightDip });
      if (rightDip) lo = mid + 1; else hi = mid;
      steps.push({ type: "move", lo, hi, mid, rightDip });
    }
    steps.push({ type: "found", lo, hi, mid: lo });

    steps.forEach((s) => {
      s.vars = [
        { k: "lo", v: s.lo },
        { k: "hi", v: s.hi },
        { k: "mid", v: s.mid >= 0 ? s.mid : "—" },
        { k: "nums[mid]", v: s.mid >= 0 && s.mid < n ? nums[s.mid] : "—", cls: "hot" },
        { k: "nums[hi]", v: nums[s.hi], cls: "good" }
      ];
      switch (s.type) {
        case "init": s.note = "The minimum is the single 'drop' point. Compare the middle against the right end to find which side it hides on."; break;
        case "probe":
          s.note = s.rightDip
            ? `nums[mid]=${nums[s.mid]} &gt; nums[hi]=${nums[s.hi]} → the array still descends after mid, so the <b>minimum is to the right</b>.`
            : `nums[mid]=${nums[s.mid]} ≤ nums[hi]=${nums[s.hi]} → mid's half is sorted; the <b>minimum is mid or to its left</b>.`;
          break;
        case "move":
          s.note = s.rightDip ? `Discard mid and left: <b>lo = mid + 1 = ${s.lo}</b>.` : `Keep mid as a candidate: <b>hi = mid = ${s.hi}</b>.`;
          break;
        case "found":
          s.note = `lo meets hi at index ${s.lo}. The minimum is <b>${nums[s.lo]}</b>.`;
          s.results = [`min = ${nums[s.lo]}`, `index = ${s.lo}`];
          break;
      }
    });

    function goTo(k) {
      const s = steps[k];
      const done = s.type === "found";
      bars.forEach((bar, i) => {
        let col = new T.Color(C.dim), em = 0x000000, active = false;
        if (i >= s.lo && i <= s.hi) { col = new T.Color(C.bar); active = true; }
        if (i === s.mid && !done) { col = new T.Color(C.anchor); em = C.anchor; active = true; }
        if (done && i === s.lo) { col = new T.Color(C.good); em = C.good; active = true; }
        bar.userData.targetColor = col;
        bar.userData.emissiveColor.set(em);
        bar.userData.active = active;
      });
      pLo.userData.tgt.set(xAt(s.lo), 0.55, zFront);
      pHi.userData.tgt.set(xAt(s.hi), 0.55, zFront);
      pLo.visible = !done; pHi.visible = !done;
      if (s.mid >= 0 && s.mid < n && !done) { pMid.visible = true; pMid.userData.tgt.set(xAt(s.mid), 1.4, zFront); }
      else pMid.visible = false;
      if (done) minLbl.userData.setText(`min = ${nums[s.lo]}`);
      minLbl.position.x = done ? xAt(s.lo) : 0;
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
