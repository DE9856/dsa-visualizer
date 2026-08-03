import Bar from "./Bar.jsx";

const SORTED_SEARCH_ALGOS = ["binary", "interpolation", "exponential", "jump"];

export default function Canvas({ step, algo, displayArr, maxVal }) {
  const n = displayArr.length;
  const isSortedSearch = SORTED_SEARCH_ALGOS.includes(algo);

  return (
    <div className="panel canvas">
      {isSortedSearch && (
        <div className="canvas__note">ARRAY SORTED FOR SEARCH</div>
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
            showPointer={isSortedSearch && n <= 30}
          />
        ))}
      </div>
      {step.found === -2 && <div className="not-found">TARGET NOT FOUND</div>}
    </div>
  );
}