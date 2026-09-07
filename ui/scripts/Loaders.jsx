// scripts/Loaders.jsx

const Loaders = () => {
  const bar = <Progress value={0} color="inf" label />;
  let timer = null;
  const startBtn = <Button variant="primary" icon="play_arrow" onClick={() => {
    clearInterval(timer);
    bar.value = 0;
    startBtn.loading = true;
    timer = setInterval(() => {
      bar.value += 5;
      if(bar.value < 100) return;
      clearInterval(timer);
      startBtn.loading = false;
      Alert.ok("Finished");
    }, 100);
  }}>Start</Button>;

  return (
    <Panel title="Spinners and progress">
      <h4>Spinners</h4>
      <row>
        <Spinner />
        <Spinner text="Loading..." />
        <Spinner size="sm" color="neutral" text="small" />
        <Spinner size="lg" color="inf" text="large" />
        <Spinner color="ok" text="ok" />
        <Spinner color="wrn" text="wrn" />
        <Spinner color="err" text="err" />
        <Spinner color="purple" text="any palette name" />
      </row>

      <h4>Progress</h4>
      <Progress value={30} color="inf" label />
      <Progress value={55} color="ok" label />
      <Progress value={70} color="wrn" label />
      <Progress value={85} color="err" label />
      <Progress value={4} max={10} color="teal" label />
      <row>
        <Progress value={60} size="sm" color="neutral" />
        <Progress value={60} color="neutral" />
        <Progress value={60} size="lg" color="neutral" />
      </row>
      <Progress color="neutral" label />

      <h4>Live</h4>
      <p>
        Button spins while bar fills:
        <code>btn.loading</code> and <code>bar.value</code> from one timer.
      </p>
      <row nowrap>
        {startBtn}
        {bar}
      </row>
    </Panel>
  );
};
