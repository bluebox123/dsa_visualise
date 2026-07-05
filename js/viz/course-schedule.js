/* ============================================================
   Viz: Course Schedule (LC 207)
   Courses are nodes on a ring; a prerequisite edge points prereq →
   course. Kahn's algorithm: each node shows its in-degree (how many
   prereqs remain). Repeatedly "take" any course whose in-degree hit
   0 (amber → green), then drop the in-degree of everything it feeds.
   If every course gets taken the schedule is possible; if some stay
   stuck above 0, a cycle makes it impossible.
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["course-schedule"] = {
  samples: [
    { label: "4 courses · diamond (ok)", n: 4, prereqs: [[1, 0], [2, 0], [3, 1], [3, 2]] },
    { label: "2 courses · cycle (impossible)", n: 2, prereqs: [[1, 0], [0, 1]] },
    { label: "3 courses · chain (ok)", n: 3, prereqs: [[1, 0], [2, 1]] },
    { label: "5 courses · cycle hidden", n: 5, prereqs: [[1, 0], [2, 1], [3, 2], [1, 3], [4, 2]] }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const cfg = this.samples[sampleIndex];
    const n = cfg.n, prereqs = cfg.prereqs;

    const R = Math.max(2.8, n * 0.9);
    const cy = R + 2.0;
    const pos = [];
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
      pos.push(new T.Vector3(Math.cos(a) * R, cy + Math.sin(a) * R, 0));
    }

    const adj = Array.from({ length: n }, () => []);
    const indeg0 = new Array(n).fill(0);
    const edgeMap = new Map();
    prereqs.forEach(([course, prereq]) => {
      adj[prereq].push(course);
      indeg0[course]++;
      const key = `${prereq}->${course}`;
      const geo = new T.BufferGeometry().setFromPoints([pos[prereq], pos[course]]);
      const line = new T.Line(geo, new T.LineBasicMaterial({ color: 0x6b331d, transparent: true, opacity: 0.7 }));
      S.world.add(line);
      edgeMap.set(key, { line, from: prereq, to: course });
    });

    const nodes = [], degLabels = [];
    for (let i = 0; i < n; i++) {
      const sphere = new T.Mesh(new T.SphereGeometry(0.6, 26, 26), new T.MeshStandardMaterial({ color: C.bar, roughness: 0.4, metalness: 0.2 }));
      sphere.position.copy(pos[i]);
      sphere.userData = { targetColor: new T.Color(C.bar), emissiveColor: new T.Color(0x000000), active: false };
      S.world.add(sphere);
      const lbl = DSAV.makeLabel(String(i), { fontSize: 44, color: "#1c0d07", scale: 0.9 });
      lbl.position.set(0, 0, 0.62); sphere.add(lbl);
      nodes.push(sphere);
      const deg = DSAV.makeLabel("in:0", { fontSize: 30, color: "#fbf6ee", scale: 0.62 });
      deg.position.copy(pos[i]).add(new T.Vector3(0, 0.95, 0));
      S.world.add(deg);
      degLabels.push(deg);
    }

    const banner = DSAV.makeLabel("taken 0 / " + n, { fontSize: 40, color: "#1c0d07", bg: DSAV.rgbHex(C.hot), scale: 1.0, noDepth: true });
    banner.position.set(0, cy + R + 1.7, 0);
    S.world.add(banner);
    S.controls.target.set(0, cy, 0);
    S.camera.position.set(0, cy, Math.max(15, n * 2.8));

    // ---- Kahn's algorithm ----
    const steps = [];
    const indeg = [...indeg0];
    let queue = [];
    for (let i = 0; i < n; i++) if (indeg[i] === 0) queue.push(i);
    steps.push({ type: "init", node: -1, freed: [], indeg: [...indeg], queue: [...queue], taken: [] });
    const order = [];
    while (queue.length) {
      const u = queue.shift();
      order.push(u);
      const freed = [];
      for (const v of adj[u]) { indeg[v]--; if (indeg[v] === 0) { queue.push(v); freed.push(v); } }
      steps.push({ type: "take", node: u, freed, indeg: [...indeg], queue: [...queue], taken: [...order] });
    }
    steps.push({ type: "done", node: -1, freed: [], indeg: [...indeg], queue: [], taken: [...order], possible: order.length === n });

    steps.forEach((s) => {
      s.vars = [
        { k: "taken", v: s.taken.length + " / " + n, cls: s.taken.length === n ? "good" : "hot" },
        { k: "queue (deg 0)", v: s.queue.length ? "[" + s.queue.join(", ") + "]" : "—" }
      ];
      switch (s.type) {
        case "init": s.note = `Count each course's prerequisites (its in-degree). Courses with <b>0 prereqs</b> can be taken now: [${s.queue.join(", ")}].`; break;
        case "take": s.note = `Take course <b>${s.node}</b> (in-degree 0). Drop the in-degree of the courses it unlocks` + (s.freed.length ? ` — ${s.freed.join(", ")} just hit 0.` : `.`); break;
        case "done": s.note = s.possible
          ? `All ${n} courses taken in order [${s.taken.join(", ")}] — schedule is <b>possible</b>.`
          : `Only ${s.taken.length} of ${n} could be taken; the rest are stuck in a cycle — <b>impossible</b>.`;
          s.results = [s.possible ? `possible: [${s.taken.join(", ")}]` : "impossible (cycle)"];
          break;
      }
    });

    function goTo(k) {
      const s = steps[k];
      const takenSet = new Set(s.taken);
      const freedSet = new Set(s.freed);
      const queueSet = new Set(s.queue);
      const stuck = s.type === "done" && !s.possible;
      nodes.forEach((node, i) => {
        let col = C.bar, em = 0x000000, active = false;
        if (takenSet.has(i)) col = C.good;
        else if (queueSet.has(i)) col = C.left;               // ready to take
        else if (stuck && s.indeg[i] > 0) col = C.bad;        // trapped in cycle
        if (i === s.node) { em = C.hot; active = true; }
        if (freedSet.has(i)) { em = C.left; active = true; }
        node.userData.targetColor.set(col);
        node.userData.emissiveColor.set(em);
        node.userData.active = active;
        degLabels[i].userData.setText(takenSet.has(i) ? "done" : "in:" + s.indeg[i]);
      });
      edgeMap.forEach(({ line, from }) => {
        const on = from === s.node;
        line.material.color.set(on ? C.hot : 0x6b331d);
        line.material.opacity = on ? 1.0 : 0.6;
      });
      banner.userData.setText(`taken ${s.taken.length} / ${n}`);
    }

    S.onTick(() => {
      const t = performance.now() * 0.004;
      nodes.forEach((node) => {
        const m = node.material;
        m.color.lerp(node.userData.targetColor, 0.16);
        m.emissive.lerp(node.userData.emissiveColor, 0.2);
        m.emissiveIntensity = node.userData.active ? (0.45 + Math.sin(t) * 0.22) : 0.0;
      });
    });

    goTo(0);
    return { steps, goTo, dispose: S.dispose };
  }
};
