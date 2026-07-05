/* ============================================================
   Viz: N-Queens (LC 51)
   An n x n board. We place one queen per row, left to right. Before
   placing, a candidate square is checked against the column and both
   diagonals already occupied (attacked squares glow red). A safe
   square gets a queen (green); a dead row backtracks and lifts the
   last queen. Every time all n rows are filled we bank a solution.
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["n-queens"] = {
  samples: [
    { label: "n = 4 (2 solutions)", n: 4 },
    { label: "n = 5 (10 solutions)", n: 5 },
    { label: "n = 6 (4 solutions)", n: 6 }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const n = this.samples[sampleIndex].n;

    const cellSize = Math.min(1.8, 13 / n);
    const xAt = (c) => (c - (n - 1) / 2) * cellSize;
    const zAt = (r) => (r - (n - 1) / 2) * cellSize;
    const LIGHT = new T.Color(0x5a2c19), DARK = new T.Color(0x381a0f);

    const tiles = [];
    for (let r = 0; r < n; r++) {
      tiles.push([]);
      for (let c = 0; c < n; c++) {
        const base = (r + c) % 2 === 0 ? LIGHT : DARK;
        const tile = DSAV.makeBar(cellSize * 0.94, 0.3, cellSize * 0.94, base.getHex());
        tile.position.set(xAt(c), 0.15, zAt(r));
        tile.userData = { targetColor: base.clone(), emissiveColor: new T.Color(0x000000), active: false, base: base.clone() };
        S.world.add(tile);
        tiles[r].push(tile);
      }
    }

    // queen markers (one per row, repositioned/hidden as we go)
    const queens = [];
    for (let r = 0; r < n; r++) {
      const q = new T.Mesh(new T.ConeGeometry(cellSize * 0.3, cellSize * 0.85, 20),
        new T.MeshStandardMaterial({ color: C.hot, roughness: 0.35, metalness: 0.4, emissive: C.hot, emissiveIntensity: 0.3 }));
      q.visible = false;
      S.world.add(q);
      queens.push(q);
    }

    const banner = DSAV.makeLabel("solutions = 0", { fontSize: 42, color: "#1c0d07", bg: DSAV.rgbHex(C.hot), scale: 1.0, noDepth: true });
    banner.position.set(0, 4.6, 0);
    S.world.add(banner);
    S.controls.target.set(0, 0.3, 0);
    S.camera.position.set(0, n * 1.7 + 3, n * 1.7 + 4);

    // ---- backtracking search ----
    const steps = [];
    const solutions = [];
    const colsUsed = new Set(), d1 = new Set(), d2 = new Set();
    const placement = new Array(n).fill(-1);
    const MAX = 1600;

    (function dfs(row) {
      if (steps.length > MAX) return;
      if (row === n) {
        solutions.push([...placement]);
        steps.push({ action: "solution", row: -1, col: -1, placement: [...placement], count: solutions.length });
        return;
      }
      for (let col = 0; col < n; col++) {
        if (steps.length > MAX) return;
        const attacked = colsUsed.has(col) || d1.has(row - col) || d2.has(row + col);
        steps.push({ action: attacked ? "conflict" : "try", row, col, placement: [...placement], count: solutions.length });
        if (attacked) continue;
        colsUsed.add(col); d1.add(row - col); d2.add(row + col); placement[row] = col;
        steps.push({ action: "place", row, col, placement: [...placement], count: solutions.length });
        dfs(row + 1);
        colsUsed.delete(col); d1.delete(row - col); d2.delete(row + col); placement[row] = -1;
        steps.push({ action: "remove", row, col, placement: [...placement], count: solutions.length });
      }
    })(0);
    steps.push({ action: "done", row: -1, col: -1, placement: new Array(n).fill(-1), count: solutions.length });

    steps.forEach((s) => {
      const placed = s.placement.filter((x) => x >= 0).length;
      s.vars = [
        { k: "queens placed", v: placed + " / " + n },
        { k: "solutions", v: s.count, cls: "good" }
      ];
      switch (s.action) {
        case "try": s.note = "Row " + s.row + ": square (" + s.row + "," + s.col + ") is safe from every placed queen - try it."; break;
        case "conflict": s.note = "Row " + s.row + ", column " + s.col + " is attacked (same column or diagonal) - skip."; break;
        case "place": s.note = "Place a queen at (" + s.row + "," + s.col + ") and recurse into row " + (s.row + 1) + "."; break;
        case "remove": s.note = "Row " + (s.row) + " ran out of safe squares below - <b>backtrack</b>, lift the queen at (" + s.row + "," + s.col + ")."; break;
        case "solution": s.note = "All " + n + " rows filled with no attacks - <b>solution #" + s.count + "</b>!"; s.results = ["solution #" + s.count]; break;
        case "done": s.note = "Search exhausted - <b>" + s.count + "</b> distinct solution(s) for n = " + n + "."; s.results = [s.count + " solution(s)"]; break;
      }
    });

    function goTo(k) {
      const s = steps[k];
      const placement = s.placement;
      // attacked squares from currently-placed queens
      const threat = new Set();
      for (let r = 0; r < n; r++) {
        if (placement[r] < 0) continue;
        const c = placement[r];
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
          if (j === c || i - j === r - c || i + j === r + c) threat.add(i + "," + j);
        }
      }
      const isSolution = s.action === "solution";
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
        const ud = tiles[r][c].userData;
        let col = ud.base.clone(), em = 0x000000, active = false;
        if (threat.has(r + "," + c)) { col = new T.Color(C.bad).multiplyScalar(0.55); }
        if (placement[r] === c) { col = new T.Color(C.good); active = isSolution; if (isSolution) em = C.good; }
        if (r === s.row && c === s.col) {
          if (s.action === "conflict") { col = new T.Color(C.bad); em = C.bad; }
          else { col = new T.Color(C.hot); em = C.hot; }
          active = true;
        }
        ud.targetColor.copy(col);
        ud.emissiveColor.set(em);
        ud.active = active;
      }
      for (let r = 0; r < n; r++) {
        if (placement[r] >= 0) {
          queens[r].visible = true;
          queens[r].position.set(xAt(placement[r]), 0.7, zAt(r));
          queens[r].material.color.set(isSolution ? C.good : C.hot);
          queens[r].material.emissive.set(isSolution ? C.good : C.hot);
        } else {
          queens[r].visible = false;
        }
      }
      banner.userData.setText("solutions = " + s.count);
    }

    S.onTick(() => {
      const t = performance.now() * 0.004;
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
        const m = tiles[r][c].material;
        m.color.lerp(tiles[r][c].userData.targetColor, 0.18);
        m.emissive.lerp(tiles[r][c].userData.emissiveColor, 0.22);
        m.emissiveIntensity = tiles[r][c].userData.active ? (0.45 + Math.sin(t) * 0.22) : 0.0;
      }
    });

    goTo(0);
    return { steps, goTo, dispose: S.dispose };
  }
};
