"use client";
// @ts-ignore: no declaration file for '@tawk.to/tawk-messenger-react'
import TawkMessengerReact from "@tawk.to/tawk-messenger-react";

export function UserChat() {
  return (
    <div>
      <TawkMessengerReact propertyId="property_id" widgetId="default" />
    </div>
  );
}
