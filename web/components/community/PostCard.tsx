type PostCardProps = {
  author: string;
  role: string;
  content: string;
  media?: string[];
};

export default function PostCard({ author, role, content, media = [] }: PostCardProps) {
  return (
    <article className="post-card">
      <div className="candidate-head">
        <strong>{author}</strong>
        <span className="pill subtle">{role}</span>
      </div>
      <p>{content}</p>
      {media.length ? (
        <div className="tag-row">
          {media.map((item) => (
            <span key={item} className="pill">
              {item}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}
