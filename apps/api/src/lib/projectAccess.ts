export function projectAccessibleWhere(userId: string, projectId?: string) {
  return {
    ...(projectId ? { id: projectId } : {}),
    OR: [{ ownerId: userId }, { members: { some: { userId } } }],
  };
}
