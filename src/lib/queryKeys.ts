export const queryKeys = {
  users: ["users"] as const,
  sessions: ["sessions"] as const,
  progress: (userId: string) => ["progress", userId] as const,
};
