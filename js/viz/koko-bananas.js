/* ============================================================
   Viz: Koko Eating Bananas (LC 875)
   "Binary search on the answer." The bars are banana piles. Above
   them floats a speed axis running from 1 to max(pile); lo / mid /
   hi markers ride along it. For the candidate speed = mid we show
   the trips each pile costs (ceil(pile/mid)); their sum is the
   hours. Feasible (hours ≤ H) → try slower (hi = mid); too slow →
   go faster (lo = mid + 1). We converge on the smallest feasible
   speed.
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["koko-bananas"] = {
  samples: [
    { label: "piles=[3,6,7,11] H=8", piles: [3, 6, 7, 11], h: 8 },
    { label: "piles=[30,11,23,4,20] H=5", piles: [30, 11, 23, 4, 20], h: 5 },
    { label: "piles=[30,11,23,4,20] H=6", piles: [30, 11, 23, 4, 20], h: 6 },
    { label: "piles=[312,250,124,7] H=24", piles: [312, 250, 124, 7], h: 24 }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const data = this.samples[sampleIndex];
    const piles = data.piles, H = data.h, n = piles.length;

    const spacing = Math.min(2.6, 15 / n);
    const depth = 1.2;
    const maxPile = Math.max(...piles);
    const unit = 4.6 / maxPile;
    const xAt = (i) => (i - (n - 1) / 2) * spacing;
    const hAt = (v) => Math.max(0.4, v * unit);

    // ---- pile bars + trip labels ----
    const bars = [], trips = [];
    piles.forEach((v, i) => {
      const h = hAt(v);
      const bar = DSAV.makeBar(1.5, h, depth, C.hot);
      bar.position.set(xAt(i), h / 2, 0);
      bar.userData = { targetColor: new T.Color(C.hot), emissiveColor: new T.Color(0x000000), active: false };
      S.world.add(bar);
      bars.push(bar);

      const val = DSAV.makeLabel(String(v), { fontSize: 48, color: "#fbf6ee", scale: 1.0 });
      val.position.set(xAt(i), h + 0.45, depth / 2);
      S.world.add(val);

      const trip = DSAV.makeLabel("", { fontSize: 42, color: "#1c0d07", bg: DSAV.rgbHex(C.anchor), scale: 0.9, noDepth: true });
      trip.position.set(xAt(i), h + 1.25, depth / 2);
      trip.visible = false;
      S.world.add(trip);
      trips.push(trip);
    });

    // ---- speed axis ----
    const axisY = maxPile * unit + 2.6;
    const halfW = Math.max(6, (n - 1) * spacing / 2 + 1);
    const axis = DSAV.makeBar(halfW * 2, 0.14, 0.14, C.grid);
    axis.position.set(0, axisY, 0);
    S.world.add(axis);
    const speedToX = (s) => (maxPile <= 1 ? 0 : ((s - 1) / (maxPile - 1)) * (halfW * 2) - halfW);

    const axLblL = DSAV.makeLabel("speed 1", { fontSize: 34, color: "#b6a184", scale: 0.75 });
    axLblL.position.set(-halfW, axisY + 0.6, 0);
    S.world.add(axLblL);
    const axLblR = DSAV.makeLabel(`${maxPile}`, { fontSize: 34, color: "#b6a184", scale: 0.75 });
    axLblR.position.set(halfW, axisY + 0.6, 0);
    S.world.add(axLblR);

    const mkMark = (color, label) => {
      const g = new T.Group();
      const cone = new T.Mesh(new T.ConeGeometry(0.28, 0.6, 20),
        new T.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.35, roughness: 0.4 }));
      cone.rotation.x = Math.PI; // point up toward axis
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
    const mMid = mkMark(C.anchor, "mid");
    mMid.position.y = axisY - 1.3;

    const hoursLbl = DSAV.makeLabel(`H = ${H}`, { fontSize: 46, color: "#1c0d07", bg: DSAV.rgbHex(C.hot), scale: 1.05, noDepth: true });
    hoursLbl.position.set(0, axisY + 1.7, 0);
    S.world.add(hoursLbl);

    S.controls.target.set(0, axisY * 0.55, 0);
    S.camera.position.set(0, axisY * 0.6 + 2, Math.max(16, n * 2.4));

    const hoursAt = (speed) => piles.reduce((a, p) => a + Math.ceil(p / speed), 0);

    // ---- steps ----
    const steps = [];
    let lo = 1, hi = maxPile, guard = 0;
    steps.push({ type: "init", lo, hi, mid: -1 });
    while (lo < hi && guard++ < 200) {
      const mid = (lo + hi) >> 1;
      const hours = hoursAt(mid);
      const feasible = hours <= H;
      steps.push({ type: "probe", lo, hi, mid, hours, feasible });
      if (feasible) hi = mid; else lo = mid + 1;
      steps.push({ type: "move", lo, hi, mid, hours, feasible });
    }
    steps.push({ type: "found", lo, hi, mid: lo, hours: hoursAt(lo), feasible: true });

    steps.forEach((s) => {
      s.vars = [
        { k: "lo", v: s.lo },
        { k: "hi", v: s.hi },
        { k: "mid", v: s.mid >= 0 ? s.mid : "—" },
        { k: "hours", v: s.hours !== undefined ? s.hours : "—", cls: s.feasible ? "good" : "hot" },
        { k: "H", v: H }
      ];
      switch (s.type) {
        case "init": s.note = `We can't scan every speed. Binary-search the speed in [1, ${maxPile}]: slower is always safer, so feasibility is monotonic.`; break;
        case "probe":
          s.note = `Try speed <b>${s.mid}</b>: total hours = Σ⌈pile/${s.mid}⌉ = <b>${s.hours}</b>. ` +
            (s.feasible ? `${s.hours} ≤ H=${H} → fast enough, maybe we can go slower.` : `${s.hours} &gt; H=${H} → too slow, must speed up.`);
          break;
        case "move":
          s.note = s.feasible ? `Feasible — shrink upper bound: <b>hi = mid = ${s.hi}</b>.` : `Infeasible — raise the floor: <b>lo = mid + 1 = ${s.lo}</b>.`;
          break;
        case "found":
          s.note = `lo meets hi. The slowest speed Koko can finish in ${H} hours is <b>${s.lo}</b> bananas/hour.`;
          s.results = [`speed = ${s.lo}`, `hours = ${s.hours}`];
          break;
      }
    });

    function goTo(k) {
      const s = steps[k];
      const done = s.type === "found";
      const showTrips = s.type === "probe" || done;
      bars.forEach((bar, i) => {
        let col = new T.Color(C.hot), em = 0x000000, active = false;
        if (showTrips && s.mid >= 1) { active = true; em = s.feasible ? 0x1c3313 : 0x3a1508; }
        bar.userData.targetColor = col;
        bar.userData.emissiveColor.set(em);
        bar.userData.active = active;
        const tr = trips[i];
        if (showTrips && s.mid >= 1) {
          tr.visible = true;
          tr.userData.setText(`${Math.ceil(piles[i] / s.mid)}h`);
        } else tr.visible = false;
      });

      mLo.userData.tgt.set(speedToX(s.lo), axisY - 0.5, 0);
      mHi.userData.tgt.set(speedToX(s.hi), axisY - 0.5, 0);
      mLo.visible = !done; mHi.visible = !done;
      if (s.mid >= 1 && !done) {
        mMid.visible = true;
        mMid.userData.tgt.set(speedToX(s.mid), axisY - 1.3, 0);
        mMid.children[0].material.color.set(s.feasible ? C.good : C.bad);
        mMid.children[0].material.emissive.set(s.feasible ? C.good : C.bad);
      } else mMid.visible = false;

      hoursLbl.userData.setText(done ? `answer speed = ${s.lo}` : (s.hours !== undefined ? `${s.hours} hrs  (H=${H})` : `H = ${H}`));
    }

    S.onTick(() => {
      const t = performance.now() * 0.004;
      bars.forEach((bar) => {
        const m = bar.material;
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
