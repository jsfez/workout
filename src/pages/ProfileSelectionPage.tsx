import { useState } from "react";
import type { FormEvent } from "react";
import { Dumbbell, Plus, UserRound } from "lucide-react";

import { createUser } from "@/api/users";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heading } from "@/components/Heading";
import { Page } from "@/components/Page";
import { PageHeader } from "@/components/PageHeader";
import { Subtitle } from "@/components/Subtitle";
import type { UserProfile } from "@/types";

interface ProfileSelectionPageProps {
  users: UserProfile[];
  isLoading: boolean;
  onUserCreated: (user: UserProfile) => void;
  onSelectUser: (user: UserProfile) => void;
}

const Brand = () => (
  <div className="mb-5 flex items-center gap-2">
    <Dumbbell className="h-5 w-5 text-primary-light" />
    <div className="text-xs font-semibold text-primary-light uppercase tracking-widest">
      Workout Tracker
    </div>
  </div>
);

export const ProfileSelectionPage = ({
  users,
  isLoading,
  onUserCreated,
  onSelectUser,
}: ProfileSelectionPageProps) => {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) return;

    setIsCreating(true);
    setError(null);

    try {
      const user = await createUser(name);
      setName("");
      onUserCreated(user);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to add this profile.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <Page>
      <PageHeader>
        <Brand />
        <Heading className="mb-1">Who's training?</Heading>
        <Subtitle>Choose your profile to pick up where you left off.</Subtitle>
      </PageHeader>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {users.map((user) => (
              <button
                key={user.id}
                type="button"
                className="flex min-h-16 items-center gap-3 rounded-xl border border-border bg-surface-raised px-4 text-left transition hover:bg-surface-hover active:scale-[0.99]"
                onClick={() => onSelectUser(user)}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <UserRound className="h-5 w-5" />
                </span>
                <span className="text-base font-semibold text-text">
                  {user.name}
                </span>
              </button>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Add profile</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="flex flex-col gap-3" onSubmit={handleCreateUser}>
                <label className="text-xs font-semibold uppercase tracking-widest text-text-faint">
                  First name
                </label>
                <input
                  className="h-11 rounded-xl border border-border bg-surface px-3 text-base text-text outline-none transition placeholder:text-text-faint focus:border-primary"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="New profile"
                />
                {error && <p className="text-sm text-danger">{error}</p>}
                <Button
                  className="gap-2"
                  disabled={!name.trim() || isCreating}
                  type="submit"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </form>
            </CardContent>
          </Card>
        </>
      )}
    </Page>
  );
};
