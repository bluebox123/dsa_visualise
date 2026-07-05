/* ============================================================
   Viz: Merge k Sorted Lists (LC 23)
   Each input list is a row of node tiles (colour-coded per list).
   A min-heap holds one candidate per active list; each step we
   pop the smallest head, append it to the merged output row below,
   and advance that list's pointer.
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["merge-k-lists"] = {
  samples: [
    { label: "[[1,4,5],[1,3,4],[2,6]]", lists: [[1, 4, 5], [1, 3, 4], [2, 6]] },
    { label: "[[],[]]", lists: [[], []] },
    { label: "[[]]", lists: [[]] },
    { label: "[[1,2,3],[4,5],[0,9]]", lists: [[1, 2, 3], [4, 5], [0, 9]] }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const lists = this.samples[sampleIndex].lists.map((l) => [...l]);
    const k = lists.length;
    const listColors = [C.left, C.right, C.anchor, C.water, C.hot];
    const maxLen = Math.max(1, ...lists.map((l) => l.length));

    const tileW = 1.2, tileH = 0.9, depth = 0.9;
    const gapX = 1.5, gapRow = 1.6;

    const rowTiles = lists.map((l, r) => {
      const color = listColors[r % listColors.length];
      const tiles = l.map((v, c) => {
        const tile = DSAV.makeBar(tileW, tileH, depth, color);
        tile.position.set(c * gapX - (maxLen - 1) * gapX / 2, (k - 1 - r) * gapRow + 2, 0);
        tile.userData = { targetColor: new T.Color(color), emissiveColor: new T.Color(0x000000), active: false };
        const g = DSAV.makeLabel(String(v), { fontSize: 46, color: "#1c0d07", scale: 1.0 });
        g.position.set(0, 0, depth / 2 + 0.01); tile.add(g);
        S.world.add(tile);
        return tile;
      });
      const lbl = DSAV.makeLabel(`list ${r}`, { fontSize: 32, color: "#8f7a5e", scale: 0.68 });
      lbl.position.set(-(maxLen - 1) * gapX / 2 - 1.6, (k - 1 - r) * gapRow + 2, 0);
      S.world.add(lbl);
      return tiles;
    });

    // merged output row (below)
    const totalNodes = lists.reduce((a, l) => a + l.length, 0);
    const outTiles = [];
    for (let i = 0; i < totalNodes; i++) {
      const tile = DSAV.makeBar(tileW, tileH, depth, C.good);
      tile.visible = false;
      const g = DSAV.makeLabel("", { fontSize: 46, color: "#1c0d07", scale: 1.0 });
      g.position.set(0, 0, depth / 2 + 0.01); tile.add(g); tile.glyph = g;
      S.world.add(tile);
      outTiles.push(tile);
    }
    const outLbl = DSAV.makeLabel("merged", { fontSize: 32, color: "#8f7a5e", scale: 0.68 });
    outLbl.position.set(-(Math.max(totalNodes, 1) - 1) * gapX / 2 - 1.8, -0.6, 0);
    S.world.add(outLbl);

    const topY = k * gapRow + 3.2;
    const heapLbl = DSAV.makeLabel("comparing heads...", { fontSize: 38, color: "#1c0d07", bg: DSAV.rgbHex(C.hot), scale: 0.9, noDepth: true });
    heapLbl.position.set(0, topY, 0);
    S.world.add(heapLbl);

    S.controls.target.set(0, topY * 0.35, 0);
    S.camera.position.set(0, topY * 0.5 + 4, Math.max(16, Math.max(maxLen, totalNodes, 1) * 1.9));

    // ---- steps: pointer per list, pick smallest head each round ----
    const steps = [];
    const ptr = new Array(k).fill(0);
    const merged = [];
    let guard = 0;
    while (guard++ < 500) {
      const heads = ptr.map((p, r) => (p < lists[r].length ? { r, v: lists[r][p] } : null)).filter(Boolean);
      if (!heads.length) break;
      steps.push({ type: "compare", ptr: [...ptr], heads, merged: [...merged] });
      const best = heads.reduce((a, b) => (b.v < a.v ? b : a));
      merged.push(best.v);
      ptr[best.r]++;
      steps.push({ type: "take", ptr: [...ptr], r: best.r, v: best.v, merged: [...merged] });
    }
    steps.push({ type: "done", merged: [...merged] });

    steps.forEach((s) => {
      s.vars = [
        { k: "pointers", v: `[${s.ptr.join(", ")}]` },
        { k: "merged so far", v: `[${s.merged.join(", ")}]`, cls: "good" }
      ];
      switch (s.type) {
        case "compare": s.note = s.heads.length ? `Compare the current head of every active list: ${s.heads.map((h) => `list ${h.r}=${h.v}`).join(", ")}. Take the smallest.` : "No active lists left."; break;
        case "take": s.note = `Smallest head is <b>${s.v}</b> from list ${s.r} — append it to the merged output and advance that list's pointer.`; break;
        case "done": s.note = `All lists exhausted. Merged result: <b>[${s.merged.join(", ")}]</b>.`; s.results = [`[${s.merged.join(", ")}]`]; break;
      }
    });

    function goTo(k2) {
      const s = steps[k2];
      lists.forEach((l, r) => {
        rowTiles[r].forEach((tile, c) => {
          const consumed = c < s.ptr[r];
          let active = false, em = 0x000000;
          if (!consumed && s.type === "compare" && s.heads.some((h) => h.r === r) && c === s.ptr[r]) { active = true; em = 0x2a2a10; }
          if (s.type === "take" && r === s.r && c === s.ptr[r] - 1) { active = true; em = C.good; }
          tile.userData.targetColor = consumed ? new T.Color(C.dim) : new T.Color(listColors[r % listColors.length]);
          tile.userData.emissiveColor.set(em);
          tile.userData.active = active;
        });
      });
      outTiles.forEach((tile, i) => {
        if (i < s.merged.length) { tile.visible = true; tile.glyph.userData.setText(String(s.merged[i])); tile.position.x = i * gapX - (totalNodes - 1) * gapX / 2; tile.position.y = 0.5; }
        else tile.visible = false;
      });
      heapLbl.userData.setText(s.type === "compare" ? "comparing heads..." : s.type === "take" ? `took ${s.v}` : "done");
    }

    S.onTick(() => {
      const t = performance.now() * 0.004;
      [...rowTiles.flat(), ...outTiles].forEach((tile) => {
        const m = tile.material;
        if (tile.userData.targetColor) m.color.lerp(tile.userData.targetColor, 0.14);
        if (tile.userData.emissiveColor) m.emissive.lerp(tile.userData.emissiveColor, 0.18);
        m.emissiveIntensity = tile.userData.active ? (0.35 + Math.sin(t) * 0.18) : 0.0;
      });
    });

    goTo(0);
    return { steps, goTo, dispose: S.dispose };
  }
};
