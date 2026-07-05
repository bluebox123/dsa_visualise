/* ============================================================
   Viz: Word Search (LC 79)
   A grid of letters. From each cell we DFS, matching the target word
   letter by letter and marking cells of the current path visited so
   we never reuse one. A mismatch (red) or dead end backtracks,
   un-marking the cell so other paths can use it. The path glows green
   as it grows; a full match lights up the whole word.
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["word-search"] = {
  samples: [
    { label: 'grid · "ABCCED" (true)', board: [["A", "B", "C", "E"], ["S", "F", "C", "S"], ["A", "D", "E", "E"]], word: "ABCCED" },
    { label: 'grid · "SEE" (true)', board: [["A", "B", "C", "E"], ["S", "F", "C", "S"], ["A", "D", "E", "E"]], word: "SEE" },
    { label: 'grid · "ABCB" (false)', board: [["A", "B", "C", "E"], ["S", "F", "C", "S"], ["A", "D", "E", "E"]], word: "ABCB" }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const cfg = this.samples[sampleIndex];
    const board = cfg.board, word = cfg.word;
    const rows = board.length, cols = board[0].length;

    const cellSize = Math.min(1.9, 14 / Math.max(rows, cols));
    const xAt = (c) => (c - (cols - 1) / 2) * cellSize;
    const zAt = (r) => (r - (rows - 1) / 2) * cellSize;

    const tiles = [];
    for (let r = 0; r < rows; r++) {
      tiles.push([]);
      for (let c = 0; c < cols; c++) {
        const tile = DSAV.makeBar(cellSize * 0.9, 0.5, cellSize * 0.9, C.bar);
        tile.position.set(xAt(c), 0.25, zAt(r));
        tile.userData = { targetColor: new T.Color(C.bar), emissiveColor: new T.Color(0x000000), active: false };
        S.world.add(tile);
        tiles[r].push(tile);
        const lbl = DSAV.makeLabel(board[r][c], { fontSize: 46, color: "#1c0d07", scale: 0.85 });
        lbl.position.set(xAt(c), 0.55, zAt(r)); S.world.add(lbl);
      }
    }

    const banner = DSAV.makeLabel('find "' + word + '"', { fontSize: 40, color: "#1c0d07", bg: DSAV.rgbHex(C.hot), scale: 1.0, noDepth: true });
    banner.position.set(0, 5.0, 0);
    S.world.add(banner);
    S.controls.target.set(0, 0.4, 0);
    S.camera.position.set(0, Math.max(rows, cols) * 1.7 + 2, Math.max(rows, cols) * 1.7 + 4);

    // ---- DFS with in-place visited + backtrack ----
    const steps = [];
    const visited = Array.from({ length: rows }, () => new Array(cols).fill(false));
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    let found = false;
    const MAX = 1200;

    function path() {
      const p = [];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (visited[r][c]) p.push(r + "," + c);
      return p;
    }
    function dfs(r, c, k) {
      if (found || steps.length > MAX) return found;
      steps.push({ action: "enter", r, c, k, path: path(), found });
      if (board[r][c] !== word[k]) {
        steps.push({ action: "mismatch", r, c, k, path: path(), found });
        return false;
      }
      if (k === word.length - 1) {
        visited[r][c] = true;
        found = true;
        steps.push({ action: "found", r, c, k, path: path(), found });
        return true;
      }
      visited[r][c] = true;
      steps.push({ action: "match", r, c, k, path: path(), found });
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc]) {
          if (dfs(nr, nc, k + 1)) return true;
        }
      }
      visited[r][c] = false;
      steps.push({ action: "backtrack", r, c, k, path: path(), found });
      return false;
    }

    outer:
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (board[r][c] === word[0]) { if (dfs(r, c, 0)) break outer; }
    }
    steps.push({ action: "done", r: -1, c: -1, k: -1, path: found ? path() : [], found });

    steps.forEach((s) => {
      s.vars = [
        { k: "matched", v: s.k >= 0 ? word.slice(0, s.k + 1) : "-" },
        { k: "target", v: word },
        { k: "found", v: s.found ? "yes" : "no", cls: s.found ? "good" : "hot" }
      ];
      switch (s.action) {
        case "enter": s.note = "Try cell (" + s.r + "," + s.c + ") = '" + board[s.r][s.c] + "' against word[" + s.k + "] = '" + word[s.k] + "'."; break;
        case "match": s.note = "'" + board[s.r][s.c] + "' matches - mark it visited and explore its neighbours for '" + word[s.k + 1] + "'."; break;
        case "mismatch": s.note = "'" + board[s.r][s.c] + "' != '" + word[s.k] + "' - dead end, back out."; break;
        case "backtrack": s.note = "No neighbour continued the word - <b>backtrack</b>, un-mark (" + s.r + "," + s.c + ")."; break;
        case "found": s.note = 'Last letter matched - the whole word "' + word + '" exists in the grid!'; s.results = ['"' + word + '" found = true']; break;
        case "done": s.note = s.found ? 'Word "' + word + '" located.' : 'No path spells "' + word + '" - return false.'; if (!s.found) s.results = ["false"]; break;
      }
    });

    function goTo(k) {
      const s = steps[k];
      const pathSet = new Set(s.path);
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        let col = C.bar, em = 0x000000, active = false;
        if (pathSet.has(r + "," + c)) { col = C.good; active = true; em = 0x1c3313; }
        if (r === s.r && c === s.c) {
          if (s.action === "mismatch") { col = C.bad; em = C.bad; }
          else if (s.action === "backtrack") { col = C.bad; em = C.bad; }
          else if (s.action === "found") { col = C.good; em = C.good; }
          else { col = C.hot; em = C.hot; }
          active = true;
        }
        tiles[r][c].userData.targetColor.set(col);
        tiles[r][c].userData.emissiveColor.set(em);
        tiles[r][c].userData.active = active;
      }
      banner.userData.setText(s.found ? "found!" : 'find "' + word + '"');
    }

    S.onTick(() => {
      const t = performance.now() * 0.004;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
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
