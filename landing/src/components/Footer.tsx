export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-links">
        <a href="https://github.com/chang-xinhai/WxEcho" target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        <a href="https://www.npmjs.com/package/wxecho" target="_blank" rel="noopener noreferrer">
          npm
        </a>
      </div>
      <p>基于 Mach VM API 和 SQLCipher 4 逆向工程</p>
      <p className="footer-license">WTFPL License</p>
    </footer>
  );
}
