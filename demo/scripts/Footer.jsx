let footerFirst = true;

const Item = ({ children }) => {
  const sep = footerFirst ? null : <span class="sep">┃</span>;
  footerFirst = false;
  return <span class="footer-item">{sep}{children}</span>;
};

const Footer = () => {
  footerFirst = true;
  return (
    <footer class="footer">
      <Item>TonkaJSX {{ver}}</Item>
      <Item>Xaeian ©<a class="footer-link" href="https://github.com/Xaeian">GitHub</a></Item>
      <Item>{{foot}} with<a class="footer-link" href="{{link}}">TonkaJSX</a></Item>
    </footer>
  );
};