import Bar from "./Bar.jsx";

export default function Canvas({ step, algo, displayArr, maxVal }) {
  const n = displayArr.length;

  return (
    <div className="panel canvas">
      {algo === "binary" && (
        <div className="canvas__note">ARRAY SORTED FOR BINARY SEARCH</div>
      )}
      <div className="bars">
        {displayArr.map((val, i) => (
          <Bar
            key={i}
            val={val}
            index={i}
            step={step}
            algo={algo}
            maxVal={maxVal}
            showLabel={n <= 22}
            showPointer={algo === "binary" && n <= 30}
          />
        ))}
      </div>
      {step.found === -2 && <div className="not-found">TARGET NOT FOUND</div>}
    </div>
  );
}
