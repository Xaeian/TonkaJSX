const Card = ({ icon, title, children }) => (
  <div class="card">
    <b>{icon} {title}</b>
    <p>{children}</p>
  </div>
);

const Features = () => (
  <Section title="Why?">
    <div class="cards">
      <Card icon="⚡" title="Zero Config">No webpack, no vite, no bundler. Just run and go.</Card>
      <Card icon="🧩" title="JSX Support">Write components without module imports. Global scope, browser-first.</Card>
      <Card icon="🔍" title="Browser Debug">What you write is what runs. No source maps, no bundler magic.</Card>
      <Card icon="📦" title="Single Build">One command packs everything into a single production HTML.</Card>
    </div>
  </Section>
);