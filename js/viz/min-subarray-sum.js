/* ============================================================
   Viz: Minimum Size Subarray Sum (LC 209)
   Value bars in a row plus a "sum tower" on the right with a
   fixed target marker. The right edge expands the window,
   stacking value onto the tower. The moment the tower reaches
   the target line it glows green, we record the window length,
   then the left edge contracts to hunt for a shorter window.
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["min-subarray-sum"] = {
  samples: [
    { label: "target 7 · [2,3,1,2,4,3]", target: 7, nums: [2, 3, 1, 2, 4, 3] },
    { label: "target 4 · [1,4,4]", target: 4, nums: [1, 4, 4] },
    { label: "target 11 · [1,1,1,1,1,1,1]", target: 11, nums: [1, 1, 1, 1, 1, 1, 1] },
    { label: "target 8 · [3,1,4,1,5,2]", target: 8, nums: [3, 1, 4, 1, 5, 2] }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const sample = this.samples[sampleIndex];
    const nums = sample.nums;
    const target = sample.target;
    const n = nums.length;

    const spacing = Math.min(2.0, 14 / n);
    const barW = Math.min(1.3, spacing * 0.82);
    const depth = 1.1;
    const maxV = Math.max(...nums, 1);
    const unit = 4.0 / maxV;
    const xAt = (i) => (i - (n - 1) / 2) * spacing - 2.0;
    const hAt = (v) => Math.max(0.4, v * unit);

    // ---- value bars ----
    const bars = [];
    nums.forEach((v, i) => {
      const h = hAt(v);
      const bar = DSAV.makeBar(barW, h, depth, C.bar);
      bar.position.set(xAt(i), h / 2, 0);
      bar.userData = {
        baseColor: new T.Color(C.bar),
        targetColor: new T.Color(C.bar),
        emissiveColor: new T.Color(0x000000),
        active: false
      };
      const vlab = DSAV.makeLabel(String(v), { fontSize: 52, color: "#fbf6ee", scale: 1.05 });
      vlab.position.set(0, h / 2 + 0.45, depth / 2);
      bar.add(vlab);
      S.world.add(bar);
      bars.push(bar);

      const idx = DSAV.makeLabel(String(i), { fontSize: 34, color: "#8f7a5e", scale: 0.72 });
      idx.position.set(xAt(i), 0.14, depth / 2 + 0.55);
      S.world.add(idx);
    });

    // ---- window box ----
    const winBox = new T.Mesh(
      new T.BoxGeometry(1, hAt(maxV) + 1.2, depth + 0.5),
      new T.MeshStandardMaterial({
        color: C.left, transparent: true, opacity: 0.14,
        roughness: 0.3, metalness: 0.1, emissive: C.left, emissiveIntensity: 0.16
      })
    );
    winBox.userData = { tgtX: 0, tgtW: 1 };
    winBox.visible = false;
    S.world.add(winBox);

    // ---- sum tower + target marker (to the right of the array) ----
    const towerX = xAt(n - 1) + spacing + 2.6;
    const sumUnit = 4.6 / Math.max(target * 1.4, maxV);
    const tower = new T.Mesh(
      new T.BoxGeometry(1.4, 1, 1.4),
      new T.MeshStandardMaterial({ color: C.water, roughness: 0.3, metalness: 0.2, emissive: C.water, emissiveIntensity: 0.15 })
    );
    tower.userData = { tgtH: 0.001, reached: false };
    tower.scale.y = 0.001;
    tower.position.set(towerX, 0, 0);
    S.world.add(tower);

    const targetY = target * sumUnit;
    const targetMark = new T.Mesh(
      new T.BoxGeometry(2.4, 0.12, 1.9),
      new T.MeshBasicMaterial({ color: 0xe6ad6b, transparent: true, opacity: 0.9 })
    );
    targetMark.position.set(towerX, targetY, 0);
    S.world.add(targetMark);
    const tgtTag = DSAV.makeLabel(`target ${target}`, { fontSize: 42, color: "#1c0d07", bg: "#e6ad6b", scale: 1.0, noDepth: true });
    tgtTag.position.set(towerX, targetY + 0.55, 0);
    S.world.add(tgtTag);
    const sumTag = DSAV.makeLabel("sum 0", { fontSize: 44, color: "#1c0d07", bg: DSAV.rgbHex(C.water), scale: 1.0, noDepth: true });
    sumTag.position.set(towerX, 0.4, 1.0);
    S.world.add(sumTag);

    // ---- pointers ----
    const zFront = depth / 2 + 1.0;
    const pL = DSAV.makePointer(C.left, "L");
    const pR = DSAV.makePointer(C.right, "R");
    [pL, pR].forEach((p) => { p.position.set(0, 0.55, zFront); p.userData.tgt = new T.Vector3(0, 0.55, zFront); S.world.add(p); });

    // ---- best readout ----
    const topY = Math.max(hAt(maxV), targetY) + 1.8;
    const bestLbl = DSAV.makeLabel("min len = —", { fontSize: 50, color: "#1c0d07", bg: DSAV.rgbHex(C.hot), scale: 1.15, noDepth: true });
    bestLbl.position.set(-2.0, topY, 0);
    S.world.add(bestLbl);

    S.controls.target.set(0, topY * 0.5, 0);
    S.camera.position.set(0, topY * 0.5 + 3.5, Math.max(15, n * 2.1));

    // ---- compute steps ----
    const INF = Infinity;
    const steps = [];
    let left = 0, sum = 0, best = INF, bestL = -1, bestR = -1;
    for (let right = 0; right < n; right++) {
      sum += nums[right];
      steps.push({ type: "expand", left, right, sum, best, bestL, bestR });
      while (sum >= target) {
        const len = right - left + 1;
        if (len < best) { best = len; bestL = left; bestR = right; }
        steps.push({ type: "valid", left, right, sum, len, best, bestL, bestR });
        sum -= nums[left];
        left++;
        steps.push({ type: "contract", left, right, sum, removed: nums[left - 1], best, bestL, bestR });
      }
    }
    steps.push({ type: "done", left, right: n - 1, sum, best, bestL, bestR });

    // ---- decorate ----
    steps.forEach((s) => {
      s.vars = [
        { k: "left", v: s.left },
        { k: "right", v: Math.max(0, Math.min(n - 1, s.right)) },
        { k: "sum", v: s.sum, cls: s.sum >= target ? "good" : "hot" },
        { k: "target", v: target },
        { k: "minLen", v: s.best === INF ? "∞" : s.best, cls: "good" }
      ];
      switch (s.type) {
        case "expand":
          s.note = `Grow right → add nums[${s.right}] = ${nums[s.right]}. Window sum is now <b>${s.sum}</b>` +
            (s.sum >= target ? ` — it reached the target!` : ` (still &lt; ${target}).`);
          break;
        case "valid":
          s.note = `sum ${s.sum} ≥ ${target}. This window [${s.left}..${s.right}] has length <b>${s.len}</b>.` +
            (s.len === s.best && s.bestR === s.right && s.bestL === s.left ? " New shortest — now try to trim it." : " Try to shrink further.");
          break;
        case "contract":
          s.note = `Drop nums[${s.left - 1}] = ${s.removed} from the left, <b>left++</b>. Sum falls to ${s.sum}` +
            (s.sum >= target ? " — still enough, keep shrinking." : ` — below ${target}, stop shrinking.`);
          break;
        case "done":
          s.note = s.best === INF
            ? `No window ever reached ${target}. Answer = <b>0</b>.`
            : `Shortest window with sum ≥ ${target} has length <b>${s.best}</b> → [${s.bestL}..${s.bestR}].`;
          s.results = [s.best === INF ? "min len = 0 (none)" : `min len = ${s.best}`];
          break;
      }
    });

    // ---- apply step ----
    function goTo(k) {
      const s = steps[k];
      const done = s.type === "done";
      const active = s.left <= s.right && !done;
      const reached = s.sum >= target;

      bars.forEach((b, i) => {
        let col = new T.Color(C.dim), em = 0x000000, act = false;
        if (active && i >= s.left && i <= s.right) {
          col = reached ? new T.Color(C.good) : new T.Color(C.hot);
          em = reached ? C.good : C.left; act = true;
        }
        if (s.type === "expand" && i === s.right) { em = C.right; act = true; }
        if (s.type === "contract" && i === s.left - 1) { em = C.bad; }
        b.userData.targetColor = col;
        b.userData.emissiveColor.set(em);
        b.userData.active = act;
      });

      winBox.visible = active;
      if (active) {
        winBox.userData.tgtX = (xAt(s.left) + xAt(s.right)) / 2;
        winBox.userData.tgtW = (s.right - s.left) * spacing + barW + 0.4;
        winBox.material.color.set(reached ? C.good : C.left);
        winBox.material.emissive.set(reached ? C.good : C.left);
      }

      tower.userData.tgtH = Math.max(0.001, s.sum * sumUnit);
      tower.userData.reached = reached;
      tower.material.color.set(reached ? C.good : C.water);
      tower.material.emissive.set(reached ? C.good : C.water);
      sumTag.userData.setText(`sum ${s.sum}`);

      pL.userData.tgt.set(xAt(Math.min(s.left, n - 1)), 0.55, zFront);
      pR.userData.tgt.set(xAt(Math.max(0, Math.min(n - 1, s.right))), 0.55, zFront);
      pL.visible = active; pR.visible = !done;

      bestLbl.userData.setText(s.best === INF ? "min len = —" : `min len = ${s.best}`);
    }

    // ---- tick ----
    S.onTick(() => {
      const t = performance.now() * 0.004;
      bars.forEach((b) => {
        const m = b.material;
        m.color.lerp(b.userData.targetColor, 0.13);
        m.emissive.lerp(new T.Color(b.userData.emissiveColor), 0.18);
        m.emissiveIntensity = b.userData.active ? (0.4 + Math.sin(t) * 0.2) : 0.0;
      });
      winBox.position.x += (winBox.userData.tgtX - winBox.position.x) * 0.16;
      winBox.scale.x += (winBox.userData.tgtW - winBox.scale.x) * 0.16;
      winBox.position.y = hAt(maxV) / 2;

      tower.scale.y += (tower.userData.tgtH - tower.scale.y) * 0.16;
      tower.position.y = tower.scale.y / 2;
      sumTag.position.y = tower.scale.y + 0.5;
      tower.material.emissiveIntensity = (tower.userData.reached ? 0.4 : 0.15) + Math.sin(t) * 0.06;

      DSAV.lerpToTarget(pL, 0.16);
      DSAV.lerpToTarget(pR, 0.16);
    });

    goTo(0);
    return { steps, goTo, dispose: S.dispose };
  }
};
