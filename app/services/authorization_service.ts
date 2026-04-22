import type User from '#models/user'

export default async function (permissionKey: string, user: User) {
  let hasPermission = false

  if (!user.permissions?.length) {
    await user.loadOnce('permissions')
    hasPermission = Boolean(user.permissions.find((permission) => permission.key === permissionKey))
  } else
    hasPermission = Boolean(user.permissions.find((permission) => permission.key === permissionKey))

  return !!hasPermission
}
