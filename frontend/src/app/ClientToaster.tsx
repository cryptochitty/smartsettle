'use client';

import { Toaster } from "react-hot-toast";

export default function ClientToaster() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: "#0d1726",
          color: "#e8f0ff",
          border: "1px solid #1a2d4a",
        },
      }}
    />
  );
}
