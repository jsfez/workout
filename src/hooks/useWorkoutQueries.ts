import { useQuery } from "@tanstack/react-query";
import { getUsers } from "@/api/users";
import {
  emptyProgress,
  getSessions,
  getWorkoutProgress,
} from "@/api/workoutProgress";
import { queryKeys } from "@/lib/queryKeys";

export function useWorkoutQueries(selectedUserId: string | null) {
  const sessionsQuery = useQuery({
    queryKey: queryKeys.sessions,
    queryFn: getSessions,
    enabled: selectedUserId !== null,
  });

  const progressQuery = useQuery({
    queryKey: selectedUserId
      ? queryKeys.progress(selectedUserId)
      : (["progress", "no-user"] as const),
    queryFn: () => getWorkoutProgress(selectedUserId ?? ""),
    enabled: selectedUserId !== null,
  });

  const sessions = sessionsQuery.data ?? [];
  const progress = progressQuery.data ?? emptyProgress;
  const isWorkoutLoading =
    selectedUserId !== null &&
    (sessionsQuery.isPending || progressQuery.isPending);

  return {
    sessionsQuery,
    progressQuery,
    sessions,
    progress,
    isWorkoutLoading,
  };
}

export function useUsersQuery() {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: getUsers,
  });
}
