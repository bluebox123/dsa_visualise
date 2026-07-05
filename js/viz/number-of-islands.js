/* ============================================================
   Viz: Number of Islands (LC 200)
   Grid of tiles: water (blue-ish dim) vs land (copper). We scan
   the grid; whenever we hit an unvisited land tile, that's a new
   island — flood fill (DFS) marks every connected land tile in
   that island with the same color before moving on to the next
   unvisited land tile.
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["number-of-islands"] = {
  samples: [
    { label: "3×4 grid A", grid: [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]] },
    { label: "3×4 grid B (3 islands)", grid: [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]] },
    { label: "single cell", grid: [["1"]] },
    { label: "checkerboard", grid: [["1","0","1"],["0","1","0"],["1","0","1"]] }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const grid = this.samples[sampleIndex].grid.map((r) => [...r]);
    const rows = grid.length, cols = grid[0].length;

    const cellSize = Math.min(1.8, 16 / Math.max(rows, cols));
    const xAt = (c) => (c - (cols - 1) / 2) * cellSize;
    const zAt = (r) => (r - (rows - 1) / 2) * cellSize;
    const palette = [C.left, C.anchor, C.water, C.hot, C.right, C.good];

    const tiles = [];
    for (let r = 0; r < rows; r++) {
      tiles.push([]);
      for (let c = 0; c < cols; c++) {
        const isLand = grid[r][c] === "1";
        const tile = DSAV.makeBar(cellSize * 0.9, isLand ? 0.6 : 0.15, cellSize * 0.9, isLand ? C.bar : C.water);
        tile.position.set(xAt(c), isLand ? 0.3 : 0.075, zAt(r));
        tile.userData = { targetColor: new T.Color(isLand ? C.bar : C.water), emissiveColor: new T.Color(0x000000), active: false };
        S.world.add(tile);
        tiles[r].push(tile);
      }
    }

    const topY = 6;
    const cntLbl = DSAV.makeLabel("islands = 0", { fontSize: 44, color: "#1c0d07", bg: DSAV.rgbHex(C.hot), scale: 1.0, noDepth: true });
    cntLbl.position.set(0, topY, 0);
    S.world.add(cntLbl);
    S.controls.target.set(0, 0.5, 0);
    S.camera.position.set(0, Math.max(rows, cols) * 1.6 + 2, Math.max(rows, cols) * 1.6 + 4);

    // ---- steps: scan grid, flood fill each new island ----
    const steps = [];
    const visited = Array.from({ length: rows }, () => new Array(cols).fill(false));
    const islandOf = Array.from({ length: rows }, () => new Array(cols).fill(-1));
    let islandCount = 0;

    function floodFill(r, c, id) {
      const stack = [[r, c]];
      visited[r][c] = true;
      while (stack.length) {
        const [cr, cc] = stack.pop();
        islandOf[cr][cc] = id;
        steps.push({ type: "fill", r: cr, c: cc, id, islandCount });
        const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        for (const [dr, dc] of dirs) {
          const nr = cr + dr, nc = cc + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc] && grid[nr][nc] === "1") {
            visited[nr][nc] = true;
            stack.push([nr, nc]);
          }
        }
      }
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] === "1" && !visited[r][c]) {
          steps.push({ type: "newisland", r, c, id: islandCount, islandCount });
          floodFill(r, c, islandCount);
          islandCount++;
        } else if (grid[r][c] === "0") {
          steps.push({ type: "skip-water", r, c, islandCount });
        } else {
          steps.push({ type: "skip-visited", r, c, islandCount });
        }
      }
    }
    steps.push({ type: "done", islandCount });

    // precompute, per step, which cells are filled so far (avoids re-scanning history each frame)
    const filledSoFar = [];
    {
      const cur = Array.from({ length: rows }, () => new Array(cols).fill(-1));
      steps.forEach((s) => {
        if (s.type === "fill") cur[s.r][s.c] = s.id;
        filledSoFar.push(cur.map((row) => [...row]));
      });
    }

    steps.forEach((s) => {
      s.vars = [
        { k: "cell", v: s.r !== undefined ? `(${s.r}, ${s.c})` : "—" },
        { k: "islands found", v: s.islandCount, cls: "good" }
      ];
      switch (s.type) {
        case "newisland": s.note = `Land at (${s.r},${s.c}) hasn't been visited — this starts <b>island #${s.islandCount + 1}</b>. Flood fill from here.`; break;
        case "fill": s.note = `Flood fill marks (${s.r},${s.c}) as part of island #${s.id + 1} and spreads to connected land neighbors.`; break;
        case "skip-water": s.note = `(${s.r},${s.c}) is water — nothing to do.`; break;
        case "skip-visited": s.note = `(${s.r},${s.c}) is land but already claimed by an earlier flood fill — skip.`; break;
        case "done": s.note = `Grid scan complete. Total islands: <b>${s.islandCount}</b>.`; s.results = [`islands = ${s.islandCount}`]; break;
      }
    });

    function goTo(k) {
      const s = steps[k];
      const filled = filledSoFar[Math.min(k, filledSoFar.length - 1)] || filledSoFar[filledSoFar.length - 1];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const tile = tiles[r][c];
          const isLand = grid[r][c] === "1";
          let col = isLand ? C.bar : C.water, em = 0x000000, active = false;
          const id = filled ? filled[r][c] : -1;
          if (id >= 0) col = palette[id % palette.length];
          if (s.r === r && s.c === c) { active = true; em = s.type === "newisland" ? C.hot : (s.type === "fill" ? palette[s.id % palette.length] : 0x000000); }
          tile.userData.targetColor = new T.Color(col);
          tile.userData.emissiveColor.set(em);
          tile.userData.active = active;
        }
      }
      cntLbl.userData.setText(`islands = ${s.islandCount}`);
    }

    S.onTick(() => {
      const t = performance.now() * 0.004;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const tile = tiles[r][c];
        const m = tile.material;
        m.color.lerp(tile.userData.targetColor, 0.16);
        m.emissive.lerp(tile.userData.emissiveColor, 0.2);
        m.emissiveIntensity = tile.userData.active ? (0.4 + Math.sin(t) * 0.2) : 0.0;
      }
    });

    goTo(0);
    return { steps, goTo, dispose: S.dispose };
  }
};
