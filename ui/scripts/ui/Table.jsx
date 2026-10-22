// scripts/ui/Table.jsx

// characters past which a cell carries its whole text in its tooltip as well
const _TABLE_TIP = 80;

/**
 * Rows of values under a head that stays in view while they scroll.
 * A cell cuts a long text with an ellipsis, and its tooltip holds the whole of a long one.
 * A value wears the colour `Code` gives its kind: a number, a boolean, `null`,
 * and an object or an array, written as JSON; text stays plain, and an element is a cell as it is.
 * A column of numbers, `null` among them or not, sits to the right.
 *
 * @param {object} props
 * @param {string[]} props.columns  the heads, and the keys of a row that is an object
 * @param {Array<Array|object>} props.rows  values in the order of `columns`, or by their names
 */
const Table = ({ columns, rows, class: className, ...rest }) => {
  const cells = rows.map(row => Array.isArray(row) ? row : columns.map(key => row[key]));
  const align = columns.map((_, at) => {
    const values = cells.map(row => row[at]).filter(v => v != null);
    return values.length > 0 && values.every(v => typeof v === "number") && "right";
  });
  return (
    <div {...rest} class={["table", className]}>
      <table>
        <thead>
          <tr>{columns.map((head, at) => <th text={align[at]}>{head}</th>)}</tr>
        </thead>
        <tbody>
          {cells.map(row => <tr>{columns.map((_, at) => _tableCell(row[at], align[at]))}</tr>)}
        </tbody>
      </table>
    </div>
  );
};

// one cell: a value as text in the colour of its kind, an element as it is
function _tableCell(value, align) {
  if(value?.nodeType) return <td text={align}>{value}</td>;
  const kind = value == null ? "null"
    : typeof value === "number" ? "num"
    : typeof value === "boolean" ? "bool"
    : typeof value === "object" ? "json"
    : null;
  const text = kind === "null" ? "null" : kind === "json" ? JSON.stringify(value) : String(value);
  return (
    <td class={kind && "table-" + kind} text={align}
      title={text.length > _TABLE_TIP && text}>{text}</td>
  );
}
