export function getDefaultHomePath(roleCode?: string | null) {
  switch (roleCode) {
    case "ROLE_ADMIN":
    case "ROLE_MANAGER":
      return "/dashboard";
    default:
      return "/customer-space";
  }
}
