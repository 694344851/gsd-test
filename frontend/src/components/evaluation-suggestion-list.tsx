export interface EvaluationSuggestionListProps {
  heading: string;
  items: string[];
  emptyText: string;
}

export function EvaluationSuggestionList({
  heading,
  items,
  emptyText,
}: EvaluationSuggestionListProps) {
  return (
    <section>
      <h4 className="overview-card__label">{heading}</h4>
      {items.length > 0 ? (
        <ul>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="module-state__body">{emptyText}</p>
      )}
    </section>
  );
}
