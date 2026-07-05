/* ============================================================
   Viz: Capacity To Ship Packages Within D Days (LC 1011)
   "Binary search on the answer" again — the answer is a ship
   capacity. Packages are bars in belt order. For a candidate
   capacity = mid we greedily pack them into days (each colour is
   one day) and count the days used. Feasible (days ≤ D) → try a
   smaller ship (hi = mid); too many days → bigger ship
   (lo = mid + 1). lo starts at the heaviest package (must fit at
   least that) and hi at the total weight (one giant day).
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["ship-capacity"] = {
  samples: [
    { label: "w=[1..10] D=5", weights: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], d: 5 },
    { label: "w=[3,2,2,4,1,4] D=3", weights: [3, 2, 2, 4, 1, 4], d: 3 },
    { label: "w=[1,2,3,1,1] D=4", weights: [1, 2, 3, 1, 1], d: 4 },
    { label: "w=[10,50,20,30,40] D=2", weights: [10, 50, 20, 30, 40], d: 2 }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const data = this.samples[sampleIndex];
    const weights = data.weights, D = data.d, n = weights.length;

    const dayPalette = [C.left, C.anchor, C.water, C.hot, C.right, C.good];

    const spacing = Math.min(2.2, 15 / n);
    const depth = 1.2;
    const maxW = Math.max(...weights);
    const sumW = weights.reduce((a, b) => a + b, 0);
    const unit = 4.6 / maxW;
    const xAt = (i) => (i - (n - 1) / 2) * spacing;
    const hAt = (v) => Math.max(0.4, v * unit);

    // ---- package bars ----
    const bars = [];
    weights.forEach((v, i) => {
      const h = hAt(v);
      const bar = DSAV.makeBar(1.4, h, depth, C.bar);
      bar.position.set(xAt(i), h / 2, 0);
      bar.userData = { targetColor: new T.Color(C.bar), emissiveColor: new T.Color(0x000000), active: false };
      S.world.add(bar);
      bars.push(bar);
      const val = DSAV.makeLabel(String(v), { fontSize: 48, color: "#fbf6ee", scale: 1.0 });
      val.position.set(xAt(i), h + 0.45, depth / 2);
      S.world.add(val);
      const idx = DSAV.makeLabel(String(i), { fontSize: 34, color: "#8f7a5e", scale: 0.72 });
      idx.position.set(xAt(i), 0.16, depth / 2 + 0.5);
      S.world.add(idx);
    });

    // ---- capacity axis ----
    const axisY = maxW * unit + 2.6;
    const halfW = Math.max(6, (n - 1) * spacing / 2 + 1);
    const axis = DSAV.makeBar(halfW * 2, 0.14, 0.14, C.grid);
    axis.position.set(0, axisY, 0);
    S.world.add(axis);
    const capToX = (c) => (sumW <= maxW ? 0 : ((c - maxW) / (sumW - maxW)) * (halfW * 2) - halfW);

    const axLblL = DSAV.makeLabel(`${maxW}`, { fontSize: 34, color: "#b6a184", scale: 0.75 });
    axLblL.position.set(-halfW, axisY + 0.6, 0);
    S.world.add(axLblL);
    const axLblR = DSAV.makeLabel(`${sumW}`, { fontSize: 34, color: "#b6a184", scale: 0.75 });
    axLblR.position.set(halfW, axisY + 0.6, 0);
    S.world.add(axLblR);

    const mkMark = (color, label) => {
      const g = new T.Group();
      const cone = new T.Mesh(new T.ConeGeometry(0.28, 0.6, 20),
        new T.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.35, roughness: 0.4 }));
      cone.rotation.x = Math.PI;
      g.add(cone);
      const spr = DSAV.makeLabel(label, { fontSize: 40, color: "#1c0d07", bg: DSAV.rgbHex(color), scale: 0.9 });
      spr.position.y = -0.7;
      g.add(spr);
      g.userData = { tgt: new T.Vector3(0, axisY - 0.5, 0) };
      S.world.add(g);
      return g;
    };
    const mLo = mkMark(C.left, "lo");
    const mHi = mkMark(C.right, "hi");
    const mMid = mkMark(C.anchor, "cap");
    mMid.position.y = axisY - 1.3;

    const daysLbl = DSAV.makeLabel(`D = ${D}`, { fontSize: 46, color: "#1c0d07", bg: DSAV.rgbHex(C.hot), scale: 1.05, noDepth: true });
    daysLbl.position.set(0, axisY + 1.7, 0);
    S.world.add(daysLbl);

    S.controls.target.set(0, axisY * 0.55, 0);
    S.camera.position.set(0, axisY * 0.6 + 2, Math.max(16, n * 2.3));

    // greedily assign each package a day index for a given capacity
    function packDays(cap) {
      const dayOf = new Array(n);
      let day = 0, cur = 0;
      for (let i = 0; i < n; i++) {
        if (cur + weights[i] > cap) { day++; cur = 0; }
        cur += weights[i];
        dayOf[i] = day;
      }
      return { dayOf, days: day + 1 };
    }

    // ---- steps ----
    const steps = [];
    let lo = maxW, hi = sumW, guard = 0;
    steps.push({ type: "init", lo, hi, mid: -1 });
    while (lo < hi && guard++ < 200) {
      const mid = (lo + hi) >> 1;
      const { days } = packDays(mid);
      const feasible = days <= D;
      steps.push({ type: "probe", lo, hi, mid, days, feasible });
      if (feasible) hi = mid; else lo = mid + 1;
      steps.push({ type: "move", lo, hi, mid, days, feasible });
    }
    steps.push({ type: "found", lo, hi, mid: lo, days: packDays(lo).days, feasible: true });

    steps.forEach((s) => {
      s.vars = [
        { k: "lo", v: s.lo },
        { k: "hi", v: s.hi },
        { k: "capacity", v: s.mid >= 0 ? s.mid : "—" },
        { k: "days", v: s.days !== undefined ? s.days : "—", cls: s.feasible ? "good" : "hot" },
        { k: "D", v: D }
      ];
      switch (s.type) {
        case "init": s.note = `Ship capacity must be at least the heaviest box (${maxW}) and at most the total (${sumW}). Bigger ship ⇒ fewer days — monotonic, so binary-search it.`; break;
        case "probe":
          s.note = `Capacity <b>${s.mid}</b>: greedily fill days (each colour = one day) → <b>${s.days} day${s.days === 1 ? "" : "s"}</b>. ` +
            (s.feasible ? `${s.days} ≤ D=${D} → this ship works, try a smaller one.` : `${s.days} &gt; D=${D} → too slow, need a bigger ship.`);
          break;
        case "move":
          s.note = s.feasible ? `Feasible — lower the ceiling: <b>hi = mid = ${s.hi}</b>.` : `Infeasible — raise the floor: <b>lo = mid + 1 = ${s.lo}</b>.`;
          break;
        case "found":
          s.note = `lo meets hi. The least capacity that ships everything in ${D} days is <b>${s.lo}</b>.`;
          s.results = [`capacity = ${s.lo}`, `days = ${s.days}`];
          break;
      }
    });

    function goTo(k) {
      const s = steps[k];
      const done = s.type === "found";
      const showPack = s.type === "probe" || done;
      const pack = showPack && s.mid >= 1 ? packDays(s.mid) : null;
      bars.forEach((bar, i) => {
        let col = new T.Color(C.bar), em = 0x000000, active = false;
        if (pack) {
          col = new T.Color(dayPalette[pack.dayOf[i] % dayPalette.length]);
          em = col.clone().multiplyScalar(0.25).getHex();
          active = true;
        }
        bar.userData.targetColor = col;
        bar.userData.emissiveColor.set(em);
        bar.userData.active = active;
      });

      mLo.userData.tgt.set(capToX(s.lo), axisY - 0.5, 0);
      mHi.userData.tgt.set(capToX(s.hi), axisY - 0.5, 0);
      mLo.visible = !done; mHi.visible = !done;
      if (s.mid >= 1 && !done) {
        mMid.visible = true;
        mMid.userData.tgt.set(capToX(s.mid), axisY - 1.3, 0);
        mMid.children[0].material.color.set(s.feasible ? C.good : C.bad);
        mMid.children[0].material.emissive.set(s.feasible ? C.good : C.bad);
      } else mMid.visible = false;

      daysLbl.userData.setText(done ? `min capacity = ${s.lo}` : (s.days !== undefined ? `${s.days} days  (D=${D})` : `D = ${D}`));
    }

    S.onTick(() => {
      const t = performance.now() * 0.004;
      bars.forEach((bar) => {
        const m = bar.material;
        m.color.lerp(bar.userData.targetColor, 0.14);
        m.emissive.lerp(bar.userData.emissiveColor, 0.16);
        m.emissiveIntensity = bar.userData.active ? (0.35 + Math.sin(t) * 0.16) : 0.0;
      });
      [mLo, mHi, mMid].forEach((mk) => {
        mk.position.x += (mk.userData.tgt.x - mk.position.x) * 0.16;
        mk.position.y += (mk.userData.tgt.y - mk.position.y) * 0.16;
      });
    });

    goTo(0);
    return { steps, goTo, dispose: S.dispose };
  }
};
