// One part of a passage result, set off by a hairline instead of a card:
// heading on the left on wide screens, above the content on narrow ones.
export default function ResultSection({ title, children, ...rest }) {
  return (
    <section className="border-t border-line py-7 sm:py-9 grid md:grid-cols-[12rem_minmax(0,1fr)] gap-x-10 gap-y-4" {...rest}>
      <h2 className="text-lg sm:text-xl font-bold leading-tight text-ink">{title}</h2>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
