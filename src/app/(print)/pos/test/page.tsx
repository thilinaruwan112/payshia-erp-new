
"use client";

import { useEffect, useState, useRef } from "react";
import Script from "next/script";
import html2canvas from "html2canvas";

declare global {
  interface Window {
    JSPM: any;
  }
}

export default function PrintPage() {
  const [printers, setPrinters] = useState([]);
  const [connected, setConnected] = useState(false);
  const invRef = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const initJSPM = () => {
        if (!window.JSPM) return;

        const { JSPrintManager } = window.JSPM;
        JSPrintManager.auto_reconnect = true;
        JSPrintManager.start();

        JSPrintManager.WS.onOpen = () => {
          console.log("✅ JSPM Connected!");
          setConnected(true);
          JSPrintManager.getPrinters().then((list: any) => {
            console.log("Printers:", list);
            setPrinters(list);
          });
        };

        JSPrintManager.WS.onClose = () => {
          console.log("❌ JSPM Disconnected!");
          setConnected(false);
        };
      };

      setTimeout(initJSPM, 500);
    }
  }, []);

  const handlePrint = async () => {
    if (!window.JSPM || !connected) {
      alert("JSPM not connected.");
      return;
    }

    const element = invRef.current;
    if (!element) {
        alert("Printable element not found.");
        return;
    }
    const canvas = await html2canvas(element, { scale: 2 });

    const b64Prefix = "data:image/png;base64,";
    const imgBase64DataUri = canvas.toDataURL("image/png");
    const imgBase64Content = imgBase64DataUri.substring(b64Prefix.length);

    const { ClientPrintJob, InstalledPrinter, PrintFile, FileSourceType } =
      window.JSPM;

    const cpj = new ClientPrintJob();

    const myPrinter = new InstalledPrinter("Microsoft Print to PDF");
    myPrinter.paperName = "80(72.1) x 297 mm";
    cpj.clientPrinter = myPrinter;

    const myImageFile = new PrintFile(
      imgBase64Content,
      FileSourceType.Base64,
      "invoice.png",
      1
    );

    cpj.files.push(myImageFile);
    cpj.sendToClient();

    setTimeout(() => {
      window.close();
    }, 5000);
  };

  return (
    <>
      {/* Load JSPM Script */}
      <Script
        src="https://unpkg.com/jsprintmanager/JSPrintManager.js"
        strategy="beforeInteractive"
      />

      <div style={{ padding: "20px", fontFamily: "Arial" }}>
        <h1>Next.js + JSPrintManager Invoice Print</h1>

        {/* Invoice content to capture */}
        <div
          id="inv"
          ref={invRef}
          style={{
            width: "300px",
            padding: "20px",
            border: "2px solid #333",
            background: "#f9f9f9",
            marginBottom: "20px",
          }}
        >
          <h2>Hello from Next.js!</h2>
          <p>This box will be captured as an image and printed.</p>
        </div>

        <button
          onClick={handlePrint}
          disabled={!connected}
          style={{ padding: "10px 20px", marginTop: "10px" }}
        >
          🖨 Print Invoice
        </button>

        <h2 style={{ marginTop: "20px" }}>Available Printers:</h2>
        <ul>
          {printers.length > 0 ? (
            printers.map((p, i) => <li key={i}>{p}</li>)
          ) : (
            <li>No printers detected yet...</li>
          )}
        </ul>
      </div>
    </>
  );
}
