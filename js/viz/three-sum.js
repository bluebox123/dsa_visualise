/* ============================================================
   Viz: 3Sum (LC 15)
   1) bars animate from original order into SORTED order.
   2) a green "anchor" pointer i walks left→right.
   3) left/right pointers two-sum the suffix for -nums[i].
   Found triplets accumulate as green chips.
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["three-sum"] = {
  samples: [
    { label: "[-1,0,1,2,-1,-4]", nums: [-1, 0, 1, 2, -1, -4] },
    { label: "[0,0,0,0]", nums: [0, 0, 0, 0] },
    { label: "[-2,0,1,1,2]", nums: [-2, 0, 1, 1, 2] },
    { label: "[-4,-2,-1,0,1,3]", nums: [-4, -2, -1, 0, 1, 3] }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const nums = this.samples[sampleIndex].nums;
    const n = nums.length;

    const spacing = Math.min(2.2, 15 / n);
    const depth = 1.2;
    const maxAbs = Math.max(...nums.map((x) => Math.abs(x)), 1);
    const unit = 4.4 / maxAbs;
    const xAt = (i) => (i - (n - 1) / 2) * spacing;
    const hAt = (v) => Math.max(0.5, Math.abs(v) * unit);

    // sorted order (stable) and slot mapping
    const sorted = nums.map((v, idx) => ({ v, idx })).sort((a, b) => a.v - b.v || a.idx - b.idx);
    const v = sorted.map((o) => o.v);                 // sorted values
    const orderToOrig = sorted.map((o) => o.idx);     // sortedSlot -> originalIndex
    const slotOfOrig = new Array(n);
    orderToOrig.forEach((orig, slot) => (slotOfOrig[orig] = slot));

    // ---- build bars (indexed by original index) ----
    const bars = [];
    nums.forEach((val, origIdx) => {
      const h = hAt(val);
      const base = val >= 0 ? C.barPos : C.barNeg;
      const bar = DSAV.makeBar(1.3, h, depth, base);
      bar.position.set(xAt(origIdx), h / 2, 0);
      bar.userData = {
        baseColor: new T.Color(base),
        targetColor: new T.Color(base),
        emissiveColor: new T.Color(0x000000),
        active: false,
        origX: xAt(origIdx),
        sortX: xAt(slotOfOrig[origIdx]),
        tgtX: xAt(origIdx),
        h
      };
      const vlab = DSAV.makeLabel(String(val), { fontSize: 54, color: "#fbf6ee", scale: 1.1 });
      vlab.position.set(0, h / 2 + 0.5, depth / 2);
      bar.add(vlab);
      S.world.add(bar);
      bars.push(bar);
    });
    for (let slot = 0; slot < n; slot++) {
      const idx = DSAV.makeLabel(String(slot), { fontSize: 38, color: "#8f7a5e", scale: 0.8 });
      idx.position.set(xAt(slot), 0.18, depth / 2 + 0.6);
      S.world.add(idx);
    }
    const barAt = (slot) => bars[orderToOrig[slot]]; // sorted slot -> bar

    // ---- pointers ----
    const zFront = depth / 2 + 1.1;
    const pA = DSAV.makePointer(C.anchor, "i");
    const pL = DSAV.makePointer(C.left, "L");
    const pR = DSAV.makePointer(C.right, "R");
    [pA, pL, pR].forEach((p) => {
      p.position.set(0, 0.55, zFront);
      p.userData.tgt = new T.Vector3(0, 0.55, zFront);
      p.userData.vis = 0; p.scale.setScalar(0.001);
      S.world.add(p);
    });

    // floating sum readout
    const sumH = maxAbs * unit + 1.6;
    const sumLbl = DSAV.makeLabel("-0 + -0 + -0 = -0", { fontSize: 50, color: "#1c0d07", bg: "#f4c884", scale: 1.15, noDepth: true });
    sumLbl.position.set(0, sumH, 0);
    sumLbl.userData.vis = 0; sumLbl.visible = false;
    S.world.add(sumLbl);

    S.controls.target.set(0, sumH * 0.42, 0);
    S.camera.position.set(0, sumH * 0.55 + 3, Math.max(15, n * 2.2));

    // ---- compute steps ----
    const steps = [];
    const foundList = [];
    steps.push({ type: "init" });
    steps.push({ type: "sort" });
    for (let i = 0; i < n - 2; i++) {
      if (i > 0 && v[i] === v[i - 1]) { steps.push({ type: "skip", i }); continue; }
      let l = i + 1, r = n - 1;
      steps.push({ type: "anchor", i, l, r });
      let guard = 0;
      while (l < r && guard++ < 200) {
        const sum = v[i] + v[l] + v[r];
        steps.push({ type: "compare", i, l, r, sum });
        if (sum === 0) {
          foundList.push(`[${v[i]}, ${v[l]}, ${v[r]}]`);
          steps.push({ type: "found", i, l, r, sum });
          l++; r--;
          while (l < r && v[l] === v[l - 1]) l++;
          while (l < r && v[r] === v[r + 1]) r--;
          if (l < r) steps.push({ type: "advance", i, l, r });
        } else if (sum < 0) {
          l++; steps.push({ type: "move", i, l, r, moved: "left" });
        } else {
          r--; steps.push({ type: "move", i, l, r, moved: "right" });
        }
      }
    }
    steps.push({ type: "done" });

    // decorate steps
    let running = [];
    steps.forEach((s) => {
      if (s.type === "found") running = running.concat([`[${v[s.i]}, ${v[s.l]}, ${v[s.r]}]`]);
      s.found = running.slice();
      s.vars = [];
      if (s.i != null) s.vars.push({ k: "i", v: s.i });
      if (s.l != null) s.vars.push({ k: "left", v: s.l });
      if (s.r != null) s.vars.push({ k: "right", v: s.r });
      if (s.sum != null) s.vars.push({ k: "sum", v: s.sum, cls: s.sum === 0 ? "good" : "hot" });

      switch (s.type) {
        case "init": s.note = "The array is unsorted. Two Pointers needs order — so first we <b>sort</b> it."; break;
        case "sort": s.note = "Sorted small → large. Now fix an anchor <b>i</b> and two-pointer the rest for sum 0."; break;
        case "skip": s.note = `nums[${s.i}] repeats the previous value → <b>skip</b> to avoid duplicate triplets.`; break;
        case "anchor": s.note = `Anchor <b>i=${s.i}</b> (value ${v[s.i]}). Find two more in the suffix summing to ${-v[s.i]}.`; break;
        case "compare":
          s.note = s.sum === 0
            ? `${v[s.i]} + ${v[s.l]} + ${v[s.r]} = <b>0</b> — a triplet!`
            : (s.sum < 0
              ? `sum = <b>${s.sum}</b> &lt; 0 → move <b>left</b> up for a bigger sum.`
              : `sum = <b>${s.sum}</b> &gt; 0 → move <b>right</b> down for a smaller sum.`);
          break;
        case "found": s.note = `Recorded <b>[${v[s.i]}, ${v[s.l]}, ${v[s.r]}]</b>. Move both pointers inward, skipping duplicates.`; s.results = s.found; break;
        case "move": s.note = s.moved === "left" ? "sum too small → <b>left++</b>." : "sum too big → <b>right--</b>."; break;
        case "advance": s.note = "Pointers moved past duplicates; keep scanning this anchor."; break;
        case "done": s.note = foundList.length ? `Done. Found <b>${foundList.length}</b> unique triplet(s).` : "Done — no triplet sums to 0."; s.results = foundList.slice(); break;
      }
    });

    // ---- apply step ----
    function goTo(k) {
      const s = steps[k];
      const sortedPhase = k >= 1; // after the sort step, bars sit in sorted order

      bars.forEach((bar) => {
        bar.userData.tgtX = sortedPhase ? bar.userData.sortX : bar.userData.origX;
        bar.userData.targetColor = bar.userData.baseColor;
        bar.userData.emissiveColor.set(0x000000);
        bar.userData.active = false;
      });

      const showPtr = ["anchor", "compare", "move", "found", "advance", "skip"].includes(s.type);
      const found = s.type === "found";

      if (s.i != null) {
        for (let slot = 0; slot < s.i; slot++) barAt(slot).userData.targetColor = new T.Color(C.dim);
        const a = barAt(s.i);
        a.userData.emissiveColor.set(found ? C.good : C.anchor); a.userData.active = true;
        pA.userData.tgt.set(xAt(s.i), 0.55, zFront); pA.userData.vis = 1;
      } else { pA.userData.vis = 0; }

      if (s.l != null && s.r != null && s.type !== "skip") {
        const lb = barAt(s.l), rb = barAt(s.r);
        lb.userData.emissiveColor.set(found ? C.good : C.left); lb.userData.active = true;
        rb.userData.emissiveColor.set(found ? C.good : C.right); rb.userData.active = true;
        pL.userData.tgt.set(xAt(s.l), 0.55, zFront); pL.userData.vis = 1;
        pR.userData.tgt.set(xAt(s.r), 0.55, zFront); pR.userData.vis = 1;
      } else { pL.userData.vis = 0; pR.userData.vis = 0; }

      if (!showPtr) { pA.userData.vis = 0; pL.userData.vis = 0; pR.userData.vis = 0; }

      if (s.sum != null) {
        const cx = (xAt(s.i) + xAt(s.l) + xAt(s.r)) / 3;
        sumLbl.position.x = cx;
        sumLbl.userData.setText(`${v[s.i]} + ${v[s.l]} + ${v[s.r]} = ${s.sum}`);
        sumLbl.userData.vis = 1;
      } else { sumLbl.userData.vis = 0; }
    }

    // ---- tick ----
    S.onTick(() => {
      const t = performance.now() * 0.004;
      bars.forEach((bar) => {
        const m = bar.material;
        bar.position.x += (bar.userData.tgtX - bar.position.x) * 0.14;
        m.color.lerp(bar.userData.targetColor, 0.12);
        m.emissive.lerp(bar.userData.emissiveColor, 0.18);
        m.emissiveIntensity = bar.userData.active ? (0.45 + Math.sin(t) * 0.22) : 0.0;
      });
      [pA, pL, pR].forEach((p) => {
        DSAV.lerpToTarget(p, 0.16);
        const target = p.userData.vis ? 1 : 0.001;
        p.scale.setScalar(p.scale.x + (target - p.scale.x) * 0.2);
      });
      sumLbl.visible = sumLbl.userData.vis === 1;
    });

    goTo(0);
    return { steps, goTo, dispose: S.dispose };
  }
};
