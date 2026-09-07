// scripts/Imgs.jsx

const SRC = "tonka.svg";

const Imgs = () => {
  const loadingImg = <Img src={SRC} height="md" width="md" rounded border />;
  const stateImg = (
    <Img src={SRC} height="md" width="md" rounded border fallbackText="no image" />
  );

  return (
    <Panel title="Images">
      <p>
        An image with a box around it:
        fixed size, fit mode, fallback for a missing or broken source, a loading overlay.
        Hover a picture for its props.
      </p>

      <h4>Height presets and units</h4>
      <row gap="lg" align="end">
        <Img src={SRC} height="sm" border title='height="sm"' />
        <Img src={SRC} height="md" border title='height="md"' />
        <Img src={SRC} height="lg" border title='height="lg"' />
        <Img src={SRC} height={48} border title="height={48}" />
        <Img src={SRC} height="4rem" border title='height="4rem"' />
      </row>

      <h4>Shape and fit</h4>
      <row gap="lg" align="end">
        <Img src={SRC} height="md" title="plain" />
        <Img src={SRC} height="md" rounded border title="rounded border" />
        <Img src={SRC} height="md" circle border title="circle border" />
        <sep />
        <Img src={SRC} height={80} width={120} border title='120x80 fit="contain"' />
        <Img src={SRC} height={80} width={120} border fit="cover" title='120x80 fit="cover"' />
      </row>

      <h4>Mutators</h4>
      <row gap="lg" align="center">
        {loadingImg}
        <ActiveBtn icon="progress_activity" size="sm"
          onChange={(on) => { loadingImg.loading = on; }}>
          loading
        </ActiveBtn>
        <sep />
        {stateImg}
        <Toggle value="ok" onChange={(v) => {
          stateImg.src = v === "ok" ? SRC : v === "empty" ? "" : "missing.png";
        }}>
          <ToggleBtn value="ok" label="src" />
          <ToggleBtn value="empty" label="empty" />
          <ToggleBtn value="error" label="broken" />
        </Toggle>
        <sep />
        <Img src={SRC} height="md" width="md" rounded border title="Click to open"
          onClick={() => Lightbox.open(SRC, "Tonka")} />
        <span tone="meta">click: <code>Lightbox.open(src)</code></span>
      </row>
    </Panel>
  );
};
