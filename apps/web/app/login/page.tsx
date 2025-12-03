"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@pingtome/ui";
import { apiRequest } from "../../lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      localStorage.setItem("token", res.accessToken);
      router.push("/dashboard");
    } catch (err) {
      alert("Login failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md space-y-4 p-8 border rounded-lg"
      >
        <h1 className="text-2xl font-bold">Login</h1>
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
