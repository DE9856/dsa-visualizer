export default function ListInfoPanel({ opMeta }) {
  return (
    <div className="panel info">
      <div className="info__summary">
        <div className="info__title">{opMeta.label}</div>
        <p className="info__desc">{opMeta.desc}</p>
        <div className="info__complexity">
          <div><span>TIME </span>{opMeta.time}</div>
          <div><span>SPACE </span>{opMeta.space}</div>
        </div>
      </div>
    </div>
  );
}