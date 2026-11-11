// scripts/ui/Form.jsx

/**
 * One line of a form: its name on the left, its controls on the right.
 *
 * A dozen settings packed several to a line is a wall;
 * laid out as a sheet they read one at a time,
 * which is the shape anything with more of them than a row can carry ends up in.
 *
 * @param {string} label
 * @param {...(Element|null)} ctrl  a null does not appear,
 *   so a field that belongs to one case only can be passed on every call
 */
function formRow(label, ...ctrl) {
  return (
    <row>
      <strong flex="2">{label}</strong>
      <row flex="10">{ctrl}</row>
    </row>
  );
}

/**
 * What the lines above mean, in the controls' own column.
 * @param {...Element} lines
 */
function formNote(...lines) {
  return (
    <row>
      <span flex="2"></span>
      <stack flex="10" gap="no">{lines}</stack>
    </row>
  );
}

/**
 * One control with its own small name, for a line that carries several.
 * @param {string} label
 * @param {Element} ctrl
 */
const named = (label, ctrl) => <inline gap="sm" nowrap><i>{label}</i>{ctrl}</inline>;
