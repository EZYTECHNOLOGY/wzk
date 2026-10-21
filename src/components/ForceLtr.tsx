"use client";

import { useEffect } from "react";

/** The desk stays left-to-right even when the homepage is Hebrew. */
export default function ForceLtr() {
  useEffect(() => {
    const html = document.documentElement;
    const prevDir = html.getAttribute("dir");
    const prevLang = html.getAttribute("lang");
    html.dir = "ltr";
    html.lang = "en";
    return () => {
      if (prevDir) html.dir = prevDir;
      if (prevLang) html.lang = prevLang;
    };
  }, []);
  return null;
}
