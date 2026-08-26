/** Renders content that may be rich text from the editor, or older plain text. */
export default function RichText({
  value,
  className = '',
}: {
  value: string;
  className?: string;
}) {
  const text = (value ?? '').trim();
  if (!text) return null;

  if (/<[a-z][\s\S]*>/i.test(text)) {
    return <div className={`story-body ${className}`} dangerouslySetInnerHTML={{ __html: text }} />;
  }

  return (
    <div className={`prose-memorial ${className}`}>
      {text.split(/\n{2,}/).map((paragraph, i) => (
        <p key={i}>{paragraph}</p>
      ))}
    </div>
  );
}
