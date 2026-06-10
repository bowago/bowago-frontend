"use client";
import { VerifyOTPForm } from "@/components/form/VerifyOTPForm";
import { useParams } from "next/navigation";

export default function Page() {
  const params = useParams();
  const email = decodeURIComponent(params?.id as string);


  return <VerifyOTPForm email={email} />;
}
