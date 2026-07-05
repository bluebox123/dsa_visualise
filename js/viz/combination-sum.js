/* ============================================================
   Viz: Combination Sum (LC 39)
   Candidate values sit in a row. A DFS builds a running combination
   (each candidate may be reused), tracking the remaining target. If
   remain hits 0 we record the combination; if it drops below 0 we
   overshoot and prune. A start index stops us re-counting the same
   multiset in a different order.
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["combination-sum"] = {
  samples: [
    { label: "[2,3,6,7]  t=7", cands: [2, 3, 6, 7], target: 7 },
    { label: "[2,3,5]  t=8", cands: [2, 3, 5], target: 8 },
    { label: "[2,4]  t=6", cands: [2, 4], target: 6 }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const cfg = this.samples[sampleIndex];
    const cands = cfg.cands, target = cfg.target, n = cands.length;

    const spacing = Math.min(2.4, 12 / n);
    const xAt = (i) => (i - (n - 1) / 2) * spacing;

    const bars = [];
    cands.forEach((v, i) => {
      const bar = DSAV.makeBar(1.5, 1.0, 1.2, C.bar);
      bar.position.set(xAt(i), 0.5, 0);
      bar.userData = { targetColor: new T.Color(C.bar), emissiveColor: new T.Color(0x000000), active: false };
      S.world.add(bar);
      bars.push(bar);
      const lbl = DSAV.makeLabel(String(v), { fontSize: 52, color: "#1c0d07", scale: 1.0 });
      lbl.position.set(xAt(i), 0.5, 0.62); S.world.add(lbl);
    });

    const remainLbl = DSAV.makeLabel("remain = " + target, { fontSize: 46, color: "#1c0d07", bg: DSAV.rgbHex(C.hot), scale: 1.15, noDepth: true });
    remainLbl.position.set(0, 3.6, 0);
    S.world.add(remainLbl);
    const curLbl = DSAV.makeLabel("combo = [ ]", { fontSize: 38, color: "#fbf6ee", scale: 0.95 });
    curLbl.position.set(0, 2.5, 0);
    S.world.add(curLbl);
    S.controls.target.set(0, 1.6, 0);
    S.camera.position.set(0, 3.6, Math.max(13, n * 3.2));

    // ---- DFS with reuse + start index ----
    const steps = [];
    const results = [];
    const MAX = 900;
    (function dfs(start, cur, remain) {
      if (steps.length > MAX) return;
      if (remain === 0) {
        results.push(cur.map((i) => cands[i]));
        steps.push({ action: "found", chosen: [...cur], hi: -1, remain, resultsSnap: results.map((r) => "[" + r.join(",") + "]") });
        return;
      }
      if (remain < 0) {
        steps.push({ action: "overshoot", chosen: [...cur], hi: cur.length ? cur[cur.length - 1] : -1, remain, resultsSnap: results.map((r) => "[" + r.join(",") + "]") });
        return;
      }
      for (let i = start; i < n; i++) {
        cur.push(i);
        steps.push({ action: "choose", chosen: [...cur], hi: i, remain: remain - cands[i], resultsSnap: results.map((r) => "[" + r.join(",") + "]") });
        dfs(i, cur, remain - cands[i]);
        cur.pop();
        steps.push({ action: "backtrack", chosen: [...cur], hi: i, remain, resultsSnap: results.map((r) => "[" + r.join(",") + "]") });
      }
    })(0, [], target);
    steps.push({ action: "done", chosen: [], hi: -1, remain: 0, resultsSnap: results.map((r) => "[" + r.join(",") + "]") });

    steps.forEach((s) => {
      const combo = s.chosen.map((i) => cands[i]);
      s.vars = [
        { k: "combo", v: "[" + combo.join(",") + "]" },
        { k: "remain", v: s.remain, cls: s.remain === 0 ? "good" : (s.remain < 0 ? "bad" : "hot") },
        { k: "found", v: s.resultsSnap.length, cls: "good" }
      ];
      switch (s.action) {
        case "choose": s.note = "Add <b>" + cands[s.hi] + "</b> (reuse allowed). Remaining target is now " + s.remain + "."; break;
        case "found": s.note = "remain hit <b>0</b> - record combination <b>[" + combo.join(", ") + "]</b>."; break;
        case "overshoot": s.note = "remain went <b>negative</b> - this branch overshoots, prune and back out."; break;
        case "backtrack": s.note = "Backtrack: drop <b>" + cands[s.hi] + "</b> and try the next candidate."; break;
        case "done": s.note = "Search complete - <b>" + s.resultsSnap.length + "</b> combination(s) sum to " + target + "."; break;
      }
      s.results = s.resultsSnap;
    });

    function goTo(k) {
      const s = steps[k];
      const counts = new Array(n).fill(0);
      s.chosen.forEach((i) => counts[i]++);
      bars.forEach((bar, i) => {
        let col = C.bar, em = 0x000000, active = false;
        if (counts[i] > 0) { col = C.good; active = true; }
        if (i === s.hi) { em = (s.action === "backtrack" || s.action === "overshoot") ? C.bad : C.hot; active = true; }
        bar.userData.targetColor.set(col);
        bar.userData.emissiveColor.set(em);
        bar.userData.active = active;
      });
      const combo = s.chosen.map((i) => cands[i]);
      curLbl.userData.setText("combo = [" + combo.join(",") + "]");
      remainLbl.userData.setText("remain = " + s.remain);
    }

    S.onTick(() => {
      const t = performance.now() * 0.004;
      bars.forEach((bar) => {
        const m = bar.material;
        m.color.lerp(bar.userData.targetColor, 0.16);
        m.emissive.lerp(bar.userData.emissiveColor, 0.2);
        m.emissiveIntensity = bar.userData.active ? (0.4 + Math.sin(t) * 0.2) : 0.0;
      });
    });

    goTo(0);
    return { steps, goTo, dispose: S.dispose };
  }
};
