const Star = ({ on }) => <span class={on ? "star" : "star off"}>★</span>;
const Stars = ({ n }) => <td>{[1,2,3].map(i => <Star on={i <= n} />)}</td>;

const Comparison = () => (
  <Section title="Comparison">
    <p class="subdesc">Subjective, for small sites and quick tools only.</p>
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th></th><th>Tonka</th><th>Bootstrap</th><th>Tw+Alpine</th><th>Preact</th><th>Astro</th>
        </tr></thead>
        <tbody>
          <tr><td class="metric">Fast start</td><Stars n={3}/><Stars n={3}/><Stars n={2}/><Stars n={2}/><Stars n={2}/></tr>
          <tr><td class="metric">Low dependency</td><Stars n={3}/><Stars n={2}/><Stars n={2}/><Stars n={1}/><Stars n={2}/></tr>
          <tr><td class="metric">Custom look</td><Stars n={3}/><Stars n={1}/><Stars n={3}/><Stars n={3}/><Stars n={3}/></tr>
          <tr><td class="metric">Ready components</td><Stars n={1}/><Stars n={3}/><Stars n={1}/><Stars n={2}/><Stars n={2}/></tr>
          <tr><td class="metric">Browser debug</td><Stars n={3}/><Stars n={3}/><Stars n={2}/><Stars n={1}/><Stars n={1}/></tr>
          <tr><td class="metric">Scaling</td><Stars n={1}/><Stars n={1}/><Stars n={2}/><Stars n={3}/><Stars n={3}/></tr>
          <tr><td class="metric">Handover</td><Stars n={1}/><Stars n={3}/><Stars n={2}/><Stars n={2}/><Stars n={2}/></tr>
        </tbody>
      </table>
    </div>
  </Section>
);