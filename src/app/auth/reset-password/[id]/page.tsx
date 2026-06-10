"use client";
import { ResetPasswordForm } from "@/components/form/ResetPasswordForm";
import { useParams } from "next/navigation";

export default function Page() {
  const params = useParams();
  const email = decodeURIComponent(params?.id as string);
  return <ResetPasswordForm email={email} />;
}
