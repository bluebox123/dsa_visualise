/* ============================================================
   Viz: Find Median from Data Stream (LC 295)
   Two columns of value tiles: LOW (max-heap, left, sorted desc
   top-to-bottom) and HIGH (min-heap, right, sorted asc top-to-
   bottom). Each new number is added then rebalanced so the two
   piles differ in size by at most 1 and every low value ≤ every
   high value. The median reads off the top of the taller pile
   (or the average of both tops when equal size).
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["median-data-stream"] = {
  samples: [
    { label: "stream: 5, 2, 3, 8", nums: [5, 2, 3, 8] },
    { label: "stream: 1, 2, 3, 4, 5", nums: [1, 2, 3, 4, 5] },
    { label: "stream: 6, 10, 2, 6, 5, 0", nums: [6, 10, 2, 6, 5, 0] },
    { label: "stream: -1, -2, -3, -4", nums: [-1, -2, -3, -4] }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const nums = this.samples[sampleIndex].nums, n = nums.length;

    const tileW = 1.6, tileH = 0.9, depth = 1.0;
    const laneGap = 2.4;
    const lowX = -laneGap, highX = laneGap;

    const lowTiles = [], highTiles = [];
    for (let i = 0; i < n; i++) {
      const lt = DSAV.makeBar(tileW, tileH, depth, C.left);
      lt.visible = false;
      const lg = DSAV.makeLabel("", { fontSize: 50, color: "#1c0d07", scale: 1.0 });
      lg.position.set(0, 0, depth / 2 + 0.01); lt.add(lg); lt.glyph = lg;
      S.world.add(lt); lowTiles.push(lt);

      const ht = DSAV.makeBar(tileW, tileH, depth, C.right);
      ht.visible = false;
      const hg = DSAV.makeLabel("", { fontSize: 50, color: "#1c0d07", scale: 1.0 });
      hg.position.set(0, 0, depth / 2 + 0.01); ht.add(hg); ht.glyph = hg;
      S.world.add(ht); highTiles.push(ht);
    }

    const lowLbl = DSAV.makeLabel("LOW (max-heap)", { fontSize: 34, color: "#8f7a5e", scale: 0.72 });
    lowLbl.position.set(lowX, -0.8, 0.7);
    S.world.add(lowLbl);
    const highLbl = DSAV.makeLabel("HIGH (min-heap)", { fontSize: 34, color: "#8f7a5e", scale: 0.72 });
    highLbl.position.set(highX, -0.8, 0.7);
    S.world.add(highLbl);

    const topY = (tileH + 0.15) * (Math.ceil(n / 2) + 1) + 1.5;
    const medLbl = DSAV.makeLabel("median = —", { fontSize: 46, color: "#1c0d07", bg: DSAV.rgbHex(C.good), scale: 1.05, noDepth: true });
    medLbl.position.set(0, topY, 0);
    S.world.add(medLbl);

    S.controls.target.set(0, topY * 0.4, 0);
    S.camera.position.set(0, topY * 0.5 + 3, Math.max(14, n * 1.6 + 6));

    // ---- steps: two-heap simulate with sorted arrays ----
    const steps = [];
    let low = [], high = []; // low sorted desc (low[0] max), high sorted asc (high[0] min)
    const median = () => {
      if (low.length === high.length) return low.length ? (low[0] + high[0]) / 2 : null;
      return low.length > high.length ? low[0] : high[0];
    };
    for (let i = 0; i < n; i++) {
      const v = nums[i];
      let target;
      if (!low.length || v <= low[0]) { low.push(v); low.sort((a, b) => b - a); target = "low"; }
      else { high.push(v); high.sort((a, b) => a - b); target = "high"; }
      steps.push({ type: "insert", i, v, target, low: [...low], high: [...high] });

      // rebalance
      if (low.length > high.length + 1) {
        const moved = low.shift();
        high.push(moved); high.sort((a, b) => a - b);
        steps.push({ type: "rebalance", i, moved, from: "low", low: [...low], high: [...high] });
      } else if (high.length > low.length + 1) {
        const moved = high.shift();
        low.push(moved); low.sort((a, b) => b - a);
        steps.push({ type: "rebalance", i, moved, from: "high", low: [...low], high: [...high] });
      }
      steps.push({ type: "median", i, med: median(), low: [...low], high: [...high] });
    }
    steps.push({ type: "done", med: median(), low: [...low], high: [...high] });

    steps.forEach((s) => {
      s.vars = [
        { k: "value", v: s.v !== undefined ? s.v : "—" },
        { k: "low (max-heap)", v: `[${s.low.join(", ")}]` },
        { k: "high (min-heap)", v: `[${s.high.join(", ")}]` },
        { k: "median", v: s.med !== undefined && s.med !== null ? s.med : "—", cls: "good" }
      ];
      switch (s.type) {
        case "insert": s.note = `${s.v} ${s.target === "low" ? "≤ low's max" : "&gt; low's max"} → goes into the <b>${s.target.toUpperCase()}</b> pile.`; break;
        case "rebalance": s.note = `Piles are unbalanced (differ by &gt;1) — move <b>${s.moved}</b> from ${s.from.toUpperCase()} to the other side.`; break;
        case "median": s.note = `Piles balanced. Median is ${s.low.length === s.high.length ? "the average of both tops" : "the top of the bigger pile"}: <b>${s.med}</b>.`; break;
        case "done": s.note = `Stream processed. Final median: <b>${s.med}</b>.`; s.results = [`median = ${s.med}`]; break;
      }
    });

    function layout(pile, tiles, x) {
      tiles.forEach((t, idx) => {
        if (idx < pile.length) {
          t.visible = true;
          t.glyph.userData.setText(String(pile[idx]));
          t.userData.tgtY = 0.5 + idx * (tileH + 0.15);
          t.position.x = x;
        } else t.visible = false;
      });
    }

    function goTo(k) {
      const s = steps[k];
      layout(s.low, lowTiles, lowX);
      layout(s.high, highTiles, highX);
      lowTiles.forEach((t, i) => { t.userData.emphasize = (i === 0 && s.low.length > 0 && (s.type === "median" || s.type === "done")); });
      highTiles.forEach((t, i) => { t.userData.emphasize = (i === 0 && s.high.length > 0 && (s.type === "median" || s.type === "done")); });
      medLbl.userData.setText(s.med !== undefined && s.med !== null ? `median = ${s.med}` : "median = —");
    }

    S.onTick(() => {
      const t = performance.now() * 0.004;
      [...lowTiles, ...highTiles].forEach((tile) => {
        if (!tile.visible) return;
        if (tile.userData.tgtY !== undefined) tile.position.y += (tile.userData.tgtY - tile.position.y) * 0.2;
        const m = tile.material;
        const emph = tile.userData.emphasize;
        m.emissiveIntensity = emph ? (0.35 + Math.sin(t) * 0.2) : 0.0;
        m.emissive.set(emph ? C.good : 0x000000);
      });
    });

    goTo(0);
    return { steps, goTo, dispose: S.dispose };
  }
};
