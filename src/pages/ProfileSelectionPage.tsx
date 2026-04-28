import { useState } from "react";
import type { FormEvent } from "react";
import { Dumbbell, Plus, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heading } from "@/components/Heading";
import { Loader } from "@/components/Loader";
import { Page } from "@/components/Page";
import { PageHeader } from "@/components/PageHeader";
import { Subtitle } from "@/components/Subtitle";
import type { UserProfile } from "@/types";

interface ProfileSelectionPageProps {
  users: UserProfile[];
  isLoading: boolean;
  onCreateUser: (name: string) => Promise<UserProfile>;
  onSelectUser: (user: UserProfile) => void;
}

const Brand = () => (
  <div className="mb-5 flex items-center gap-2">
    <Dumbbell className="text-primary-light h-5 w-5" />
    <div className="text-primary-light text-xs font-semibold tracking-widest uppercase">
      Workout Tracker
    </div>
  </div>
);

export const ProfileSelectionPage = ({
  users,
  isLoading,
  onCreateUser,
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
      await onCreateUser(name);
      setName("");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to add this profile.",
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
        <Loader centered label="Loading profiles" />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {users.map((user) => (
              <button
                key={user.id}
                type="button"
                className="border-border bg-surface-raised hover:bg-surface-hover flex min-h-16 items-center gap-3 rounded-xl border px-4 text-left transition active:scale-[0.99]"
                onClick={() => onSelectUser(user)}
              >
                <span className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-xl">
                  <UserRound className="h-5 w-5" />
                </span>
                <span className="text-text text-base font-semibold">
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
                <label className="text-text-faint text-xs font-semibold tracking-widest uppercase">
                  First name
                </label>
                <input
                  className="border-border bg-surface text-text placeholder:text-text-faint focus:border-primary h-11 rounded-xl border px-3 text-base transition outline-none"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="New profile"
                />
                {error && <p className="text-danger text-sm">{error}</p>}
                <Button
                  className="gap-2"
                  disabled={!name.trim() || isCreating}
                  type="submit"
                >
                  {isCreating ? (
                    <Loader
                      aria-label="Creating profile"
                      label="Adding..."
                      labelClassName="text-sm font-semibold text-current"
                      size="sm"
                      spinnerClassName="border-white/30 border-t-white"
                    />
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Add
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </>
      )}
    </Page>
  );
};
