
// pages/print.js
"use client";
import { useEffect, useState, useRef } from "react";
import Script from "next/script";
import html2canvas from "html2canvas";

export default function PrintPage() {
  const [printers, setPrinters] = useState([]);
  const [connected, setConnected] = useState(false);
  const invRef = useRef(null);

  const handlePrint = async () => {
    if (!window.JSPM || !connected) {
      alert("JSPM not connected. Cannot print.");
      return;
    }

    // 1️⃣ Capture the invoice div
    const element = invRef.current;
    if (!element) {
        alert("Printable element not found.");
        return;
    }
    const canvas = await html2canvas(element, { scale: 2 });

    // 2️⃣ Convert to Base64 PNG
    const b64Prefix = "data:image/png;base64,";
    const imgBase64DataUri = canvas.toDataURL("image/png");
    const imgBase64Content = imgBase64DataUri.substring(b64Prefix.length);

    // 3️⃣ Create print job
    const { ClientPrintJob, InstalledPrinter, PrintFile, FileSourceType } =
      window.JSPM;

    const cpj = new ClientPrintJob();

    // Pick printer → for demo: Using a specific KOT printer
    const myPrinter = new InstalledPrinter("KOT-Printer");
    myPrinter.paperName = "80(72.1) x 297 mm"; // optional: custom paper size
    cpj.clientPrinter = myPrinter;

    // 4️⃣ Add image as PrintFile (Base64)
    const myImageFile = new PrintFile(
      imgBase64Content,
      FileSourceType.Base64,
      "invoice.png",
      1
    );

    cpj.files.push(myImageFile);

    // 5️⃣ Send job to client
    cpj.sendToClient();
    
    console.log("Print job sent to KOT-Printer.");

    // (Optional) close after a few seconds
    setTimeout(() => {
      window.close();
    }, 5000);
  };


  useEffect(() => {
    if (typeof window !== "undefined") {
      const initJSPM = () => {
        // Ensure JSPM is loaded
        if (!window.JSPM) {
            console.error("JSPrintManager is not loaded.");
            // Fallback to browser print if JSPM is not available
            window.print();
            return;
        }

        const { JSPrintManager, WSStatus } = window.JSPM;
        JSPrintManager.auto_reconnect = true;
        JSPrintManager.start();

        JSPrintManager.WS.onStatusChanged = () => {
          if (JSPrintManager.websocket_status === WSStatus.Open) {
            console.log("✅ JSPM Connected!");
            setConnected(true);
            // Automatically trigger print once connected
            handlePrint();
          } else {
            console.log("❌ JSPM Disconnected! Falling back to browser print.");
            setConnected(false);
            window.print();
          }
        };
      };

      // Give the script a moment to load before initializing
      setTimeout(initJSPM, 500);
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <>
      {/* Load JSPM Script */}
      <Script
        src="https://unpkg.com/jsprintmanager@6.0.3/JSPrintManager.js"
        strategy="beforeInteractive"
      />

      <div style={{ padding: "20px", fontFamily: "Arial" }}>
        <h1>Next.js + JSPrintManager Auto Print Test</h1>
        <p>This page should automatically attempt to print on load.</p>

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

        <div>
            Status: {connected ? <span style={{color: 'green'}}>Connected</span> : <span style={{color: 'red'}}>Disconnected</span>}
        </div>
      </div>
    </>
  );
}
