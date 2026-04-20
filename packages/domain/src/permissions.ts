export enum Role {
  Admin = "Admin",
  Editor = "Editor",
  Viewer = "Viewer",
}

export enum Permission {
  ResultsView = "results.view",
  TestsUpdate = "tests.update",
  WorkspaceArchive = "workspace.archive",
}

const rolePermissions: Readonly<Record<Role, readonly Permission[]>> = {
  [Role.Admin]: [Permission.ResultsView, Permission.TestsUpdate],
  [Role.Editor]: [Permission.ResultsView, Permission.TestsUpdate],
  [Role.Viewer]: [Permission.ResultsView],
};

export function can(role: Role, permission: Permission): boolean {
  return rolePermissions[role].includes(permission);
}
