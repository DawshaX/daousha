export function isOperationalProject(project: { projectKind: "standalone" | "package_parent" | "package_variant" }) {
  return project.projectKind !== "package_parent";
}

export function filterOperationalProjectVideoAssets<T extends { project: { projectKind: "standalone" | "package_parent" | "package_variant" } }>(items: T[]) {
  return items.filter(item => isOperationalProject(item.project));
}
