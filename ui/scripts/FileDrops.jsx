// scripts/FileDrops.jsx

const FileDrops = () => {

  //---------------------------------------------------------------------------------------- Avatar

  const avatarSlot = <stack></stack>;
  const showDrop = () => avatarSlot.replaceChildren(avatarDrop);
  function showImage(file) {
    avatarSlot.replaceChildren(
      <FileRow name={file.name} size={file.size} meta={<span tone="meta">{file.type}</span>}
        actions={<IconBtn icon="close" variant="ghost" title="Remove" onClick={showDrop} />}>
        <FileThumb name={file.name} src={URL.createObjectURL(file)} />
        <strong>{file.name}</strong>
      </FileRow>
    );
  }
  const avatarDrop = (
    <FileDrop accept="image/*" maxSize={2e6} icon="account_circle"
      title="Choose your avatar" description="PNG, JPG or SVG up to 2MB"
      onFiles={([file]) => showImage(file)} onError={(msg) => Alert.wrn(msg)} />
  );
  showDrop();

  //----------------------------------------------------------------------------------- Attachments

  const files = [];
  const fileList = <list></list>;
  const fileEmpty = <span tone="meta">Nothing attached yet.</span>;
  function renderFiles() {
    fileList.replaceChildren(...files.map((f, i) => (
      <FileRow name={f.name} size={f.size}
        actions={<IconBtn icon="close" variant="ghost" size="sm" title="Remove"
          onClick={() => { files.splice(i, 1); renderFiles(); }} />}>
        <strong>{f.name}</strong>
      </FileRow>
    )));
    fileList.hidden = !files.length;
    fileEmpty.hidden = !!files.length;
  }
  renderFiles();
  const attachDrop = (
    <FileDrop multiple maxCount={5} maxSize={10e6} icon="attach_file" size="sm"
      title="Attach up to five files" description="any type, 10MB each"
      onFiles={(picked) => { files.push(...picked); renderFiles(); }}
      onError={(msg) => Alert.wrn(msg)} />
  );

  //------------------------------------------------------------------------------------- Keep file

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
        A file that passes becomes a <code>FileRow</code> here.
      </p>

      <h4>One image</h4>
      {avatarSlot}

      <h4>Many files</h4>
      {attachDrop}
      {fileList}
      {fileEmpty}

      <h4>Keep file in drop</h4>
      <p><code>drop.selected = file</code> shows its name and size until a click clears it.</p>
      {keepDrop}
    </Panel>
  );
};
