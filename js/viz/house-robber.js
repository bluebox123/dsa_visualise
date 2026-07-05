/* ============================================================
   Viz: House Robber (LC 198)
   Houses in a row, bar height = money inside. You can't rob two
   adjacent houses. dp[i] = best loot considering houses 0..i, and at
   each house you either SKIP it (keep dp[i-1]) or ROB it
   (nums[i] + dp[i-2]). The larger option wins; at the end we trace
   back which houses were actually robbed (they glow green).
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["house-robber"] = {
  samples: [
    { label: "[2,7,9,3,1]", nums: [2, 7, 9, 3, 1] },
    { label: "[1,2,3,1]", nums: [1, 2, 3, 1] },
    { label: "[5,1,1,5]", nums: [5, 1, 1, 5] },
    { label: "[2,1,1,2,6,1]", nums: [2, 1, 1, 2, 6, 1] }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const nums = this.samples[sampleIndex].nums;
    const n = nums.length;

    const dp = new Array(n).fill(0);
    dp[0] = nums[0];
    if (n > 1) dp[1] = Math.max(nums[0], nums[1]);
    for (let i = 2; i < n; i++) dp[i] = Math.max(dp[i - 1], nums[i] + dp[i - 2]);

    // trace robbed houses
    const robbed = new Set();
    let i = n - 1;
    while (i >= 0) {
      if (i === 0) { robbed.add(0); break; }
      if (i === 1) { robbed.add(nums[1] >= nums[0] ? 1 : 0); break; }
      if (dp[i] === nums[i] + dp[i - 2]) { robbed.add(i); i -= 2; } else { i -= 1; }
    }

    const maxV = Math.max(...nums, 1);
    const spacing = Math.min(2.3, 14 / n);
    const xAt = (i) => (i - (n - 1) / 2) * spacing;
    const hAt = (v) => 0.5 + (v / maxV) * 3.2;

    const bars = [];
    nums.forEach((v, i) => {
      const h = hAt(v);
      const bar = DSAV.makeBar(1.4, h, 1.2, C.bar);
      bar.position.set(xAt(i), h / 2, 0);
      bar.userData = { targetColor: new T.Color(C.bar), emissiveColor: new T.Color(0x000000), active: false };
      S.world.add(bar);
      bars.push(bar);
      const val = DSAV.makeLabel("$" + v, { fontSize: 40, color: "#fbf6ee", scale: 0.85 });
      val.position.set(xAt(i), h + 0.4, 0.7); S.world.add(val);
      const dl = DSAV.makeLabel("", { fontSize: 30, color: "#8bbf7a", scale: 0.62 });
      dl.position.set(xAt(i), 0.25, 0.75); S.world.add(dl);
      bar.userData.dpLbl = dl;
    });

    const banner = DSAV.makeLabel("max loot = ?", { fontSize: 42, color: "#1c0d07", bg: DSAV.rgbHex(C.hot), scale: 1.0, noDepth: true });
    banner.position.set(0, hAt(maxV) + 1.6, 0);
    S.world.add(banner);
    S.controls.target.set(0, hAt(maxV) * 0.5, 0);
    S.camera.position.set(0, hAt(maxV) * 0.5 + 3, Math.max(14, n * 2.6));

    // ---- steps ----
    const steps = [];
    steps.push({ i: 0, filled: 1, from: [], base: true });
    if (n > 1) steps.push({ i: 1, filled: 2, from: [0], base: true });
    for (let k = 2; k < n; k++) {
      const rob = nums[k] + dp[k - 2], skip = dp[k - 1];
      steps.push({ i: k, filled: k + 1, from: [k - 1, k - 2], rob, skip, choseRob: dp[k] === rob });
    }
    steps.push({ i: -1, filled: n, from: [], done: true });

    steps.forEach((s) => {
      s.vars = [
        { k: "house i", v: s.i < 0 ? "-" : s.i },
        { k: "dp[i]", v: s.i < 0 ? dp[n - 1] : dp[s.i], cls: "good" },
        { k: "best so far", v: s.i < 0 ? dp[n - 1] : dp[s.i], cls: "hot" }
      ];
      if (s.done) { s.note = "Best achievable loot without robbing adjacent houses is <b>$" + dp[n - 1] + "</b>. Robbed houses glow green."; s.results = ["max = $" + dp[n - 1]]; }
      else if (s.base) s.note = s.i === 0 ? "dp[0] = $" + nums[0] + " (only one house to consider)." : "dp[1] = max($" + nums[0] + ", $" + nums[1] + ") = $" + dp[1] + ".";
      else s.note = "House " + s.i + ": ROB ($" + nums[s.i] + " + dp[" + (s.i - 2) + "]=$" + s.rob + ") vs SKIP (dp[" + (s.i - 1) + "]=$" + s.skip + ") -> <b>" + (s.choseRob ? "rob, $" + s.rob : "skip, $" + s.skip) + "</b>.";
    });

    function goTo(k) {
      const s = steps[k];
      const fromSet = new Set(s.from);
      const showRobbed = !!s.done;
      bars.forEach((bar, i) => {
        const isFilled = i < s.filled;
        let col = C.bar, em = 0x000000, active = false;
        if (isFilled) { bar.userData.dpLbl.userData.setText("dp=" + dp[i]); } else bar.userData.dpLbl.userData.setText("");
        if (fromSet.has(i)) { col = C.left; em = C.left; active = true; }
        if (i === s.i) { col = C.hot; em = C.hot; active = true; }
        if (showRobbed && robbed.has(i)) { col = C.good; em = C.good; active = true; }
        bar.userData.targetColor.set(col);
        bar.userData.emissiveColor.set(em);
        bar.userData.active = active;
      });
      banner.userData.setText(s.done ? "max loot = $" + dp[n - 1] : "building dp...");
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
