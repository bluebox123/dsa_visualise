/* ============================================================
   Viz: Word Ladder (LC 127)
   Each word is a node; two words are neighbours if they differ by
   exactly one letter. We BFS out from beginWord — words are laid out
   in columns by their BFS distance, so each new column is the next
   rung of the ladder. The first column that contains endWord gives
   the shortest transformation length; the winning chain lights green.
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["word-ladder"] = {
  samples: [
    { label: "hit -> cog", begin: "hit", end: "cog", words: ["hot", "dot", "dog", "lot", "log", "cog"] },
    { label: "hit -> cog (no log)", begin: "hit", end: "cog", words: ["hot", "dot", "dog", "lot", "cog"] },
    { label: "a -> c", begin: "a", end: "c", words: ["a", "b", "c"] },
    { label: "unreachable", begin: "hit", end: "cog", words: ["hot", "dot", "dog", "lot"] }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const cfg = this.samples[sampleIndex];
    const begin = cfg.begin, end = cfg.end;

    const all = [];
    const seenW = new Set();
    [begin, ...cfg.words].forEach((w) => { if (!seenW.has(w)) { seenW.add(w); all.push(w); } });

    function oneApart(a, b) {
      if (a.length !== b.length) return false;
      let diff = 0;
      for (let i = 0; i < a.length; i++) if (a[i] !== b[i] && ++diff > 1) return false;
      return diff === 1;
    }
    const adj = new Map();
    all.forEach((w) => adj.set(w, all.filter((x) => x !== w && oneApart(w, x))));

    // ---- BFS by level ----
    const dist = new Map([[begin, 0]]);
    const parent = new Map();
    const levels = [[begin]];
    let frontier = [begin];
    const visited = new Set([begin]);
    while (frontier.length) {
      const next = [];
      for (const w of frontier) for (const x of adj.get(w)) {
        if (!visited.has(x)) { visited.add(x); dist.set(x, dist.get(w) + 1); parent.set(x, w); next.push(x); }
      }
      if (next.length) { levels.push(next); frontier = next; } else break;
    }
    const reached = visited.has(end);
    const ladderLen = reached ? dist.get(end) + 1 : 0;

    const pathSet = new Set();
    if (reached) { let w = end; while (w !== undefined) { pathSet.add(w); w = parent.get(w); } }

    const unreached = all.filter((w) => !visited.has(w));
    const numCols = levels.length + (unreached.length ? 1 : 0);

    const spacingX = 3.4, spacingY = 1.7, baseY = 3.2;
    const colX = (col) => (col - (numCols - 1) / 2) * spacingX;
    const stackY = (idx, count) => baseY + ((count - 1) / 2 - idx) * spacingY;

    const nodeOf = new Map();
    function place(word, col, idx, count) {
      const box = DSAV.makeBar(2.5, 0.7, 0.4, C.bar);
      const x = colX(col), y = stackY(idx, count);
      box.position.set(x, y, 0);
      box.userData = { targetColor: new T.Color(C.bar), emissiveColor: new T.Color(0x000000), active: false };
      S.world.add(box);
      const lbl = DSAV.makeLabel(word, { fontSize: 40, color: "#1c0d07", scale: 0.85 });
      lbl.position.set(x, y, 0.42);
      S.world.add(lbl);
      nodeOf.set(word, box);
    }
    levels.forEach((lvl, col) => lvl.forEach((w, i) => place(w, col, i, lvl.length)));
    unreached.forEach((w, i) => place(w, levels.length, i, unreached.length));

    parent.forEach((par, child) => {
      const a = nodeOf.get(par).position, b = nodeOf.get(child).position;
      const line = new T.Line(new T.BufferGeometry().setFromPoints([a, b]), new T.LineBasicMaterial({ color: 0x6b331d, transparent: true, opacity: 0.7 }));
      S.world.add(line);
    });

    const maxCol = Math.max(...levels.map((l) => l.length), unreached.length, 1);
    const banner = DSAV.makeLabel('"' + begin + '" -> "' + end + '"', { fontSize: 38, color: "#1c0d07", bg: DSAV.rgbHex(C.hot), scale: 1.0, noDepth: true });
    banner.position.set(0, baseY + (maxCol / 2) * spacingY + 1.5, 0);
    S.world.add(banner);
    S.controls.target.set(0, baseY, 0);
    S.camera.position.set(0, baseY, Math.max(16, numCols * 3.2));

    const steps = [];
    const cum = new Set();
    levels.forEach((lvl, i) => {
      lvl.forEach((w) => cum.add(w));
      const hasEnd = lvl.includes(end);
      steps.push({ type: "level", level: i, frontier: [...lvl], visited: [...cum], hasEnd });
    });
    steps.push({ type: "done", level: levels.length - 1, frontier: [], visited: [...cum], reached, ladderLen });

    steps.forEach((s) => {
      s.vars = [
        { k: "BFS depth", v: s.level },
        { k: "ladder length", v: reached ? ladderLen : "-", cls: "good" }
      ];
      if (s.type === "level") {
        s.note = s.level === 0
          ? 'Start BFS at "<b>' + begin + '</b>" (rung 1). Its neighbours differ by one letter.'
          : "Rung " + (s.level + 1) + ": every word one letter from the previous rung. " + (s.hasEnd ? '"<b>' + end + '</b>" appears here - shortest ladder found!' : "endWord not here yet, expand again.");
      } else {
        s.note = reached
          ? "Shortest transformation is <b>" + ladderLen + "</b> words long: " + [...pathSet].reverse().join(" -> ") + "."
          : 'endWord "' + end + '" is unreachable through single-letter edits - return <b>0</b>.';
        s.results = [reached ? "length = " + ladderLen : "0 (unreachable)"];
      }
    });

    function goTo(k) {
      const s = steps[k];
      const visitedSet = new Set(s.visited);
      const frontierSet = new Set(s.frontier);
      const showPath = s.type === "done" && reached;
      nodeOf.forEach((box, word) => {
        let col = C.bar, em = 0x000000, active = false;
        if (word === begin) col = C.anchor;
        if (visitedSet.has(word)) col = word === begin ? C.anchor : C.right;
        if (frontierSet.has(word)) { col = C.hot; em = C.hot; active = true; }
        if (word === end && visitedSet.has(word)) { col = C.good; em = C.good; active = true; }
        if (showPath && pathSet.has(word)) { col = C.good; em = C.good; active = true; }
        box.userData.targetColor.set(col);
        box.userData.emissiveColor.set(em);
        box.userData.active = active;
      });
      banner.userData.setText(s.type === "done" ? (reached ? "ladder = " + ladderLen : "unreachable") : "depth " + s.level);
    }

    S.onTick(() => {
      const t = performance.now() * 0.004;
      nodeOf.forEach((box) => {
        const m = box.material;
        m.color.lerp(box.userData.targetColor, 0.15);
        m.emissive.lerp(box.userData.emissiveColor, 0.2);
        m.emissiveIntensity = box.userData.active ? (0.4 + Math.sin(t) * 0.2) : 0.0;
      });
    });

    goTo(0);
    return { steps, goTo, dispose: S.dispose };
  }
};
