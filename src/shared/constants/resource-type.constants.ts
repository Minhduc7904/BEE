// src/shared/constants/resource-type.constants.ts

export const RESOURCE_TYPES = {
  ROLE: 'ROLE',
  USER: 'USER',
  DOCUMENT: 'DOCUMENT',
  QUESTION_IMAGE: 'QUESTION_IMAGE',
  SOLUTION_IMAGE: 'SOLUTION_IMAGE',
  MEDIA_IMAGE: 'MEDIA_IMAGE',
  IMAGE: 'IMAGE',
} as const

export const RESOURCE_TYPE_TABLE = {
  [RESOURCE_TYPES.ROLE]: {
    displayName: 'Role',
    tableName: 'roles',
    primaryKey: 'roleId',
    repositoryName: 'roleRepository',
  },
  [RESOURCE_TYPES.USER]: {
    displayName: 'User',
    tableName: 'users',
    primaryKey: 'userId',
    repositoryName: 'userRepository',
  },
  [RESOURCE_TYPES.DOCUMENT]: {
    displayName: 'Document',
    tableName: 'documents',
    primaryKey: 'documentId',
    repositoryName: 'documentRepository',
  },
  [RESOURCE_TYPES.QUESTION_IMAGE]: {
    displayName: 'Question Image',
    tableName: 'question_images',
    primaryKey: 'imageId',
    repositoryName: 'questionImageRepository',
  },
  [RESOURCE_TYPES.SOLUTION_IMAGE]: {
    displayName: 'Solution Image',
    tableName: 'solution_images',
    primaryKey: 'imageId',
    repositoryName: 'solutionImageRepository',
  },
  [RESOURCE_TYPES.MEDIA_IMAGE]: {
    displayName: 'Media Image',
    tableName: 'media_images',
    primaryKey: 'imageId',
    repositoryName: 'mediaImageRepository',
  },
  [RESOURCE_TYPES.IMAGE]: {
    displayName: 'Image',
    tableName: 'images',
    primaryKey: 'imageId',
    repositoryName: 'imageRepository',
  },
} as const

export type ResourceType = (typeof RESOURCE_TYPES)[keyof typeof RESOURCE_TYPES]

export type ResourceInfo = {
  displayName: string
  tableName: string
  primaryKey: string
  repositoryName: string
}

// Helper functions để tra cứu thông tin
export const getResourceInfo = (resourceType: ResourceType): ResourceInfo => {
  return RESOURCE_TYPE_TABLE[resourceType]
}

export const getTableName = (resourceType: ResourceType): string => {
  return RESOURCE_TYPE_TABLE[resourceType].tableName
}

export const getRepositoryName = (resourceType: ResourceType): string => {
  return RESOURCE_TYPE_TABLE[resourceType].repositoryName
}

export const getPrimaryKey = (resourceType: ResourceType): string => {
  return RESOURCE_TYPE_TABLE[resourceType].primaryKey
}

export const getDisplayName = (resourceType: ResourceType): string => {
  return RESOURCE_TYPE_TABLE[resourceType].displayName
}
