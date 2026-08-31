import { Shuffle } from "lucide-react";
import { MAX_SYMBOLS, MAX_TEXT } from "../dataStructures/huffman";

export default function HuffmanSidebar({ text, onTextChange, onRun, onRandom, error }) {
  return (
    <div className="panel sidebar">
      <div className="label">HUFFMAN CODING</div>
      <p className="sidebar__note">
        Symbols that occur often get short codes and rare ones get long codes. The tree is built
        from the bottom up, merging the two lightest trees each time.
      </p>

      <form
        className="sidebar__section"
        onSubmit={(e) => {
          e.preventDefault();
          onRun();
        }}
      >
        <div className="label">TEXT</div>
        <button type="button" className="btn btn--block-flat" style={{ marginBottom: 10 }} onClick={onRandom}>
          <Shuffle size={13} /> RANDOM EXAMPLE
        </button>
        <textarea
          className="text-input textarea-input str-input"
          placeholder="ABRACADABRA"
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          rows={2}
          spellCheck="false"
        />
        <div className="dp-hint">
          up to {MAX_TEXT} characters and {MAX_SYMBOLS} distinct symbols · spaces ignored, case folded
        </div>

        {error && <div className="dp-error mono">{error}</div>}

        <button type="submit" className="btn active btn--block-flat">
          BUILD THE TREE
        </button>
      </form>
    </div>
  );
}
