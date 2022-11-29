import "../styles/globals.css";
import type { AppProps } from "next/app";
import { Routes } from "../components/Routes";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <Routes />
    </>
  );
}
