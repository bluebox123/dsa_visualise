/* ============================================================
   Viz: Subsets (LC 78)
   Elements sit in a row. A depth-first walk decides, element by
   element, whether to include it. Every node of that decision tree
   IS a subset, so we record the current selection (glowing green)
   at each node, then try adding each later element and un-choose on
   the way back. 2^n subsets fall out.
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["subsets"] = {
  samples: [
    { label: "[1,2,3]", nums: [1, 2, 3] },
    { label: "[5,7]", nums: [5, 7] },
    { label: "[1,2,3,4]", nums: [1, 2, 3, 4] }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const nums = this.samples[sampleIndex].nums;
    const n = nums.length;

    const spacing = Math.min(2.4, 13 / n);
    const xAt = (i) => (i - (n - 1) / 2) * spacing;

    const bars = [];
    nums.forEach((v, i) => {
      const bar = DSAV.makeBar(1.5, 1.0, 1.2, C.bar);
      bar.position.set(xAt(i), 0.5, 0);
      bar.userData = { targetColor: new T.Color(C.bar), emissiveColor: new T.Color(0x000000), active: false, baseY: 0.5 };
      S.world.add(bar);
      bars.push(bar);
      const lbl = DSAV.makeLabel(String(v), { fontSize: 54, color: "#1c0d07", scale: 1.0 });
      lbl.position.set(xAt(i), 0.5, 0.62); S.world.add(lbl);
    });

    const curLbl = DSAV.makeLabel("subset = [ ]", { fontSize: 44, color: "#1c0d07", bg: DSAV.rgbHex(C.hot), scale: 1.1, noDepth: true });
    curLbl.position.set(0, 3.4, 0);
    S.world.add(curLbl);
    S.controls.target.set(0, 1.4, 0);
    S.camera.position.set(0, 3.5, Math.max(13, n * 3));

    // ---- DFS (start-index): every node records a subset ----
    const steps = [];
    const results = [];
    (function dfs(start, cur) {
      results.push(cur.map((i) => nums[i]));
      steps.push({ action: "record", chosen: [...cur], hi: -1, resultsSnap: results.map((r) => "[" + r.join(",") + "]") });
      for (let i = start; i < n; i++) {
        cur.push(i);
        steps.push({ action: "choose", chosen: [...cur], hi: i, resultsSnap: results.map((r) => "[" + r.join(",") + "]") });
        dfs(i + 1, cur);
        cur.pop();
        steps.push({ action: "unchoose", chosen: [...cur], hi: i, resultsSnap: results.map((r) => "[" + r.join(",") + "]") });
      }
    })(0, []);
    steps.push({ action: "done", chosen: [], hi: -1, resultsSnap: results.map((r) => "[" + r.join(",") + "]") });

    steps.forEach((s) => {
      const subset = s.chosen.map((i) => nums[i]);
      s.vars = [
        { k: "subset", v: "[" + subset.join(",") + "]" },
        { k: "found", v: s.resultsSnap.length, cls: "good" }
      ];
      switch (s.action) {
        case "record": s.note = "Record the current selection <b>[" + subset.join(", ") + "]</b> as a subset (every node of the tree counts)."; break;
        case "choose": s.note = "Include element <b>" + nums[s.hi] + "</b> and recurse on the elements after it."; break;
        case "unchoose": s.note = "Backtrack: remove <b>" + nums[s.hi] + "</b> so we can explore the next branch."; break;
        case "done": s.note = "All <b>" + s.resultsSnap.length + "</b> = 2^" + n + " subsets generated."; break;
      }
      s.results = s.resultsSnap;
    });

    function goTo(k) {
      const s = steps[k];
      const chosenSet = new Set(s.chosen);
      const record = s.action === "record";
      bars.forEach((bar, i) => {
        let col = C.bar, em = 0x000000, active = false, y = 0.5;
        if (chosenSet.has(i)) { col = C.good; y = 0.9; active = record; if (record) em = C.good; }
        if (i === s.hi) { em = s.action === "unchoose" ? C.bad : C.hot; active = true; }
        bar.userData.targetColor.set(col);
        bar.userData.emissiveColor.set(em);
        bar.userData.active = active;
        bar.userData.baseY = y;
      });
      const subset = s.chosen.map((i) => nums[i]);
      curLbl.userData.setText("subset = [" + subset.join(",") + "]");
    }

    S.onTick(() => {
      const t = performance.now() * 0.004;
      bars.forEach((bar) => {
        const m = bar.material;
        m.color.lerp(bar.userData.targetColor, 0.16);
        m.emissive.lerp(bar.userData.emissiveColor, 0.2);
        m.emissiveIntensity = bar.userData.active ? (0.45 + Math.sin(t) * 0.2) : 0.0;
        bar.position.y += (bar.userData.baseY - bar.position.y) * 0.18;
      });
    });

    goTo(0);
    return { steps, goTo, dispose: S.dispose };
  }
};
