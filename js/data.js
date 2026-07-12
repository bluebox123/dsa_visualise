/* ============================================================
   DSA Arsenal — data model
   window.DSAV.patterns : all 12 patterns / 58 questions.
   Questions with `built: true` have full content + a `vizId`
   that maps to a visualisation registered in js/viz/*.js.
   ============================================================ */
window.DSAV = window.DSAV || {};

const LC = "https://leetcode.com/problems/";

/* helper to keep locked entries terse */
function q(num, title, slug, tier, trigger) {
  return { num, title, slug, tier, trigger, built: false };
}

DSAV.patterns = [
  {
    id: "two-pointers",
    name: "Two Pointers",
    blurb: "Converge or chase indices across an array to shrink an O(n²) scan to O(n).",
    questions: [
      {
        num: 167,
        title: "Two Sum II – Input Array Is Sorted",
        slug: "two-sum-ii-input-array-is-sorted",
        tier: "easy",
        trigger: "Array is sorted + find a pair hitting a target → converge two pointers from both ends.",
        built: true,
        vizId: "two-sum-ii",
        simplified: [
          "You get a list of numbers that is <strong>already sorted</strong> small → large, and a <code>target</code>. Find the two numbers that add up exactly to the target and return their 1-based positions.",
          "Because it's sorted, you don't need to try every pair. Put one finger on the <strong>smallest</strong> number (left) and one on the <strong>largest</strong> (right). Add them:",
          "If the sum is <strong>too big</strong>, the only way to shrink it is to move the right finger left. If it's <strong>too small</strong>, move the left finger right to grow it. When the sum equals the target — done."
        ],
        approach: [
          "<strong>left</strong> starts at index 0, <strong>right</strong> at the last index.",
          "<code>sum = numbers[left] + numbers[right]</code>.",
          "<code>sum &gt; target</code> → <code>right--</code> (need a smaller sum).",
          "<code>sum &lt; target</code> → <code>left++</code> (need a bigger sum).",
          "<code>sum == target</code> → you found the answer."
        ],
        code: `public int[] twoSum(int[] numbers, int target) {
    int left = 0, right = numbers.length - 1;

    while (left < right) {
        int sum = numbers[left] + numbers[right];

        if (sum == target) {
            // problem uses 1-based indices
            return new int[]{ left + 1, right + 1 };
        } else if (sum < target) {
            left++;   // sum too small -> grow it
        } else {
            right--;  // sum too big   -> shrink it
        }
    }
    return new int[]{ -1, -1 }; // no pair (won't happen per constraints)
}`,
        complexity: { time: "O(n)", space: "O(1)" }
      },
      {
        num: 15,
        title: "3Sum",
        slug: "3sum",
        tier: "medium",
        trigger: "Find triplets summing to a target → fix one element, two-pointer the remaining sorted suffix.",
        built: true,
        vizId: "three-sum",
        simplified: [
          "Find every group of <strong>three</strong> numbers that add up to <strong>0</strong>. No duplicate triplets allowed.",
          "The trick: <strong>sort</strong> the array first. Then walk a fixed pointer <code>i</code> through it. For each <code>i</code>, the problem becomes \"find two numbers in the rest that sum to <code>-nums[i]</code>\" — which is exactly Two Sum II on the sorted suffix.",
          "So it's a loop wrapped around the two-pointer trick. Sorting also lets you <strong>skip duplicates</strong> easily: if a value equals the one before it, skip, so you never emit the same triplet twice."
        ],
        approach: [
          "<strong>Sort</strong> the array.",
          "For each index <code>i</code>, skip it if it repeats the previous value.",
          "Set <code>left = i+1</code>, <code>right = n-1</code> and two-pointer for <code>sum == 0</code>.",
          "On a hit, record the triplet, then move both pointers inward, skipping duplicate values.",
          "<code>sum &lt; 0</code> → <code>left++</code>; <code>sum &gt; 0</code> → <code>right--</code>."
        ],
        code: `public List<List<Integer>> threeSum(int[] nums) {
    Arrays.sort(nums);
    List<List<Integer>> res = new ArrayList<>();

    for (int i = 0; i < nums.length - 2; i++) {
        // skip duplicate anchor values
        if (i > 0 && nums[i] == nums[i - 1]) continue;

        int left = i + 1, right = nums.length - 1;
        while (left < right) {
            int sum = nums[i] + nums[left] + nums[right];

            if (sum == 0) {
                res.add(Arrays.asList(nums[i], nums[left], nums[right]));
                left++; right--;
                // skip duplicate pairs
                while (left < right && nums[left] == nums[left - 1]) left++;
                while (left < right && nums[right] == nums[right + 1]) right--;
            } else if (sum < 0) {
                left++;   // need a bigger sum
            } else {
                right--;  // need a smaller sum
            }
        }
    }
    return res;
}`,
        complexity: { time: "O(n²)", space: "O(1) extra" }
      },
      {
        num: 11,
        title: "Container With Most Water",
        slug: "container-with-most-water",
        tier: "medium",
        trigger: "Maximize area/width between two lines → always shrink from the side with the smaller bound.",
        built: true,
        vizId: "container-water",
        simplified: [
          "Each number is the <strong>height of a vertical wall</strong>. Pick two walls so that the water trapped between them has the <strong>biggest area</strong>.",
          "Area = <code>width × height</code>, where width is the distance between the two walls and height is the <strong>shorter</strong> of the two walls (water spills over the short side).",
          "Start with the widest possible pair — the two ends. Then move inward. Which side? Always move the <strong>shorter</strong> wall inward: it's the bottleneck, so the only chance to find a bigger area is to hope for a taller wall on that side. Moving the taller one can never help."
        ],
        approach: [
          "<strong>left = 0</strong>, <strong>right = n-1</strong>, <code>max = 0</code>.",
          "<code>area = min(h[left], h[right]) × (right - left)</code>.",
          "Update <code>max</code> with the best area seen so far.",
          "Move the pointer at the <strong>shorter</strong> wall inward (if equal, either works).",
          "Stop when the two pointers meet."
        ],
        code: `public int maxArea(int[] height) {
    int left = 0, right = height.length - 1;
    int max = 0;

    while (left < right) {
        int h = Math.min(height[left], height[right]);
        int area = h * (right - left);
        max = Math.max(max, area);

        // move the shorter wall inward - the bottleneck
        if (height[left] < height[right]) {
            left++;
        } else {
            right--;
        }
    }
    return max;
}`,
        complexity: { time: "O(n)", space: "O(1)" }
      },
      {
        num: 42,
        title: "Trapping Rain Water",
        slug: "trapping-rain-water",
        tier: "hard",
        trigger: "Compute a bounded/trapped quantity → two pointers tracking running left-max and right-max.",
        built: true,
        vizId: "trapping-rain-water",
        simplified: [
          "Each number is the height of a bar in a bar-chart landscape. After it rains, water pools in the dips <strong>between</strong> taller bars. Count the total units of water trapped.",
          "The water sitting on top of any single bar is decided by the <strong>shorter</strong> of the two tallest walls on its left and right: <code>water = min(leftMax, rightMax) − height</code>. If that's negative the bar is a peak and holds nothing.",
          "The trick that makes it O(n): walk two pointers inward. Whichever side currently has the <strong>smaller wall</strong> is the side whose water is already fully determined — because the other side is guaranteed at least as tall. So resolve that cell, bank its water, and step inward."
        ],
        approach: [
          "<strong>left = 0</strong>, <strong>right = n-1</strong>, <code>leftMax = rightMax = 0</code>, <code>water = 0</code>.",
          "If <code>height[left] &lt; height[right]</code>, work the <strong>left</strong> side; else work the right.",
          "On the working side: if the bar is ≥ its running max, it becomes the new max (dry). Otherwise it's a valley — add <code>max − height</code> to <code>water</code>.",
          "Step that pointer inward and repeat until <code>left</code> meets <code>right</code>.",
          "Why the shorter side is safe: its water is capped by the smaller max, which we already know for certain."
        ],
        code: `public int trap(int[] height) {
    int left = 0, right = height.length - 1;
    int leftMax = 0, rightMax = 0;
    int water = 0;

    while (left < right) {
        if (height[left] < height[right]) {
            // left wall is the bottleneck -> left side is safe
            if (height[left] >= leftMax) {
                leftMax = height[left];      // new wall, holds no water
            } else {
                water += leftMax - height[left];
            }
            left++;
        } else {
            if (height[right] >= rightMax) {
                rightMax = height[right];
            } else {
                water += rightMax - height[right];
            }
            right--;
        }
    }
    return water;
}`,
        complexity: { time: "O(n)", space: "O(1)" }
      }
    ]
  },
  {
    id: "sliding-window",
    name: "Sliding Window",
    blurb: "Grow and shrink a contiguous window to answer 'longest/smallest subarray with a constraint'.",
    questions: [
      {
        num: 3,
        title: "Longest Substring Without Repeating Characters",
        slug: "longest-substring-without-repeating-characters",
        tier: "medium",
        trigger: "Longest substring with a 'no repeats / at most K distinct' constraint → variable expand-shrink window.",
        built: true,
        vizId: "longest-substring",
        simplified: [
          "Given a string, find the length of the <strong>longest run</strong> of characters that has <strong>no repeats</strong>. In \"abcabcbb\" the best is \"abc\" — length 3.",
          "Keep a <strong>window</strong> (a stretch of the string) that is always repeat-free. Push the right edge forward one letter at a time. Remember which letters are currently inside using a <code>seen</code> set.",
          "The moment the new right letter is <strong>already in the window</strong>, the window has a duplicate. Slide the <strong>left edge</strong> forward — removing letters from <code>seen</code> — until that duplicate is gone. After every valid step, record the window's length if it beats the best."
        ],
        approach: [
          "<code>left = 0</code>, an empty <code>seen</code> set, <code>best = 0</code>.",
          "For each <code>right</code>: while <code>s[right]</code> is in <code>seen</code>, remove <code>s[left]</code> and do <code>left++</code>.",
          "Add <code>s[right]</code> to <code>seen</code> — the window is repeat-free again.",
          "<code>best = max(best, right − left + 1)</code>.",
          "Each character is added once and removed at most once → O(n)."
        ],
        code: `public int lengthOfLongestSubstring(String s) {
    Set<Character> seen = new HashSet<>();
    int left = 0, best = 0;

    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);
        // shrink from the left until 'c' is no longer inside
        while (seen.contains(c)) {
            seen.remove(s.charAt(left));
            left++;
        }
        seen.add(c);
        best = Math.max(best, right - left + 1);
    }
    return best;
}`,
        complexity: { time: "O(n)", space: "O(min(n, alphabet))" }
      },
      {
        num: 209,
        title: "Minimum Size Subarray Sum",
        slug: "minimum-size-subarray-sum",
        tier: "medium",
        trigger: "Smallest window whose sum ≥ target → contract from the left once the condition holds.",
        built: true,
        vizId: "min-subarray-sum",
        simplified: [
          "You get positive numbers and a <code>target</code>. Find the <strong>shortest contiguous block</strong> whose numbers add up to at least the target. If none can, the answer is 0.",
          "Grow a window by moving the right edge and adding each value to a running <code>sum</code>. As soon as <code>sum ≥ target</code>, you have a valid block — record its length.",
          "But maybe a shorter block also works. So while the sum is still <strong>≥ target</strong>, keep <strong>shrinking from the left</strong> (subtracting values) and updating the best length. When it drops below target, resume growing on the right."
        ],
        approach: [
          "<code>left = 0</code>, <code>sum = 0</code>, <code>best = ∞</code>.",
          "For each <code>right</code>: <code>sum += nums[right]</code>.",
          "While <code>sum ≥ target</code>: update <code>best = min(best, right − left + 1)</code>, then <code>sum −= nums[left]</code> and <code>left++</code>.",
          "After the scan, return <code>best</code> — or 0 if it never became finite.",
          "Positivity matters: it guarantees shrinking always lowers the sum, so the window logic is monotonic."
        ],
        code: `public int minSubArrayLen(int target, int[] nums) {
    int left = 0, sum = 0;
    int best = Integer.MAX_VALUE;

    for (int right = 0; right < nums.length; right++) {
        sum += nums[right];
        // shrink while still valid, chasing a shorter window
        while (sum >= target) {
            best = Math.min(best, right - left + 1);
            sum -= nums[left];
            left++;
        }
    }
    return best == Integer.MAX_VALUE ? 0 : best;
}`,
        complexity: { time: "O(n)", space: "O(1)" }
      },
      {
        num: 424,
        title: "Longest Repeating Character Replacement",
        slug: "longest-repeating-character-replacement",
        tier: "medium",
        trigger: "Longest valid window allowing ≤ K modifications → window size − max-frequency-in-window ≤ K.",
        built: true,
        vizId: "longest-repeating",
        simplified: [
          "You have a string and a budget <code>k</code>. You may <strong>repaint up to k letters</strong> into any other letter. Find the <strong>longest run</strong> you can make where every letter is the same.",
          "In any window, the smartest move is to keep the letter that <strong>already appears most</strong> and repaint the rest. The number of repaints needed is <code>windowLength − maxFreq</code>, where <code>maxFreq</code> is the count of that most-common letter.",
          "So a window is <strong>affordable</strong> while <code>windowLength − maxFreq ≤ k</code>. Grow the right edge; the instant the window gets too expensive, slide the left edge in. Track the longest affordable window you ever saw."
        ],
        approach: [
          "<code>left = 0</code>, a <code>count[]</code> of letters in the window, <code>maxFreq = 0</code>, <code>best = 0</code>.",
          "For each <code>right</code>: <code>count[s[right]]++</code>, update <code>maxFreq</code>.",
          "While <code>(right − left + 1) − maxFreq &gt; k</code>: the window can't be fixed within budget → <code>count[s[left]]--</code>, <code>left++</code>.",
          "<code>best = max(best, right − left + 1)</code>.",
          "maxFreq never needs to shrink: a smaller window can't beat a length we already recorded, so leaving it stale is safe and keeps it O(n)."
        ],
        code: `public int characterReplacement(String s, int k) {
    int[] count = new int[26];
    int left = 0, maxFreq = 0, best = 0;

    for (int right = 0; right < s.length(); right++) {
        int c = s.charAt(right) - 'A';
        count[c]++;
        maxFreq = Math.max(maxFreq, count[c]);

        // (windowLen - maxFreq) letters must be repainted
        while ((right - left + 1) - maxFreq > k) {
            count[s.charAt(left) - 'A']--;
            left++;
        }
        best = Math.max(best, right - left + 1);
    }
    return best;
}`,
        complexity: { time: "O(n)", space: "O(1) — 26 letters" }
      },
      {
        num: 76,
        title: "Minimum Window Substring",
        slug: "minimum-window-substring",
        tier: "hard",
        trigger: "Smallest substring containing all chars of another → 'have / need' counter with a contracting window.",
        built: true,
        vizId: "min-window",
        simplified: [
          "Given strings <code>s</code> and <code>t</code>, find the <strong>shortest slice of s</strong> that still contains every letter of <code>t</code> (respecting duplicates). If none exists, return the empty string.",
          "Keep a <strong>need</strong> tally (how many of each letter t wants) and a <strong>have</strong> tally (what's in the current window). A counter <code>formed</code> tracks how many distinct letters are fully satisfied.",
          "Grow the right edge until <code>formed == required</code> — now the window is valid. Then greedily <strong>shrink from the left</strong> while it stays valid, recording the smallest valid window each time. When it breaks, resume growing right."
        ],
        approach: [
          "Build <code>need</code> from t; <code>required</code> = number of distinct letters.",
          "Expand <code>right</code>, updating window counts; when a letter's count hits its need, <code>formed++</code>.",
          "While <code>formed == required</code>: update the best (smallest) window, then drop <code>s[left]</code>, <code>left++</code>, and decrement <code>formed</code> if that letter fell below its need.",
          "Return the best window found, or <code>\"\"</code> if it never became valid.",
          "Each index enters and leaves the window once → O(|s| + |t|)."
        ],
        code: `public String minWindow(String s, String t) {
    int[] need = new int[128];
    for (char c : t.toCharArray()) need[c]++;
    int required = t.length();          // total chars still owed

    int left = 0, bestLen = Integer.MAX_VALUE, bestL = 0;
    for (int right = 0; right < s.length(); right++) {
        // consuming a still-owed char pays down the debt
        if (need[s.charAt(right)]-- > 0) required--;

        while (required == 0) {         // window covers all of t
            if (right - left + 1 < bestLen) {
                bestLen = right - left + 1;
                bestL = left;
            }
            // release the left char; if it was needed, debt grows
            if (need[s.charAt(left)]++ == 0) required++;
            left++;
        }
    }
    return bestLen == Integer.MAX_VALUE ? "" : s.substring(bestL, bestL + bestLen);
}`,
        complexity: { time: "O(|s| + |t|)", space: "O(1) — fixed alphabet" }
      }
    ]
  },
  {
    id: "binary-search",
    name: "Binary Search",
    blurb: "Halve the search space each step — on a sorted array, or on the answer itself.",
    questions: [
      {
        num: 33,
        title: "Search in Rotated Sorted Array",
        slug: "search-in-rotated-sorted-array",
        tier: "medium",
        trigger: "Sorted but rotated → detect which half is sorted, discard the half that can't hold the target.",
        built: true,
        vizId: "search-rotated",
        simplified: [
          "A sorted array was <strong>rotated</strong> at some unknown pivot, e.g. <code>[4,5,6,7,0,1,2]</code>. Find the index of a <code>target</code> in <strong>O(log n)</strong> — so plain scanning is out.",
          "Even after rotation, if you cut at the middle, <strong>at least one half is still perfectly sorted</strong>. You can always tell which: if <code>nums[lo] ≤ nums[mid]</code>, the left half is sorted; otherwise the right half is.",
          "Once you know the sorted half, you can check in O(1) whether the target falls inside its clean <code>[low..high]</code> range. If it does, search there; if not, throw that half away. Halving each step → logarithmic."
        ],
        approach: [
          "<code>lo = 0</code>, <code>hi = n − 1</code>. Loop while <code>lo ≤ hi</code>.",
          "<code>mid = (lo + hi) / 2</code>. If <code>nums[mid] == target</code>, done.",
          "If <code>nums[lo] ≤ nums[mid]</code> the left half is sorted: if <code>nums[lo] ≤ target &lt; nums[mid]</code> go left (<code>hi = mid − 1</code>), else go right.",
          "Otherwise the right half is sorted: if <code>nums[mid] &lt; target ≤ nums[hi]</code> go right (<code>lo = mid + 1</code>), else go left.",
          "If the loop ends, the target is absent → −1."
        ],
        code: `public int search(int[] nums, int target) {
    int lo = 0, hi = nums.length - 1;

    while (lo <= hi) {
        int mid = (lo + hi) >>> 1;
        if (nums[mid] == target) return mid;

        if (nums[lo] <= nums[mid]) {          // left half sorted
            if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;
            else lo = mid + 1;
        } else {                              // right half sorted
            if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
            else hi = mid - 1;
        }
    }
    return -1;
}`,
        complexity: { time: "O(log n)", space: "O(1)" }
      },
      {
        num: 153,
        title: "Find Minimum in Rotated Sorted Array",
        slug: "find-minimum-in-rotated-sorted-array",
        tier: "medium",
        trigger: "Find the pivot / inflection point → compare mid against the rightmost element.",
        built: true,
        vizId: "find-min-rotated",
        simplified: [
          "A sorted array was rotated; find its <strong>smallest element</strong> in O(log n). The minimum is the single spot where a big number is followed by a small one — the 'drop'.",
          "Compare the middle to the <strong>right end</strong>. If <code>nums[mid] &gt; nums[hi]</code>, the array is still descending past mid, so the drop (minimum) must be <strong>to the right</strong> — move <code>lo = mid + 1</code>.",
          "Otherwise <code>nums[mid] ≤ nums[hi]</code>: mid's segment is clean, so the minimum is <strong>mid or to its left</strong> — move <code>hi = mid</code> (keep mid, it might be the answer). When <code>lo == hi</code>, that's the minimum."
        ],
        approach: [
          "<code>lo = 0</code>, <code>hi = n − 1</code>. Loop while <code>lo &lt; hi</code>.",
          "<code>mid = (lo + hi) / 2</code>.",
          "<code>nums[mid] &gt; nums[hi]</code> → minimum is to the right: <code>lo = mid + 1</code>.",
          "Else → minimum is mid or left: <code>hi = mid</code> (never <code>mid − 1</code>, or you might skip it).",
          "Loop ends with <code>lo == hi</code> pointing at the minimum."
        ],
        code: `public int findMin(int[] nums) {
    int lo = 0, hi = nums.length - 1;

    while (lo < hi) {
        int mid = (lo + hi) >>> 1;
        if (nums[mid] > nums[hi]) {
            lo = mid + 1;      // dip is strictly to the right
        } else {
            hi = mid;          // mid could be the minimum - keep it
        }
    }
    return nums[lo];
}`,
        complexity: { time: "O(log n)", space: "O(1)" }
      },
      {
        num: 875,
        title: "Koko Eating Bananas",
        slug: "koko-eating-bananas",
        tier: "medium",
        trigger: "'Minimum value such that is-feasible(X) is monotonic' → binary search on the answer.",
        built: true,
        vizId: "koko-bananas",
        simplified: [
          "Koko eats bananas at some speed <code>k</code> per hour. Each hour she picks one pile and eats up to <code>k</code> from it (leftovers wait). Given <code>H</code> hours, find the <strong>smallest k</strong> that clears every pile in time.",
          "Key insight: the array isn't sorted, but the <strong>answer space is</strong>. If speed k works, any faster speed also works — feasibility is <strong>monotonic</strong>. So binary-search on k itself, not on the piles.",
          "For a candidate speed, the hours needed are <code>Σ ⌈pile / k⌉</code>. If that's ≤ H the speed is feasible (try slower); if it's &gt; H it's too slow (go faster). Search k in <code>[1, max(pile)]</code>."
        ],
        approach: [
          "<code>lo = 1</code>, <code>hi = max(piles)</code> (no point eating faster than the biggest pile).",
          "<code>mid = (lo + hi) / 2</code>; compute <code>hours = Σ ⌈pile / mid⌉</code>.",
          "<code>hours ≤ H</code> → feasible, maybe slower works: <code>hi = mid</code>.",
          "<code>hours &gt; H</code> → too slow: <code>lo = mid + 1</code>.",
          "When <code>lo == hi</code>, that's the minimum feasible speed."
        ],
        code: `public int minEatingSpeed(int[] piles, int h) {
    int lo = 1, hi = 0;
    for (int p : piles) hi = Math.max(hi, p);

    while (lo < hi) {
        int mid = (lo + hi) >>> 1;
        long hours = 0;
        for (int p : piles) hours += (p + mid - 1) / mid;  // ceil(p/mid)

        if (hours <= h) hi = mid;      // fast enough, try slower
        else lo = mid + 1;             // too slow, speed up
    }
    return lo;
}`,
        complexity: { time: "O(n log maxPile)", space: "O(1)" }
      },
      {
        num: 1011,
        title: "Capacity To Ship Packages Within D Days",
        slug: "capacity-to-ship-packages-within-d-days",
        tier: "medium",
        trigger: "Smallest capacity/threshold passing a feasibility check → binary search on answer + greedy validate.",
        built: true,
        vizId: "ship-capacity",
        simplified: [
          "Packages sit on a belt in a fixed order and must ship within <code>D</code> days. Each day the ship carries a prefix of the remaining packages without exceeding its capacity. Find the <strong>smallest capacity</strong> that still finishes in D days.",
          "Same shape as Koko: the answer (capacity) is monotonic — a bigger ship never needs <em>more</em> days. So binary-search the capacity and <strong>greedily validate</strong> each candidate.",
          "To count days for a capacity, walk the belt adding weights; when the next box would overflow, start a new day. Capacity must be at least the <strong>heaviest box</strong> (lo) and at most the <strong>total weight</strong> (hi = one day)."
        ],
        approach: [
          "<code>lo = max(weights)</code>, <code>hi = sum(weights)</code>.",
          "<code>mid = (lo + hi) / 2</code>; greedily count days needed at capacity <code>mid</code>.",
          "<code>days ≤ D</code> → feasible, try a smaller ship: <code>hi = mid</code>.",
          "<code>days &gt; D</code> → too many days: <code>lo = mid + 1</code>.",
          "<code>lo == hi</code> is the minimum feasible capacity."
        ],
        code: `public int shipWithinDays(int[] weights, int days) {
    int lo = 0, hi = 0;
    for (int w : weights) { lo = Math.max(lo, w); hi += w; }

    while (lo < hi) {
        int mid = (lo + hi) >>> 1;
        int need = 1, cur = 0;
        for (int w : weights) {
            if (cur + w > mid) { need++; cur = 0; }  // start a new day
            cur += w;
        }
        if (need <= days) hi = mid;   // fits, try a smaller ship
        else lo = mid + 1;            // too slow, bigger ship
    }
    return lo;
}`,
        complexity: { time: "O(n log sum)", space: "O(1)" }
      }
    ]
  },
  {
    id: "hashing-prefix",
    name: "Hashing / Prefix Sum",
    blurb: "Trade space for time: remember what you've seen in a map for O(1) lookups.",
    questions: [
      {
        num: 1,
        title: "Two Sum",
        slug: "two-sum",
        tier: "easy",
        trigger: "Find the complement (target − x) in one pass → store seen values in a hash map.",
        built: true,
        vizId: "two-sum",
        simplified: [
          "Given an array and a <code>target</code>, return the indices of the <strong>two numbers</strong> that add up to it. The array isn't sorted, so the Two-Pointer trick doesn't apply.",
          "The brute-force is every pair, O(n²). The speed-up: for each value <code>x</code>, the partner you need is fixed — it's <code>target − x</code>. So instead of searching for it, <strong>remember values you've already seen</strong> in a hash map for instant O(1) lookup.",
          "Walk once. At each element check whether its complement is already in the map. If yes, you've found the pair; if no, drop the current value into the map and keep going."
        ],
        approach: [
          "Create an empty map of <code>value → index</code>.",
          "For each <code>i</code>: compute <code>complement = target − nums[i]</code>.",
          "If <code>complement</code> is in the map, return <code>[map[complement], i]</code>.",
          "Otherwise store <code>nums[i] → i</code> and continue.",
          "One pass, each lookup/insert O(1) → O(n) overall."
        ],
        code: `public int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> seen = new HashMap<>();

    for (int i = 0; i < nums.length; i++) {
        int complement = target - nums[i];
        if (seen.containsKey(complement)) {
            return new int[]{ seen.get(complement), i };
        }
        seen.put(nums[i], i);   // remember for a later element
    }
    return new int[]{ -1, -1 }; // no pair (won't happen per constraints)
}`,
        complexity: { time: "O(n)", space: "O(n)" }
      },
      {
        num: 49,
        title: "Group Anagrams",
        slug: "group-anagrams",
        tier: "medium",
        trigger: "Group strings by identity → use sorted-string or char-count signature as the hash key.",
        built: true,
        vizId: "group-anagrams",
        simplified: [
          "Given a list of words, group together the ones that are <strong>anagrams</strong> of each other (same letters, different order), e.g. \"eat\", \"tea\", \"ate\" belong together.",
          "Two words are anagrams exactly when their letters, <strong>sorted</strong>, are identical. So sorting a word's letters gives a canonical <strong>signature</strong> — anagrams collapse to the same signature.",
          "Use that signature as a hash-map key: for each word, compute its signature and append the word to the bucket for that key. At the end, the map's buckets are exactly the answer groups."
        ],
        approach: [
          "Create a map of <code>signature → list of words</code>.",
          "For each word, sort its characters to get the signature.",
          "Append the original word to <code>map[signature]</code>.",
          "Return <code>map.values()</code> as the list of groups.",
          "Sorting each word costs O(k log k); overall O(n · k log k) for n words of max length k."
        ],
        code: `public List<List<String>> groupAnagrams(String[] strs) {
    Map<String, List<String>> groups = new HashMap<>();

    for (String s : strs) {
        char[] chars = s.toCharArray();
        Arrays.sort(chars);
        String key = new String(chars);       // canonical signature
        groups.computeIfAbsent(key, k -> new ArrayList<>()).add(s);
    }
    return new ArrayList<>(groups.values());
}`,
        complexity: { time: "O(n · k log k)", space: "O(n · k)" }
      },
      {
        num: 560,
        title: "Subarray Sum Equals K",
        slug: "subarray-sum-equals-k",
        tier: "medium",
        trigger: "Count subarrays with an exact sum → store prefix-sum frequencies in a map.",
        built: true,
        vizId: "subarray-sum-k",
        simplified: [
          "Count how many <strong>contiguous subarrays</strong> add up to exactly <code>k</code>. Numbers can be negative, so a sliding window (which relies on positivity) doesn't work here.",
          "Track a <strong>running prefix sum</strong> as you scan. The sum of any subarray <code>(j, i]</code> equals <code>prefix[i] − prefix[j]</code>. So a subarray ending at <code>i</code> sums to k exactly when some earlier prefix equalled <code>prefix[i] − k</code>.",
          "Keep a hash map of <strong>how many times each prefix sum has occurred</strong>. At each index, look up <code>prefix − k</code> in the map — its count is exactly how many new k-sum subarrays end here. Add that to the running answer, then record the current prefix."
        ],
        approach: [
          "<code>freq = {0: 1}</code> (empty prefix), <code>prefix = 0</code>, <code>count = 0</code>.",
          "For each number: <code>prefix += num</code>.",
          "<code>count += freq.getOrDefault(prefix − k, 0)</code>.",
          "<code>freq[prefix]++</code>.",
          "Seeding <code>freq</code> with <code>{0:1}</code> correctly counts subarrays that start at index 0."
        ],
        code: `public int subarraySum(int[] nums, int k) {
    Map<Integer, Integer> freq = new HashMap<>();
    freq.put(0, 1);              // empty prefix occurs once

    int prefix = 0, count = 0;
    for (int num : nums) {
        prefix += num;
        count += freq.getOrDefault(prefix - k, 0);
        freq.merge(prefix, 1, Integer::sum);
    }
    return count;
}`,
        complexity: { time: "O(n)", space: "O(n)" }
      },
      {
        num: 128,
        title: "Longest Consecutive Sequence",
        slug: "longest-consecutive-sequence",
        tier: "medium",
        trigger: "Longest run of consecutive integers in O(n) → hash set, only start counting from sequence-heads.",
        built: true,
        vizId: "longest-consecutive",
        simplified: [
          "Given an unsorted array, find the length of the <strong>longest run of consecutive integers</strong> (e.g. 3, 4, 5, 6) — in O(n), so actually sorting first is too slow.",
          "Put every number in a <strong>hash set</strong> for O(1) membership checks. The key trick: only start counting a chain from a number that is a <strong>sequence head</strong> — one whose <code>value − 1</code> is <em>not</em> in the set. That guarantees each chain is counted exactly once, from its true start.",
          "From a head, keep checking <code>value + 1</code>, <code>+2</code>, ... as long as they're in the set, extending the chain. Track the longest chain seen across all heads."
        ],
        approach: [
          "Put all numbers into a <code>HashSet</code>.",
          "For each number <code>v</code> in the set: if <code>v − 1</code> is in the set, skip it (it's not a head).",
          "Otherwise, walk <code>cur = v, v+1, v+2, ...</code> while each is in the set, counting the length.",
          "Update <code>best = max(best, length)</code>.",
          "Every number is visited by the inner while-loop at most once across the whole run → amortized O(n)."
        ],
        code: `public int longestConsecutive(int[] nums) {
    Set<Integer> set = new HashSet<>();
    for (int n : nums) set.add(n);

    int best = 0;
    for (int v : set) {
        if (set.contains(v - 1)) continue;   // not a sequence head, skip

        int cur = v, len = 1;
        while (set.contains(cur + 1)) { cur++; len++; }
        best = Math.max(best, len);
    }
    return best;
}`,
        complexity: { time: "O(n)", space: "O(n)" }
      }
    ]
  },
  {
    id: "monotonic-stack",
    name: "Monotonic Stack",
    blurb: "Keep a stack in sorted order to answer 'next greater / smaller' in one pass.",
    questions: [
      {
        num: 739,
        title: "Daily Temperatures",
        slug: "daily-temperatures",
        tier: "medium",
        trigger: "'Next greater / warmer element' or 'days until' → decreasing stack of indices.",
        built: true,
        vizId: "daily-temperatures",
        simplified: [
          "For each day, find how many days you'd have to wait for a <strong>warmer</strong> temperature. If none comes, the answer is 0. Brute force checks every future day — O(n²).",
          "Keep a stack of <strong>day indices whose warmer day hasn't shown up yet</strong>, ordered so temperatures on the stack only ever decrease from bottom to top.",
          "When today's temperature beats the day on top of the stack, that day's wait is finally resolved — pop it and record <code>today − thatDay</code>. Keep popping while today beats the new top, then push today (it's now waiting for its own warmer day)."
        ],
        approach: [
          "Empty stack of indices, <code>answer[]</code> initialized to 0.",
          "For each day <code>i</code>: while the stack isn't empty and <code>temps[stack.top] &lt; temps[i]</code>, pop <code>j</code> and set <code>answer[j] = i − j</code>.",
          "Push <code>i</code> onto the stack.",
          "Any index left on the stack at the end never finds a warmer day → stays 0.",
          "Each index is pushed once and popped at most once → O(n)."
        ],
        code: `import java.util.*;

class Solution {
    public int[] dailyTemperatures(int[] temperatures) {
        int n = temperatures.length;
        int[] answer = new int[n];
        Deque<Integer> stack = new ArrayDeque<>();  // indices, decreasing temps

        for (int i = 0; i < n; i++) {
            while (!stack.isEmpty() && temperatures[stack.peek()] < temperatures[i]) {
                int j = stack.pop();
                answer[j] = i - j;
            }
            stack.push(i);
        }
        return answer;
    }
}

public class Main {
    public static void main(String[] args) {
        int[] temps = {73, 74, 75, 71, 69, 72, 76, 73};
        int[] wait = new Solution().dailyTemperatures(temps);
        System.out.println(Arrays.toString(wait));  // [1, 1, 4, 2, 1, 1, 0, 0]
    }
}`,
        complexity: { time: "O(n)", space: "O(n)" }
      },
      {
        num: 503,
        title: "Next Greater Element II",
        slug: "next-greater-element-ii",
        tier: "medium",
        trigger: "Next greater in a circular array → monotonic stack with a double pass (i % n).",
        built: true,
        vizId: "next-greater-circular",
        simplified: [
          "Same 'next greater element' idea, but the array is <strong>circular</strong> — after the last element, searching wraps back to the start.",
          "Trick: simulate the wraparound by iterating indices <code>0 .. 2n−1</code> and using <code>i % n</code> to map back into the real array. Walking twice around means every element gets a fair shot at seeing what comes 'after' it, wraparound included.",
          "Use the exact same decreasing stack as Daily Temperatures, just iterating the doubled range and always looking up <code>nums[i % n]</code>."
        ],
        approach: [
          "<code>answer[]</code> initialized to −1, empty stack of indices in <code>[0, n)</code>.",
          "For <code>k</code> from <code>0</code> to <code>2n − 1</code>: let <code>i = k % n</code>.",
          "While the stack isn't empty and <code>nums[stack.top] &lt; nums[i]</code>: pop <code>j</code>, set <code>answer[j] = nums[i]</code>.",
          "Only push <code>i</code> if <code>k &lt; n</code> (avoid pushing duplicates on the second lap).",
          "Two full passes still keep it O(n) — each index pushed once, popped at most once."
        ],
        code: `import java.util.*;

class Solution {
    public int[] nextGreaterElements(int[] nums) {
        int n = nums.length;
        int[] answer = new int[n];
        Arrays.fill(answer, -1);
        Deque<Integer> stack = new ArrayDeque<>();  // indices, decreasing values

        for (int k = 2 * n - 1; k >= 0; k--) {
            int i = k % n;
            while (!stack.isEmpty() && nums[stack.peek()] <= nums[i]) {
                stack.pop();
            }
            if (k < n) {
                answer[i] = stack.isEmpty() ? -1 : nums[stack.peek()];
            }
            stack.push(i);
        }
        return answer;
    }
}

public class Main {
    public static void main(String[] args) {
        int[] nums = {1, 2, 1};
        System.out.println(Arrays.toString(new Solution().nextGreaterElements(nums)));  // [2, -1, 2]
    }
}`,
        complexity: { time: "O(n)", space: "O(n)" }
      },
      {
        num: 84,
        title: "Largest Rectangle in Histogram",
        slug: "largest-rectangle-in-histogram",
        tier: "hard",
        trigger: "Max area bounded by bars → increasing stack tracking the previous-smaller boundary.",
        built: true,
        vizId: "largest-rectangle",
        simplified: [
          "Given histogram bar heights, find the area of the <strong>largest rectangle</strong> that fits entirely under the skyline. The rectangle's height is capped by the shortest bar it spans.",
          "For every bar, imagine it as the <strong>shortest</strong> bar in its rectangle — then the rectangle extends left and right until it hits a shorter bar on either side. If we know those two boundaries for each bar, the area is just <code>height × (right − left − 1)</code>.",
          "An <strong>increasing stack</strong> of indices finds those boundaries in one pass: when a shorter bar arrives, every taller bar on the stack just found its right boundary (the current index) — pop it, compute its area using the new stack top as its left boundary, and repeat."
        ],
        approach: [
          "Empty stack of indices; append a sentinel bar of height 0 at the end to flush everything.",
          "For each index <code>i</code> (including the sentinel): while stack isn't empty and <code>heights[stack.top] ≥ heights[i]</code>, pop <code>top</code>.",
          "Compute its width: <code>i − stack.top − 1</code> if stack isn't empty after popping, else <code>i</code>.",
          "<code>area = heights[top] × width</code>; track the maximum.",
          "Push <code>i</code>. Each index is pushed and popped once → O(n)."
        ],
        code: `import java.util.*;

class Solution {
    public int largestRectangleArea(int[] heights) {
        Deque<Integer> stack = new ArrayDeque<>();
        int n = heights.length, best = 0;

        for (int i = 0; i <= n; i++) {
            int h = (i == n) ? 0 : heights[i];   // sentinel flushes the stack
            while (!stack.isEmpty() && heights[stack.peek()] >= h) {
                int top = stack.pop();
                int width = stack.isEmpty() ? i : i - stack.peek() - 1;
                best = Math.max(best, heights[top] * width);
            }
            stack.push(i);
        }
        return best;
    }
}

public class Main {
    public static void main(String[] args) {
        int[] heights = {2, 1, 5, 6, 2, 3};
        System.out.println(new Solution().largestRectangleArea(heights));  // 10
    }
}`,
        complexity: { time: "O(n)", space: "O(n)" }
      },
      {
        num: 316,
        title: "Remove Duplicate Letters",
        slug: "remove-duplicate-letters",
        tier: "medium",
        trigger: "Lexicographically smallest result after removals → greedy monotonic stack + last-occurrence guard.",
        built: true,
        vizId: "remove-dup-letters",
        simplified: [
          "Remove duplicate letters so each letter appears exactly once, keeping the result the <strong>lexicographically smallest</strong> possible — while preserving relative order and using every distinct letter.",
          "Build the answer as a <strong>stack</strong>. For each new letter: if it's already in the stack, skip it (a copy would just be a duplicate). Otherwise, while the stack's top letter is <strong>bigger</strong> than the current one and that top letter <strong>reappears later</strong> in the string, pop it — we can safely drop it now and pick it up again on its later occurrence, getting a smaller result.",
          "Track each letter's <strong>last index</strong> up front so you always know whether popping is safe (there must be a later occurrence to fall back on)."
        ],
        approach: [
          "Precompute <code>lastIndex[c]</code> = the last position each character appears.",
          "Empty stack + a <code>inStack</code> set for O(1) membership.",
          "For each index <code>i</code>, char <code>c</code>: if <code>c</code> already in stack, skip.",
          "Else, while stack's top <code>&gt; c</code> AND <code>lastIndex[top] &gt; i</code>: pop it, remove from <code>inStack</code>.",
          "Push <code>c</code>, add to <code>inStack</code>. The stack at the end is the answer."
        ],
        code: `import java.util.*;

class Solution {
    public String removeDuplicateLetters(String s) {
        int[] lastIndex = new int[26];
        for (int i = 0; i < s.length(); i++) lastIndex[s.charAt(i) - 'a'] = i;

        Deque<Character> stack = new ArrayDeque<>();
        boolean[] inStack = new boolean[26];

        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (inStack[c - 'a']) continue;               // already used, skip

            while (!stack.isEmpty() && stack.peek() > c && lastIndex[stack.peek() - 'a'] > i) {
                inStack[stack.pop() - 'a'] = false;        // safe to drop, reappears later
            }
            stack.push(c);
            inStack[c - 'a'] = true;
        }

        StringBuilder sb = new StringBuilder();
        for (char c : stack) sb.append(c);
        return sb.reverse().toString();   // stack iterates top->bottom, so reverse
    }
}

public class Main {
    public static void main(String[] args) {
        System.out.println(new Solution().removeDuplicateLetters("cbacdcbc"));  // acdb
    }
}`,
        complexity: { time: "O(n)", space: "O(1) — 26 letters" }
      }
    ]
  },
  {
    id: "heap-topk",
    name: "Heap / Top-K",
    blurb: "A heap keeps the best K elements handy without fully sorting.",
    questions: [
      {
        num: 215,
        title: "Kth Largest Element in an Array",
        slug: "kth-largest-element-in-an-array",
        tier: "medium",
        trigger: "'Kth largest/smallest' → min-heap of size K (or quickselect).",
        built: true,
        vizId: "kth-largest",
        simplified: [
          "Find the <code>k</code>-th largest value in an unsorted array — not the k-th <em>distinct</em> value, duplicates count. Sorting works but costs O(n log n); we can do better.",
          "Keep a <strong>min-heap of size k</strong> holding the k largest values seen so far. Its smallest member (the heap's root) is always the current k-th largest candidate.",
          "Scan once: if the heap has room, add the value. Once full, a new value only replaces the heap's minimum if it's bigger than that minimum — otherwise it can't be in the top k, discard it. At the end, the heap's minimum is the answer."
        ],
        approach: [
          "Empty min-heap.",
          "For each value: if heap size &lt; k, push it.",
          "Else if value &gt; heap.peek(), pop the min and push the value.",
          "Otherwise discard the value.",
          "After the scan, the heap's root is the k-th largest. O(n log k), much better than full sort when k ≪ n."
        ],
        code: `import java.util.*;

class Solution {
    public int findKthLargest(int[] nums, int k) {
        PriorityQueue<Integer> heap = new PriorityQueue<>();  // min-heap of size k

        for (int num : nums) {
            if (heap.size() < k) {
                heap.offer(num);
            } else if (num > heap.peek()) {
                heap.poll();          // evict the smallest kept value
                heap.offer(num);
            }
        }
        return heap.peek();           // root = k-th largest
    }
}

public class Main {
    public static void main(String[] args) {
        int[] nums = {3, 2, 1, 5, 6, 4};
        System.out.println(new Solution().findKthLargest(nums, 2));  // 5
    }
}`,
        complexity: { time: "O(n log k)", space: "O(k)" }
      },
      {
        num: 347,
        title: "Top K Frequent Elements",
        slug: "top-k-frequent-elements",
        tier: "medium",
        trigger: "'K most frequent' → count in a map, then heap or bucket-by-frequency.",
        built: true,
        vizId: "top-k-frequent",
        simplified: [
          "Find the <code>k</code> values that appear <strong>most often</strong> in the array. First step is always the same: count every value's frequency with a hash map.",
          "Instead of sorting all distinct values by frequency (O(d log d)), use <strong>bucket sort</strong>: create buckets indexed by frequency (0 to n), and drop each value into <code>bucket[frequency]</code>.",
          "Then walk the buckets from the <strong>highest frequency down</strong>, collecting values until you have k of them. Since frequency can never exceed n, this is O(n) overall."
        ],
        approach: [
          "Count frequencies into a map.",
          "Create <code>buckets[0..n]</code>; for each value, push it into <code>buckets[freq[value]]</code>.",
          "Walk <code>f</code> from <code>n</code> down to <code>1</code>; for each value in <code>buckets[f]</code>, add it to the result.",
          "Stop as soon as the result has k values.",
          "No comparison sort needed → O(n) time, O(n) space."
        ],
        code: `import java.util.*;

class Solution {
    public int[] topKFrequent(int[] nums, int k) {
        Map<Integer, Integer> freq = new HashMap<>();
        for (int num : nums) freq.merge(num, 1, Integer::sum);

        // bucket[f] holds every value that occurs exactly f times
        List<Integer>[] buckets = new List[nums.length + 1];
        for (var entry : freq.entrySet()) {
            int f = entry.getValue();
            if (buckets[f] == null) buckets[f] = new ArrayList<>();
            buckets[f].add(entry.getKey());
        }

        int[] result = new int[k];
        int idx = 0;
        for (int f = buckets.length - 1; f >= 1 && idx < k; f--) {   // walk high -> low freq
            if (buckets[f] == null) continue;
            for (int v : buckets[f]) {
                if (idx == k) break;
                result[idx++] = v;
            }
        }
        return result;
    }
}

public class Main {
    public static void main(String[] args) {
        int[] nums = {1, 1, 1, 2, 2, 3};
        System.out.println(Arrays.toString(new Solution().topKFrequent(nums, 2)));  // [1, 2]
    }
}`,
        complexity: { time: "O(n)", space: "O(n)" }
      },
      {
        num: 973,
        title: "K Closest Points to Origin",
        slug: "k-closest-points-to-origin",
        tier: "medium",
        trigger: "'K closest/nearest' → max-heap of size K keyed on the distance metric.",
        built: true,
        vizId: "k-closest-points",
        simplified: [
          "Given 2D points, return the <code>k</code> closest to the origin. No need for the actual square-root distance — comparing <strong>squared distances</strong> (<code>x² + y²</code>) gives the same ordering and avoids floating point.",
          "This is the mirror image of Kth Largest: keep a <strong>max-heap of size k</strong> holding the k closest points seen so far. Its root is the <em>farthest</em> of the kept points — the weakest link.",
          "Scan the points: fill the heap first, then only swap in a new point if it's <strong>closer</strong> than the current farthest kept point. At the end, the heap holds exactly the k closest."
        ],
        approach: [
          "Empty max-heap keyed by squared distance.",
          "For each point: if heap size &lt; k, push it.",
          "Else if its distance &lt; heap.peek()'s distance, pop the farthest and push this point.",
          "Otherwise discard.",
          "Return the heap's contents. O(n log k)."
        ],
        code: `import java.util.*;

class Solution {
    public int[][] kClosest(int[][] points, int k) {
        // max-heap ordered by descending squared distance (farthest kept point on top)
        PriorityQueue<int[]> heap = new PriorityQueue<>(
            (a, b) -> (b[0]*b[0] + b[1]*b[1]) - (a[0]*a[0] + a[1]*a[1])
        );

        for (int[] p : points) {
            if (heap.size() < k) {
                heap.offer(p);
            } else if (p[0]*p[0] + p[1]*p[1] < heap.peek()[0]*heap.peek()[0] + heap.peek()[1]*heap.peek()[1]) {
                heap.poll();          // drop the current farthest
                heap.offer(p);
            }
        }
        return heap.toArray(new int[0][]);
    }
}

public class Main {
    public static void main(String[] args) {
        int[][] points = {{1, 3}, {-2, 2}, {5, 8}, {0, 1}};
        int[][] closest = new Solution().kClosest(points, 2);
        System.out.println(Arrays.deepToString(closest));  // e.g. [[0, 1], [-2, 2]]
    }
}`,
        complexity: { time: "O(n log k)", space: "O(k)" }
      },
      {
        num: 295,
        title: "Find Median from Data Stream",
        slug: "find-median-from-data-stream",
        tier: "hard",
        trigger: "Running median / dynamic order statistic → two heaps (max-heap low half, min-heap high half).",
        built: true,
        vizId: "median-data-stream",
        simplified: [
          "Numbers arrive one at a time; after each one, report the <strong>median</strong> of everything seen so far. Re-sorting on every insert would be O(n log n) per number — too slow.",
          "Split the data into two balanced halves: a <strong>max-heap</strong> holding the smaller half (\"low\", so its root is the biggest of the small numbers) and a <strong>min-heap</strong> holding the larger half (\"high\", root is the smallest of the big numbers).",
          "Every value ≤ every value in the other heap by construction. Keep the two heaps' sizes within 1 of each other. The median is then just the root of the bigger heap, or the average of both roots if they're equal size — O(log n) per insert, O(1) per median query."
        ],
        approach: [
          "Insert the new value into <code>low</code> if it's ≤ <code>low</code>'s max (or <code>low</code> is empty), else into <code>high</code>.",
          "Rebalance: if one heap has more than 1 extra element, pop its root and push it to the other heap.",
          "If sizes are equal, median = average of both roots.",
          "If unequal, median = root of the larger heap.",
          "Each insert is O(log n); each median lookup is O(1)."
        ],
        code: `import java.util.*;

class MedianFinder {
    private PriorityQueue<Integer> low  = new PriorityQueue<>(Collections.reverseOrder()); // max-heap, smaller half
    private PriorityQueue<Integer> high = new PriorityQueue<>();                            // min-heap, larger half

    public void addNum(int num) {
        if (low.isEmpty() || num <= low.peek()) low.offer(num);
        else high.offer(num);

        // rebalance so the two halves differ in size by at most 1
        if (low.size() > high.size() + 1) high.offer(low.poll());
        else if (high.size() > low.size() + 1) low.offer(high.poll());
    }

    public double findMedian() {
        if (low.size() == high.size()) return (low.peek() + high.peek()) / 2.0;
        return low.size() > high.size() ? low.peek() : high.peek();
    }
}

public class Main {
    public static void main(String[] args) {
        MedianFinder mf = new MedianFinder();
        mf.addNum(1);
        mf.addNum(2);
        System.out.println(mf.findMedian());  // 1.5
        mf.addNum(3);
        System.out.println(mf.findMedian());  // 2.0
    }
}`,
        complexity: { time: "O(log n) add, O(1) median", space: "O(n)" }
      },
      {
        num: 23,
        title: "Merge k Sorted Lists",
        slug: "merge-k-sorted-lists",
        tier: "hard",
        trigger: "Merge K sorted sequences → min-heap holding one head per list.",
        built: true,
        vizId: "merge-k-lists",
        simplified: [
          "Merge <code>k</code> already-sorted linked lists into one sorted list. Merging two at a time pairwise works, but a <strong>min-heap</strong> generalizes the classic 2-way merge to k lists directly.",
          "Put the <strong>head node of every list</strong> into a min-heap keyed by value. The heap's minimum is always the smallest node among all current list heads.",
          "Pop that minimum, append it to the result, and push its <code>next</code> node (if any) back into the heap. Repeat until the heap is empty — the result comes out fully sorted."
        ],
        approach: [
          "Min-heap keyed by node value, seeded with each list's head (skip empty lists).",
          "While the heap isn't empty: pop the smallest node, append to the result list.",
          "If that node has a <code>next</code>, push it into the heap.",
          "Repeat until the heap empties.",
          "Each of the n total nodes is pushed/popped once → O(n log k)."
        ],
        code: `import java.util.*;

// Definition for singly-linked list.
class ListNode {
    int val;
    ListNode next;
    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}

class Solution {
    public ListNode mergeKLists(ListNode[] lists) {
        PriorityQueue<ListNode> heap = new PriorityQueue<>((a, b) -> a.val - b.val);
        for (ListNode node : lists) if (node != null) heap.offer(node);

        ListNode dummy = new ListNode(0), tail = dummy;
        while (!heap.isEmpty()) {
            ListNode smallest = heap.poll();
            tail.next = smallest;
            tail = tail.next;
            if (smallest.next != null) heap.offer(smallest.next);
        }
        return dummy.next;
    }
}

public class Main {
    public static void main(String[] args) {
        // three sorted lists: [1,4,5], [1,3,4], [2,6]
        ListNode[] lists = {
            build(new int[]{1, 4, 5}),
            build(new int[]{1, 3, 4}),
            build(new int[]{2, 6})
        };
        ListNode merged = new Solution().mergeKLists(lists);
        System.out.println(toList(merged));  // [1, 1, 2, 3, 4, 4, 5, 6]
    }

    // build a linked list from an array
    static ListNode build(int[] a) {
        ListNode dummy = new ListNode(0), t = dummy;
        for (int x : a) { t.next = new ListNode(x); t = t.next; }
        return dummy.next;
    }

    // linked list -> Java List for readable printing
    static List<Integer> toList(ListNode head) {
        List<Integer> out = new ArrayList<>();
        for (ListNode c = head; c != null; c = c.next) out.add(c.val);
        return out;
    }
}`,
        complexity: { time: "O(n log k)", space: "O(k)" }
      }
    ]
  },
  {
    id: "intervals",
    name: "Intervals",
    blurb: "Sort by an endpoint, then sweep — merge, insert, or count overlaps greedily.",
    questions: [
      {
        num: 56,
        title: "Merge Intervals",
        slug: "merge-intervals",
        tier: "medium",
        trigger: "Overlapping intervals → sort by start, merge when cur.start ≤ prev.end.",
        built: true,
        vizId: "merge-intervals",
        simplified: [
          "Given a list of intervals, merge all that <strong>overlap</strong> into single spanning intervals. Two intervals overlap if one starts before or exactly when the other ends.",
          "Overlap-checking is easy once the intervals are <strong>sorted by start</strong> — then any interval that could overlap the one you're building must appear right after it.",
          "Walk the sorted list keeping a 'current merged interval'. If the next interval's start is ≤ the current merged interval's end, fuse them (extend the end). Otherwise, the current merged interval is finished — start a new one."
        ],
        approach: [
          "Sort intervals by start time.",
          "Initialize the result with the first interval.",
          "For each subsequent interval: if it starts ≤ the last result's end, extend that result's end to the max of the two.",
          "Otherwise, append it as a new entry in the result.",
          "One pass after sorting → O(n log n) total."
        ],
        code: `import java.util.*;

class Solution {
    public int[][] merge(int[][] intervals) {
        Arrays.sort(intervals, (a, b) -> a[0] - b[0]);   // sort by start time
        List<int[]> result = new ArrayList<>();

        for (int[] iv : intervals) {
            if (result.isEmpty() || iv[0] > result.get(result.size() - 1)[1]) {
                result.add(iv);                                  // no overlap, start fresh
            } else {
                int[] last = result.get(result.size() - 1);
                last[1] = Math.max(last[1], iv[1]);               // fuse into the last group
            }
        }
        return result.toArray(new int[0][]);
    }
}

public class Main {
    public static void main(String[] args) {
        int[][] intervals = {{1, 3}, {2, 6}, {8, 10}, {15, 18}};
        System.out.println(Arrays.deepToString(new Solution().merge(intervals)));
        // [[1, 6], [8, 10], [15, 18]]
    }
}`,
        complexity: { time: "O(n log n)", space: "O(n)" }
      },
      {
        num: 57,
        title: "Insert Interval",
        slug: "insert-interval",
        tier: "medium",
        trigger: "Insert into a sorted non-overlapping set → three phases: before, merge-overlap, after.",
        built: true,
        vizId: "insert-interval",
        simplified: [
          "You're given a list of intervals that's already sorted and non-overlapping, plus one <strong>new interval</strong> to insert (and merge as needed). Since the input is already clean, you don't need to sort — just sweep once.",
          "Three phases as you scan left to right: intervals that end <strong>before</strong> the new one starts (untouched, copy as-is), intervals that <strong>overlap</strong> the new one (fuse them all into a single growing interval), and intervals that start <strong>after</strong> the fused interval ends (untouched, copy as-is).",
          "The 'overlap' phase is just repeatedly widening the new interval's start/end to swallow every interval that touches it, before dropping the final fused interval into the result."
        ],
        approach: [
          "Phase 1: while the next interval ends before the new interval starts, copy it to the result.",
          "Phase 2: while the next interval starts ≤ the new interval's (possibly already widened) end, fuse: widen new interval's start/end.",
          "Append the fully-widened new interval to the result.",
          "Phase 3: copy all remaining intervals as-is.",
          "Single linear scan → O(n)."
        ],
        code: `import java.util.*;

class Solution {
    public int[][] insert(int[][] intervals, int[] newInterval) {
        List<int[]> result = new ArrayList<>();
        int i = 0, n = intervals.length;

        while (i < n && intervals[i][1] < newInterval[0]) {   // ends before new starts
            result.add(intervals[i++]);
        }
        while (i < n && intervals[i][0] <= newInterval[1]) {   // overlaps new interval
            newInterval[0] = Math.min(newInterval[0], intervals[i][0]);
            newInterval[1] = Math.max(newInterval[1], intervals[i][1]);
            i++;
        }
        result.add(newInterval);
        while (i < n) result.add(intervals[i++]);              // starts after new ends

        return result.toArray(new int[0][]);
    }
}

public class Main {
    public static void main(String[] args) {
        int[][] intervals = {{1, 3}, {6, 9}};
        int[] newInterval = {2, 5};
        System.out.println(Arrays.deepToString(new Solution().insert(intervals, newInterval)));
        // [[1, 5], [6, 9]]
    }
}`,
        complexity: { time: "O(n)", space: "O(n)" }
      },
      {
        num: 435,
        title: "Non-overlapping Intervals",
        slug: "non-overlapping-intervals",
        tier: "medium",
        trigger: "Minimum removals to kill overlaps → sort by end, greedily keep the earliest-finishing.",
        built: true,
        vizId: "non-overlapping-intervals",
        simplified: [
          "Find the <strong>minimum number of intervals to remove</strong> so that none of the remaining ones overlap. Equivalent to maximizing how many you can keep.",
          "Classic greedy 'activity selection': sort by <strong>end time</strong>, not start. An interval that finishes earliest leaves the most room for everything after it, so it's always at least as good to keep the earliest-finishing option when a conflict arises.",
          "Walk the sorted list tracking the end time of the last interval you kept. If the next interval starts before that end, it overlaps — remove it (it necessarily finishes later than what you kept, since sorted by end). Otherwise keep it and update the tracked end."
        ],
        approach: [
          "Sort intervals by end time.",
          "<code>lastEnd = −∞</code>, <code>removed = 0</code>.",
          "For each interval: if its start &lt; <code>lastEnd</code>, it overlaps — <code>removed++</code> (discard it, keep the earlier-ending one already chosen).",
          "Otherwise, keep it: <code>lastEnd = interval.end</code>.",
          "One pass after sorting → O(n log n)."
        ],
        code: `import java.util.*;

class Solution {
    public int eraseOverlapIntervals(int[][] intervals) {
        Arrays.sort(intervals, (a, b) -> a[1] - b[1]);   // sort by END time
        int lastEnd = Integer.MIN_VALUE, removed = 0;

        for (int[] iv : intervals) {
            if (iv[0] < lastEnd) {
                removed++;                 // overlaps what we already kept - drop it
            } else {
                lastEnd = iv[1];           // no overlap - keep it
            }
        }
        return removed;
    }
}

public class Main {
    public static void main(String[] args) {
        int[][] intervals = {{1, 2}, {2, 3}, {3, 4}, {1, 3}};
        System.out.println(new Solution().eraseOverlapIntervals(intervals));  // 1
    }
}`,
        complexity: { time: "O(n log n)", space: "O(1)" }
      },
      {
        num: 253,
        title: "Meeting Rooms II",
        slug: "meeting-rooms-ii",
        tier: "medium",
        trigger: "Max concurrent intervals / min resources → split starts & ends, or min-heap of end times.",
        built: true,
        vizId: "meeting-rooms-ii",
        simplified: [
          "Given meeting time intervals, find the <strong>minimum number of rooms</strong> needed so no two overlapping meetings share a room. That's the same as asking: what's the peak number of meetings happening <em>at the same instant</em>?",
          "Split every interval into two <strong>events</strong> — a start and an end — and sort starts and ends <strong>separately</strong>. Then sweep through time: process whichever event (start or end) comes next.",
          "A start bumps a running 'active rooms' counter up; an end frees a room, bumping it down. The <strong>highest value</strong> that counter ever reaches during the sweep is the answer — the maximum overlap, hence minimum rooms."
        ],
        approach: [
          "Extract all start times into one sorted array, all end times into another.",
          "Two pointers <code>s, e</code> over each; <code>active = 0</code>, <code>peak = 0</code>.",
          "While events remain: if <code>starts[s] &lt; ends[e]</code>, a meeting starts — <code>active++</code>, update <code>peak</code>, advance <code>s</code>.",
          "Otherwise a meeting ends — <code>active--</code>, advance <code>e</code>. (Ties process the end first, freeing the room.)",
          "Return <code>peak</code>. O(n log n) for the sort, O(n) for the sweep."
        ],
        code: `import java.util.*;

class Solution {
    public int minMeetingRooms(int[][] intervals) {
        int n = intervals.length;
        int[] starts = new int[n], ends = new int[n];
        for (int i = 0; i < n; i++) { starts[i] = intervals[i][0]; ends[i] = intervals[i][1]; }
        Arrays.sort(starts);
        Arrays.sort(ends);

        int s = 0, e = 0, active = 0, peak = 0;
        while (s < n) {
            if (starts[s] < ends[e]) {
                active++;                          // a meeting starts -> need a room
                peak = Math.max(peak, active);
                s++;
            } else {
                active--;                          // a meeting ends -> free a room
                e++;
            }
        }
        return peak;
    }
}

public class Main {
    public static void main(String[] args) {
        int[][] meetings = {{0, 30}, {5, 10}, {15, 20}};
        System.out.println(new Solution().minMeetingRooms(meetings));  // 2
    }
}`,
        complexity: { time: "O(n log n)", space: "O(n)" }
      }
    ]
  },
  {
    id: "linked-list",
    name: "Linked List",
    blurb: "Pointer choreography — reverse in place, detect cycles, find the middle.",
    questions: [
      {
        num: 206,
        title: "Reverse Linked List",
        slug: "reverse-linked-list",
        tier: "easy",
        trigger: "Reverse pointers in place → iterative prev / curr / next three-pointer dance.",
        built: true,
        vizId: "reverse-linked-list",
        simplified: [
          "Reverse a singly linked list so it points the other way, using only <strong>pointer surgery</strong> — no new nodes, no arrays.",
          "The trick is a <strong>three-pointer dance</strong>: <code>prev</code> (what's already reversed, starts null), <code>curr</code> (the node being flipped), and <code>next</code> (saved before you overwrite curr's link, so you don't lose the rest of the list).",
          "At each node: save <code>next</code>, point <code>curr.next</code> backward to <code>prev</code>, then slide both <code>prev</code> and <code>curr</code> forward by one. When <code>curr</code> falls off the end, <code>prev</code> is the new head."
        ],
        approach: [
          "<code>prev = null</code>, <code>curr = head</code>.",
          "While <code>curr != null</code>: save <code>next = curr.next</code>.",
          "Flip the link: <code>curr.next = prev</code>.",
          "Slide forward: <code>prev = curr</code>, <code>curr = next</code>.",
          "When the loop ends, <code>prev</code> is the new head. One pass → O(n)."
        ],
        code: `import java.util.*;

// Definition for singly-linked list.
class ListNode {
    int val;
    ListNode next;
    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}

class Solution {
    public ListNode reverseList(ListNode head) {
        ListNode prev = null, curr = head;

        while (curr != null) {
            ListNode next = curr.next;   // save before overwriting
            curr.next = prev;            // flip the link backward
            prev = curr;                 // slide prev forward
            curr = next;                 // slide curr forward
        }
        return prev;   // new head
    }
}

public class Main {
    public static void main(String[] args) {
        ListNode head = build(new int[]{1, 2, 3, 4, 5});
        ListNode reversed = new Solution().reverseList(head);
        System.out.println(toList(reversed));  // [5, 4, 3, 2, 1]
    }

    // build a linked list from an array
    static ListNode build(int[] a) {
        ListNode dummy = new ListNode(0), t = dummy;
        for (int x : a) { t.next = new ListNode(x); t = t.next; }
        return dummy.next;
    }

    // linked list -> Java List for readable printing
    static List<Integer> toList(ListNode head) {
        List<Integer> out = new ArrayList<>();
        for (ListNode c = head; c != null; c = c.next) out.add(c.val);
        return out;
    }
}`,
        complexity: { time: "O(n)", space: "O(1)" }
      },
      {
        num: 141,
        title: "Linked List Cycle",
        slug: "linked-list-cycle",
        tier: "easy",
        trigger: "Detect a loop → Floyd's fast & slow pointers meet inside the cycle.",
        built: true,
        vizId: "linked-list-cycle",
        simplified: [
          "Determine whether a linked list has a <strong>cycle</strong> — some node's <code>next</code> eventually loops back to an earlier node instead of ending at null.",
          "<strong>Floyd's Tortoise and Hare</strong>: run two pointers, <code>slow</code> moving 1 hop at a time and <code>fast</code> moving 2. If there's no cycle, <code>fast</code> simply reaches the end (null) first.",
          "If there <em>is</em> a cycle, both pointers are trapped inside it forever — and because <code>fast</code> gains one extra hop on <code>slow</code> every step, it's guaranteed to eventually <strong>lap</strong> and land on the exact same node as <code>slow</code>. That collision is the signal."
        ],
        approach: [
          "<code>slow = head</code>, <code>fast = head</code>.",
          "While <code>fast != null</code> and <code>fast.next != null</code>: <code>slow = slow.next</code>, <code>fast = fast.next.next</code>.",
          "If <code>slow == fast</code> at any point, return true (cycle found).",
          "If the loop exits normally (fast hit null), return false.",
          "O(n) time, O(1) space — no extra data structure needed to track visited nodes."
        ],
        code: `import java.util.*;

// Definition for singly-linked list.
class ListNode {
    int val;
    ListNode next;
    ListNode(int val) { this.val = val; }
}

class Solution {
    public boolean hasCycle(ListNode head) {
        ListNode slow = head, fast = head;

        while (fast != null && fast.next != null) {
            slow = slow.next;          // 1 hop
            fast = fast.next.next;     // 2 hops

            if (slow == fast) return true;   // fast lapped slow inside a loop
        }
        return false;   // fast reached null - no cycle
    }
}

public class Main {
    public static void main(String[] args) {
        // 3 -> 2 -> 0 -> -4, with the tail pointing back to node "2" (a cycle)
        ListNode a = new ListNode(3), b = new ListNode(2), c = new ListNode(0), d = new ListNode(-4);
        a.next = b; b.next = c; c.next = d; d.next = b;   // d links back to b
        System.out.println(new Solution().hasCycle(a));   // true
    }
}`,
        complexity: { time: "O(n)", space: "O(1)" }
      },
      {
        num: 19,
        title: "Remove Nth Node From End of List",
        slug: "remove-nth-node-from-end-of-list",
        tier: "medium",
        trigger: "Kth-from-end in one pass → two pointers with a fixed N-gap + dummy head.",
        built: true,
        vizId: "remove-nth-from-end",
        simplified: [
          "Remove the <code>n</code>-th node <strong>counting from the end</strong> of a linked list, in a <strong>single pass</strong> (no separate 'count the length' pass, and no second traversal).",
          "Use a <strong>dummy node</strong> before the head (handles the edge case of removing the head itself cleanly), then two pointers separated by a <strong>fixed gap of n+1</strong>: advance <code>fast</code> alone first to create that gap.",
          "Once the gap is set, move <code>slow</code> and <code>fast</code> together. When <code>fast</code> falls off the end (null), <code>slow</code> is sitting exactly one node before the target — bridge <code>slow.next</code> past it to delete it."
        ],
        approach: [
          "Create a <code>dummy</code> node pointing at <code>head</code>; <code>slow = fast = dummy</code>.",
          "Advance <code>fast</code> by <code>n + 1</code> steps to open the gap.",
          "While <code>fast != null</code>: advance both <code>slow</code> and <code>fast</code> one step at a time.",
          "When <code>fast</code> reaches null, <code>slow.next</code> is the node to remove — set <code>slow.next = slow.next.next</code>.",
          "Return <code>dummy.next</code> (handles removing the head). Single pass → O(n)."
        ],
        code: `import java.util.*;

// Definition for singly-linked list.
class ListNode {
    int val;
    ListNode next;
    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}

class Solution {
    public ListNode removeNthFromEnd(ListNode head, int n) {
        ListNode dummy = new ListNode(0, head);
        ListNode slow = dummy, fast = dummy;

        for (int i = 0; i < n + 1; i++) fast = fast.next;   // open the gap

        while (fast != null) {       // move together, gap stays fixed
            slow = slow.next;
            fast = fast.next;
        }
        slow.next = slow.next.next;  // bridge past the target node

        return dummy.next;
    }
}

public class Main {
    public static void main(String[] args) {
        ListNode head = build(new int[]{1, 2, 3, 4, 5});
        ListNode result = new Solution().removeNthFromEnd(head, 2);
        System.out.println(toList(result));  // [1, 2, 3, 5]
    }

    static ListNode build(int[] a) {
        ListNode dummy = new ListNode(0), t = dummy;
        for (int x : a) { t.next = new ListNode(x); t = t.next; }
        return dummy.next;
    }

    static List<Integer> toList(ListNode head) {
        List<Integer> out = new ArrayList<>();
        for (ListNode c = head; c != null; c = c.next) out.add(c.val);
        return out;
    }
}`,
        complexity: { time: "O(n)", space: "O(1)" }
      },
      {
        num: 143,
        title: "Reorder List",
        slug: "reorder-list",
        tier: "medium",
        trigger: "Restructure / fold a list → find middle (fast/slow), reverse second half, merge alternately.",
        built: true,
        vizId: "reorder-list",
        simplified: [
          "Reorder <code>L0 → L1 → ... → Ln</code> into the zig-zag <code>L0 → Ln → L1 → Ln-1 → ...</code> — in place, no extra array of nodes.",
          "Three clean phases: (1) find the <strong>middle</strong> with fast/slow pointers, (2) <strong>reverse</strong> the second half in place (turns 'take from the back' into 'take from the front of the reversed half'), (3) <strong>merge</strong> the two halves by alternating one node from each.",
          "Each phase is a technique you already know — the insight is that <em>chaining</em> them turns an awkward 'access from both ends' problem into three easy linear passes."
        ],
        approach: [
          "Find the middle: <code>slow</code>/<code>fast</code> pointers, <code>slow</code> ends at the middle when <code>fast</code> reaches the end.",
          "Split the list at the middle; reverse the second half in place (classic iterative reversal).",
          "Merge: alternately splice a node from the first half, then a node from the reversed second half.",
          "Stop when one half is exhausted; the last first-half node's <code>next</code> should point to null.",
          "Three linear passes → O(n) time, O(1) extra space."
        ],
        code: `import java.util.*;

// Definition for singly-linked list.
class ListNode {
    int val;
    ListNode next;
    ListNode(int val) { this.val = val; }
}

class Solution {
    public void reorderList(ListNode head) {
        if (head == null || head.next == null) return;

        // 1) find the middle
        ListNode slow = head, fast = head;
        while (fast.next != null && fast.next.next != null) {
            slow = slow.next; fast = fast.next.next;
        }

        // 2) reverse the second half
        ListNode second = slow.next;
        slow.next = null;
        ListNode prev = null;
        while (second != null) {
            ListNode next = second.next;
            second.next = prev;
            prev = second;
            second = next;
        }

        // 3) merge the two halves alternately
        ListNode first = head, secondHalf = prev;
        while (secondHalf != null) {
            ListNode n1 = first.next, n2 = secondHalf.next;
            first.next = secondHalf;
            secondHalf.next = n1;
            first = n1;
            secondHalf = n2;
        }
    }
}

public class Main {
    public static void main(String[] args) {
        ListNode head = build(new int[]{1, 2, 3, 4, 5});
        new Solution().reorderList(head);   // reorders in place
        System.out.println(toList(head));   // [1, 5, 2, 4, 3]
    }

    static ListNode build(int[] a) {
        ListNode dummy = new ListNode(0), t = dummy;
        for (int x : a) { t.next = new ListNode(x); t = t.next; }
        return dummy.next;
    }

    static List<Integer> toList(ListNode head) {
        List<Integer> out = new ArrayList<>();
        for (ListNode c = head; c != null; c = c.next) out.add(c.val);
        return out;
    }
}`,
        complexity: { time: "O(n)", space: "O(1)" }
      }
    ]
  },
  {
    id: "trees",
    name: "Trees (DFS / BFS)",
    blurb: "Recurse down or sweep level-by-level — the two lenses for every tree problem.",
    questions: [
      {
        num: 102,
        title: "Binary Tree Level Order Traversal",
        slug: "binary-tree-level-order-traversal",
        tier: "medium",
        trigger: "Process nodes level-by-level → BFS with a queue, sizing each level.",
        built: true,
        vizId: "level-order-traversal",
        simplified: [
          "Return the tree's values grouped <strong>level by level</strong>, top to bottom, left to right within each level.",
          "This is a textbook <strong>BFS</strong>: a queue naturally processes nodes in level order. The trick is knowing where one level ends and the next begins — snapshot the queue's current size before you start popping, and pop exactly that many.",
          "For each of those popped nodes, collect its value and push its children (for the <em>next</em> level). Once you've popped the snapshotted count, that level's list is complete."
        ],
        approach: [
          "Queue starts with just the root (if it exists).",
          "While the queue isn't empty: record <code>size = queue.length</code> — that's exactly this level's node count.",
          "Pop <code>size</code> nodes, collecting their values into a level list and pushing their children.",
          "Append the level list to the result.",
          "Repeat until the queue empties. O(n) — every node is visited once."
        ],
        code: `import java.util.*;

// Definition for a binary tree node.
class TreeNode {
    int val;
    TreeNode left, right;
    TreeNode(int val) { this.val = val; }
}

class Solution {
    public List<List<Integer>> levelOrder(TreeNode root) {
        List<List<Integer>> result = new ArrayList<>();
        if (root == null) return result;

        Queue<TreeNode> queue = new LinkedList<>();
        queue.offer(root);

        while (!queue.isEmpty()) {
            int size = queue.size();          // exactly this level's node count
            List<Integer> level = new ArrayList<>();

            for (int i = 0; i < size; i++) {
                TreeNode node = queue.poll();
                level.add(node.val);
                if (node.left != null) queue.offer(node.left);
                if (node.right != null) queue.offer(node.right);
            }
            result.add(level);
        }
        return result;
    }
}

public class Main {
    public static void main(String[] args) {
        //     3
        //    / \\
        //   9  20
        //      / \\
        //    15   7
        TreeNode root = buildTree(new Integer[]{3, 9, 20, null, null, 15, 7});
        System.out.println(new Solution().levelOrder(root));  // [[3], [9, 20], [15, 7]]
    }

    // build a tree from a level-order array (null = missing child)
    static TreeNode buildTree(Integer[] a) {
        if (a.length == 0 || a[0] == null) return null;
        TreeNode root = new TreeNode(a[0]);
        Queue<TreeNode> q = new LinkedList<>();
        q.offer(root);
        int i = 1;
        while (i < a.length) {
            TreeNode node = q.poll();
            if (i < a.length && a[i] != null) { node.left  = new TreeNode(a[i]); q.offer(node.left);  }
            i++;
            if (i < a.length && a[i] != null) { node.right = new TreeNode(a[i]); q.offer(node.right); }
            i++;
        }
        return root;
    }
}`,
        complexity: { time: "O(n)", space: "O(n)" }
      },
      {
        num: 98,
        title: "Validate Binary Search Tree",
        slug: "validate-binary-search-tree",
        tier: "medium",
        trigger: "Check the BST property → in-order must be strictly increasing (or pass down (min, max) bounds).",
        built: true,
        vizId: "validate-bst",
        simplified: [
          "Check whether a binary tree satisfies the <strong>BST property</strong>: every node's value must be strictly greater than <em>everything</em> in its left subtree and strictly less than <em>everything</em> in its right subtree — not just its immediate children.",
          "That 'everything below' part is the trap — comparing a node only to its direct children misses violations further down. The fix: pass a <strong>valid (min, max) range</strong> down through the recursion.",
          "The root has no bound (−∞, +∞). Going left tightens the upper bound to the parent's value; going right tightens the lower bound. If any node falls outside its inherited range, the tree is invalid."
        ],
        approach: [
          "Recursive helper <code>valid(node, lo, hi)</code>, called initially with <code>(root, −∞, +∞)</code>.",
          "If <code>node</code> is null, return true (empty subtree is trivially valid).",
          "If <code>node.val ≤ lo</code> or <code>node.val ≥ hi</code>, return false.",
          "Recurse: <code>valid(node.left, lo, node.val)</code> and <code>valid(node.right, node.val, hi)</code>.",
          "Both must be true. One pass → O(n)."
        ],
        code: `import java.util.*;

// Definition for a binary tree node.
class TreeNode {
    int val;
    TreeNode left, right;
    TreeNode(int val) { this.val = val; }
}

class Solution {
    public boolean isValidBST(TreeNode root) {
        return valid(root, null, null);
    }

    private boolean valid(TreeNode node, Integer lo, Integer hi) {
        if (node == null) return true;
        if ((lo != null && node.val <= lo) || (hi != null && node.val >= hi)) {
            return false;
        }
        return valid(node.left, lo, node.val) && valid(node.right, node.val, hi);
    }
}

public class Main {
    public static void main(String[] args) {
        // level-order {5, 3, 8, 1, 4, 7, 9} -> a valid BST
        TreeNode root = buildTree(new Integer[]{5, 3, 8, 1, 4, 7, 9});
        System.out.println(new Solution().isValidBST(root));  // true
    }

    // build a tree from a level-order array (null = missing child)
    static TreeNode buildTree(Integer[] a) {
        if (a.length == 0 || a[0] == null) return null;
        TreeNode root = new TreeNode(a[0]);
        Queue<TreeNode> q = new LinkedList<>();
        q.offer(root);
        int i = 1;
        while (i < a.length) {
            TreeNode node = q.poll();
            if (i < a.length && a[i] != null) { node.left  = new TreeNode(a[i]); q.offer(node.left);  }
            i++;
            if (i < a.length && a[i] != null) { node.right = new TreeNode(a[i]); q.offer(node.right); }
            i++;
        }
        return root;
    }
}`,
        complexity: { time: "O(n)", space: "O(h) recursion, h = height" }
      },
      {
        num: 199,
        title: "Binary Tree Right Side View",
        slug: "binary-tree-right-side-view",
        tier: "medium",
        trigger: "'Visible from the side' / last node per level → BFS taking the last element of each level.",
        built: true,
        vizId: "right-side-view",
        simplified: [
          "Imagine standing to the <strong>right</strong> of the tree — return the values you'd see, one per level, top to bottom.",
          "Same BFS-by-level idea as Level Order Traversal, except you don't need every value in a level — just the <strong>rightmost</strong> one, since it's the last thing blocking your view of everything behind it.",
          "Process each level as a queue batch (same size-snapshot trick), and simply keep the <em>last</em> node's value processed in that batch."
        ],
        approach: [
          "Queue starts with the root.",
          "While the queue isn't empty: snapshot <code>size = queue.length</code>.",
          "Pop <code>size</code> nodes; the <strong>last one popped</strong> in this batch is the rightmost of the level — record its value.",
          "Push all children as usual for the next level.",
          "Repeat until the queue is empty. O(n)."
        ],
        code: `import java.util.*;

// Definition for a binary tree node.
class TreeNode {
    int val;
    TreeNode left, right;
    TreeNode(int val) { this.val = val; }
}

class Solution {
    public List<Integer> rightSideView(TreeNode root) {
        List<Integer> result = new ArrayList<>();
        if (root == null) return result;

        Queue<TreeNode> queue = new LinkedList<>();
        queue.offer(root);

        while (!queue.isEmpty()) {
            int size = queue.size();
            for (int i = 0; i < size; i++) {
                TreeNode node = queue.poll();
                if (i == size - 1) result.add(node.val);   // rightmost of this level
                if (node.left != null) queue.offer(node.left);
                if (node.right != null) queue.offer(node.right);
            }
        }
        return result;
    }
}

public class Main {
    public static void main(String[] args) {
        // level-order {1, 2, 3, null, 5, null, 4}
        TreeNode root = buildTree(new Integer[]{1, 2, 3, null, 5, null, 4});
        System.out.println(new Solution().rightSideView(root));  // [1, 3, 4]
    }

    static TreeNode buildTree(Integer[] a) {
        if (a.length == 0 || a[0] == null) return null;
        TreeNode root = new TreeNode(a[0]);
        Queue<TreeNode> q = new LinkedList<>();
        q.offer(root);
        int i = 1;
        while (i < a.length) {
            TreeNode node = q.poll();
            if (i < a.length && a[i] != null) { node.left  = new TreeNode(a[i]); q.offer(node.left);  }
            i++;
            if (i < a.length && a[i] != null) { node.right = new TreeNode(a[i]); q.offer(node.right); }
            i++;
        }
        return root;
    }
}`,
        complexity: { time: "O(n)", space: "O(n)" }
      },
      {
        num: 236,
        title: "Lowest Common Ancestor of a Binary Tree",
        slug: "lowest-common-ancestor-of-a-binary-tree",
        tier: "medium",
        trigger: "Find a meeting / split node → post-order recursion returning whether each target lies below.",
        built: true,
        vizId: "lowest-common-ancestor",
        simplified: [
          "Given two nodes <code>p</code> and <code>q</code> in a binary tree (not necessarily a BST), find their <strong>lowest common ancestor</strong> — the deepest node that has both somewhere in its subtree.",
          "Use <strong>post-order recursion</strong>: each call reports upward whether <code>p</code> or <code>q</code> (or both) were found anywhere in that subtree. Recurse left, recurse right, then check the current node.",
          "The magic moment: if a node's <strong>left</strong> subtree reports finding one target and its <strong>right</strong> subtree reports finding the other (or the node itself is one of the targets and one side finds the other), that node is exactly where the two paths <strong>split</strong> — the LCA."
        ],
        approach: [
          "Base case: if <code>node</code> is null or equals <code>p</code>/<code>q</code>, return <code>node</code> (a found signal).",
          "Recurse: <code>left = lca(node.left, p, q)</code>, <code>right = lca(node.right, p, q)</code>.",
          "If both <code>left</code> and <code>right</code> are non-null, <code>node</code> is the split point — return <code>node</code>.",
          "Otherwise return whichever of <code>left</code>/<code>right</code> is non-null (the found target bubbles up).",
          "Single pass → O(n)."
        ],
        code: `import java.util.*;

// Definition for a binary tree node.
class TreeNode {
    int val;
    TreeNode left, right;
    TreeNode(int val) { this.val = val; }
}

class Solution {
    public TreeNode lowestCommonAncestor(TreeNode node, TreeNode p, TreeNode q) {
        if (node == null || node == p || node == q) return node;

        TreeNode left = lowestCommonAncestor(node.left, p, q);
        TreeNode right = lowestCommonAncestor(node.right, p, q);

        if (left != null && right != null) return node;   // split point found here
        return left != null ? left : right;                // bubble up whichever side found something
    }
}

public class Main {
    public static void main(String[] args) {
        //        3
        //      5   1        (built by hand so we can hold node references)
        //    6  2
        TreeNode root = new TreeNode(3);
        TreeNode five = new TreeNode(5), one = new TreeNode(1);
        TreeNode six = new TreeNode(6), two = new TreeNode(2);
        root.left = five; root.right = one;
        five.left = six;  five.right = two;

        TreeNode lca = new Solution().lowestCommonAncestor(root, six, two);
        System.out.println(lca.val);  // 5
    }
}`,
        complexity: { time: "O(n)", space: "O(h) recursion" }
      },
      {
        num: 124,
        title: "Binary Tree Maximum Path Sum",
        slug: "binary-tree-maximum-path-sum",
        tier: "hard",
        trigger: "Best path through the tree → post-order DP returning best downward gain, update a global max per node.",
        built: true,
        vizId: "max-path-sum",
        simplified: [
          "Find the maximum sum of any <strong>path</strong> in the tree, where a path can start and end anywhere and may <strong>bend once</strong> at some node (going up one child then down the other) — it does not have to pass through the root or go strictly downward.",
          "For any single node, its best contribution <strong>upward</strong> to a parent's path is: its own value plus the better of its two children's gains (you can only continue the path through one side once you go up). Negative gains are worthless, so clamp them to 0.",
          "But the best path <strong>through</strong> this node (as the bend point) can use <em>both</em> children's gains at once — that's a candidate for the global answer, even though only one side of it can be reported upward to the node's own parent."
        ],
        approach: [
          "Post-order recursive helper returning the node's best <strong>downward gain</strong>.",
          "<code>leftGain = max(dfs(node.left), 0)</code>, <code>rightGain = max(dfs(node.right), 0)</code> — clamp negatives to 0.",
          "Update the global best: <code>best = max(best, node.val + leftGain + rightGain)</code> (the 'bend through this node' candidate).",
          "Return <code>node.val + max(leftGain, rightGain)</code> upward — only one branch can continue.",
          "One pass, O(n); the global <code>best</code> is the answer."
        ],
        code: `import java.util.*;

// Definition for a binary tree node.
class TreeNode {
    int val;
    TreeNode left, right;
    TreeNode(int val) { this.val = val; }
}

class Solution {
    private int best = Integer.MIN_VALUE;

    public int maxPathSum(TreeNode root) {
        dfs(root);
        return best;
    }

    private int dfs(TreeNode node) {
        if (node == null) return 0;

        int leftGain = Math.max(dfs(node.left), 0);    // negative gains aren't worth taking
        int rightGain = Math.max(dfs(node.right), 0);

        best = Math.max(best, node.val + leftGain + rightGain);  // path bending through node

        return node.val + Math.max(leftGain, rightGain);          // only one side continues upward
    }
}

public class Main {
    public static void main(String[] args) {
        // level-order {-10, 9, 20, null, null, 15, 7}
        TreeNode root = buildTree(new Integer[]{-10, 9, 20, null, null, 15, 7});
        System.out.println(new Solution().maxPathSum(root));  // 42  (15 -> 20 -> 7)
    }

    static TreeNode buildTree(Integer[] a) {
        if (a.length == 0 || a[0] == null) return null;
        TreeNode root = new TreeNode(a[0]);
        Queue<TreeNode> q = new LinkedList<>();
        q.offer(root);
        int i = 1;
        while (i < a.length) {
            TreeNode node = q.poll();
            if (i < a.length && a[i] != null) { node.left  = new TreeNode(a[i]); q.offer(node.left);  }
            i++;
            if (i < a.length && a[i] != null) { node.right = new TreeNode(a[i]); q.offer(node.right); }
            i++;
        }
        return root;
    }
}`,
        complexity: { time: "O(n)", space: "O(h) recursion" }
      },
      {
        num: 297,
        title: "Serialize and Deserialize Binary Tree",
        slug: "serialize-and-deserialize-binary-tree",
        tier: "hard",
        trigger: "Encode / rebuild a tree → preorder DFS with explicit null markers.",
        built: true,
        vizId: "serialize-tree",
        simplified: [
          "Design an encoding that turns a binary tree into a string, and a matching decoder that rebuilds the <strong>exact same tree</strong> from that string.",
          "A plain level-order or in-order list is ambiguous without extra shape information. The fix: use <strong>preorder DFS</strong> (node, then left, then right) and explicitly emit a marker like <code>\"#\"</code> for every <strong>null child</strong> encountered.",
          "With null markers included, the preorder sequence uniquely determines the tree's shape — decoding just replays the same preorder recursion, consuming tokens one at a time and stopping the moment a \"#\" is seen."
        ],
        approach: [
          "<strong>Serialize:</strong> preorder DFS. If <code>node</code> is null, append <code>\"#\"</code>. Otherwise append <code>node.val</code>, then recurse left, then right. Join with commas.",
          "<strong>Deserialize:</strong> split the string into tokens, use an index/queue to consume them in order.",
          "Recursive helper: if the next token is <code>\"#\"</code>, consume it and return null.",
          "Otherwise create a node with that value, then recursively build its left and right children from the remaining tokens.",
          "Both directions are O(n)."
        ],
        code: `import java.util.*;

// Definition for a binary tree node.
class TreeNode {
    int val;
    TreeNode left, right;
    TreeNode(int val) { this.val = val; }
}

class Codec {
    public String serialize(TreeNode root) {
        StringBuilder sb = new StringBuilder();
        build(root, sb);
        return sb.toString();
    }

    private void build(TreeNode node, StringBuilder sb) {
        if (node == null) { sb.append("#,"); return; }
        sb.append(node.val).append(",");
        build(node.left, sb);
        build(node.right, sb);
    }

    public TreeNode deserialize(String data) {
        Queue<String> tokens = new LinkedList<>(Arrays.asList(data.split(",")));
        return rebuild(tokens);
    }

    private TreeNode rebuild(Queue<String> tokens) {
        String val = tokens.poll();
        if (val.equals("#")) return null;

        TreeNode node = new TreeNode(Integer.parseInt(val));
        node.left = rebuild(tokens);
        node.right = rebuild(tokens);
        return node;
    }
}

public class Main {
    public static void main(String[] args) {
        //   1
        //  2 3
        //   4 5
        TreeNode root = new TreeNode(1);
        root.left = new TreeNode(2);
        root.right = new TreeNode(3);
        root.right.left = new TreeNode(4);
        root.right.right = new TreeNode(5);

        Codec codec = new Codec();
        String encoded = codec.serialize(root);
        System.out.println(encoded);                    // 1,2,#,#,3,4,#,#,5,#,#,
        TreeNode rebuilt = codec.deserialize(encoded);
        System.out.println(codec.serialize(rebuilt));   // same string -> round-trip works
    }
}`,
        complexity: { time: "O(n) both ways", space: "O(n)" }
      }
    ]
  },
  {
    id: "graphs",
    name: "Graphs",
    blurb: "Flood fill, topological order, multi-source BFS, and weighted shortest paths.",
    questions: [
      {
        num: 200,
        title: "Number of Islands",
        slug: "number-of-islands",
        tier: "medium",
        trigger: "Count connected regions in a grid → flood fill (DFS/BFS), mark visited cells.",
        built: true,
        vizId: "number-of-islands",
        simplified: [
          "A grid of <code>'1'</code> (land) and <code>'0'</code> (water). Count the <strong>islands</strong> — groups of land tiles joined horizontally or vertically.",
          "Scan the grid tile by tile. The moment you hit a piece of land that hasn't been visited, that's the corner of a <strong>brand-new island</strong> — add one to the count.",
          "Then <strong>flood fill</strong> from that tile: spread out to every connected land tile and mark it visited, so the rest of that same island is never counted again. Continue the scan until every tile is accounted for."
        ],
        approach: [
          "Walk every cell <code>(r, c)</code> of the grid.",
          "If it's land (<code>'1'</code>) and not yet visited, increment the island count.",
          "Flood fill from it (DFS or BFS), marking each reachable land tile visited.",
          "Water tiles and already-visited land are skipped.",
          "Every tile is touched a constant number of times → O(rows × cols)."
        ],
        code: `import java.util.*;

class Solution {
    public int numIslands(char[][] grid) {
        int rows = grid.length, cols = grid[0].length, count = 0;

        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == '1') {   // unvisited land -> new island
                    count++;
                    flood(grid, r, c);
                }
            }
        }
        return count;
    }

    private void flood(char[][] grid, int r, int c) {
        if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length || grid[r][c] != '1') return;
        grid[r][c] = '0';                  // sink it so it isn't revisited
        flood(grid, r + 1, c);
        flood(grid, r - 1, c);
        flood(grid, r, c + 1);
        flood(grid, r, c - 1);
    }
}

public class Main {
    public static void main(String[] args) {
        char[][] grid = {
            {'1','1','0','0','0'},
            {'1','1','0','0','0'},
            {'0','0','1','0','0'},
            {'0','0','0','1','1'}
        };
        System.out.println(new Solution().numIslands(grid));  // 3
    }
}`,
        complexity: { time: "O(rows × cols)", space: "O(rows × cols) recursion worst case" }
      },
      {
        num: 133,
        title: "Clone Graph",
        slug: "clone-graph",
        tier: "medium",
        trigger: "Deep-copy a graph → DFS/BFS with a visited → clone map to handle cycles.",
        built: true,
        vizId: "clone-graph",
        simplified: [
          "Given a reference to a node in a connected undirected graph, build a <strong>deep copy</strong> — brand-new nodes with the same values and the same connections.",
          "The danger is <strong>cycles</strong>: naively following edges would loop forever and duplicate nodes. The fix is a map from <strong>original node → its clone</strong>.",
          "DFS from the start node. The first time you see a node, create its clone and record it in the map, then recurse to copy its neighbours. If you reach a node that's <em>already</em> in the map, just reuse that existing clone — that's what stops the recursion from looping."
        ],
        approach: [
          "Keep a map <code>original → clone</code>.",
          "On visiting a node: if it's already cloned, return the stored clone.",
          "Otherwise create its clone and store it <em>before</em> recursing (so cycles terminate).",
          "Recurse into each neighbour, wiring the returned clones into the copy's neighbour list.",
          "Every node and edge is processed once → O(V + E)."
        ],
        code: `import java.util.*;

// Definition for a graph node.
class Node {
    public int val;
    public List<Node> neighbors;
    public Node(int val) {
        this.val = val;
        this.neighbors = new ArrayList<>();
    }
}

class Solution {
    public Node cloneGraph(Node node) {
        if (node == null) return null;
        return dfs(node, new HashMap<>());
    }

    private Node dfs(Node node, Map<Node, Node> clones) {
        if (clones.containsKey(node)) return clones.get(node);

        Node copy = new Node(node.val);
        clones.put(node, copy);                 // register before recursing -> breaks cycles
        for (Node nei : node.neighbors) {
            copy.neighbors.add(dfs(nei, clones));
        }
        return copy;
    }
}

public class Main {
    public static void main(String[] args) {
        // square graph: 1-2, 2-3, 3-4, 4-1
        Node n1 = new Node(1), n2 = new Node(2), n3 = new Node(3), n4 = new Node(4);
        n1.neighbors.addAll(Arrays.asList(n2, n4));
        n2.neighbors.addAll(Arrays.asList(n1, n3));
        n3.neighbors.addAll(Arrays.asList(n2, n4));
        n4.neighbors.addAll(Arrays.asList(n1, n3));

        Node clone = new Solution().cloneGraph(n1);
        System.out.println(clone != n1);              // true  (a brand-new object)
        System.out.println(clone.val);                // 1
        System.out.println(clone.neighbors.size());   // 2
    }
}`,
        complexity: { time: "O(V + E)", space: "O(V)" }
      },
      {
        num: 207,
        title: "Course Schedule",
        slug: "course-schedule",
        tier: "medium",
        trigger: "Prerequisites / valid ordering / cycle detection → topological sort (Kahn's in-degree BFS or DFS coloring).",
        built: true,
        vizId: "course-schedule",
        simplified: [
          "You have courses and prerequisite pairs. Can you finish all of them? You can only take a course once its prerequisites are done — so the question is really: does the prerequisite graph have a <strong>cycle</strong>?",
          "Model it as a directed graph (prereq → course) and use <strong>Kahn's algorithm</strong>. Each course's <strong>in-degree</strong> is how many prerequisites it still needs.",
          "Repeatedly take any course with in-degree 0 (nothing blocks it), then decrement the in-degree of everything it unlocks — possibly freeing more courses. If you manage to take <em>all</em> of them, there's no cycle; if some stay stuck above 0, they're trapped in a cycle and it's impossible."
        ],
        approach: [
          "Build the adjacency list and an <code>indegree[]</code> array from the prerequisite pairs.",
          "Queue every course with in-degree 0.",
          "Pop a course, count it as taken, and decrement each dependent's in-degree; enqueue any that hit 0.",
          "Continue until the queue empties.",
          "Return true iff the number of courses taken equals the total → O(V + E)."
        ],
        code: `import java.util.*;

class Solution {
    public boolean canFinish(int numCourses, int[][] prerequisites) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < numCourses; i++) adj.add(new ArrayList<>());
        int[] indegree = new int[numCourses];

        for (int[] p : prerequisites) {        // p = [course, prereq] -> edge prereq -> course
            adj.get(p[1]).add(p[0]);
            indegree[p[0]]++;
        }

        Queue<Integer> queue = new LinkedList<>();
        for (int i = 0; i < numCourses; i++) if (indegree[i] == 0) queue.offer(i);

        int taken = 0;
        while (!queue.isEmpty()) {
            int course = queue.poll();
            taken++;
            for (int next : adj.get(course)) {
                if (--indegree[next] == 0) queue.offer(next);
            }
        }
        return taken == numCourses;            // all taken -> no cycle
    }
}

public class Main {
    public static void main(String[] args) {
        Solution s = new Solution();
        // to take course 1 you must first finish course 0
        System.out.println(s.canFinish(2, new int[][]{{1, 0}}));           // true
        System.out.println(s.canFinish(2, new int[][]{{1, 0}, {0, 1}}));   // false (cycle)
    }
}`,
        complexity: { time: "O(V + E)", space: "O(V + E)" }
      },
      {
        num: 994,
        title: "Rotting Oranges",
        slug: "rotting-oranges",
        tier: "medium",
        trigger: "Spread / time-to-fill from multiple sources → multi-source BFS, seed all start nodes at once.",
        built: true,
        vizId: "rotting-oranges",
        simplified: [
          "A grid holds empty cells (0), fresh oranges (1), and rotten oranges (2). Every minute, each rotten orange rots the fresh oranges directly adjacent to it. Find the minutes until none stay fresh — or −1 if some can never rot.",
          "Because <em>all</em> rotten oranges spread <strong>at the same time</strong>, this is a <strong>multi-source BFS</strong>: seed the queue with every rotten orange at once (time 0), instead of starting from a single point.",
          "Process the queue in waves. Each wave is one minute: rot all fresh neighbours of the current frontier and push them for the next wave. The minute counter when the last fresh orange rots is the answer; if any fresh orange remains unreachable, return −1."
        ],
        approach: [
          "Scan the grid: enqueue every rotten orange and count the fresh ones.",
          "BFS in layers — each layer is one minute.",
          "For each rotten orange popped, rot fresh 4-neighbours, decrement the fresh count, and enqueue them.",
          "Increment the minute counter once per non-empty layer.",
          "Return the minutes if no fresh remain, else −1 → O(rows × cols)."
        ],
        code: `import java.util.*;

class Solution {
    public int orangesRotting(int[][] grid) {
        int rows = grid.length, cols = grid[0].length, fresh = 0;
        Queue<int[]> queue = new LinkedList<>();

        for (int r = 0; r < rows; r++)
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == 2) queue.offer(new int[]{r, c});
                else if (grid[r][c] == 1) fresh++;
            }

        int minutes = 0;
        int[][] dirs = {{1,0},{-1,0},{0,1},{0,-1}};
        while (!queue.isEmpty() && fresh > 0) {
            minutes++;
            for (int i = queue.size(); i > 0; i--) {       // one full layer = one minute
                int[] cell = queue.poll();
                for (int[] d : dirs) {
                    int nr = cell[0] + d[0], nc = cell[1] + d[1];
                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == 1) {
                        grid[nr][nc] = 2;
                        fresh--;
                        queue.offer(new int[]{nr, nc});
                    }
                }
            }
        }
        return fresh == 0 ? minutes : -1;
    }
}

public class Main {
    public static void main(String[] args) {
        int[][] grid = {
            {2, 1, 1},
            {1, 1, 0},
            {0, 1, 1}
        };
        System.out.println(new Solution().orangesRotting(grid));  // 4
    }
}`,
        complexity: { time: "O(rows × cols)", space: "O(rows × cols)" }
      },
      {
        num: 417,
        title: "Pacific Atlantic Water Flow",
        slug: "pacific-atlantic-water-flow",
        tier: "medium",
        trigger: "Cells reachable from multiple boundaries → reverse DFS/BFS inward from each border, intersect.",
        built: true,
        vizId: "pacific-atlantic",
        simplified: [
          "A height-map grid. Water flows from a cell to an equal-or-lower neighbour. The Pacific touches the top and left edges; the Atlantic touches the bottom and right. Find every cell whose water can reach <strong>both</strong> oceans.",
          "Testing each cell forward (does its water reach an ocean?) repeats tons of work. The trick is to flood <strong>in reverse</strong>: start at each ocean's border cells and climb <em>inward</em> to any neighbour of equal-or-greater height (if you can climb up to it, water could flow back down from it to the ocean).",
          "Do this reverse flood twice — once from Pacific borders, once from Atlantic borders — producing two reachable sets. The answer is their <strong>intersection</strong>: cells both floods reached."
        ],
        approach: [
          "Run a DFS/BFS inward from all Pacific border cells, marking cells reachable to the Pacific (moving only to ≥-height neighbours).",
          "Do the same from all Atlantic border cells.",
          "A cell in both reachable sets can drain to both oceans.",
          "Collect those cells as the result.",
          "Each cell is visited a constant number of times per flood → O(rows × cols)."
        ],
        code: `import java.util.*;

class Solution {
    public List<List<Integer>> pacificAtlantic(int[][] heights) {
        int rows = heights.length, cols = heights[0].length;
        boolean[][] pac = new boolean[rows][cols], atl = new boolean[rows][cols];

        for (int r = 0; r < rows; r++) { dfs(heights, pac, r, 0); dfs(heights, atl, r, cols - 1); }
        for (int c = 0; c < cols; c++) { dfs(heights, pac, 0, c); dfs(heights, atl, rows - 1, c); }

        List<List<Integer>> res = new ArrayList<>();
        for (int r = 0; r < rows; r++)
            for (int c = 0; c < cols; c++)
                if (pac[r][c] && atl[r][c]) res.add(Arrays.asList(r, c));
        return res;
    }

    private void dfs(int[][] h, boolean[][] seen, int r, int c) {
        seen[r][c] = true;
        int[][] dirs = {{1,0},{-1,0},{0,1},{0,-1}};
        for (int[] d : dirs) {
            int nr = r + d[0], nc = c + d[1];
            if (nr >= 0 && nr < h.length && nc >= 0 && nc < h[0].length
                && !seen[nr][nc] && h[nr][nc] >= h[r][c]) {      // climb uphill in reverse
                dfs(h, seen, nr, nc);
            }
        }
    }
}

public class Main {
    public static void main(String[] args) {
        int[][] heights = {
            {1, 2, 2, 3, 5},
            {3, 2, 3, 4, 4},
            {2, 4, 5, 3, 1},
            {6, 7, 1, 4, 5},
            {5, 1, 1, 2, 4}
        };
        System.out.println(new Solution().pacificAtlantic(heights));
        // cells that drain to both oceans
    }
}`,
        complexity: { time: "O(rows × cols)", space: "O(rows × cols)" }
      },
      {
        num: 127,
        title: "Word Ladder",
        slug: "word-ladder",
        tier: "hard",
        trigger: "Shortest transformation sequence → BFS over an implicit graph of one-edit neighbors.",
        built: true,
        vizId: "word-ladder",
        simplified: [
          "Turn <code>beginWord</code> into <code>endWord</code> by changing one letter at a time, where every intermediate word must be in the dictionary. Return the length of the <strong>shortest</strong> such chain (0 if impossible).",
          "Think of each word as a node, with an edge between any two words that differ by exactly one letter. The shortest chain is then the shortest path in that graph — and for unweighted shortest paths, the tool is <strong>BFS</strong>.",
          "BFS outward from <code>beginWord</code> level by level. Each level is the next rung of the ladder; the first level that contains <code>endWord</code> gives the shortest length. Building neighbours by trying every letter at every position keeps it an implicit graph — no need to precompute all edges."
        ],
        approach: [
          "Put the word list in a set for O(1) membership; BFS from <code>beginWord</code> with distance 1.",
          "For the current word, generate neighbours by swapping each position through 'a'–'z'.",
          "If a neighbour is in the set and unvisited, enqueue it with distance+1 and remove it from the set.",
          "Return the distance the moment you dequeue <code>endWord</code>.",
          "If BFS drains without reaching it, return 0. O(N · L² · 26) worst case."
        ],
        code: `import java.util.*;

class Solution {
    public int ladderLength(String beginWord, String endWord, List<String> wordList) {
        Set<String> dict = new HashSet<>(wordList);
        if (!dict.contains(endWord)) return 0;

        Queue<String> queue = new LinkedList<>();
        queue.offer(beginWord);
        int level = 1;

        while (!queue.isEmpty()) {
            for (int i = queue.size(); i > 0; i--) {
                String word = queue.poll();
                if (word.equals(endWord)) return level;

                char[] chars = word.toCharArray();
                for (int j = 0; j < chars.length; j++) {
                    char original = chars[j];
                    for (char c = 'a'; c <= 'z'; c++) {
                        chars[j] = c;
                        String next = new String(chars);
                        if (dict.remove(next)) queue.offer(next);   // remove = mark visited
                    }
                    chars[j] = original;
                }
            }
            level++;
        }
        return 0;
    }
}

public class Main {
    public static void main(String[] args) {
        List<String> words = Arrays.asList("hot", "dot", "dog", "lot", "log", "cog");
        System.out.println(new Solution().ladderLength("hit", "cog", words));
        // 5   (hit -> hot -> dot -> dog -> cog)
    }
}`,
        complexity: { time: "O(N · L² · 26)", space: "O(N · L)" }
      },
      {
        num: 743,
        title: "Network Delay Time",
        slug: "network-delay-time",
        tier: "medium",
        trigger: "Shortest path with weighted edges / 'time for all to receive' → Dijkstra with a min-heap.",
        built: true,
        vizId: "network-delay-time",
        simplified: [
          "A signal starts at node <code>k</code> in a weighted directed graph and travels along edges taking their listed time. How long until <strong>every</strong> node has received it — or −1 if some node never does?",
          "The time a node receives the signal is the <strong>shortest path</strong> from <code>k</code> to it. The whole network is done when the <em>last</em> node hears it, so the answer is the <strong>maximum</strong> of those shortest distances.",
          "Compute the shortest distances with <strong>Dijkstra</strong>: a min-heap always finalises the closest not-yet-finalised node next, then relaxes its outgoing edges. If any node stays at infinity, it's unreachable → −1."
        ],
        approach: [
          "Build an adjacency list; init <code>dist[k] = 0</code>, all others ∞.",
          "Push <code>(0, k)</code> into a min-heap keyed by distance.",
          "Pop the closest node; if already finalised skip, else finalise it and relax each out-edge.",
          "Relaxing edge <code>u→v (w)</code>: if <code>dist[u] + w &lt; dist[v]</code>, update and push <code>v</code>.",
          "Answer is the max finalised distance, or −1 if any is still ∞. O(E log V)."
        ],
        code: `import java.util.*;

class Solution {
    public int networkDelayTime(int[][] times, int n, int k) {
        List<int[]>[] adj = new List[n + 1];
        for (int i = 1; i <= n; i++) adj[i] = new ArrayList<>();
        for (int[] t : times) adj[t[0]].add(new int[]{t[1], t[2]});   // u -> (v, weight)

        int[] dist = new int[n + 1];
        Arrays.fill(dist, Integer.MAX_VALUE);
        dist[k] = 0;

        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> a[1] - b[1]); // (node, dist)
        heap.offer(new int[]{k, 0});

        while (!heap.isEmpty()) {
            int[] cur = heap.poll();
            int u = cur[0], d = cur[1];
            if (d > dist[u]) continue;                 // stale heap entry
            for (int[] edge : adj[u]) {
                int v = edge[0], w = edge[1];
                if (d + w < dist[v]) { dist[v] = d + w; heap.offer(new int[]{v, dist[v]}); }
            }
        }

        int ans = 0;
        for (int i = 1; i <= n; i++) {
            if (dist[i] == Integer.MAX_VALUE) return -1;
            ans = Math.max(ans, dist[i]);
        }
        return ans;
    }
}

public class Main {
    public static void main(String[] args) {
        // edges: u -> v takes w time
        int[][] times = {{2, 1, 1}, {2, 3, 1}, {3, 4, 1}};
        System.out.println(new Solution().networkDelayTime(times, 4, 2));  // 2
    }
}`,
        complexity: { time: "O(E log V)", space: "O(V + E)" }
      }
    ]
  },
  {
    id: "backtracking",
    name: "Backtracking",
    blurb: "Choose, explore, un-choose — systematically generate every valid arrangement.",
    questions: [
      {
        num: 78,
        title: "Subsets",
        slug: "subsets",
        tier: "medium",
        trigger: "Generate all subsets/combinations → include/exclude recursion (or start-index loop).",
        built: true,
        vizId: "subsets",
        simplified: [
          "Return <strong>every</strong> subset of the given distinct numbers — the power set. For <code>[1,2,3]</code> that's 8 subsets, from <code>[]</code> to <code>[1,2,3]</code>.",
          "Build them with a depth-first walk that carries a <strong>start index</strong>. At every node of the recursion you already hold a valid subset, so <strong>record it immediately</strong>.",
          "Then, to extend it, loop over the remaining elements (from the start index onward): <strong>choose</strong> one, recurse deeper, then <strong>un-choose</strong> it and try the next. The start index guarantees you never revisit an earlier element, so no subset is produced twice."
        ],
        approach: [
          "Recursive helper <code>dfs(start, current)</code>.",
          "At entry, add a copy of <code>current</code> to the results (every node is a subset).",
          "Loop <code>i</code> from <code>start</code> to <code>n−1</code>: append <code>nums[i]</code>, recurse with <code>i+1</code>, then pop it (backtrack).",
          "The start index prevents reusing earlier elements → each subset appears once.",
          "2ⁿ subsets, each built in O(n) → O(n · 2ⁿ)."
        ],
        code: `import java.util.*;

class Solution {
    public List<List<Integer>> subsets(int[] nums) {
        List<List<Integer>> res = new ArrayList<>();
        dfs(nums, 0, new ArrayList<>(), res);
        return res;
    }

    private void dfs(int[] nums, int start, List<Integer> current, List<List<Integer>> res) {
        res.add(new ArrayList<>(current));          // every node is a valid subset
        for (int i = start; i < nums.length; i++) {
            current.add(nums[i]);                   // choose
            dfs(nums, i + 1, current, res);         // explore
            current.remove(current.size() - 1);     // un-choose (backtrack)
        }
    }
}

public class Main {
    public static void main(String[] args) {
        System.out.println(new Solution().subsets(new int[]{1, 2, 3}));
        // [[], [1], [1, 2], [1, 2, 3], [1, 3], [2], [2, 3], [3]]
    }
}`,
        complexity: { time: "O(n · 2ⁿ)", space: "O(n) recursion" }
      },
      {
        num: 46,
        title: "Permutations",
        slug: "permutations",
        tier: "medium",
        trigger: "Generate all orderings → recursion with a used[] set, undo the choice on return.",
        built: true,
        vizId: "permutations",
        simplified: [
          "Return every possible <strong>ordering</strong> of the distinct numbers. For <code>[1,2,3]</code> there are 3! = 6 permutations.",
          "Fill the ordering one slot at a time. A <code>used[]</code> flag array remembers which numbers are already in the current arrangement so you don't place a number twice.",
          "For each empty slot, try every <strong>unused</strong> number: mark it used, recurse to fill the next slot, then <strong>un-mark</strong> it on the way back so it's available for a different branch. When the ordering uses all n numbers, record it."
        ],
        approach: [
          "Recursive helper <code>dfs(current)</code> with a shared <code>used[]</code> array.",
          "If <code>current.size() == n</code>, record a copy and return.",
          "Loop over all indices; skip used ones.",
          "Mark used, append, recurse; then un-mark and pop (backtrack).",
          "n! leaves, each O(n) to copy → O(n · n!)."
        ],
        code: `import java.util.*;

class Solution {
    public List<List<Integer>> permute(int[] nums) {
        List<List<Integer>> res = new ArrayList<>();
        dfs(nums, new boolean[nums.length], new ArrayList<>(), res);
        return res;
    }

    private void dfs(int[] nums, boolean[] used, List<Integer> current, List<List<Integer>> res) {
        if (current.size() == nums.length) {
            res.add(new ArrayList<>(current));
            return;
        }
        for (int i = 0; i < nums.length; i++) {
            if (used[i]) continue;                  // already placed in this ordering
            used[i] = true; current.add(nums[i]);   // choose
            dfs(nums, used, current, res);          // explore
            used[i] = false; current.remove(current.size() - 1);  // un-choose
        }
    }
}

public class Main {
    public static void main(String[] args) {
        System.out.println(new Solution().permute(new int[]{1, 2, 3}));
        // [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]]
    }
}`,
        complexity: { time: "O(n · n!)", space: "O(n) recursion" }
      },
      {
        num: 39,
        title: "Combination Sum",
        slug: "combination-sum",
        tier: "medium",
        trigger: "All combinations hitting a target (reuse allowed) → recursion with a start index to dedupe.",
        built: true,
        vizId: "combination-sum",
        simplified: [
          "Find every combination of the candidate numbers that adds up to <code>target</code>. Each candidate may be reused <strong>any number of times</strong>, and combinations that are reorderings of each other count as the same.",
          "DFS while tracking the <strong>remaining</strong> target. Add a candidate, subtract it from the remainder, and recurse. If the remainder hits 0 you've found a combination; if it goes negative you've <strong>overshot</strong> — prune that branch.",
          "The key to avoiding duplicate multisets is a <strong>start index</strong>: when you recurse you may reuse the current candidate (pass the same index) but never go back to earlier ones. That fixes an order and stops <code>[2,3]</code> and <code>[3,2]</code> from both appearing."
        ],
        approach: [
          "Recursive helper <code>dfs(start, remain, current)</code>.",
          "If <code>remain == 0</code>, record the current combination.",
          "If <code>remain &lt; 0</code>, prune (overshoot).",
          "Loop <code>i</code> from <code>start</code>: choose <code>candidates[i]</code>, recurse with the <strong>same</strong> <code>i</code> (reuse allowed), then backtrack.",
          "Start index keeps combinations canonical → no duplicates."
        ],
        code: `import java.util.*;

class Solution {
    public List<List<Integer>> combinationSum(int[] candidates, int target) {
        List<List<Integer>> res = new ArrayList<>();
        dfs(candidates, 0, target, new ArrayList<>(), res);
        return res;
    }

    private void dfs(int[] cand, int start, int remain, List<Integer> current, List<List<Integer>> res) {
        if (remain == 0) { res.add(new ArrayList<>(current)); return; }
        if (remain < 0) return;                      // overshoot -> prune

        for (int i = start; i < cand.length; i++) {
            current.add(cand[i]);                    // choose
            dfs(cand, i, remain - cand[i], current, res);  // reuse allowed: pass i, not i+1
            current.remove(current.size() - 1);      // backtrack
        }
    }
}

public class Main {
    public static void main(String[] args) {
        System.out.println(new Solution().combinationSum(new int[]{2, 3, 6, 7}, 7));
        // [[2, 2, 3], [7]]
    }
}`,
        complexity: { time: "O(n^(target/min))", space: "O(target/min) recursion" }
      },
      {
        num: 79,
        title: "Word Search",
        slug: "word-search",
        tier: "medium",
        trigger: "Path/word exists in a grid → DFS from each cell with in-place visited marking + backtrack.",
        built: true,
        vizId: "word-search",
        simplified: [
          "Given a grid of letters, decide whether a target word can be spelled by walking to <strong>adjacent</strong> cells (up/down/left/right), using each cell at most once per path.",
          "Try starting a DFS from every cell whose letter matches the first character. At each step, check the current cell against the current letter of the word; a mismatch is a dead end.",
          "To enforce 'each cell used once', mark the cell <strong>visited in place</strong> before exploring its neighbours, then <strong>un-mark it on the way back</strong> (backtrack) so other paths can still use it. If the DFS ever matches the final letter, the word exists."
        ],
        approach: [
          "For each cell, launch <code>dfs(r, c, k=0)</code>.",
          "If <code>board[r][c] != word[k]</code>, return false.",
          "If <code>k</code> is the last index, return true (whole word matched).",
          "Mark the cell used, recurse into the four neighbours; if any succeeds, propagate true.",
          "Restore the cell (backtrack) before returning. O(rows · cols · 4^L)."
        ],
        code: `import java.util.*;

class Solution {
    public boolean exist(char[][] board, String word) {
        int rows = board.length, cols = board[0].length;
        for (int r = 0; r < rows; r++)
            for (int c = 0; c < cols; c++)
                if (dfs(board, word, r, c, 0)) return true;
        return false;
    }

    private boolean dfs(char[][] board, String word, int r, int c, int k) {
        if (r < 0 || r >= board.length || c < 0 || c >= board[0].length || board[r][c] != word.charAt(k))
            return false;
        if (k == word.length() - 1) return true;

        char tmp = board[r][c];
        board[r][c] = '#';                           // mark visited in place
        boolean found = dfs(board, word, r + 1, c, k + 1)
                     || dfs(board, word, r - 1, c, k + 1)
                     || dfs(board, word, r, c + 1, k + 1)
                     || dfs(board, word, r, c - 1, k + 1);
        board[r][c] = tmp;                           // restore (backtrack)
        return found;
    }
}

public class Main {
    public static void main(String[] args) {
        char[][] board = {
            {'A','B','C','E'},
            {'S','F','C','S'},
            {'A','D','E','E'}
        };
        Solution s = new Solution();
        System.out.println(s.exist(board, "ABCCED"));  // true
        System.out.println(s.exist(board, "ABCB"));    // false
    }
}`,
        complexity: { time: "O(rows · cols · 4^L)", space: "O(L) recursion" }
      },
      {
        num: 51,
        title: "N-Queens",
        slug: "n-queens",
        tier: "hard",
        trigger: "Place items under mutual constraints → row-by-row recursion with column/diagonal sets, prune invalid.",
        built: true,
        vizId: "n-queens",
        simplified: [
          "Place <code>n</code> queens on an n×n board so none attack another — no two share a row, column, or diagonal. Return all distinct arrangements.",
          "Place <strong>one queen per row</strong>, top to bottom, so rows never clash automatically. For a given row you try each column, checking it against the columns and both diagonals already occupied.",
          "A square is safe if its column, its ↘ diagonal (<code>row − col</code>), and its ↙ diagonal (<code>row + col</code>) are all unused. Place the queen, recurse to the next row, then <strong>remove it</strong> and try the next column (backtracking). Reaching row n means a full valid board."
        ],
        approach: [
          "Track three sets: used <code>columns</code>, <code>row−col</code> diagonals, <code>row+col</code> diagonals.",
          "Recursive helper <code>dfs(row)</code>; if <code>row == n</code>, record the board.",
          "For each column, skip if it or either diagonal is occupied.",
          "Otherwise place the queen (add to all three sets), recurse to <code>row+1</code>, then remove it.",
          "Diagonal keys make the safety check O(1) → overall bounded by the number of valid placements."
        ],
        code: `import java.util.*;

class Solution {
    public List<List<String>> solveNQueens(int n) {
        List<List<String>> res = new ArrayList<>();
        Set<Integer> cols = new HashSet<>(), diag1 = new HashSet<>(), diag2 = new HashSet<>();
        int[] placement = new int[n];
        dfs(0, n, placement, cols, diag1, diag2, res);
        return res;
    }

    private void dfs(int row, int n, int[] placement,
                     Set<Integer> cols, Set<Integer> diag1, Set<Integer> diag2,
                     List<List<String>> res) {
        if (row == n) { res.add(build(placement, n)); return; }

        for (int col = 0; col < n; col++) {
            if (cols.contains(col) || diag1.contains(row - col) || diag2.contains(row + col)) continue;
            cols.add(col); diag1.add(row - col); diag2.add(row + col); placement[row] = col;
            dfs(row + 1, n, placement, cols, diag1, diag2, res);
            cols.remove(col); diag1.remove(row - col); diag2.remove(row + col);   // backtrack
        }
    }

    private List<String> build(int[] placement, int n) {
        List<String> board = new ArrayList<>();
        for (int r = 0; r < n; r++) {
            char[] row = new char[n];
            Arrays.fill(row, '.');
            row[placement[r]] = 'Q';
            board.add(new String(row));
        }
        return board;
    }
}

public class Main {
    public static void main(String[] args) {
        List<List<String>> solutions = new Solution().solveNQueens(4);
        System.out.println("distinct boards: " + solutions.size());  // 2
        for (String row : solutions.get(0)) System.out.println(row);
        // one valid 4-queens board, e.g.
        // .Q..
        // ...Q
        // Q...
        // ..Q.
    }
}`,
        complexity: { time: "O(n!)", space: "O(n) recursion + sets" }
      }
    ]
  },
  {
    id: "dynamic-programming",
    name: "Dynamic Programming",
    blurb: "Break a problem into overlapping subproblems and reuse the answers.",
    questions: [
      {
        num: 70,
        title: "Climbing Stairs",
        slug: "climbing-stairs",
        tier: "easy",
        trigger: "Count ways, 'each step depends on the previous few' → 1D DP, dp[i] = dp[i-1] + dp[i-2].",
        built: true,
        vizId: "climbing-stairs",
        simplified: [
          "You climb a staircase of <code>n</code> steps taking either 1 or 2 steps at a time. How many distinct ways can you reach the top?",
          "Think about the <strong>last move</strong> onto step <code>i</code>: it came either from step <code>i−1</code> (a single step) or from step <code>i−2</code> (a double). So the ways to reach <code>i</code> are just the ways to reach those two, summed.",
          "That gives <code>dp[i] = dp[i−1] + dp[i−2]</code> — the Fibonacci recurrence. Seed <code>dp[0] = dp[1] = 1</code> and fill upward; <code>dp[n]</code> is the answer. You only ever need the last two values, so it's O(1) space."
        ],
        approach: [
          "Base cases: <code>dp[0] = 1</code>, <code>dp[1] = 1</code>.",
          "For <code>i</code> from 2 to n: <code>dp[i] = dp[i−1] + dp[i−2]</code>.",
          "Return <code>dp[n]</code>.",
          "Keep only the previous two values to run in O(1) space.",
          "Single pass → O(n) time."
        ],
        code: `public class Main {
    public int climbStairs(int n) {
        if (n <= 2) return n;
        int prev2 = 1, prev1 = 2;          // ways to reach step 1 and step 2

        for (int i = 3; i <= n; i++) {
            int cur = prev1 + prev2;       // dp[i] = dp[i-1] + dp[i-2]
            prev2 = prev1;
            prev1 = cur;
        }
        return prev1;
    }

    public static void main(String[] args) {
        System.out.println(new Main().climbStairs(5));  // 8
    }
}`,
        complexity: { time: "O(n)", space: "O(1)" }
      },
      {
        num: 198,
        title: "House Robber",
        slug: "house-robber",
        tier: "medium",
        trigger: "Max sum with a 'no two adjacent' constraint → dp[i] = max(skip, take + dp[i-2]).",
        built: true,
        vizId: "house-robber",
        simplified: [
          "Houses in a row each hold some money. You can't rob two <strong>adjacent</strong> houses (alarms link neighbours). Maximise the loot.",
          "At each house you face a binary choice: <strong>skip</strong> it (keep whatever was best up to the previous house) or <strong>rob</strong> it (its money plus the best from two houses back, since the immediate neighbour is off-limits).",
          "So <code>dp[i] = max(dp[i−1], nums[i] + dp[i−2])</code>. Walk left to right building this up; <code>dp[last]</code> is the best achievable. As with Climbing Stairs, only the last two results matter → O(1) space."
        ],
        approach: [
          "<code>dp[i]</code> = best loot considering houses 0..i.",
          "Base: <code>dp[0] = nums[0]</code>, <code>dp[1] = max(nums[0], nums[1])</code>.",
          "Transition: <code>dp[i] = max(dp[i−1], nums[i] + dp[i−2])</code>.",
          "Return the last value.",
          "Track just the previous two → O(1) space, O(n) time."
        ],
        code: `public class Main {
    public int rob(int[] nums) {
        int prev2 = 0, prev1 = 0;          // best loot two-back and one-back

        for (int money : nums) {
            int cur = Math.max(prev1, money + prev2);   // skip vs rob-this
            prev2 = prev1;
            prev1 = cur;
        }
        return prev1;
    }

    public static void main(String[] args) {
        System.out.println(new Main().rob(new int[]{2, 7, 9, 3, 1}));  // 12
    }
}`,
        complexity: { time: "O(n)", space: "O(1)" }
      },
      {
        num: 322,
        title: "Coin Change",
        slug: "coin-change",
        tier: "medium",
        trigger: "Min / # ways to form an amount with reusable items → unbounded knapsack over amounts.",
        built: true,
        vizId: "coin-change",
        simplified: [
          "Given coin denominations and a target <code>amount</code>, find the <strong>fewest coins</strong> that sum to it (coins reusable). Return −1 if it can't be made.",
          "Build up answers for every amount from 0 to the target. <code>dp[a]</code> = the fewest coins to make amount <code>a</code>, starting at <code>dp[0] = 0</code> and everything else 'infinity' (unreachable).",
          "For each amount <code>a</code>, try each coin <code>c</code>: if you can make <code>a − c</code>, then making <code>a</code> costs one more coin — <code>dp[a] = min(dp[a], dp[a−c] + 1)</code>. It's an unbounded knapsack; <code>dp[amount]</code> is the answer (or −1 if still infinity)."
        ],
        approach: [
          "Create <code>dp[0..amount]</code>, all set to a large sentinel, with <code>dp[0] = 0</code>.",
          "For each amount <code>a</code> from 1 to target, for each coin <code>c ≤ a</code>: <code>dp[a] = min(dp[a], dp[a−c] + 1)</code>.",
          "Any reachable smaller amount plus one coin is a candidate.",
          "Return <code>dp[amount]</code>, or −1 if it never dropped below the sentinel.",
          "O(amount × coins) time, O(amount) space."
        ],
        code: `import java.util.*;

public class Main {
    public int coinChange(int[] coins, int amount) {
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, amount + 1);       // sentinel = "unreachable"
        dp[0] = 0;

        for (int a = 1; a <= amount; a++) {
            for (int c : coins) {
                if (c <= a) dp[a] = Math.min(dp[a], dp[a - c] + 1);
            }
        }
        return dp[amount] > amount ? -1 : dp[amount];
    }

    public static void main(String[] args) {
        System.out.println(new Main().coinChange(new int[]{1, 2, 5}, 11));  // 3  (5 + 5 + 1)
    }
}`,
        complexity: { time: "O(amount × coins)", space: "O(amount)" }
      },
      {
        num: 300,
        title: "Longest Increasing Subsequence",
        slug: "longest-increasing-subsequence",
        tier: "medium",
        trigger: "Longest increasing / chain subsequence → dp[i] over earlier valid j (or patience sort O(n log n)).",
        built: true,
        vizId: "longest-increasing-subsequence",
        simplified: [
          "Find the length of the longest <strong>strictly increasing subsequence</strong> — elements kept in order but not necessarily contiguous.",
          "Let <code>dp[i]</code> be the length of the longest increasing subsequence that <strong>ends at index i</strong>. Any such subsequence's second-to-last element is some earlier <code>j</code> with <code>nums[j] &lt; nums[i]</code>.",
          "So <code>dp[i] = 1 + max(dp[j])</code> over all valid earlier <code>j</code> (or just 1 if none). The answer is the largest <code>dp[i]</code>. This is the clear O(n²) version; a patience-sorting variant reaches O(n log n)."
        ],
        approach: [
          "Initialise every <code>dp[i] = 1</code> (each element alone is a subsequence).",
          "For each <code>i</code>, scan all <code>j &lt; i</code>: if <code>nums[j] &lt; nums[i]</code>, relax <code>dp[i] = max(dp[i], dp[j] + 1)</code>.",
          "Track the running maximum of <code>dp[i]</code>.",
          "Return that maximum.",
          "O(n²) time, O(n) space (O(n log n) possible with binary search)."
        ],
        code: `import java.util.*;

public class Main {
    public int lengthOfLIS(int[] nums) {
        int n = nums.length, best = 1;
        int[] dp = new int[n];
        Arrays.fill(dp, 1);                 // each element is a length-1 subsequence

        for (int i = 0; i < n; i++) {
            for (int j = 0; j < i; j++) {
                if (nums[j] < nums[i]) dp[i] = Math.max(dp[i], dp[j] + 1);
            }
            best = Math.max(best, dp[i]);
        }
        return best;
    }

    public static void main(String[] args) {
        System.out.println(new Main().lengthOfLIS(new int[]{10, 9, 2, 5, 3, 7, 101, 18}));  // 4
    }
}`,
        complexity: { time: "O(n²)", space: "O(n)" }
      },
      {
        num: 1143,
        title: "Longest Common Subsequence",
        slug: "longest-common-subsequence",
        tier: "medium",
        trigger: "Match / align two sequences → 2D grid DP on (i, j) prefixes.",
        built: true,
        vizId: "longest-common-subsequence",
        simplified: [
          "Given two strings, find the length of the longest subsequence common to both — letters in order, gaps allowed. For \"abcde\" and \"ace\" it's \"ace\", length 3.",
          "Compare <strong>prefixes</strong>: <code>dp[i][j]</code> = LCS length of the first <code>i</code> letters of A and first <code>j</code> of B. Fill a 2D grid over these prefixes.",
          "If the current letters match (<code>A[i−1] == B[j−1]</code>), they extend the diagonal: <code>dp[i][j] = dp[i−1][j−1] + 1</code>. If not, drop one letter from either side and take the better: <code>dp[i][j] = max(dp[i−1][j], dp[i][j−1])</code>. The bottom-right cell is the answer."
        ],
        approach: [
          "Create a <code>(m+1) × (n+1)</code> grid; the zero row/column are 0 (empty prefix).",
          "Fill row by row over the two prefixes.",
          "Match → <code>dp[i][j] = dp[i−1][j−1] + 1</code>.",
          "Mismatch → <code>dp[i][j] = max(dp[i−1][j], dp[i][j−1])</code>.",
          "Return <code>dp[m][n]</code>. O(m·n) time and space."
        ],
        code: `public class Main {
    public int longestCommonSubsequence(String text1, String text2) {
        int m = text1.length(), n = text2.length();
        int[][] dp = new int[m + 1][n + 1];

        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (text1.charAt(i - 1) == text2.charAt(j - 1)) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;            // extend diagonal
                } else {
                    dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);  // best of dropping one
                }
            }
        }
        return dp[m][n];
    }

    public static void main(String[] args) {
        System.out.println(new Main().longestCommonSubsequence("abcde", "ace"));  // 3  ("ace")
    }
}`,
        complexity: { time: "O(m · n)", space: "O(m · n)" }
      },
      {
        num: 139,
        title: "Word Break",
        slug: "word-break",
        tier: "medium",
        trigger: "Can a string be segmented by a dictionary → 1D DP over prefixes, dp[i] if some dp[j] + word fits.",
        built: true,
        vizId: "word-break",
        simplified: [
          "Can the string be cut into a sequence of words that are all in the dictionary? For \"leetcode\" with {\"leet\", \"code\"} the answer is yes.",
          "Let <code>dp[i]</code> mean 'the first <code>i</code> characters can be fully segmented'. <code>dp[0]</code> is true (the empty prefix is trivially segmentable).",
          "For each boundary <code>i</code>, look for a split point <code>j &lt; i</code> where the prefix up to <code>j</code> is already segmentable (<code>dp[j]</code> true) <em>and</em> the slice <code>s[j..i)</code> is a dictionary word. If such a <code>j</code> exists, <code>dp[i]</code> is true. The answer is <code>dp[length]</code>."
        ],
        approach: [
          "Put the dictionary in a set; create <code>dp[0..len]</code> with <code>dp[0] = true</code>.",
          "For each end <code>i</code> from 1 to len, scan split points <code>j</code> from 0 to i−1.",
          "If <code>dp[j]</code> and <code>s.substring(j, i)</code> is in the set, set <code>dp[i] = true</code> and stop.",
          "Return <code>dp[len]</code>.",
          "O(n²) substrings (× lookup) time, O(n) space."
        ],
        code: `import java.util.*;

public class Main {
    public boolean wordBreak(String s, List<String> wordDict) {
        Set<String> dict = new HashSet<>(wordDict);
        boolean[] dp = new boolean[s.length() + 1];
        dp[0] = true;                       // empty prefix is segmentable

        for (int i = 1; i <= s.length(); i++) {
            for (int j = 0; j < i; j++) {
                if (dp[j] && dict.contains(s.substring(j, i))) {
                    dp[i] = true;
                    break;
                }
            }
        }
        return dp[s.length()];
    }

    public static void main(String[] args) {
        System.out.println(new Main().wordBreak("leetcode", Arrays.asList("leet", "code")));  // true
    }
}`,
        complexity: { time: "O(n²) (+ substring)", space: "O(n)" }
      },
      {
        num: 72,
        title: "Edit Distance",
        slug: "edit-distance",
        tier: "hard",
        trigger: "Min operations to transform one string into another → 2D DP with insert/delete/replace transitions.",
        built: true,
        vizId: "edit-distance",
        simplified: [
          "Find the minimum number of single-character edits — insert, delete, or replace — to turn word A into word B.",
          "Work over prefixes: <code>dp[i][j]</code> = edits to convert the first <code>i</code> letters of A into the first <code>j</code> of B. The base row and column are 0,1,2,… — turning a prefix into (or from) the empty string costs one edit per character.",
          "If the current letters match, no edit is needed and you copy the diagonal <code>dp[i−1][j−1]</code>. Otherwise you take <code>1 + min</code> of three moves: <strong>replace</strong> (diagonal), <strong>delete</strong> (from above), <strong>insert</strong> (from the left). The bottom-right cell is the distance."
        ],
        approach: [
          "Create a <code>(m+1) × (n+1)</code> grid; set <code>dp[i][0] = i</code> and <code>dp[0][j] = j</code>.",
          "Fill row by row.",
          "Match → <code>dp[i][j] = dp[i−1][j−1]</code>.",
          "Mismatch → <code>dp[i][j] = 1 + min(replace, delete, insert)</code>.",
          "Return <code>dp[m][n]</code>. O(m·n) time and space."
        ],
        code: `public class Main {
    public int minDistance(String word1, String word2) {
        int m = word1.length(), n = word2.length();
        int[][] dp = new int[m + 1][n + 1];

        for (int i = 0; i <= m; i++) dp[i][0] = i;   // delete all of A's prefix
        for (int j = 0; j <= n; j++) dp[0][j] = j;   // insert all of B's prefix

        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (word1.charAt(i - 1) == word2.charAt(j - 1)) {
                    dp[i][j] = dp[i - 1][j - 1];                 // free: letters match
                } else {
                    dp[i][j] = 1 + Math.min(dp[i - 1][j - 1],    // replace
                                  Math.min(dp[i - 1][j],         // delete
                                           dp[i][j - 1]));       // insert
                }
            }
        }
        return dp[m][n];
    }

    public static void main(String[] args) {
        System.out.println(new Main().minDistance("horse", "ros"));  // 3
    }
}`,
        complexity: { time: "O(m · n)", space: "O(m · n)" }
      }
    ]
  }
];

/* attach LeetCode URLs + flatten helper */
DSAV.patterns.forEach((p, pi) => {
  p.index = pi + 1;
  p.questions.forEach((qq) => {
    qq.url = LC + qq.slug + "/";
    qq.patternId = p.id;
    qq.patternName = p.name;
  });
});

DSAV.builtCount = DSAV.patterns
  .flatMap((p) => p.questions)
  .filter((qq) => qq.built).length;

DSAV.findQuestion = function (num) {
  for (const p of DSAV.patterns) {
    for (const qq of p.questions) {
      if (qq.num === num) return qq;
    }
  }
  return null;
};
