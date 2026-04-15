import type { UserProfile } from "@/types";

export async function getUsers(): Promise<UserProfile[]> {
  const response = await fetch("/api/users");

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Users request failed with status ${response.status}: ${errorBody}`,
    );
  }

  return response.json() as Promise<UserProfile[]>;
}

export async function createUser(name: string): Promise<UserProfile> {
  const response = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Users request failed with status ${response.status}: ${errorBody}`,
    );
  }

  return response.json() as Promise<UserProfile>;
}
