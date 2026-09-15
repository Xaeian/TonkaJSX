// scripts/ui/Qr.jsx

/**
 * QR code of `text` as inline SVG on a white card (styles/ui/qr.css), so it scans in both
 * themes. Needs `qrcode` (qrcode-generator) on the page; without it the card stays empty.
 * Text that is digits and upper-case letters goes in the alphanumeric mode, 5.5 bits a
 * character against 8 for bytes, so such a code stays sparse.
 *
 * Mutators: .text, .svg (read-only: the code as a standalone SVG file, with a quiet zone)
 *
 * @param {Object} props
 * @param {string} [props.text=""]
 * @param {number} [props.size=200]  CSS pixels
 */
const QrCode = ({ text = "", size = 200 }) => {
  const el = <div class="qr"></div>;
  let current = "";
  let code = null;
  UI.prop(el, "text", () => current, (v) => {
    current = v || "";
    el.innerHTML = "";
    code = null;
    if(!current || typeof qrcode !== "function") return;
    code = qrcode(0, "M"); // 0 picks the smallest version that fits
    code.addData(current, /^[0-9A-Z $%*+\-./:]*$/.test(current) ? "Alphanumeric" : "Byte");
    code.make();
    el.innerHTML = code.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
    const svg = el.firstElementChild;
    svg.setAttribute("width", size);
    svg.setAttribute("height", size);
  });
  // a file needs a fixed size and a quiet zone, so any viewer and any scanner gets it right
  UI.prop(el, "svg", () => code ? code.createSvgTag({ cellSize: 8, margin: 4 }) : "");
  el.text = text;
  return el;
};

/**
 * Camera QR reader: the rear camera in a <video>, a frame decoded every few hundred ms until
 * one holds a code. Decoding is the browser's `BarcodeDetector` where it exists, else `jsQR`
 * on the page; with neither, `start` reports it. A camera also needs a secure origin.
 *
 * Mutators: .start() (camera on; a promise), .stop()
 *
 * @param {Object} props
 * @param {(text:string) => void} props.onScan  first code found; the camera is off by then
 * @param {(message:string) => void} [props.onError]
 */
const QrScan = ({ onScan, onError }) => {
  const video = <video class="qr-scan" playsinline muted autoplay></video>;
  let stream = null;
  let timer = 0;

  // one frame to text or null, by whatever decoder the page has
  const decoder = () => {
    if("BarcodeDetector" in window) {
      const detector = new BarcodeDetector({ formats: ["qr_code"] });
      return async () => (await detector.detect(video))[0]?.rawValue ?? null;
    }
    if(typeof jsQR === "function") {
      const cv = document.createElement("canvas");
      const ctx = cv.getContext("2d");
      return async () => {
        cv.width = video.videoWidth;
        cv.height = video.videoHeight;
        if(!cv.width) return null; // no frame yet
        ctx.drawImage(video, 0, 0);
        const img = ctx.getImageData(0, 0, cv.width, cv.height);
        return jsQR(img.data, img.width, img.height)?.data ?? null;
      };
    }
    return null;
  };

  async function start() {
    const decode = decoder();
    if(!decode) { onError?.("No QR decoder on this page"); return; }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    }
    catch(e) {
      onError?.(e.name === "NotAllowedError" ? "Camera access was refused" : e.message);
      return;
    }
    video.srcObject = stream;
    await video.play();
    const tick = async () => {
      let text = null;
      try { text = await decode(); } catch {} // a frame that fails to decode is just skipped
      if(text) { stop(); onScan(text); return; }
      timer = setTimeout(tick, 250);
    };
    tick();
  }

  function stop() {
    clearTimeout(timer);
    timer = 0;
    stream?.getTracks().forEach(t => t.stop());
    stream = null;
    video.srcObject = null;
  }

  video.start = start;
  video.stop = stop;
  return video;
};
