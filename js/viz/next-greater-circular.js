/* ============================================================
   Viz: Next Greater Element II (LC 503)
   Value bars arranged in a ring on the ground plane since the
   array wraps. Two passes over indices 0..2n-1 (mod n) with a
   decreasing stack — pass 1 seeds the stack, pass 2 resolves
   answers using the wraparound.
   ============================================================ */
window.DSAV = window.DSAV || {};
DSAV.viz = DSAV.viz || {};

DSAV.viz["next-greater-circular"] = {
  samples: [
    { label: "[1,2,1]", nums: [1, 2, 1] },
    { label: "[1,2,3,4,3]", nums: [1, 2, 3, 4, 3] },
    { label: "[5,4,3,2,1]", nums: [5, 4, 3, 2, 1] },
    { label: "[3,8,4,1,2]", nums: [3, 8, 4, 1, 2] }
  ],

  build(container, sampleIndex) {
    const T = window.THREE;
    const S = DSAV.Stage(container);
    const C = DSAV.COLORS;
    const nums = this.samples[sampleIndex].nums, n = nums.length;

    const radius = Math.max(3.5, n * 0.9);
    const angAt = (i) => (i / n) * Math.PI * 2 - Math.PI / 2;
    const xAt = (i) => Math.cos(angAt(i)) * radius;
    const zAt = (i) => Math.sin(angAt(i)) * radius;
    const maxV = Math.max(...nums);
    const unit = 3.6 / maxV;
    const hAt = (v) => Math.max(0.5, v * unit);

    const bars = [];
    nums.forEach((v, i) => {
      const h = hAt(v);
      const bar = DSAV.makeBar(1.2, h, 1.2, C.bar);
      bar.position.set(xAt(i), h / 2, zAt(i));
      bar.lookAt(0, h / 2, 0);
      bar.userData = { targetColor: new T.Color(C.bar), emissiveColor: new T.Color(0x000000), active: false };
      S.world.add(bar);
      bars.push(bar);
      const val = DSAV.makeLabel(String(v), { fontSize: 44, color: "#fbf6ee", scale: 0.95 });
      val.position.set(0, h / 2 + 0.7, 0.7);
      bar.add(val);
      const ansLbl = DSAV.makeLabel("-1", { fontSize: 34, color: "#1c0d07", bg: DSAV.rgbHex(C.good), scale: 0.7, noDepth: true });
      ansLbl.position.set(0, -0.6, 0.7);
      bar.add(ansLbl);
      bar.ansLbl = ansLbl;
    });

    const pCur = DSAV.makePointer(C.left, "i");
    pCur.userData.tgt = new T.Vector3(xAt(0), 0.55, zAt(0));
    pCur.position.copy(pCur.userData.tgt);
    S.world.add(pCur);

    S.controls.target.set(0, 1.2, 0);
    S.camera.position.set(0, radius * 0.7 + 3, radius + 6);

    // ---- steps: two passes, decreasing stack, mod n ----
    const steps = [];
    const stack = [];
    const answer = new Array(n).fill(-1);
    for (let k = 2 * n - 1; k >= 0; k--) {
      const i = k % n;
      const pass = k >= n ? 1 : 2;
      steps.push({ type: "arrive", i, k, pass, stack: [...stack] });
      while (stack.length && nums[stack[stack.length - 1]] <= nums[i]) {
        stack.pop();
      }
      if (stack.length) {
        answer[i] = nums[stack[stack.length - 1]];
        steps.push({ type: "resolve", i, k, pass, j: stack[stack.length - 1], stack: [...stack], answer: [...answer] });
      } else {
        steps.push({ type: "empty", i, k, pass, stack: [...stack], answer: [...answer] });
      }
      stack.push(i);
      steps.push({ type: "push", i, k, pass, stack: [...stack], answer: [...answer] });
    }
    steps.push({ type: "done", answer: [...answer] });

    steps.forEach((s) => {
      s.vars = [
        { k: "pass", v: s.pass || "—" },
        { k: "i (mod n)", v: s.i !== undefined ? s.i : "—" },
        { k: "nums[i]", v: s.i !== undefined ? nums[s.i] : "—" },
        { k: "stack (indices)", v: `[${s.stack ? s.stack.join(", ") : ""}]`, cls: "hot" }
      ];
      switch (s.type) {
        case "arrive": s.note = `Pass ${s.pass}: visiting index ${s.i} (value ${nums[s.i]}). Discard any stack top that's ≤ it — it can't be anyone's next-greater.`; break;
        case "resolve": s.note = `Stack top after cleanup is index ${s.j} (value ${nums[s.j]}) — that's index ${s.i}'s <b>next greater element</b>.`; break;
        case "empty": s.note = `Stack emptied — nothing greater found for index ${s.i} yet (stays −1 unless the wraparound pass finds one).`; break;
        case "push": s.note = `Push index ${s.i} — a future element (wrapping around) might be its next greater.`; break;
        case "done": s.note = `Two passes done: pass 1 (indices n−1..0 again) lets the search wrap around the circle. Final answers computed.`; s.results = [`[${s.answer.join(", ")}]`]; break;
      }
    });

    function goTo(k) {
      const s = steps[k];
      const stackSet = new Set(s.stack || []);
      const ans = s.answer || answer;
      bars.forEach((bar, i) => {
        let col = new T.Color(C.bar), em = 0x000000, active = false;
        if (stackSet.has(i)) { col = new T.Color(C.hot); em = 0x3a1c05; active = true; }
        if (i === s.i) { col = new T.Color(C.left); em = C.left; active = true; }
        if (i === s.j) { col = new T.Color(C.good); em = C.good; active = true; }
        bar.userData.targetColor = col;
        bar.userData.emissiveColor.set(em);
        bar.userData.active = active;
        bar.ansLbl.userData.setText(String(ans[i]));
      });
      if (s.i !== undefined) { pCur.visible = true; pCur.userData.tgt.set(xAt(s.i), 0.55, zAt(s.i)); }
      else pCur.visible = false;
    }

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
