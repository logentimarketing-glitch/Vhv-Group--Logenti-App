type ChartsProps = {
  values: number[];
};

export default function Charts({ values }: ChartsProps) {
  const max = Math.max(...values, 1);

  return (
    <div className="chart-bars">
      {values.map((value, index) => (
        <div key={`${value}-${index}`} className="chart-bar-wrap">
          <div className="chart-bar" style={{ height: `${(value / max) * 100}%` }} />
          <span>{value}</span>
        </div>
      ))}
    </div>
  );
}
