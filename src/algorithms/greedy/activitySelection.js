import {
  MAX_ACTIVITIES,
  MAX_TIME,
  auxOf,
  chip,
  indexRow,
  parsePairs,
  pointer,
  randomActivities,
  snap,
} from "./helpers";

const PSEUDOCODE = [
  "sort the activities by finishing time",
  "last = -infinity;  chosen = []",
  "for each activity (s, f) in that order:",
  "    if s >= last:",
  "        chosen.append(activity)",
  "        last = f",
  "    else:",
  "        skip it — it overlaps what we already hold",
];

const LINE = { SORT: 0, INIT: 1, LOOP: 2, TEST: 3, TAKE: 4, ADVANCE: 5, SKIP: 7 };

/** One activity as a bar starting at its own column. */
const barRow = (activity, tone, index) => ({
  label: `A${index + 1}`,
  offset: activity.start,
  cells: Array.from({ length: Math.max(1, activity.end - activity.start) }, (_, i) => {
    const c = { text: i === 0 ? `${activity.start}→${activity.end}` : "" };
    if (tone) c.tone = tone;
    return c;
  }),
});

export const activitySelection = {
  key: "activity",
  label: "Activity Selection",
  short: "ACTIVITY SELECTION",
  group: "greedy",
  fields: ["activities"],
  defaults: { activities: "1-4, 3-5, 0-6, 5-7, 3-9, 5-9, 6-10, 8-11, 8-12, 2-14, 12-16" },
  desc:
    "Given a set of activities that each occupy a fixed span of time, take as many as possible without overlapping. The greedy rule is one line — always take the activity that finishes earliest among those that still fit — and the surprise is that it is optimal, not merely good. The reason is an exchange argument: take any optimal schedule, and swap its first activity for the earliest-finishing one. The swap cannot conflict with anything, since the replacement ends no later, so the result is still valid and still the same size. Repeat, and any optimal solution can be turned into the greedy one without ever losing an activity. What does *not* work is the intuition most people reach for first: taking the shortest activity, or the one that starts earliest, both of which are easy to defeat.",
  time: "O(n log n) — the sort dominates; the scan is O(n)",
  space: "O(n) for the sorted order",
  pseudocode: PSEUDOCODE,

  random: () => ({ activities: randomActivities(8) }),

  parse(raw) {
    const parsed = parsePairs(raw.activities, MAX_ACTIVITIES);
    if (parsed.error) return { error: parsed.error };
    const activities = [];
    for (const [start, end] of parsed.pairs) {
      if (end <= start) return { error: `An activity must end after it starts — "${start}-${end}" does not.` };
      if (end > MAX_TIME) return { error: `Times run from 0 to ${MAX_TIME}.` };
      activities.push({ start, end });
    }
    return { activities };
  },

  run({ activities }) {
    const steps = [];
    // Original position is kept so the labels stay stable while the rows are
    // reordered by the sort — otherwise "A3" would mean a different activity
    // before and after, and the sort would look like the answer changing.
    const sorted = activities
      .map((a, i) => ({ ...a, original: i }))
      .sort((x, y) => x.end - y.end || x.start - y.start);

    const width = MAX_TIME + 1;
    const chosen = [];
    const tones = new Array(sorted.length).fill(null);

    const rowsNow = (activeIndex) =>
      sorted.map((a, i) =>
        // Undecided bars are dimmed rather than left untoned, so a bar reads as
        // one object instead of a lit first cell trailing empty ones.
        barRow(a, tones[i] || (i === activeIndex ? "active" : "dim"), a.original)
      );

    const frame = (extra, activeIndex = -1) =>
      steps.push(
        snap({
          width,
          rows: [indexRow(width), ...rowsNow(activeIndex)],
          aux: auxOf(
            "CHOSEN",
            chosen.length
              ? chosen.map((a) => chip(`A${a.original + 1} (${a.start}→${a.end})`, "take"))
              : [chip("nothing yet", "plain")]
          ),
          ...extra,
        })
      );

    frame({
      line: LINE.SORT,
      message: `Sorted by finishing time: ${sorted.map((a) => `A${a.original + 1}`).join(", ")}. Everything below follows from this order.`,
    });

    let last = -Infinity;
    frame({ line: LINE.INIT, message: "Nothing chosen yet, so any activity fits." });

    for (let i = 0; i < sorted.length; i++) {
      const a = sorted[i];
      const pointers = Number.isFinite(last) ? [pointer("last finish", last, "found")] : [];

      frame(
        {
          line: LINE.TEST,
          pointers,
          message: `A${a.original + 1} runs ${a.start}→${a.end}. Does it start at or after ${Number.isFinite(last) ? last : "the beginning"}?`,
        },
        i
      );

      if (a.start >= last) {
        tones[i] = "found";
        chosen.push(a);
        last = a.end;
        frame({
          line: LINE.TAKE,
          pointers: [pointer("last finish", last, "found")],
          message: `Yes — take it. Nothing that finishes before ${a.end} can be beaten by taking something else here.`,
        });
      } else {
        tones[i] = "mismatch";
        frame({
          line: LINE.SKIP,
          pointers,
          message: `No — it starts at ${a.start}, before ${last}, so it overlaps what is already held. Skip it.`,
        });
      }
    }

    frame({
      line: null,
      pointers: [pointer("last finish", last, "found")],
      message: `${chosen.length} of ${sorted.length} activities, and no schedule of these can do better.`,
      resultBadge: `${chosen.length} ACTIVITIES: ${chosen.map((a) => `${a.start}→${a.end}`).join(", ")}`,
    });

    return { steps };
  },
};
