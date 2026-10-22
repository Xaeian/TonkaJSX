// scripts/ui/FileRow.jsx

/**
 * A file as a row: the glyph and the colour of its kind, `children`, what it weighs, then `meta`.
 * Every row stands as tall as one with a `FileThumb`, so a list of them reads as one column.
 * The row is an inline `Panel`, and native attributes go to it.
 *
 * @param {object} props
 * @param {string} props.name  what the glyph and the colour are read from
 * @param {number} [props.size]  bytes; a row without it shows no weight
 * @param {Element|string} [props.meta]  what follows the weight, such as when it changed
 * @param {Element} [props.actions]
 * @param {Element|Element[]} [props.children]  the name, and its picture where there is one
 */
const FileRow = ({ name, size, meta, actions, class: className, children, ...rest }) => {
  const color = Kind.color(name);
  return (
    <Panel {...rest} inline stripe class={["file-row", className]} color={color}
      actions={actions}>
      <span class="icon" translate={false} color={color}>{Kind.icon(name)}</span>
      {children}
      <spacer />
      {size != null && (
        <Badge variant="tint" color="neutral" size="sm" mono>{Kind.sizeText(size)}</Badge>
      )}
      {meta}
    </Panel>
  );
};

/**
 * The picture of a `FileRow`: as tall as the row,
 * and as wide as it likes up to `--file-thumb-max`, past which it gives up height instead.
 * Everything else, `src` and `onClick` among it, and the mutators are those of `Img`.
 *
 * @param {object} props
 * @param {string} [props.name]  the tooltip
 */
const FileThumb = ({ name, ...rest }) => (
  <Img {...rest} height="var(--file-thumb)" maxWidth="var(--file-thumb-max)" minSquare rounded
    border title={name} />
);
