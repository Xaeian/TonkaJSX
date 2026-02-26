const Star = ({ on }) => <span class={on ? "star" : "star off"}>★</span>;
const Stars = ({ n }) => <td>{[1,2,3].map(i => <Star on={i <= n} />)}</td>;

const Row = ({ label, scores }) => (
  <tr>
    <td class="metric">{label}</td>
    {scores.map(s => <Stars n={s} />)}
  </tr>
);

const Comparison = () => (
  <Section title="Comparison">
    <p class="subdesc">Subjective, for small sites and quick tools only.</p>
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th></th><th>Tonka</th><th>Vanilla</th><th>Bootstrap</th><th>Tw+Alpine</th><th>Preact</th><th>Astro</th>
        </tr></thead>
        <tbody>
          <Row label="Fast start" scores={[3,3,3,1,2,2]} />
          <Row label="Low dependency" scores={[2,3,2,2,1,2]} />
          <Row label="Custom look" scores={[3,3,1,3,3,3]} />
          <Row label="Ready components" scores={[1,1,3,1,2,2]} />
          <Row label="Browser debug" scores={[3,3,3,2,2,1]} />
          <Row label="Code structure" scores={[3,1,1,2,3,3]} />
          <Row label="Scaling" scores={[1,1,1,2,3,3]} />
          <Row label="Handover" scores={[1,2,3,2,2,2]} />
        </tbody>
      </table>
    </div>
  </Section>
);