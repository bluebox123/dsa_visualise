/* ============================================================
   Viz: Coin Change (LC 322)
   A row of amount cells 0..amount. dp[a] = fewest coins to make a.
   We fill left to right: for amount a we try every coin c and ask
   "make (a - c) then add one coin" - dp[a] = min(dp[a-c] + 1). The
   winning source cell dp[a-c] lights amber. Cells that stay
   unreachable keep an X; dp[amount] is the answer (or -1).
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["coin-change"] = {
  samples: [
    { label: "coins [1,2,5] amount 11", coins: [1, 2, 5], amount: 11 },
    { label: "coins [2] amount 3 (-1)", coins: [2], amount: 3 },
    { label: "coins [1,3,4] amount 6", coins: [1, 3, 4], amount: 6 }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const cfg = this.samples[sampleIndex];
    const coins = cfg.coins, amount = cfg.amount, INF = Infinity;

    const dp = new Array(amount + 1).fill(INF);
    dp[0] = 0;
    const bestCoin = new Array(amount + 1).fill(-1);
    for (let a = 1; a <= amount; a++) {
      for (const c of coins) {
        if (c <= a && dp[a - c] + 1 < dp[a]) { dp[a] = dp[a - c] + 1; bestCoin[a] = c; }
      }
    }

    const spacing = Math.min(1.7, 15 / (amount + 1));
    const xAt = (a) => (a - amount / 2) * spacing;

    const cells = [];
    for (let a = 0; a <= amount; a++) {
      const cell = DSAV.makeBar(spacing * 0.82, 0.55, 1.2, C.dim);
      cell.position.set(xAt(a), 0.28, 0);
      cell.userData = { targetColor: new T.Color(C.dim), emissiveColor: new T.Color(0x000000), active: false };
      S.world.add(cell);
      cells.push(cell);
      const idx = DSAV.makeLabel(String(a), { fontSize: 26, color: "#8f7a5e", scale: 0.5 });
      idx.position.set(xAt(a), -0.15, 0.7); S.world.add(idx);
      const val = DSAV.makeLabel("", { fontSize: 38, color: "#fbf6ee", scale: 0.8 });
      val.position.set(xAt(a), 0.95, 0.7); S.world.add(val);
      cell.userData.valLbl = val;
    }

    const banner = DSAV.makeLabel("coins [" + coins.join(",") + "]  ->  " + amount, { fontSize: 36, color: "#1c0d07", bg: DSAV.rgbHex(C.hot), scale: 1.0, noDepth: true });
    banner.position.set(0, 2.9, 0);
    S.world.add(banner);
    S.controls.target.set(0, 0.6, 0);
    S.camera.position.set(0, 4, Math.max(15, amount * 1.7));

    // ---- steps ----
    const steps = [];
    steps.push({ a: 0, source: -1, filled: 1, init: true });
    for (let a = 1; a <= amount; a++) steps.push({ a, source: bestCoin[a] >= 0 ? a - bestCoin[a] : -1, coin: bestCoin[a], filled: a + 1 });
    steps.push({ a: -1, source: -1, filled: amount + 1, done: true });

    steps.forEach((s) => {
      s.vars = [
        { k: "amount a", v: s.a < 0 ? "-" : s.a },
        { k: "dp[a]", v: s.a < 0 ? (dp[amount] === INF ? "inf" : dp[amount]) : (dp[s.a] === INF ? "inf" : dp[s.a]), cls: "good" },
        { k: "dp[" + amount + "]", v: dp[amount] === INF ? "-1" : dp[amount], cls: "hot" }
      ];
      if (s.init) s.note = "Base case: <b>dp[0] = 0</b> - zero coins make amount 0. Everything else starts unreachable (infinity).";
      else if (s.done) { s.note = dp[amount] === INF ? "Amount " + amount + " can't be formed by these coins - return <b>-1</b>." : "Fewest coins for " + amount + " is <b>" + dp[amount] + "</b>."; s.results = [dp[amount] === INF ? "-1 (impossible)" : dp[amount] + " coins"]; }
      else if (dp[s.a] === INF) s.note = "Amount " + s.a + ": no coin lands on a reachable smaller amount - stays unreachable.";
      else s.note = "dp[" + s.a + "] = dp[" + (s.a - s.coin) + "] + 1 (add coin " + s.coin + ") = <b>" + dp[s.a] + "</b>.";
    });

    function goTo(k) {
      const s = steps[k];
      cells.forEach((cell, a) => {
        const isFilled = a < s.filled;
        let col = C.dim, em = 0x000000, active = false;
        if (isFilled) {
          col = dp[a] === INF ? C.dim : C.bar;
          cell.userData.valLbl.userData.setText(dp[a] === INF ? "X" : String(dp[a]));
        } else cell.userData.valLbl.userData.setText("");
        if (a === s.source) { col = C.left; em = C.left; active = true; }
        if (a === s.a) { col = dp[a] === INF ? C.bad : C.good; em = dp[a] === INF ? C.bad : C.hot; active = true; }
        cell.userData.targetColor.set(col);
        cell.userData.emissiveColor.set(em);
        cell.userData.active = active;
      });
      if (s.done && dp[amount] !== INF) { cells[amount].userData.targetColor.set(C.good); cells[amount].userData.emissiveColor.set(C.good); cells[amount].userData.active = true; }
      banner.userData.setText(s.done ? (dp[amount] === INF ? "impossible (-1)" : "answer = " + dp[amount]) : "coins [" + coins.join(",") + "]  ->  " + amount);
    }

    S.onTick(() => {
      const t = performance.now() * 0.004;
      cells.forEach((cell) => {
        const m = cell.material;
        m.color.lerp(cell.userData.targetColor, 0.16);
        m.emissive.lerp(cell.userData.emissiveColor, 0.2);
        m.emissiveIntensity = cell.userData.active ? (0.45 + Math.sin(t) * 0.2) : 0.0;
      });
    });

    goTo(0);
    return { steps, goTo, dispose: S.dispose };
  }
};
