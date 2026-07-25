import { createAccessControl } from 'better-auth/plugins/access'

const roles = {
  manage: ['create', 'share', 'update', 'delete'],
  user: ['read'],
  guest: [],
} as const

export const ac = createAccessControl(roles)

export const manager = ac.newRole({
  manage: ['create', 'share', 'update', 'delete'],
})

export const user = ac.newRole({
  user: ['read'],
})

export const guest = ac.newRole({
  guest: [],
})
