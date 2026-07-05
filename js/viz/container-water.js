/* ============================================================
   Viz: Container With Most Water (LC 11)
   Vertical walls. Translucent water fills between the two
   pointers (height = the shorter wall). A copper wireframe
   marks the best area found so far. Shorter wall moves inward.
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["container-water"] = {
  samples: [
    { label: "[1,8,6,2,5,4,8,3,7]", height: [1, 8, 6, 2, 5, 4, 8, 3, 7] },
    { label: "[1,1]", height: [1, 1] },
    { label: "[4,3,2,1,4]", height: [4, 3, 2, 1, 4] },
    { label: "[2,3,10,5,7,8,9]", height: [2, 3, 10, 5, 7, 8, 9] }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const height = this.samples[sampleIndex].height;
    const n = height.length;

    const spacing = Math.min(2.1, 15 / n);
    const depth = 1.1;
    const maxH = Math.max(...height, 1);
    const unit = 5.0 / maxH;
    const xAt = (i) => (i - (n - 1) / 2) * spacing;
    const hAt = (v) => Math.max(0.4, v * unit);

    // ---- walls ----
    const walls = [];
    height.forEach((v, i) => {
      const h = hAt(v);
      const bar = DSAV.makeBar(0.8, h, depth, C.bar);
      bar.position.set(xAt(i), h / 2, 0);
      bar.userData = {
        baseColor: new T.Color(C.bar),
        targetColor: new T.Color(C.bar),
        emissiveColor: new T.Color(0x000000),
        active: false, h
      };
      const vlab = DSAV.makeLabel(String(v), { fontSize: 52, color: "#fbf6ee", scale: 1.05 });
      vlab.position.set(0, h / 2 + 0.45, depth / 2);
      bar.add(vlab);
      S.world.add(bar);
      walls.push(bar);

      const idx = DSAV.makeLabel(String(i), { fontSize: 36, color: "#8f7a5e", scale: 0.78 });
      idx.position.set(xAt(i), 0.16, depth / 2 + 0.55);
      S.world.add(idx);
    });

    // ---- water (unit box, scaled) ----
    const water = new T.Mesh(
      new T.BoxGeometry(1, 1, depth * 0.82),
      new T.MeshStandardMaterial({
        color: C.water, transparent: true, opacity: 0.5,
        roughness: 0.15, metalness: 0.2, emissive: C.water, emissiveIntensity: 0.12
      })
    );
    water.userData = { tgtX: 0, tgtW: 1, tgtH: 1 };
    S.world.add(water);

    // ---- best-area ghost (wireframe) ----
    const ghost = new T.Mesh(
      new T.BoxGeometry(1, 1, depth * 0.9),
      new T.MeshBasicMaterial({ color: C.hot, wireframe: true, transparent: true, opacity: 0.7 })
    );
    ghost.userData = { tgtX: 0, tgtW: 1, tgtH: 1 };
    ghost.visible = false;
    S.world.add(ghost);

    // ---- pointers ----
    const zFront = depth / 2 + 1.0;
    const pL = DSAV.makePointer(C.left, "L");
    const pR = DSAV.makePointer(C.right, "R");
    [pL, pR].forEach((p) => { p.position.set(0, 0.55, zFront); p.userData.tgt = new T.Vector3(0, 0.55, zFront); S.world.add(p); });

    // ---- area readout ----
    const areaH = maxH * unit + 1.4;
    const areaLbl = DSAV.makeLabel("area = 0000", { fontSize: 50, color: "#1c0d07", bg: "#5aa9c4", scale: 1.15, noDepth: true });
    areaLbl.position.set(0, areaH, 0);
    S.world.add(areaLbl);

    S.controls.target.set(0, areaH * 0.42, 0);
    S.camera.position.set(0, areaH * 0.55 + 3, Math.max(15, n * 2.0));

    // ---- compute steps ----
    const steps = [];
    let l = 0, r = n - 1, max = 0, bestL = 0, bestR = n - 1;
    steps.push({ type: "init", l, r, max: 0, bestL, bestR });
    let guard = 0;
    while (l < r && guard++ < 200) {
      const hh = Math.min(height[l], height[r]);
      const area = hh * (r - l);
      if (area > max) { max = area; bestL = l; bestR = r; }
      steps.push({ type: "compare", l, r, area, max, bestL, bestR });
      if (height[l] < height[r]) { l++; steps.push({ type: "move", l, r, moved: "left", max, bestL, bestR }); }
      else { r--; steps.push({ type: "move", l, r, moved: "right", max, bestL, bestR }); }
    }
    steps.push({ type: "done", l, r, max, bestL, bestR });

    steps.forEach((s, si) => {
      const hh = Math.min(height[s.l], height[s.r]);
      const area = hh * (s.r - s.l);
      s.vars = [
        { k: "left", v: s.l },
        { k: "right", v: s.r },
        { k: "width", v: s.r - s.l },
        { k: "area", v: area, cls: "hot" },
        { k: "max", v: s.max, cls: "good" }
      ];
      switch (s.type) {
        case "init": s.note = "Start at the widest possible pair — the two ends."; break;
        case "compare":
          s.note = `Water height = min(${height[s.l]}, ${height[s.r]}) = <b>${hh}</b>, width ${s.r - s.l} → area <b>${area}</b>.` +
            (area === s.max ? " New best!" : ` Best so far ${s.max}.`);
          break;
        case "move": {
          const prev = steps[si - 1];
          s.note = s.moved === "left"
            ? `Left wall (${height[prev.l]}) was the shorter → <b>left++</b>. Moving the taller one can't help.`
            : `Right wall (${height[prev.r]}) was the shorter → <b>right--</b>. Chase a taller wall on the bottleneck side.`;
          break;
        }
        case "done": s.note = `Pointers met. Largest container area = <b>${s.max}</b>.`; s.results = [`max area = ${s.max}`]; break;
      }
    });

    // ---- apply step ----
    function goTo(k) {
      const s = steps[k];
      const li = s.l, ri = s.r;
      const hh = Math.min(height[li], height[ri]);
      const done = s.type === "done";

      walls.forEach((w, wi) => {
        let em = 0x000000, col = w.userData.baseColor, active = false;
        if (wi === li) { em = C.left; active = true; }
        else if (wi === ri) { em = C.right; active = true; }
        else if (wi < li || wi > ri) col = new T.Color(C.dim);
        w.userData.targetColor = (col instanceof T.Color) ? col : new T.Color(col);
        w.userData.emissiveColor.set(em);
        w.userData.active = active;
      });

      pL.userData.tgt.set(xAt(li), 0.55, zFront);
      pR.userData.tgt.set(xAt(ri), 0.55, zFront);

      const cx = (xAt(li) + xAt(ri)) / 2;
      const w = Math.max(0.2, xAt(ri) - xAt(li));
      water.userData.tgtX = cx;
      water.userData.tgtW = w;
      water.userData.tgtH = Math.max(0.05, hAt(hh));
      water.visible = !done && li < ri;

      const bh = Math.min(height[s.bestL], height[s.bestR]);
      ghost.userData.tgtX = (xAt(s.bestL) + xAt(s.bestR)) / 2;
      ghost.userData.tgtW = Math.max(0.2, xAt(s.bestR) - xAt(s.bestL));
      ghost.userData.tgtH = Math.max(0.05, hAt(bh));
      ghost.visible = s.max > 0;

      const area = hh * (ri - li);
      areaLbl.position.x = cx;
      areaLbl.userData.setText(done ? `max = ${s.max}` : `area = ${area}`);
    }

    // ---- tick ----
    S.onTick(() => {
      const t = performance.now() * 0.004;
      walls.forEach((w) => {
        const m = w.material;
        m.color.lerp(w.userData.targetColor, 0.12);
        m.emissive.lerp(w.userData.emissiveColor, 0.18);
        m.emissiveIntensity = w.userData.active ? (0.45 + Math.sin(t) * 0.22) : 0.0;
      });
      DSAV.lerpToTarget(pL, 0.16);
      DSAV.lerpToTarget(pR, 0.16);
      lerpBox(water, 0.16);
      lerpBox(ghost, 0.16);
      water.material.emissiveIntensity = 0.12 + Math.sin(t) * 0.05;
    });

    function lerpBox(box, sp) {
      box.position.x += (box.userData.tgtX - box.position.x) * sp;
      box.scale.x += (box.userData.tgtW - box.scale.x) * sp;
      box.scale.y += (box.userData.tgtH - box.scale.y) * sp;
      box.position.y += (box.scale.y / 2 - box.position.y) * sp;
    }

    goTo(0);
    return { steps, goTo, dispose: S.dispose };
  }
};
