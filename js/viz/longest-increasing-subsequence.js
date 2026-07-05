/* ============================================================
   Viz: Longest Increasing Subsequence (LC 300)
   Value bars. dp[i] = length of the longest increasing subsequence
   ENDING at i. For each i we look back at every earlier bar j that is
   shorter (nums[j] < nums[i]) and inherit its best chain: dp[i] =
   max(dp[j]) + 1. The best predecessor lights amber; at the end the
   winning chain glows green.
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["longest-increasing-subsequence"] = {
  samples: [
    { label: "[10,9,2,5,3,7,101,18]", nums: [10, 9, 2, 5, 3, 7, 101, 18] },
    { label: "[0,1,0,3,2,3]", nums: [0, 1, 0, 3, 2, 3] },
    { label: "[7,7,7,7]", nums: [7, 7, 7, 7] },
    { label: "[4,10,4,3,8,9]", nums: [4, 10, 4, 3, 8, 9] }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const nums = this.samples[sampleIndex].nums;
    const n = nums.length;

    const dp = new Array(n).fill(1);
    const prev = new Array(n).fill(-1);
    for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) {
      if (nums[j] < nums[i] && dp[j] + 1 > dp[i]) { dp[i] = dp[j] + 1; prev[i] = j; }
    }
    let bestI = 0; for (let i = 1; i < n; i++) if (dp[i] > dp[bestI]) bestI = i;
    const chain = new Set(); { let c = bestI; while (c >= 0) { chain.add(c); c = prev[c]; } }

    const maxV = Math.max(...nums.map((v) => Math.abs(v)), 1);
    const spacing = Math.min(2.2, 15 / n);
    const xAt = (i) => (i - (n - 1) / 2) * spacing;
    const hAt = (v) => 0.5 + (Math.abs(v) / maxV) * 3.2;

    const bars = [];
    nums.forEach((v, i) => {
      const h = hAt(v);
      const bar = DSAV.makeBar(1.35, h, 1.2, C.bar);
      bar.position.set(xAt(i), h / 2, 0);
      bar.userData = { targetColor: new T.Color(C.bar), emissiveColor: new T.Color(0x000000), active: false };
      S.world.add(bar);
      bars.push(bar);
      const val = DSAV.makeLabel(String(v), { fontSize: 40, color: "#fbf6ee", scale: 0.82 });
      val.position.set(xAt(i), h + 0.4, 0.7); S.world.add(val);
      const dl = DSAV.makeLabel("", { fontSize: 30, color: "#8bbf7a", scale: 0.62 });
      dl.position.set(xAt(i), 0.25, 0.75); S.world.add(dl);
      bar.userData.dpLbl = dl;
    });

    const banner = DSAV.makeLabel("LIS length = ?", { fontSize: 42, color: "#1c0d07", bg: DSAV.rgbHex(C.hot), scale: 1.0, noDepth: true });
    banner.position.set(0, hAt(maxV) + 1.5, 0);
    S.world.add(banner);
    S.controls.target.set(0, hAt(maxV) * 0.5, 0);
    S.camera.position.set(0, hAt(maxV) * 0.5 + 3, Math.max(14, n * 2.6));

    // ---- steps ----
    const steps = [];
    for (let i = 0; i < n; i++) steps.push({ i, from: prev[i], filled: i + 1 });
    steps.push({ i: -1, from: -1, filled: n, done: true });

    steps.forEach((s) => {
      s.vars = [
        { k: "i", v: s.i < 0 ? "-" : s.i },
        { k: "dp[i]", v: s.i < 0 ? dp[bestI] : dp[s.i], cls: "good" },
        { k: "best LIS", v: dp[bestI], cls: "hot" }
      ];
      if (s.done) { s.note = "Longest increasing subsequence has length <b>" + dp[bestI] + "</b> (chain glows green)."; s.results = ["length = " + dp[bestI]]; }
      else if (s.from < 0) s.note = "Bar " + s.i + " (value " + nums[s.i] + "): no shorter bar precedes it, so dp[" + s.i + "] = 1.";
      else s.note = "Bar " + s.i + " (value " + nums[s.i] + ") extends the chain ending at bar " + s.from + " (value " + nums[s.from] + "): dp[" + s.i + "] = dp[" + s.from + "] + 1 = <b>" + dp[s.i] + "</b>.";
    });

    function goTo(k) {
      const s = steps[k];
      const showChain = !!s.done;
      bars.forEach((bar, i) => {
        const isFilled = i < s.filled;
        let col = C.bar, em = 0x000000, active = false;
        if (isFilled) bar.userData.dpLbl.userData.setText("dp=" + dp[i]); else bar.userData.dpLbl.userData.setText("");
        if (i === s.from) { col = C.left; em = C.left; active = true; }
        if (i === s.i) { col = C.hot; em = C.hot; active = true; }
        if (showChain && chain.has(i)) { col = C.good; em = C.good; active = true; }
        bar.userData.targetColor.set(col);
        bar.userData.emissiveColor.set(em);
        bar.userData.active = active;
      });
      banner.userData.setText(s.done ? "LIS length = " + dp[bestI] : "building dp...");
    }

    S.onTick(() => {
      const t = performance.now() * 0.004;
      bars.forEach((bar) => {
        const m = bar.material;
        m.color.lerp(bar.userData.targetColor, 0.16);
        m.emissive.lerp(bar.userData.emissiveColor, 0.2);
        m.emissiveIntensity = bar.userData.active ? (0.45 + Math.sin(t) * 0.2) : 0.0;
      });
    });

    goTo(0);
    return { steps, goTo, dispose: S.dispose };
  }
};
