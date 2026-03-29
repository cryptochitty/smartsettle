'use client';

import { Toaster } from "react-hot-toast";

export default function ClientToaster() {
  return (
    <Toaster
      position="bottom-right"
      reverseOrder={false}
      gutter={8}
      containerStyle={{
        bottom: 20,
        right: 20,
      }}
      toastOptions={{
        duration: 4000,
        style: {
          background: "#0d1726",
          color: "#e8f0ff",
          border: "1px solid #1a2d4a",
          borderRadius: "12px",
          fontSize: "14px",
        },
        success: {
          iconTheme: {
            primary: "#00ff87",
            secondary: "#020c1c",
          },
        },
        error: {
          iconTheme: {
            primary: "#ff4d4f",
            secondary: "#020c1c",
          },
        },
      }}
    />
  );
}
