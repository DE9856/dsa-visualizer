import Controls from "./Controls.jsx";

// Same transport as the sorting/searching view, minus the comparison counters
// (data-structure operations don't track them).
export default function ListControls(props) {
  return <Controls {...props} step={null} meta={null} />;
}
