/* ============================================================
   Viz: Network Delay Time (LC 743)
   A weighted directed graph. A signal starts at node k; we run
   Dijkstra to find the shortest time it needs to reach every node.
   Each node shows its best-known distance. We repeatedly finalise
   the closest un-finalised node (green), then relax its outgoing
   edges (amber). The answer is the largest finalised distance -
   the moment the last node hears the signal - or -1 if one never does.
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["network-delay-time"] = {
  samples: [
    { label: "4 nodes · from 2", n: 4, k: 2, times: [[2, 1, 1], [2, 3, 1], [3, 4, 1]] },
    { label: "5 nodes · from 1", n: 5, k: 1, times: [[1, 2, 3], [1, 3, 1], [3, 2, 1], [2, 4, 2], [3, 5, 4], [4, 5, 1]] },
    { label: "2 nodes · unreachable (-1)", n: 2, k: 2, times: [[1, 2, 1]] },
    { label: "3 nodes · from 1", n: 3, k: 1, times: [[1, 2, 1], [2, 3, 2], [1, 3, 4]] }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const cfg = this.samples[sampleIndex];
    const n = cfg.n, src = cfg.k, INF = Infinity;

    const R = Math.max(2.8, n * 0.95);
    const cy = R + 2.0;
    const pos = [null];
    for (let i = 1; i <= n; i++) {
      const a = -Math.PI / 2 + ((i - 1) / n) * Math.PI * 2;
      pos.push(new T.Vector3(Math.cos(a) * R, cy + Math.sin(a) * R, 0));
    }

    const adj = Array.from({ length: n + 1 }, () => []);
    const edgeMap = new Map();
    cfg.times.forEach(([u, v, w]) => {
      adj[u].push([v, w]);
      const key = u + "->" + v;
      const line = new T.Line(new T.BufferGeometry().setFromPoints([pos[u], pos[v]]), new T.LineBasicMaterial({ color: 0x6b331d, transparent: true, opacity: 0.7 }));
      S.world.add(line);
      edgeMap.set(key, { line, from: u });
      const mid = pos[u].clone().add(pos[v]).multiplyScalar(0.5);
      const wl = DSAV.makeLabel(String(w), { fontSize: 30, color: "#f4c884", scale: 0.6 });
      wl.position.copy(mid);
      S.world.add(wl);
    });

    const nodes = [null], distLabels = [null];
    for (let i = 1; i <= n; i++) {
      const sphere = new T.Mesh(new T.SphereGeometry(0.6, 26, 26), new T.MeshStandardMaterial({ color: C.bar, roughness: 0.4, metalness: 0.2 }));
      sphere.position.copy(pos[i]);
      sphere.userData = { targetColor: new T.Color(C.bar), emissiveColor: new T.Color(0x000000), active: false };
      S.world.add(sphere);
      const lbl = DSAV.makeLabel(String(i), { fontSize: 44, color: "#1c0d07", scale: 0.9 });
      lbl.position.set(0, 0, 0.62); sphere.add(lbl);
      nodes.push(sphere);
      const dl = DSAV.makeLabel("inf", { fontSize: 30, color: "#fbf6ee", scale: 0.62 });
      dl.position.copy(pos[i]).add(new T.Vector3(0, 1.0, 0));
      S.world.add(dl);
      distLabels.push(dl);
    }

    const banner = DSAV.makeLabel("Dijkstra from " + src, { fontSize: 38, color: "#1c0d07", bg: DSAV.rgbHex(C.hot), scale: 1.0, noDepth: true });
    banner.position.set(0, cy + R + 1.7, 0);
    S.world.add(banner);
    S.controls.target.set(0, cy, 0);
    S.camera.position.set(0, cy, Math.max(15, n * 2.8));

    // ---- Dijkstra ----
    const steps = [];
    const dist = new Array(n + 1).fill(INF);
    const visited = new Array(n + 1).fill(false);
    dist[src] = 0;
    steps.push({ type: "init", u: -1, relaxed: [], dist: [...dist], visited: [...visited] });
    for (let iter = 0; iter < n; iter++) {
      let u = -1, best = INF;
      for (let i = 1; i <= n; i++) if (!visited[i] && dist[i] < best) { best = dist[i]; u = i; }
      if (u === -1) break;                    // remaining nodes unreachable
      visited[u] = true;
      const relaxed = [];
      for (const [v, w] of adj[u]) {
        if (!visited[v] && dist[u] + w < dist[v]) { dist[v] = dist[u] + w; relaxed.push(v); }
      }
      steps.push({ type: "finalize", u, relaxed, dist: [...dist], visited: [...visited] });
    }
    const allReached = visited.every((x, i) => i === 0 || x);
    let answer = -1;
    if (allReached) { answer = 0; for (let i = 1; i <= n; i++) answer = Math.max(answer, dist[i]); }
    steps.push({ type: "done", u: -1, relaxed: [], dist: [...dist], visited: [...visited], answer, allReached });

    steps.forEach((s) => {
      const finalized = s.visited.filter((x, i) => i > 0 && x).length;
      s.vars = [
        { k: "finalized", v: finalized + " / " + n, cls: finalized === n ? "good" : "hot" },
        { k: "answer", v: s.type === "done" ? s.answer : "...", cls: "good" }
      ];
      switch (s.type) {
        case "init": s.note = "Set dist[" + src + "] = 0, every other node = infinity. Dijkstra always finalises the closest un-finalised node next."; break;
        case "finalize": s.note = "Closest un-finalised node is <b>" + s.u + "</b> (dist " + s.dist[s.u] + "). Finalise it, then relax its out-edges" + (s.relaxed.length ? " - improved node(s) " + s.relaxed.join(", ") + "." : " (no improvement)."); break;
        case "done": s.note = s.allReached
          ? "Every node has heard the signal. The delay is the <b>maximum</b> shortest-distance = <b>" + s.answer + "</b>."
          : "Some node is unreachable from " + src + " - return <b>-1</b>.";
          s.results = [s.allReached ? "delay = " + s.answer : "-1 (unreachable)"];
          break;
      }
    });

    function goTo(k) {
      const s = steps[k];
      const relaxedSet = new Set(s.relaxed);
      const stuck = s.type === "done" && !s.allReached;
      for (let i = 1; i <= n; i++) {
        let col = C.bar, em = 0x000000, active = false;
        if (s.visited[i]) col = C.good;
        if (stuck && s.dist[i] === INF) col = C.bad;
        if (i === s.u) { em = C.hot; active = true; }
        if (relaxedSet.has(i)) { em = C.left; active = true; }
        nodes[i].userData.targetColor.set(col);
        nodes[i].userData.emissiveColor.set(em);
        nodes[i].userData.active = active;
        distLabels[i].userData.setText(s.dist[i] === INF ? "inf" : "d=" + s.dist[i]);
      }
      edgeMap.forEach(({ line, from }) => {
        const on = from === s.u;
        line.material.color.set(on ? C.hot : 0x6b331d);
        line.material.opacity = on ? 1.0 : 0.6;
      });
      banner.userData.setText(s.type === "done" ? (s.allReached ? "delay = " + s.answer : "unreachable") : "Dijkstra from " + src);
    }

    S.onTick(() => {
      const t = performance.now() * 0.004;
      for (let i = 1; i <= n; i++) {
        const m = nodes[i].material;
        m.color.lerp(nodes[i].userData.targetColor, 0.16);
        m.emissive.lerp(nodes[i].userData.emissiveColor, 0.2);
        m.emissiveIntensity = nodes[i].userData.active ? (0.45 + Math.sin(t) * 0.22) : 0.0;
      }
    });

    goTo(0);
    return { steps, goTo, dispose: S.dispose };
  }
};
