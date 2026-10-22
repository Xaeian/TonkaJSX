// scripts/ui/Columns.jsx

/**
 * Cards in columns of their own heights:
 * one column, and one more at every width of `breaks` the box reaches.
 * Cards are dealt in reading order, each to the column that is shortest when its turn comes,
 * so the columns end close to level.
 * A card keeps its column while it grows or shrinks; only another count deals again,
 * and a card swapped for a form by then stays the form.
 *
 * Mutators: .items
 *
 * @param {object} props
 * @param {number[]} [props.breaks]  widths of the box in px, each opening one more column
 * @param {"no"|"xs"|"sm"|"md"|"lg"} [props.gap="md"]
 * @param {Element[]} [props.children]
 */
const Columns = ({ breaks = [], gap = "md", children, ...rest }) => {
  const el = <row {...rest} split nowrap align="start" gap={gap}></row>;
  // one box per card, in reading order: whatever takes a card's place takes it in the box
  let slots = [];
  let count = 0;

  const countFor = (width) => 1 + breaks.filter(b => width >= b).length;

  function deal(n) {
    count = n;
    const cols = Array.from({ length: n }, () => <stack gap={gap}></stack>);
    el.replaceChildren(...cols);
    for(const slot of slots) {
      let low = cols[0];
      for(const col of cols) if(col.offsetHeight < low.offsetHeight) low = col;
      low.appendChild(slot);
    }
  }

  // children come nested as JSX hands them, and a false one is no card
  UI.prop(el, "items", () => slots.map(slot => slot.firstChild), (cards) => {
    slots = [cards].flat(Infinity).filter(Boolean).map(card => <div>{card}</div>);
    deal(countFor(el.clientWidth));
  });
  new ResizeObserver(() => {
    const n = countFor(el.clientWidth);
    if(n !== count) deal(n);
  }).observe(el);
  el.items = children;
  return el;
};
