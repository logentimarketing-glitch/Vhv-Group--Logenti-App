type StatsCardProps = {
  label: string;
  value: string;
  helper?: string;
};

export default function StatsCard({ label, value, helper }: StatsCardProps) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {helper ? <p>{helper}</p> : null}
    </article>
  );
}
