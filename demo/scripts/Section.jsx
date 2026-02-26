const Section = ({ title, children }) => (
  <section class="section">
    <h2 class="section-title">{title}</h2>
    {children}
  </section>
);