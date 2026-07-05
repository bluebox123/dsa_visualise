/* ============================================================
   Viz: Two Sum II (LC 167)
   Sorted value-bars. Two pointer arrows (left=amber, right=rust)
   converge from the ends. A "sum bridge" connects the active
   pair and turns green when it equals the target.
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["two-sum-ii"] = {
  samples: [
    { label: "[2,7,11,15]  t=9", nums: [2, 7, 11, 15], target: 9 },
    { label: "[1,3,4,5,7,11]  t=9", nums: [1, 3, 4, 5, 7, 11], target: 9 },
    { label: "[2,3,4]  t=6", nums: [2, 3, 4], target: 6 },
    { label: "[-10,-3,0,5,9]  t=-1", nums: [-10, -3, 0, 5, 9], target: -1 }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const data = this.samples[sampleIndex];
    const nums = data.nums, target = data.target;
    const n = nums.length;

    const spacing = Math.min(2.2, 15 / n);
    const depth = 1.2;
    const maxAbs = Math.max(...nums.map((v) => Math.abs(v)), 1);
    const unit = 4.6 / maxAbs;
    const xAt = (i) => (i - (n - 1) / 2) * spacing;
    const hAt = (v) => Math.max(0.5, Math.abs(v) * unit);

    // ---- build bars ----
    const bars = [];
    nums.forEach((v, i) => {
      const h = hAt(v);
      const base = v >= 0 ? C.barPos : C.barNeg;
      const bar = DSAV.makeBar(1.35, h, depth, base);
      bar.position.set(xAt(i), h / 2, 0);
      bar.userData = {
        baseColor: new T.Color(base),
        targetColor: new T.Color(base),
        emissiveColor: new T.Color(0x000000),
        active: false,
        h
      };
      S.world.add(bar);
      bars.push(bar);

      const val = DSAV.makeLabel(String(v), { fontSize: 54, color: "#fbf6ee", scale: 1.15 });
      val.position.set(xAt(i), h + 0.5, depth / 2);
      S.world.add(val);

      const idx = DSAV.makeLabel(String(i), { fontSize: 40, color: "#b6a184", scale: 0.85 });
      idx.position.set(xAt(i), 0.2, depth / 2 + 0.5);
      S.world.add(idx);
    });

    // ---- pointers ----
    const zFront = depth / 2 + 1.1;
    const pL = DSAV.makePointer(C.left, "L");
    const pR = DSAV.makePointer(C.right, "R");
    [pL, pR].forEach((p) => { p.position.y = 0.55; p.userData.tgt = new T.Vector3(0, 0.55, zFront); S.world.add(p); });

    // ---- sum bridge ----
    const bridgeH = maxAbs * unit + 1.4;
    const bridge = DSAV.makeBar(1, 0.16, 0.16, C.hot);
    bridge.material.transparent = true; bridge.material.opacity = 0.9;
    bridge.material.metalness = 0.4;
    bridge.position.set(0, bridgeH, 0);
    bridge.userData = { tgtX: 0, tgtW: 1, tgtColor: new T.Color(C.hot) };
    S.world.add(bridge);
    const bridgeLbl = DSAV.makeLabel("-00 + -00 = -00", { fontSize: 50, color: "#1c0d07", bg: "#f4c884", scale: 1.15, noDepth: true });
    bridgeLbl.position.set(0, bridgeH + 0.6, 0);
    S.world.add(bridgeLbl);

    S.controls.target.set(0, bridgeH * 0.45, 0);
    S.camera.position.set(0, bridgeH * 0.6 + 3, Math.max(15, n * 2.1));

    // ---- compute steps ----
    const steps = [];
    let l = 0, r = n - 1;
    steps.push({ type: "init", l, r });
    let guard = 0;
    while (l < r && guard++ < 200) {
      const sum = nums[l] + nums[r];
      steps.push({ type: "compare", l, r, sum });
      if (sum === target) { steps.push({ type: "found", l, r, sum }); break; }
      if (sum < target) { l++; steps.push({ type: "move", l, r, moved: "left" }); }
      else { r--; steps.push({ type: "move", l, r, moved: "right" }); }
    }

    // decorate steps with note + vars
    steps.forEach((s) => {
      const sm = nums[s.l] + nums[s.r];
      s.vars = [
        { k: "left", v: s.l },
        { k: "right", v: s.r },
        { k: "sum", v: sm, cls: s.type === "found" ? "good" : "hot" },
        { k: "target", v: target }
      ];
      if (s.type === "init") s.note = "Place <b>left</b> on the smallest number and <b>right</b> on the largest.";
      else if (s.type === "compare") {
        if (sm === target) s.note = `sum = ${nums[s.l]} + ${nums[s.r]} = <b>${sm}</b> = target.`;
        else if (sm < target) s.note = `sum = <b>${sm}</b> &lt; target ${target}. Too small — we'll grow it.`;
        else s.note = `sum = <b>${sm}</b> &gt; target ${target}. Too big — we'll shrink it.`;
      } else if (s.type === "move") {
        s.note = s.moved === "left"
          ? "Move <b>left</b> rightward to a bigger number → larger sum."
          : "Move <b>right</b> leftward to a smaller number → smaller sum.";
      } else if (s.type === "found") {
        s.note = `Found it! Indices <b>${s.l + 1}</b> and <b>${s.r + 1}</b> (1-based) add to the target.`;
        s.results = [`[${s.l + 1}, ${s.r + 1}]`];
      }
    });

    // ---- apply a step to the scene ----
    function goTo(i) {
      const s = steps[i];
      const li = s.l, ri = s.r, sm = nums[li] + nums[ri];
      const found = s.type === "found";

      bars.forEach((bar, bi) => {
        let col = bar.userData.baseColor, em = 0x000000, active = false;
        if (bi === li) { em = found ? C.good : C.left; active = true; }
        else if (bi === ri) { em = found ? C.good : C.right; active = true; }
        else if (bi < li || bi > ri) { col = new T.Color(C.dim); }
        bar.userData.targetColor = (col instanceof T.Color) ? col : new T.Color(col);
        bar.userData.emissiveColor.set(em);
        bar.userData.active = active;
      });

      pL.userData.tgt.set(xAt(li), 0.55, zFront);
      pR.userData.tgt.set(xAt(ri), 0.55, zFront);

      const cx = (xAt(li) + xAt(ri)) / 2;
      const w = Math.max(0.4, xAt(ri) - xAt(li));
      bridge.userData.tgtX = cx;
      bridge.userData.tgtW = w;
      bridge.userData.tgtColor.set(found || sm === target ? C.good : C.hot);
      bridgeLbl.position.x = cx;
      bridgeLbl.userData.setText(`${nums[li]} + ${nums[ri]} = ${sm}`);
    }

    // ---- animation tick ----
    S.onTick(() => {
      const t = performance.now() * 0.004;
      bars.forEach((bar) => {
        const m = bar.material;
        m.color.lerp(bar.userData.targetColor, 0.12);
        m.emissive.lerp(bar.userData.emissiveColor, 0.18);
        m.emissiveIntensity = bar.userData.active ? (0.45 + Math.sin(t) * 0.22) : 0.0;
      });
      DSAV.lerpToTarget(pL, 0.16);
      DSAV.lerpToTarget(pR, 0.16);
      bridge.position.x += (bridge.userData.tgtX - bridge.position.x) * 0.16;
      bridge.scale.x += (bridge.userData.tgtW - bridge.scale.x) * 0.16;
      bridge.material.color.lerp(bridge.userData.tgtColor, 0.15);
    });

    goTo(0);
    return { steps, goTo, dispose: S.dispose };
  }
};
