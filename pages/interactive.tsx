import Head from "next/head";
import { useEffect } from "react";
import { init } from "../space/interactive";

export default function Home() {
  useEffect(() => {
    init();
  }, []);

  return (
    <div style={{ background: "black" }}>
      <canvas id="hyperspeed-canvas"></canvas>
    </div>
  );
}
