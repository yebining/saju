"use client";
import { useRouter } from "next/navigation";
import { InputForm } from "@/components/input-form";
import { FullInput } from "@/types";

export default function CheckPage() {
  const router = useRouter();

  const handleSubmit = (input: FullInput) => {
    sessionStorage.setItem("saju_input", JSON.stringify(input));
    const tempId = crypto.randomUUID();
    router.push(`/manse/${tempId}`);
  };

  return <InputForm onSubmit={handleSubmit} />;
}
