/* ============================================================
   Viz: Two Sum (LC 1)
   Value bars. We scan left→right keeping a hash map of every
   value already seen (those bars glow faintly green — "in the
   map"). For each new value x we look for its complement
   target − x: a copper ghost marker floats at the needed value.
   The instant that complement is already in the map, a bridge
   snaps between the two bars and turns green — answer found in
   one pass.
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["two-sum"] = {
  samples: [
    { label: "[2,7,11,15]  t=9", nums: [2, 7, 11, 15], target: 9 },
    { label: "[3,2,4]  t=6", nums: [3, 2, 4], target: 6 },
    { label: "[3,3]  t=6", nums: [3, 3], target: 6 },
    { label: "[4,1,9,2,7]  t=11", nums: [4, 1, 9, 2, 7], target: 11 }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const data = this.samples[sampleIndex];
    const nums = data.nums, target = data.target, n = nums.length;

    const spacing = Math.min(2.3, 15 / n);
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
      bar.userData = { targetColor: new T.Color(C.bar), emissiveColor: new T.Color(0x000000), active: false, h };
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
    const pCur = DSAV.makePointer(C.left, "i");
    pCur.position.y = 0.55; pCur.userData.tgt = new T.Vector3(0, 0.55, zFront);
    S.world.add(pCur);

    // bridge connecting a matched pair
    const bridgeH = maxAbs * unit + 1.4;
    const bridge = DSAV.makeBar(1, 0.16, 0.16, C.good);
    bridge.material.transparent = true; bridge.material.opacity = 0.9; bridge.material.metalness = 0.4;
    bridge.position.set(0, bridgeH, 0);
    bridge.userData = { tgtX: 0, tgtW: 0.4 };
    bridge.visible = false;
    S.world.add(bridge);

    const topLbl = DSAV.makeLabel(`target = ${target}`, { fontSize: 48, color: "#1c0d07", bg: DSAV.rgbHex(C.hot), scale: 1.1, noDepth: true });
    topLbl.position.set(0, bridgeH + 0.7, 0);
    S.world.add(topLbl);

    S.controls.target.set(0, bridgeH * 0.45, 0);
    S.camera.position.set(0, bridgeH * 0.55 + 3, Math.max(15, n * 2.2));

    // ---- steps ----
    const steps = [];
    const seen = new Map();               // value -> index
    for (let i = 0; i < n; i++) {
      const x = nums[i], comp = target - x;
      const inMap = [...seen.values()];
      const hit = seen.has(comp);
      steps.push({ type: "probe", i, comp, hit, j: hit ? seen.get(comp) : -1, inMap });
      if (hit) { steps.push({ type: "found", i, j: seen.get(comp), inMap }); break; }
      seen.set(x, i);
      steps.push({ type: "add", i, inMap: [...seen.values()] });
    }
    if (steps.length && steps[steps.length - 1].type !== "found") {
      steps.push({ type: "done", i: n - 1, inMap: [...seen.values()] });
    }

    steps.forEach((s) => {
      const x = s.i >= 0 ? nums[s.i] : "—";
      s.vars = [
        { k: "i", v: s.i },
        { k: "nums[i]", v: x },
        { k: "need", v: s.type === "done" ? "—" : (target - nums[s.i]), cls: "hot" },
        { k: "map.size", v: s.inMap.length },
        { k: "target", v: target }
      ];
      switch (s.type) {
        case "probe":
          s.note = `At index ${s.i}, value ${nums[s.i]}. Complement = ${target} − ${nums[s.i]} = <b>${s.comp}</b>. ` +
            (s.hit ? `It's already in the map (index ${s.j}) — match!` : `Not in the map yet.`);
          break;
        case "add":
          s.note = `Store <b>${nums[s.i]} → ${s.i}</b> in the map so future values can find it, then move on.`;
          break;
        case "found":
          s.note = `<b>nums[${s.j}] + nums[${s.i}] = ${nums[s.j]} + ${nums[s.i]} = ${target}</b>. Return the two indices.`;
          s.results = [`[${s.j}, ${s.i}]`];
          break;
        case "done":
          s.note = `Scanned everything with no complement ever present — no pair sums to ${target}.`;
          s.results = [`no pair`];
          break;
      }
    });

    function goTo(k) {
      const s = steps[k];
      const inMapSet = new Set(s.inMap);
      const found = s.type === "found";
      bars.forEach((bar, i) => {
        let col = new T.Color(C.bar), em = 0x000000, active = false;
        if (inMapSet.has(i)) { col = new T.Color(C.bar); em = 0x1c3313; active = true; }  // in map: faint green
        if (i === s.i && !found && s.type !== "done") { col = new T.Color(C.left); em = C.left; active = true; }
        if (found && (i === s.i || i === s.j)) { col = new T.Color(C.good); em = C.good; active = true; }
        bar.userData.targetColor = col;
        bar.userData.emissiveColor.set(em);
        bar.userData.active = active;
      });

      pCur.visible = s.type !== "done" && !found;
      pCur.userData.tgt.set(xAt(Math.max(0, s.i)), 0.55, zFront);

      if (found) {
        bridge.visible = true;
        const cx = (xAt(s.i) + xAt(s.j)) / 2;
        bridge.userData.tgtX = cx;
        bridge.userData.tgtW = Math.max(0.4, Math.abs(xAt(s.i) - xAt(s.j)));
      } else bridge.visible = false;
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
      bridge.position.x += (bridge.userData.tgtX - bridge.position.x) * 0.16;
      bridge.scale.x += (bridge.userData.tgtW - bridge.scale.x) * 0.16;
    });

    goTo(0);
    return { steps, goTo, dispose: S.dispose };
  }
};
