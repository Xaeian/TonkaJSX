const Hero = () => (
  <section class="hero">
    <h1><img src="tonka.svg" alt="T" width="50" height="50" />onka<code>JSX</code></h1>
    <p class="tagline">Like Vanilla<code>JS</code> but with a hint of <code>JSX</code></p>
    <p class="desc">
      Lightweight <i>(and probably a bit unfinished)</i> <b>frontend framework</b>.
      It doesn't use <s>modules</s> because they make browser debugging harder,
      but it does support <b>JSX</b> because it's great.
      Files land in browser <b>1:1</b>, so DevTools shows your file, not a bundle.
    </p>
    <p class="subdesc">
      Script-first, not for huge apps. Zero config, fast setup,
      for small sites, prototypes, and quick internal tools.
    </p>
  </section>
);