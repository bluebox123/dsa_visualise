/* ============================================================
   Viz: Permutations (LC 46)
   Elements sit in a row. A DFS builds an ordering: at each depth it
   picks any UNUSED element (used ones glow, greyed), recurses, then
   un-picks on the way back. When the ordering uses all n elements we
   record it. The choose / recurse / un-choose rhythm is backtracking.
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["permutations"] = {
  samples: [
    { label: "[1,2,3]", nums: [1, 2, 3] },
    { label: "[7,8]", nums: [7, 8] },
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
      bar.userData = { targetColor: new T.Color(C.bar), emissiveColor: new T.Color(0x000000), active: false };
      S.world.add(bar);
      bars.push(bar);
      const lbl = DSAV.makeLabel(String(v), { fontSize: 54, color: "#1c0d07", scale: 1.0 });
      lbl.position.set(xAt(i), 0.5, 0.62); S.world.add(lbl);
    });

    const curLbl = DSAV.makeLabel("perm = [ ]", { fontSize: 44, color: "#1c0d07", bg: DSAV.rgbHex(C.hot), scale: 1.1, noDepth: true });
    curLbl.position.set(0, 3.4, 0);
    S.world.add(curLbl);
    S.controls.target.set(0, 1.4, 0);
    S.camera.position.set(0, 3.5, Math.max(13, n * 3));

    // ---- DFS with a used[] set ----
    const steps = [];
    const results = [];
    const used = new Array(n).fill(false);
    (function dfs(cur) {
      if (cur.length === n) {
        results.push(cur.map((i) => nums[i]));
        steps.push({ action: "record", chosen: [...cur], used: [...used], hi: -1, resultsSnap: results.map((r) => "[" + r.join(",") + "]") });
        return;
      }
      for (let i = 0; i < n; i++) {
        if (used[i]) continue;
        used[i] = true; cur.push(i);
        steps.push({ action: "choose", chosen: [...cur], used: [...used], hi: i, resultsSnap: results.map((r) => "[" + r.join(",") + "]") });
        dfs(cur);
        used[i] = false; cur.pop();
        steps.push({ action: "unchoose", chosen: [...cur], used: [...used], hi: i, resultsSnap: results.map((r) => "[" + r.join(",") + "]") });
      }
    })([]);
    steps.push({ action: "done", chosen: [], used: new Array(n).fill(false), hi: -1, resultsSnap: results.map((r) => "[" + r.join(",") + "]") });

    steps.forEach((s) => {
      const perm = s.chosen.map((i) => nums[i]);
      s.vars = [
        { k: "perm", v: "[" + perm.join(",") + "]" },
        { k: "found", v: s.resultsSnap.length, cls: "good" }
      ];
      switch (s.action) {
        case "record": s.note = "All " + n + " elements used - record permutation <b>[" + perm.join(", ") + "]</b>."; break;
        case "choose": s.note = "Pick unused element <b>" + nums[s.hi] + "</b> for the next slot, then recurse."; break;
        case "unchoose": s.note = "Backtrack: free <b>" + nums[s.hi] + "</b> so a different element can take that slot."; break;
        case "done": s.note = "All <b>" + s.resultsSnap.length + "</b> = " + n + "! permutations generated."; break;
      }
      s.results = s.resultsSnap;
    });

    function goTo(k) {
      const s = steps[k];
      const chosenSet = new Set(s.chosen);
      const record = s.action === "record";
      bars.forEach((bar, i) => {
        let col = C.bar, em = 0x000000, active = false;
        if (s.used[i]) { col = C.right; active = true; }        // used in current path
        if (chosenSet.has(i) && record) { col = C.good; em = C.good; }
        if (i === s.hi) { em = s.action === "unchoose" ? C.bad : C.hot; active = true; }
        bar.userData.targetColor.set(col);
        bar.userData.emissiveColor.set(em);
        bar.userData.active = active;
      });
      const perm = s.chosen.map((i) => nums[i]);
      curLbl.userData.setText("perm = [" + perm.join(",") + "]");
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
