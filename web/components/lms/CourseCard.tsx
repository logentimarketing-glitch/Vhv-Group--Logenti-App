type CourseCardProps = {
  title: string;
  level: string;
  code: string;
  format: string;
  summary: string;
};

export default function CourseCard({
  title,
  level,
  code,
  format,
  summary,
}: CourseCardProps) {
  return (
    <article className="class-card">
      <div className="candidate-head">
        <strong>{title}</strong>
        <span className="pill">{level}</span>
      </div>
      <div className="tag-row">
        <span className="pill subtle">Clave {code}</span>
        <span className="pill subtle">{format}</span>
      </div>
      <p>{summary}</p>
    </article>
  );
}
