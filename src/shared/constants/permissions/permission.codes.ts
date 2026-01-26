// src/core/constants/permission/permission.codes.ts

import { PERMISSION_DEFINITIONS } from './permission.definitions';

/**
 * Convert camelCase sang snake_case
 * viewStudentManagement -> view_student_management
 */
function camelToSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Kiểu action có thể lồng nhau
 */
type PermissionAction =
    | {
        name?: string;
        description?: string;
        actions?: Record<string, PermissionAction>;
    }
    | undefined;

/**
 * Kiểu permission definition tổng
 */
type PermissionDefinitions = Record<
    string,
    {
        actions?: Record<string, PermissionAction>;
    }
>;

/**
 * Flatten permission definitions thành:
 * [
 *   ['NOTIFICATION_GET_MY', 'notification.getMy'],
 *   ['MEDIA_FOLDER_CREATE', 'media.folder.create'],
 *   ...
 * ]
 */
function flattenPermissions(
    definitions: PermissionDefinitions,
    prefix = ''
): Array<[string, string]> {
    const result: Array<[string, string]> = [];

    Object.entries(definitions).forEach(([key, value]) => {
        const currentPrefix = prefix ? `${prefix}.${key}` : key;

        if (!value || typeof value !== 'object' || !value.actions) return;

        Object.entries(value.actions).forEach(([actionKey, actionValue]) => {
            // Case: nested actions (vd: media.folder.create)
            if (
                actionValue &&
                typeof actionValue === 'object' &&
                'actions' in actionValue &&
                actionValue.actions
            ) {
                result.push(
                    ...flattenPermissions(
                        { [actionKey]: actionValue },
                        currentPrefix
                    )
                );
            } else {
                // Case: action thường
                const code = `${currentPrefix}.${actionKey}`;

                // camelCase -> snake_case -> UPPERCASE
                const snakeCase = camelToSnakeCase(code);
                const constName = snakeCase.toUpperCase().replace(/\./g, '_');

                result.push([constName, code]);
            }
        });
    });

    return result;
}

export const PERMISSION_CODES: Record<string, string> = Object.fromEntries(
    flattenPermissions(PERMISSION_DEFINITIONS as PermissionDefinitions)
);
