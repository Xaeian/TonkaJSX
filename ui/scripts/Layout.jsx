// scripts/Layout.jsx

// keys of a settings list: a value long enough to be cut, and a note
const LAYOUT_KEYS = [
  ["API_KEY", "sk-proj-abc123def456ghi789jkl012mno345pqr678stu901", "production, do not share"],
  ["DB_HOST", "postgres.prod.example.com", "primary database"],
  ["TIMEOUT", "30s", "per request"],
];

// lines of a log: the icon of a level and its colour, a time, a message
const LAYOUT_LOG = [
  ["info", "blue", "09:12:04", "server listening on :8080"],
  ["warning", "amber", "09:12:31", "slow query, 840ms"],
  ["error", "red", "09:13:02", "upstream refused the connection\n  at connect (pool.js:42)"],
];

const Layout = () => (
  <Panel title="Layout">
    <p>Boxes are tags, their space and looks are attributes, so an app writes no CSS.</p>

    <h4>row, stack, inline</h4>
    <p>
      A <code>row</code> lays its children in a line that wraps, a <code>stack</code> in a column.
      An <code>inline</code> holds an icon to its words, a <code>spacer</code> fills the gap.
      A <code>sep</code> dots two things apart, or draws a rule across a stack.
    </p>
    <stack gap="xs">
      <row gap="sm">
        <strong>Release notes</strong>
        <Badge variant="tint" size="sm" color="wrn">draft</Badge>
        <spacer />
        <inline tone="meta">
          <span class="icon" translate={false} size="sm">schedule</span>
          2h ago
        </inline>
        <sep />
        <span tone="meta">Ada Lovelace</span>
      </row>
      <sep />
      <span tone="note">The stack piles this line under the rule.</span>
    </stack>

    <h4>flex, basis</h4>
    <p>
      A <code>flex</code> child takes a share of the row, a <code>basis</code> one a fixed width.
      Text in either is cut to fit.
      On a narrow screen each weighted child takes a line, unless the row is <code>nowrap</code>.
    </p>
    <list>
      {LAYOUT_KEYS.map(([key, value, note]) => (
        <row pad="sm">
          <strong basis="md">{key}</strong>
          <span flex="3" mono>{value}</span>
          <i flex="2">{note}</i>
        </row>
      ))}
    </list>

    <h4>align, stretch</h4>
    <p>
      A row centres its children unless <code>align</code> says start, end, stretch or baseline.
      A <code>stretch</code> child spans the whole height, as the words beside this picture do.
    </p>
    <row align="start" nowrap>
      <Img src="tonka.svg" height="md" border />
      <stack stretch justify="between" gap="no">
        <strong>tonka.svg</strong>
        <span tone="meta">the name at the top, this line at the foot</span>
      </stack>
    </row>

    <h4>Text</h4>
    <row split align="start">
      <stack gap="xs">
        <span tone="note">tone="note": a sentence beside a control</span>
        <span tone="meta">tone="meta": a date, a count</span>
        <span tone="tag">tone="tag": an id, a key, a time</span>
        <span tone="log">tone="log": output, its lines kept</span>
      </stack>
      <stack gap="xs">
        <span mono>mono: a value to copy</span>
        <span quoted>quoted: words someone wrote</span>
        <span>
          <a link href="https://tonkajsx.com" target="_blank">link</a>: an address to follow
        </span>
        <span text="right">text="right": a column of numbers</span>
      </stack>
    </row>

    <h4>sunken, glow, edge, wash</h4>
    <p>
      A log sits <code>sunken</code>, and <code>glow</code> lights the line under the pointer.
      An <code>edge</code> in a <code>color</code> marks the lines worth reading first.
      A <code>wash</code> lays a soft ground of that colour under the worst of them.
      Its icons are <code>size="sm"</code>, and <code>align="baseline"</code> sets them mid-word.
      A message takes the rest with <code>grow</code> and keeps its breaks with <code>wrap</code>.
    </p>
    <stack sunken mono gap="no" pad="sm">
      {LAYOUT_LOG.map(([icon, color, time, message]) => (
        <row gap="sm" nowrap align="baseline" pad="xs" glow edge wash={icon === "error"}
          color={icon !== "info" && color}>
          <span class="icon" translate={false} size="sm" color={color}>{icon}</span>
          <span tone="tag" basis="sm">{time}</span>
          <span grow wrap>{message}</span>
        </row>
      ))}
    </stack>

    <h4>hide-narrow, only-narrow</h4>
    <p>Up to 720px wide, <code>hide-narrow</code> hides and <code>only-narrow</code> shows.</p>
    <row gap="sm">
      <Badge variant="tint" color="blue" hide-narrow>a wide screen shows this</Badge>
      <Badge variant="tint" color="wrn" only-narrow>a narrow screen shows this</Badge>
    </row>
  </Panel>
);
