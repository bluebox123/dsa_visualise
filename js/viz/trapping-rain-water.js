/* ============================================================
   Viz: Trapping Rain Water (LC 42)
   An elevation map of solid bars. Two pointers L / R converge.
   Two glowing planes track the running leftMax and rightMax.
   Whenever the shorter side is a valley, translucent water
   fills that cell up to its bounding max. Total water tallies
   in the floating readout.
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["trapping-rain-water"] = {
  samples: [
    { label: "[0,1,0,2,1,0,1,3,2,1,2,1]", height: [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1] },
    { label: "[4,2,0,3,2,5]", height: [4, 2, 0, 3, 2, 5] },
    { label: "[3,0,2,0,4]", height: [3, 0, 2, 0, 4] },
    { label: "[2,1,0,1,3]", height: [2, 1, 0, 1, 3] }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const height = this.samples[sampleIndex].height;
    const n = height.length;

    const spacing = Math.min(1.9, 15 / n);
    const barW = Math.min(1.2, spacing * 0.84);
    const depth = 1.1;
    const maxH = Math.max(...height, 1);
    const unit = 5.0 / maxH;
    const xAt = (i) => (i - (n - 1) / 2) * spacing;
    const hAt = (v) => Math.max(0.06, v * unit);

    // ---- terrain bars ----
    const bars = [];
    height.forEach((v, i) => {
      const h = hAt(v);
      const bar = DSAV.makeBar(barW, h, depth, C.bar);
      bar.position.set(xAt(i), h / 2, 0);
      bar.userData = {
        baseColor: new T.Color(C.bar),
        targetColor: new T.Color(C.bar),
        emissiveColor: new T.Color(0x000000),
        active: false, topY: h
      };
      const vlab = DSAV.makeLabel(String(v), { fontSize: 48, color: "#fbf6ee", scale: 0.98 });
      vlab.position.set(0, h / 2 + 0.42, depth / 2);
      bar.add(vlab);
      S.world.add(bar);
      bars.push(bar);

      const idx = DSAV.makeLabel(String(i), { fontSize: 34, color: "#8f7a5e", scale: 0.72 });
      idx.position.set(xAt(i), 0.14, depth / 2 + 0.55);
      S.world.add(idx);
    });

    // ---- water columns (one per cell) ----
    const waters = [];
    height.forEach((v, i) => {
      const w = new T.Mesh(
        new T.BoxGeometry(barW * 0.92, 1, depth * 0.82),
        new T.MeshStandardMaterial({
          color: C.water, transparent: true, opacity: 0.55,
          roughness: 0.12, metalness: 0.25, emissive: C.water, emissiveIntensity: 0.16
        })
      );
      w.userData = { tgtH: 0, baseY: hAt(v) };
      w.scale.y = 0.001;
      w.position.set(xAt(i), hAt(v), 0);
      w.visible = false;
      S.world.add(w);
      waters.push(w);
    });

    // ---- leftMax / rightMax marker slabs ----
    function marker(color) {
      const m = new T.Mesh(
        new T.BoxGeometry(1, 0.1, depth * 1.3),
        new T.MeshBasicMaterial({ color, transparent: true, opacity: 0.55 })
      );
      m.userData = { tgtY: 0.02, tgtX: 0, tgtW: 1 };
      m.visible = false;
      S.world.add(m);
      return m;
    }
    const lMark = marker(C.left);
    const rMark = marker(C.right);
    const lTag = DSAV.makeLabel("leftMax", { fontSize: 38, color: "#1c0d07", bg: DSAV.rgbHex(C.left), scale: 0.85, noDepth: true });
    const rTag = DSAV.makeLabel("rightMax", { fontSize: 38, color: "#1c0d07", bg: DSAV.rgbHex(C.right), scale: 0.85, noDepth: true });
    lTag.visible = false; rTag.visible = false;
    S.world.add(lTag); S.world.add(rTag);

    // ---- pointers ----
    const zFront = depth / 2 + 1.0;
    const pL = DSAV.makePointer(C.left, "L");
    const pR = DSAV.makePointer(C.right, "R");
    [pL, pR].forEach((p) => { p.position.set(0, 0.55, zFront); p.userData.tgt = new T.Vector3(0, 0.55, zFront); S.world.add(p); });

    // ---- total-water readout ----
    const topY = maxH * unit + 1.5;
    const waterLbl = DSAV.makeLabel("water = 0", { fontSize: 50, color: "#1c0d07", bg: DSAV.rgbHex(C.water), scale: 1.15, noDepth: true });
    waterLbl.position.set(0, topY, 0);
    S.world.add(waterLbl);

    S.controls.target.set(0, topY * 0.42, 0);
    S.camera.position.set(0, topY * 0.55 + 3, Math.max(15, n * 1.9));

    // ---- compute steps ----
    const steps = [];
    let l = 0, r = n - 1, lm = 0, rm = 0, water = 0;
    const snap = new Array(n).fill(0);
    steps.push({ type: "init", l, r, lm, rm, water, snap: snap.slice() });
    let guard = 0;
    while (l < r && guard++ < 400) {
      if (height[l] < height[r]) {
        if (height[l] >= lm) { lm = height[l]; steps.push({ type: "lwall", cell: l, l, r, lm, rm, water, snap: snap.slice() }); }
        else { const add = lm - height[l]; water += add; snap[l] = add; steps.push({ type: "lfill", cell: l, add, l, r, lm, rm, water, snap: snap.slice() }); }
        l++;
      } else {
        if (height[r] >= rm) { rm = height[r]; steps.push({ type: "rwall", cell: r, l, r, lm, rm, water, snap: snap.slice() }); }
        else { const add = rm - height[r]; water += add; snap[r] = add; steps.push({ type: "rfill", cell: r, add, l, r, lm, rm, water, snap: snap.slice() }); }
        r--;
      }
    }
    steps.push({ type: "done", l, r, lm, rm, water, snap: snap.slice() });

    // ---- decorate ----
    steps.forEach((s) => {
      s.vars = [
        { k: "left", v: Math.max(0, Math.min(n - 1, s.l)) },
        { k: "right", v: Math.max(0, Math.min(n - 1, s.r)) },
        { k: "leftMax", v: s.lm },
        { k: "rightMax", v: s.rm },
        { k: "water", v: s.water, cls: "good" }
      ];
      switch (s.type) {
        case "init":
          s.note = "Two fingers at the ends. leftMax / rightMax start at 0. The shorter side always moves inward — it's the one whose fate is already sealed.";
          break;
        case "lwall":
          s.note = `Left side is shorter. height[${s.cell}] = ${height[s.cell]} ≥ leftMax → new <b>leftMax = ${s.lm}</b>. A wall this tall holds no water itself.`;
          break;
        case "rwall":
          s.note = `Right side is shorter. height[${s.cell}] = ${height[s.cell]} ≥ rightMax → new <b>rightMax = ${s.rm}</b>. No water on the tallest-so-far.`;
          break;
        case "lfill":
          s.note = `Left is shorter and is a valley. leftMax(${s.lm}) − height[${s.cell}](${height[s.cell]}) = <b>+${s.add}</b> water trapped here. Total ${s.water}.`;
          break;
        case "rfill":
          s.note = `Right is shorter and is a valley. rightMax(${s.rm}) − height[${s.cell}](${height[s.cell]}) = <b>+${s.add}</b> water trapped here. Total ${s.water}.`;
          break;
        case "done":
          s.note = `Pointers met. Total rain trapped = <b>${s.water}</b>.`;
          s.results = [`water = ${s.water}`];
          break;
      }
    });

    // ---- apply step ----
    function goTo(k) {
      const s = steps[k];
      const li = Math.max(0, Math.min(n - 1, s.l));
      const ri = Math.max(0, Math.min(n - 1, s.r));
      const done = s.type === "done";

      bars.forEach((b, bi) => {
        let em = 0x000000, active = false, col = b.userData.baseColor;
        if (!done && bi === li) { em = C.left; active = true; }
        else if (!done && bi === ri) { em = C.right; active = true; }
        else if (bi < li || bi > ri) col = new T.Color(C.dim);
        if ((s.type === "lfill" || s.type === "rfill") && bi === s.cell) { em = C.water; active = true; }
        b.userData.targetColor = (col instanceof T.Color) ? col : new T.Color(col);
        b.userData.emissiveColor.set(em);
        b.userData.active = active;
      });

      // water columns from snapshot
      waters.forEach((w, wi) => {
        const wh = s.snap[wi] * unit;
        w.userData.tgtH = wh;
        w.visible = wh > 0.001;
      });

      // markers
      lMark.visible = s.lm > 0;
      lMark.userData.tgtY = hAt(s.lm);
      lMark.userData.tgtX = (xAt(0) + xAt(li)) / 2 - spacing * 0.1;
      lMark.userData.tgtW = Math.max(barW, xAt(li) - xAt(0) + barW);
      lTag.visible = s.lm > 0;
      lTag.position.set(xAt(0) - spacing * 0.2, hAt(s.lm) + 0.35, depth);

      rMark.visible = s.rm > 0;
      rMark.userData.tgtY = hAt(s.rm);
      rMark.userData.tgtX = (xAt(ri) + xAt(n - 1)) / 2 + spacing * 0.1;
      rMark.userData.tgtW = Math.max(barW, xAt(n - 1) - xAt(ri) + barW);
      rTag.visible = s.rm > 0;
      rTag.position.set(xAt(n - 1) + spacing * 0.2, hAt(s.rm) + 0.35, depth);

      pL.userData.tgt.set(xAt(li), 0.55, zFront);
      pR.userData.tgt.set(xAt(ri), 0.55, zFront);
      pL.visible = !done; pR.visible = !done;

      waterLbl.userData.setText(done ? `total water = ${s.water}` : `water = ${s.water}`);
    }

    // ---- tick ----
    S.onTick(() => {
      const t = performance.now() * 0.004;
      bars.forEach((b) => {
        const m = b.material;
        m.color.lerp(b.userData.targetColor, 0.12);
        m.emissive.lerp(b.userData.emissiveColor, 0.18);
        m.emissiveIntensity = b.userData.active ? (0.4 + Math.sin(t) * 0.2) : 0.0;
      });
      waters.forEach((w) => {
        w.scale.y += (Math.max(0.001, w.userData.tgtH) - w.scale.y) * 0.16;
        w.position.y = w.userData.baseY + w.scale.y / 2;
        w.material.emissiveIntensity = 0.16 + Math.sin(t) * 0.05;
      });
      [lMark, rMark].forEach((m) => {
        m.position.y += (m.userData.tgtY - m.position.y) * 0.16;
        m.position.x += (m.userData.tgtX - m.position.x) * 0.16;
        m.scale.x += (m.userData.tgtW - m.scale.x) * 0.16;
      });
      DSAV.lerpToTarget(pL, 0.16);
      DSAV.lerpToTarget(pR, 0.16);
    });

    goTo(0);
    return { steps, goTo, dispose: S.dispose };
  }
};
