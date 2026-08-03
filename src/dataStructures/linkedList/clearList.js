export const clearList = {
  key: "clear",
  label: "Clear List",
  group: "build",
  fields: [],
  desc: "Empties the list entirely.",
  time: "O(1)",
  space: "O(1)",
  run() {
    return {
      steps: [{ nodes: [], message: "List cleared" }],
      finalList: [],
    };
  },
};