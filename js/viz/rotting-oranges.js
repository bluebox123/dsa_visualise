/* ============================================================
   Viz: Rotting Oranges (LC 994)
   Grid of tiles: empty (dim), fresh (copper), rotten (red). All
   rotten oranges rot their fresh 4-neighbours simultaneously each
   minute — a multi-source BFS that spreads in waves. We count the
   minutes until no fresh orange remains (or −1 if some are cut off).
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["rotting-oranges"] = {
  samples: [
    { label: "3×3 · spreads fully", grid: [[2, 1, 1], [1, 1, 0], [0, 1, 1]] },
    { label: "3×3 · one is trapped (−1)", grid: [[2, 1, 1], [0, 1, 1], [1, 0, 1]] },
    { label: "already all rotten (0 min)", grid: [[2, 2], [2, 2]] },
    { label: "4×4 · two sources", grid: [[2, 1, 1, 0], [1, 1, 0, 1], [0, 1, 1, 1], [1, 0, 1, 2]] }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const src = this.samples[sampleIndex].grid;
    const grid = src.map((r) => [...r]);
    const rows = grid.length, cols = grid[0].length;

    const cellSize = Math.min(1.9, 15 / Math.max(rows, cols));
    const xAt = (c) => (c - (cols - 1) / 2) * cellSize;
    const zAt = (r) => (r - (rows - 1) / 2) * cellSize;

    const EMPTY = new T.Color(C.dim), FRESH = new T.Color(C.barPos), ROT = new T.Color(C.bad);

    const tiles = [];
    for (let r = 0; r < rows; r++) {
      tiles.push([]);
      for (let c = 0; c < cols; c++) {
        const v = grid[r][c];
        const h = v === 0 ? 0.14 : 0.62;
        const tile = DSAV.makeBar(cellSize * 0.9, h, cellSize * 0.9, v === 0 ? C.dim : (v === 2 ? C.bad : C.barPos));
        tile.position.set(xAt(c), h / 2, zAt(r));
        tile.userData = {
          targetColor: new T.Color(), emissiveColor: new T.Color(0x000000),
          active: false, startFresh: v === 1, empty: v === 0
        };
        S.world.add(tile);
        tiles[r].push(tile);
      }
    }

    const topY = 5.5;
    const clock = DSAV.makeLabel("minute = 0", { fontSize: 44, color: "#1c0d07", bg: DSAV.rgbHex(C.hot), scale: 1.0, noDepth: true });
    clock.position.set(0, topY, 0);
    S.world.add(clock);
    S.controls.target.set(0, 0.5, 0);
    S.camera.position.set(0, Math.max(rows, cols) * 1.7 + 2, Math.max(rows, cols) * 1.7 + 4);

    // ---- multi-source BFS in waves ----
    const rotMinute = Array.from({ length: rows }, () => new Array(cols).fill(null));
    let fresh = 0;
    let frontier = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 2) { rotMinute[r][c] = 0; frontier.push([r, c]); }
      else if (grid[r][c] === 1) fresh++;
    }

    const steps = [];
    steps.push({ type: "seed", minute: 0, newly: frontier.map(([r, c]) => `${r},${c}`), fresh });
    let minute = 0;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    while (frontier.length) {
      const next = [], newly = [];
      for (const [r, c] of frontier) {
        for (const [dr, dc] of dirs) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === 1) {
            grid[nr][nc] = 2;
            rotMinute[nr][nc] = minute + 1;
            fresh--;
            newly.push([nr, nc]);
            next.push([nr, nc]);
          }
        }
      }
      if (newly.length) {
        minute++;
        steps.push({ type: "wave", minute, newly: newly.map(([r, c]) => `${r},${c}`), fresh });
      }
      frontier = next;
    }
    steps.push({ type: "done", minute, fresh, answer: fresh === 0 ? minute : -1 });

    steps.forEach((s) => {
      s.vars = [
        { k: "minute", v: s.minute },
        { k: "fresh left", v: s.fresh, cls: s.fresh === 0 ? "good" : "hot" }
      ];
      switch (s.type) {
        case "seed": s.note = `Start: every rotten orange is a BFS source (seeded at minute 0). ${s.fresh} fresh orange(s) to reach.`; break;
        case "wave": s.note = `Minute ${s.minute}: every current-rotten orange rots its fresh 4-neighbours at once. ${s.newly.length} newly rotten; ${s.fresh} fresh left.`; break;
        case "done":
          if (s.answer === -1) { s.note = `The spread stalled with ${s.fresh} fresh orange(s) unreachable — return <b>−1</b>.`; s.results = ["−1 (impossible)"]; }
          else { s.note = `All oranges are rotten. It took <b>${s.minute} minute(s)</b>.`; s.results = [`${s.minute} minute(s)`]; }
          break;
      }
    });

    function goTo(k) {
      const s = steps[k];
      const m = s.minute;
      const newlySet = new Set(s.newly || []);
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const ud = tiles[r][c].userData;
        const rm = rotMinute[r][c];
        let col = EMPTY, em = 0x000000, active = false;
        if (ud.empty) {
          col = EMPTY;
        } else if (rm !== null && rm <= m) {
          col = ROT;
          if (newlySet.has(`${r},${c}`)) { em = C.bad; active = true; }
        } else {
          col = FRESH;   // orange not yet reached this minute
        }
        ud.targetColor.copy(col);
        ud.emissiveColor.set(em);
        ud.active = active;
      }
      clock.userData.setText(s.type === "done" && s.answer === -1 ? "minute = −1" : `minute = ${m}`);
    }

    S.onTick(() => {
      const t = performance.now() * 0.004;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const m = tiles[r][c].material;
        m.color.lerp(tiles[r][c].userData.targetColor, 0.16);
        m.emissive.lerp(tiles[r][c].userData.emissiveColor, 0.2);
        m.emissiveIntensity = tiles[r][c].userData.active ? (0.45 + Math.sin(t) * 0.2) : 0.0;
      }
    });

    goTo(0);
    return { steps, goTo, dispose: S.dispose };
  }
};
