/* ============================================================
   Viz: Group Anagrams (LC 49)
   Each input word is a tile. Below it we compute its signature
   (sorted letters) and show it on a small tag. Words sharing a
   signature drift together into the same colored cluster/lane —
   that's the anagram group.
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["group-anagrams"] = {
  samples: [
    { label: '["eat","tea","tan","ate","nat","bat"]', words: ["eat", "tea", "tan", "ate", "nat", "bat"] },
    { label: '[""]', words: [""] },
    { label: '["a"]', words: ["a"] },
    { label: '["abc","bca","cab","xyz","zzz"]', words: ["abc", "bca", "cab", "xyz", "zzz"] }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const words = this.samples[sampleIndex].words, n = words.length;
    const sig = (w) => w.split("").sort().join("") || "∅";

    const palette = [C.left, C.anchor, C.water, C.hot, C.right, C.good, C.barPos];
    const groupOf = new Map();  // signature -> group index
    words.forEach((w) => { const s = sig(w); if (!groupOf.has(s)) groupOf.set(s, groupOf.size); });

    const spacing = Math.min(2.6, 15 / n);
    const depth = 1.2, tileH = 1.3;
    const startX = (i) => (i - (n - 1) / 2) * spacing;

    // ---- word tiles, start in original scan order ----
    const tiles = [];
    words.forEach((w, i) => {
      const color = palette[groupOf.get(sig(w)) % palette.length];
      const tile = DSAV.makeBar(1.7, tileH, depth, C.bar);
      tile.position.set(startX(i), tileH / 2, 0);
      tile.userData = { targetColor: new T.Color(C.bar), emissiveColor: new T.Color(0x000000), active: false, groupColor: new T.Color(color), tgtX: startX(i), tgtZ: 0 };
      const glyph = DSAV.makeLabel(w || "(empty)", { fontSize: 44, color: "#1c0d07", scale: 1.05 });
      glyph.position.set(0, 0, depth / 2 + 0.01);
      tile.add(glyph);
      S.world.add(tile);
      tiles.push(tile);

      const tag = DSAV.makeLabel(sig(w), { fontSize: 28, color: "#8f7a5e", scale: 0.6 });
      tag.position.set(startX(i), -0.55, depth / 2 + 0.4);
      S.world.add(tag);
    });

    // final lane x-position per group (sorted by first appearance)
    const groups = [...groupOf.keys()];
    const laneSpacing = Math.max(spacing * 1.1, 15 / Math.max(groups.length, 1));
    const laneX = (gi) => (gi - (groups.length - 1) / 2) * laneSpacing;
    const laneCounts = new Array(groups.length).fill(0);

    const topY = tileH + 2.0;
    const capLbl = DSAV.makeLabel(`groups: 0 / ${groups.length}`, { fontSize: 44, color: "#1c0d07", bg: DSAV.rgbHex(C.hot), scale: 1.0, noDepth: true });
    capLbl.position.set(0, topY, 0);
    S.world.add(capLbl);

    S.controls.target.set(0, topY * 0.4, 0);
    S.camera.position.set(0, topY * 0.5 + 3.5, Math.max(15, Math.max(n, groups.length) * 2.2));

    // ---- steps: scan words, assign to lane ----
    const steps = [];
    const laneZ = new Array(groups.length).fill(0);
    for (let i = 0; i < n; i++) {
      const s = sig(words[i]);
      const gi = groups.indexOf(s);
      const isNewGroup = laneCounts[gi] === 0;
      const z = laneCounts[gi] * 1.6;
      laneCounts[gi]++;
      steps.push({ type: "place", i, gi, sig: s, isNewGroup, z, groupsUsed: laneCounts.filter((c) => c > 0).length });
    }
    steps.push({ type: "done", groupsUsed: groups.length });

    steps.forEach((s) => {
      if (s.type === "place") {
        s.vars = [
          { k: "word", v: `"${words[s.i]}"` },
          { k: "signature", v: `"${s.sig}"` },
          { k: "group", v: s.gi, cls: "hot" },
          { k: "groups so far", v: s.groupsUsed, cls: "good" }
        ];
        s.note = s.isNewGroup
          ? `"${words[s.i]}" sorts to "<b>${s.sig}</b>" — a signature we haven't seen. Open a <b>new group</b>.`
          : `"${words[s.i]}" sorts to "<b>${s.sig}</b>" — matches an existing group. Slide it into that <b>lane</b>.`;
      } else {
        s.vars = [{ k: "total groups", v: s.groupsUsed, cls: "good" }];
        s.note = `Done. Every word is bucketed by its sorted-letter signature — <b>${s.groupsUsed}</b> anagram groups.`;
        s.results = groups.map((g) => {
          const members = words.filter((w) => sig(w) === g);
          return `[${members.map((m) => `"${m}"`).join(", ")}]`;
        });
      }
    });

    function goTo(k) {
      const s = steps[k];
      const upto = s.type === "done" ? n : s.i + 1;
      tiles.forEach((tile, i) => {
        if (i < upto) {
          const st = steps.find((st) => st.type === "place" && st.i === i);
          tile.userData.tgtX = laneX(st.gi);
          tile.userData.tgtZ = st.z;
          tile.userData.targetColor = tile.userData.groupColor;
          tile.userData.emissiveColor.set(tile.userData.groupColor.getHex());
          tile.userData.active = (s.type === "place" && s.i === i);
        } else {
          tile.userData.tgtX = startX(i);
          tile.userData.tgtZ = 0;
          tile.userData.targetColor = new T.Color(C.bar);
          tile.userData.emissiveColor.set(0x000000);
          tile.userData.active = false;
        }
      });
      capLbl.userData.setText(`groups: ${s.groupsUsed} / ${groups.length}`);
    }

    S.onTick(() => {
      const t = performance.now() * 0.004;
      tiles.forEach((tile) => {
        const m = tile.material;
        m.color.lerp(tile.userData.targetColor, 0.13);
        m.emissive.lerp(tile.userData.emissiveColor, 0.16);
        m.emissiveIntensity = tile.userData.active ? (0.35 + Math.sin(t) * 0.18) : 0.12;
        tile.position.x += (tile.userData.tgtX - tile.position.x) * 0.14;
        tile.position.z += (tile.userData.tgtZ - tile.position.z) * 0.14;
      });
    });

    goTo(0);
    return { steps, goTo, dispose: S.dispose };
  }
};
