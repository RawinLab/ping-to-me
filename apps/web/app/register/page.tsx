"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@pingtome/ui";
import { apiRequest } from "../../lib/api";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, name }),
      });
      router.push("/login");
    } catch (err) {
      alert("Registration failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form
        onSubmit={handleRegister}
        className="w-full max-w-md space-y-4 p-8 border rounded-lg"
      >
        <h1 className="text-2xl font-bold">Register</h1>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <Button />
      </form>
    </div>
  );
}
