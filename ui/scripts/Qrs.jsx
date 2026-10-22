// scripts/Qrs.jsx

// A camera reads a code with the browser's own `BarcodeDetector` where there is one;
// jsQR stands in elsewhere (Windows, iOS) and is fetched on the first scan, not before.
const JSQR_SRC = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js";
const JSQR_SRI = "sha384-b5Ya4Bq3qCyz39m2ISh+4DxjAIljdeFwK/BsXLuj9gugaNwAcj/ia15fxNZL9Nlx";

const Qrs = () => {
  const textIn = (
    <Input icon="qr_code_2" value="HELLO TONKA" placeholder="Text to encode"
      onChange={(v) => { code.text = v; }} />
  );
  const code = <QrCode text="HELLO TONKA" size={200} />;
  const saveBtn = <IconBtn icon="download" title="Save as .svg file"
    onClick={() => fileSave("qr.svg", code.svg, "image/svg+xml")} />;

  // every way a scan ends: a code read, a failure, or the button pressed again
  function stopScan() {
    scanner.stop();
    scanner.hidden = true;
    scanBtn.active = false;
  }
  const scanner = <QrScan
    onScan={(text) => {
      stopScan();
      textIn.value = text;
      code.text = text;
      Alert.ok(`Scanned: ${text}`);
    }}
    onError={(msg) => { stopScan(); Alert.err(msg); }} />;
  scanner.hidden = true;

  const scanBtn = <ActiveBtn icon="photo_camera" onChange={async (on) => {
    if(!on) { stopScan(); return; }
    if(!("BarcodeDetector" in window) && typeof jsQR !== "function") {
      scanBtn.loading = true;
      try { await UI.script(JSQR_SRC, JSQR_SRI); }
      catch(e) { Alert.err(e.message); stopScan(); return; }
      finally { scanBtn.loading = false; }
    }
    scanner.hidden = false;
    await scanner.start();
  }}>Scan</ActiveBtn>;

  return (
    <Panel title="QR">
      <p>
        A <code>QrCode</code> needs <code>qrcode-generator</code> on the page.
        It holds <code>.text</code> and <code>.svg</code>, the code as a file with its quiet zone.
        Digits and capitals go in the alphanumeric mode, so such a code stays sparse.
      </p>
      <h4>Code</h4>
      <row gap="sm" nowrap>
        {textIn}
        {saveBtn}
      </row>
      <row justify="center">{code}</row>

      <h4>Camera</h4>
      <p>
        A <code>QrScan</code> reads one code and stops, then hands it to <code>onScan</code>.
        It runs from <code>.start()</code> to <code>.stop()</code>, on a secure origin only.
      </p>
      <row>{scanBtn}</row>
      {scanner}
    </Panel>
  );
};
