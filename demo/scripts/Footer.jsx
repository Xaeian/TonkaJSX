let footerFirst = true;

const Item = ({ children }) => {
  const sep = footerFirst ? null : <span class="sep">┆</span>;
  footerFirst = false;
  return <span class="footer-item">{sep}{children}</span>;
};

const Footer = () => {
  footerFirst = true;
  return (
    <footer class="footer">
      <Item>© Xaeian</Item>
      <Item>Like Vanilla but JSX</Item>
      <Item>Built with 🌰 <a class="footer-link" href="https://github.com/Xaeian/TonkaJSX">TonkaJSX</a></Item>
    </footer>
  );
};