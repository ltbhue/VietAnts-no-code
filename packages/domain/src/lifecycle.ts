export enum LifecycleState {
  Draft = "Draft",
  Validated = "Validated",
  Published = "Published",
}

const allowedTransitions: Readonly<Record<LifecycleState, readonly LifecycleState[]>> = {
  [LifecycleState.Draft]: [LifecycleState.Validated],
  [LifecycleState.Validated]: [LifecycleState.Published],
  [LifecycleState.Published]: [],
};

export function canTransition(from: LifecycleState, to: LifecycleState): boolean {
  return allowedTransitions[from].includes(to);
}
