"use client";
import { useState } from "react";
import RequestQuoteModal from "../modals/RequestQuoteModal";
import { Button } from "../ui/button";

export default function ShippingCard() {
  const [openQuote, setOpenQuote] = useState(false);
  return (
    <>
      <div className="bg-black text-white border-2 rounded-2xl p-5 flex flex-col gap-5 flex-1 justify-center items-center text-center">
        <div className="gap-2 mt-4 flex flex-col flex-1">
          <h5>Ready to ship?</h5>
          <p className="font-normal text-base">
            Get a quote to send your shipment to any location with us today.
          </p>
        </div>

        <div className="flex gap-3">
          <Button className="mt-1" onClick={() => setOpenQuote(true)}>
            Get a Quote
          </Button>
          <Button variant="social" className="mt-1">
            Contact Us
          </Button>
        </div>
      </div>

      <RequestQuoteModal isOpen={openQuote} setIsOpen={setOpenQuote} />
    </>
  );
}
