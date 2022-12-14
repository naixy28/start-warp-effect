import Head from "next/head";
import { useEffect } from "react";
import { init } from "../space";

export default function Home() {
  useEffect(() => {
    init();
  }, []);

  return (
    <div>
      <canvas id="hyperspeed-canvas"></canvas>
    </div>
  );
}
