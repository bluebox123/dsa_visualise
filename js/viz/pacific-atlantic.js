/* ============================================================
   Viz: Pacific Atlantic Water Flow (LC 417)
   A height-map of tiles. Water flows from a cell to a neighbour of
   equal-or-lower height. Instead of testing every cell, we flood
   INWARD from each ocean's borders in reverse (climbing to
   equal-or-higher neighbours). Cells the Pacific flood reaches turn
   blue, the Atlantic flood amber; cells reached by BOTH glow green —
   those are the answer.
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["pacific-atlantic"] = {
  samples: [
    {
      label: "5×5 · classic",
      grid: [[1, 2, 2, 3, 5], [3, 2, 3, 4, 4], [2, 4, 5, 3, 1], [6, 7, 1, 4, 5], [5, 1, 1, 2, 4]]
    },
    { label: "3×3 · bowl", grid: [[3, 3, 3], [3, 1, 3], [3, 3, 3]] },
    { label: "3×4 · ramp", grid: [[1, 2, 3, 4], [2, 3, 4, 5], [3, 4, 5, 6]] }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const grid = this.samples[sampleIndex].grid;
    const rows = grid.length, cols = grid[0].length;
    const maxH = Math.max(...grid.flat());

    const cellSize = Math.min(1.9, 15 / Math.max(rows, cols));
    const xAt = (c) => (c - (cols - 1) / 2) * cellSize;
    const zAt = (r) => (r - (rows - 1) / 2) * cellSize;
    const hAt = (v) => 0.35 + (v / maxH) * 1.7;

    const TERRAIN = new T.Color(C.bar), PAC = new T.Color(C.water), ATL = new T.Color(C.left), BOTH = new T.Color(C.good);

    const tiles = [];
    for (let r = 0; r < rows; r++) {
      tiles.push([]);
      for (let c = 0; c < cols; c++) {
        const h = hAt(grid[r][c]);
        const tile = DSAV.makeBar(cellSize * 0.9, h, cellSize * 0.9, C.bar);
        tile.position.set(xAt(c), h / 2, zAt(r));
        tile.userData = { targetColor: new T.Color(C.bar), emissiveColor: new T.Color(0x000000), active: false };
        S.world.add(tile);
        tiles[r].push(tile);
        const lbl = DSAV.makeLabel(String(grid[r][c]), { fontSize: 34, color: "#1c0d07", scale: 0.6 });
        lbl.position.set(xAt(c), h + 0.3, zAt(r));
        S.world.add(lbl);
      }
    }

    const banner = DSAV.makeLabel("Pacific / Atlantic", { fontSize: 40, color: "#1c0d07", bg: DSAV.rgbHex(C.hot), scale: 1.0, noDepth: true });
    banner.position.set(0, 5.5, 0);
    S.world.add(banner);
    S.controls.target.set(0, 0.6, 0);
    S.camera.position.set(0, Math.max(rows, cols) * 1.8 + 3, Math.max(rows, cols) * 1.8 + 5);

    // ---- reverse BFS from each ocean's borders (climb to >= neighbour) ----
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    function bfsWaves(seeds) {
      const visited = new Set(seeds.map(([r, c]) => `${r},${c}`));
      let frontier = seeds;
      const waves = [seeds.slice()];
      while (frontier.length) {
        const next = [];
        for (const [r, c] of frontier) {
          for (const [dr, dc] of dirs) {
            const nr = r + dr, nc = c + dc, key = `${nr},${nc}`;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited.has(key) && grid[nr][nc] >= grid[r][c]) {
              visited.add(key);
              next.push([nr, nc]);
            }
          }
        }
        if (next.length) waves.push(next);
        frontier = next;
      }
      return { visited, waves };
    }

    const pacSeeds = [], atlSeeds = [];
    for (let c = 0; c < cols; c++) { pacSeeds.push([0, c]); atlSeeds.push([rows - 1, c]); }
    for (let r = 0; r < rows; r++) { pacSeeds.push([r, 0]); atlSeeds.push([r, cols - 1]); }
    const pac = bfsWaves(pacSeeds), atl = bfsWaves(atlSeeds);

    const result = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (pac.visited.has(`${r},${c}`) && atl.visited.has(`${r},${c}`)) result.push(`${r},${c}`);
    }

    // ---- steps ----
    const steps = [];
    const pCum = new Set();
    pac.waves.forEach((wave, i) => {
      wave.forEach(([r, c]) => pCum.add(`${r},${c}`));
      steps.push({ phase: "pacific", wave: i, newly: wave.map(([r, c]) => `${r},${c}`), pSet: [...pCum], aSet: [] });
    });
    const pFull = [...pac.visited];
    const aCum = new Set();
    atl.waves.forEach((wave, i) => {
      wave.forEach(([r, c]) => aCum.add(`${r},${c}`));
      steps.push({ phase: "atlantic", wave: i, newly: wave.map(([r, c]) => `${r},${c}`), pSet: pFull, aSet: [...aCum] });
    });
    steps.push({ phase: "done", newly: [], pSet: pFull, aSet: [...atl.visited], result });

    steps.forEach((s) => {
      s.vars = [
        { k: "pacific cells", v: s.pSet.length, cls: "good" },
        { k: "atlantic cells", v: s.aSet.length, cls: "good" }
      ];
      if (s.phase === "pacific") s.note = s.wave === 0
        ? `Seed the Pacific flood at the <b>top row + left column</b> — those touch the ocean.`
        : `Pacific flood, wave ${s.wave}: climb to any neighbour of equal-or-greater height (water could flow back down to it).`;
      else if (s.phase === "atlantic") s.note = s.wave === 0
        ? `Now seed the Atlantic flood at the <b>bottom row + right column</b>.`
        : `Atlantic flood, wave ${s.wave}: same reverse climb. Cells reached by both floods turn green.`;
      else { s.note = `Cells reachable by <b>both</b> oceans flow to the Pacific and the Atlantic — <b>${s.result.length}</b> of them.`; s.results = s.result.map((k) => `(${k})`); }
    });

    function goTo(k) {
      const s = steps[k];
      const pSet = new Set(s.pSet), aSet = new Set(s.aSet), newly = new Set(s.newly || []);
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const key = `${r},${c}`;
        let col = TERRAIN, em = 0x000000, active = false;
        const inP = pSet.has(key), inA = aSet.has(key);
        if (inP && inA) col = BOTH;
        else if (inP) col = PAC;
        else if (inA) col = ATL;
        if (newly.has(key)) { em = inP && inA ? C.good : (s.phase === "pacific" ? C.water : C.left); active = true; }
        if (s.phase === "done" && inP && inA) { em = C.good; active = true; }
        tiles[r][c].userData.targetColor.copy(col);
        tiles[r][c].userData.emissiveColor.set(em);
        tiles[r][c].userData.active = active;
      }
      banner.userData.setText(s.phase === "done" ? `both oceans = ${s.result.length}` : (s.phase === "pacific" ? "Pacific flood" : "Atlantic flood"));
    }

    S.onTick(() => {
      const t = performance.now() * 0.004;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const m = tiles[r][c].material;
        m.color.lerp(tiles[r][c].userData.targetColor, 0.15);
        m.emissive.lerp(tiles[r][c].userData.emissiveColor, 0.2);
        m.emissiveIntensity = tiles[r][c].userData.active ? (0.4 + Math.sin(t) * 0.2) : 0.0;
      }
    });

    goTo(0);
    return { steps, goTo, dispose: S.dispose };
  }
};
