// scripts/FileDrops.jsx

const FileDrops = () => {
  const fmtSize = (n) =>
    n < 1048576 ? (n / 1024).toFixed(1) + " KB" : (n / 1048576).toFixed(1) + " MB";

  //---------------------------------------------------------------------------------------- Avatar

  const avatarSlot = <div></div>;
  const showDrop = () => avatarSlot.replaceChildren(avatarDrop);
  const showImage = (file) => avatarSlot.replaceChildren(
    <Panel inline stripe color="ok"
      actions={<IconBtn icon="close" variant="ghost" title="Remove" onClick={showDrop} />}>
      <Img src={URL.createObjectURL(file)} height="lg" rounded border />
      <stack gap="no">
        <strong>{file.name}</strong>
        <span tone="meta">{fmtSize(file.size)} · {file.type}</span>
      </stack>
    </Panel>
  );
  const avatarDrop = (
    <FileDrop accept="image/*" maxSize={2 * 1024 * 1024} icon="account_circle"
      title="Choose your avatar" description="PNG, JPG or SVG up to 2 MB"
      onFiles={([file]) => showImage(file)} onError={(msg) => Alert.wrn(msg)} />
  );
  showDrop();

  //----------------------------------------------------------------------------------- Attachments

  const files = [];
  const fileList = <stack gap="xs"></stack>;
  const fileEmpty = <span tone="meta">Nothing attached yet.</span>;
  const renderFiles = () => {
    fileList.replaceChildren(...files.map((f, i) => (
      <Panel inline stripe color="blue" icon="draft" size="sm"
        actions={<IconBtn icon="close" variant="ghost" size="sm" title="Remove"
          onClick={() => { files.splice(i, 1); renderFiles(); }} />}>
        <strong flex="8">{f.name}</strong>
        <Badge variant="tint" size="sm" mono>{fmtSize(f.size)}</Badge>
      </Panel>
    )));
    fileEmpty.hidden = !!files.length;
  };
  renderFiles();
  const attachDrop = (
    <FileDrop multiple maxCount={5} maxSize={10 * 1024 * 1024} icon="attach_file" size="sm"
      title="Attach up to five files" description="any type, 10 MB each"
      onFiles={(picked) => { files.push(...picked); renderFiles(); }}
      onError={(msg) => Alert.wrn(msg)} />
  );

  //--------------------------------------------------------------------------------- Keep file

  const keepDrop = (
    <FileDrop icon="draft" title="Pick one file"
      description="drop keeps it, a click clears it"
      onFiles={([file]) => { keepDrop.selected = file; }}
      onClear={() => Alert.inf("Cleared")}
      onError={(msg) => Alert.wrn(msg)} />
  );

  //------------------------------------------------------------------------------------------ View

  return (
    <Panel title="File drops">
      <p>
        Click or drop.
        Wrong type, too big or too many files go to <code>onError</code>;
        nothing reaches <code>onFiles</code> unless every file passes.
      </p>

      <h4>One image</h4>
      {avatarSlot}

      <h4>Many files</h4>
      {attachDrop}
      {fileList}
      {fileEmpty}

      <h4>Keep file in drop</h4>
      <p>
        <code>drop.selected = file</code> shows name and size
        until a click clears it.
      </p>
      {keepDrop}
    </Panel>
  );
};
