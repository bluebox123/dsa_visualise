/* ============================================================
   Viz: Daily Temperatures (LC 739)
   Temperature bars. A monotonic decreasing stack holds indices of
   days still waiting for a warmer day. Each new day pops every
   stack entry colder than it (recording the wait), then pushes
   itself.
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["daily-temperatures"] = {
  samples: [
    { label: "[73,74,75,71,69,72,76,73]", temps: [73, 74, 75, 71, 69, 72, 76, 73] },
    { label: "[30,40,50,60]", temps: [30, 40, 50, 60] },
    { label: "[30,60,90]", temps: [30, 60, 90] },
    { label: "[89,62,70,58,47,47,46,76,100,70]", temps: [89, 62, 70, 58, 47, 47, 46, 76, 100, 70] }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const temps = this.samples[sampleIndex].temps, n = temps.length;

    const spacing = Math.min(2.2, 15 / n);
    const depth = 1.2;
    const maxT = Math.max(...temps);
    const unit = 4.8 / maxT;
    const xAt = (i) => (i - (n - 1) / 2) * spacing;
    const hAt = (v) => Math.max(0.5, v * unit);

    const bars = [];
    temps.forEach((v, i) => {
      const h = hAt(v);
      const bar = DSAV.makeBar(1.3, h, depth, C.bar);
      bar.position.set(xAt(i), h / 2, 0);
      bar.userData = { targetColor: new T.Color(C.bar), emissiveColor: new T.Color(0x000000), active: false };
      S.world.add(bar);
      bars.push(bar);
      const val = DSAV.makeLabel(String(v), { fontSize: 44, color: "#fbf6ee", scale: 0.95 });
      val.position.set(xAt(i), h + 0.4, depth / 2);
      S.world.add(val);
      const ansLbl = DSAV.makeLabel("", { fontSize: 34, color: "#1c0d07", bg: DSAV.rgbHex(C.good), scale: 0.7, noDepth: true });
      ansLbl.position.set(xAt(i), -0.55, depth / 2);
      ansLbl.visible = false;
      S.world.add(ansLbl);
      bars[i].ansLbl = ansLbl;
    });

    const zFront = depth / 2 + 1.1;
    const pCur = DSAV.makePointer(C.left, "i");
    pCur.position.y = 0.55; pCur.userData.tgt = new T.Vector3(0, 0.55, zFront);
    S.world.add(pCur);

    // ---- steps: monotonic decreasing stack of indices ----
    const steps = [];
    const stack = [];
    const answer = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      steps.push({ type: "arrive", i, stack: [...stack] });
      while (stack.length && temps[stack[stack.length - 1]] < temps[i]) {
        const j = stack.pop();
        answer[j] = i - j;
        steps.push({ type: "pop", i, j, wait: i - j, stack: [...stack], answer: [...answer] });
      }
      stack.push(i);
      steps.push({ type: "push", i, stack: [...stack], answer: [...answer] });
    }
    steps.push({ type: "done", answer: [...answer] });

    steps.forEach((s) => {
      s.vars = [
        { k: "i", v: s.i !== undefined ? s.i : "—" },
        { k: "temps[i]", v: s.i !== undefined ? temps[s.i] : "—" },
        { k: "stack (indices)", v: `[${s.stack ? s.stack.join(", ") : ""}]`, cls: "hot" }
      ];
      switch (s.type) {
        case "arrive": s.note = `Day ${s.i} arrives at ${temps[s.i]}°. Check the stack — is it warmer than the day waiting on top?`; break;
        case "pop": s.note = `${temps[s.i]}° &gt; ${temps[s.j]}° (day ${s.j} on top of stack) → day ${s.j} finally got its warmer day. Wait = <b>${s.wait}</b> day${s.wait === 1 ? "" : "s"}.`; break;
        case "push": s.note = `Day ${s.i} isn't resolved yet — push it onto the stack to wait for something warmer.`; break;
        case "done": s.note = `All days processed. Any day left on the stack never got warmer — its answer stays 0.`; s.results = [`[${s.answer.join(", ")}]`]; break;
      }
    });

    function goTo(k) {
      const s = steps[k];
      const stackSet = new Set(s.stack || []);
      const ans = s.answer || answer.map(() => 0);
      bars.forEach((bar, i) => {
        let col = new T.Color(C.bar), em = 0x000000, active = false;
        if (stackSet.has(i)) { col = new T.Color(C.hot); em = 0x3a1c05; active = true; }
        if (i === s.i) { col = new T.Color(C.left); em = C.left; active = true; }
        if (i === s.j) { col = new T.Color(C.good); em = C.good; active = true; }
        bar.userData.targetColor = col;
        bar.userData.emissiveColor.set(em);
        bar.userData.active = active;

        const done = s.type === "done";
        bar.ansLbl.visible = done || ans[i] > 0;
        if (bar.ansLbl.visible) bar.ansLbl.userData.setText(String(ans[i]));
      });
      pCur.visible = s.i !== undefined;
      if (s.i !== undefined) pCur.userData.tgt.set(xAt(s.i), 0.55, zFront);
    }

    S.controls.target.set(0, maxT * unit * 0.35, 0);
    S.camera.position.set(0, maxT * unit * 0.5 + 3, Math.max(15, n * 2.1));

    S.onTick(() => {
      const t = performance.now() * 0.004;
      bars.forEach((bar) => {
        const m = bar.material;
        m.color.lerp(bar.userData.targetColor, 0.13);
        m.emissive.lerp(bar.userData.emissiveColor, 0.18);
        m.emissiveIntensity = bar.userData.active ? (0.35 + Math.sin(t) * 0.18) : 0.0;
      });
      DSAV.lerpToTarget(pCur, 0.16);
    });

    goTo(0);
    return { steps, goTo, dispose: S.dispose };
  }
};
