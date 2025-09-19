// src/shared/constants/action-key.constants.ts

export const ACTION_KEYS = {
  USER: {
    CREATE: 'CREATE_USER',
    UPDATE: 'UPDATE_USER',
    DELETE: 'DELETE_USER',
  },
  ROLE: {
    CREATE: 'CREATE_ROLE',
    UPDATE: 'UPDATE_ROLE',
    DELETE: 'DELETE_ROLE',
  },
  DOCUMENT: {
    CREATE: 'CREATE_DOCUMENT',
    UPDATE: 'UPDATE_DOCUMENT',
    DELETE: 'DELETE_DOCUMENT',
  },
  IMAGE: {
    CREATE: 'CREATE_IMAGE',
    UPDATE: 'UPDATE_IMAGE',
    DELETE: 'DELETE_IMAGE',
  },
} as const

// Mapping action to reverse action for rollback
export const ROLLBACK_ACTIONS = {
  // CREATE -> DELETE (xóa record đã tạo)
  CREATE_USER: 'DELETE_USER',
  CREATE_ROLE: 'DELETE_ROLE',
  CREATE_DOCUMENT: 'DELETE_DOCUMENT',
  CREATE_IMAGE: 'DELETE_IMAGE',

  // DELETE -> CREATE (tạo lại record đã xóa)
  DELETE_USER: 'CREATE_USER',
  DELETE_ROLE: 'CREATE_ROLE',
  DELETE_DOCUMENT: 'CREATE_DOCUMENT',
  DELETE_IMAGE: 'CREATE_IMAGE',

  // UPDATE -> UPDATE (update lại với data cũ)
  UPDATE_USER: 'UPDATE_USER',
  UPDATE_ROLE: 'UPDATE_ROLE',
  UPDATE_DOCUMENT: 'UPDATE_DOCUMENT',
  UPDATE_IMAGE: 'UPDATE_IMAGE',
} as const

// Action operation types
export const ACTION_OPERATIONS = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
} as const

// Extract operation from action key
export const getActionOperation = (actionKey: string): string => {
  if (actionKey.startsWith('CREATE_')) return ACTION_OPERATIONS.CREATE
  if (actionKey.startsWith('UPDATE_')) return ACTION_OPERATIONS.UPDATE
  if (actionKey.startsWith('DELETE_')) return ACTION_OPERATIONS.DELETE
  return 'UNKNOWN'
}

// Get reverse action for rollback
export const getRollbackAction = (actionKey: string): string => {
  return ROLLBACK_ACTIONS[actionKey as keyof typeof ROLLBACK_ACTIONS] || actionKey
}

// Check if action is reversible
export const isReversibleAction = (actionKey: string): boolean => {
  return actionKey in ROLLBACK_ACTIONS
}

// Get rollback strategy
export const getRollbackStrategy = (
  actionKey: string,
): {
  operation: string
  reverseAction: string
  strategy: string
} => {
  const operation = getActionOperation(actionKey)
  const reverseAction = getRollbackAction(actionKey)

  let strategy = ''
  switch (operation) {
    case ACTION_OPERATIONS.CREATE:
      strategy = 'Delete the created record'
      break
    case ACTION_OPERATIONS.DELETE:
      strategy = 'Restore the deleted record from beforeData'
      break
    case ACTION_OPERATIONS.UPDATE:
      strategy = 'Revert to previous state from beforeData'
      break
    default:
      strategy = 'Manual rollback required'
  }

  return {
    operation,
    reverseAction,
    strategy,
  }
}

export type ActionKey = string
export type RollbackAction = (typeof ROLLBACK_ACTIONS)[keyof typeof ROLLBACK_ACTIONS]
