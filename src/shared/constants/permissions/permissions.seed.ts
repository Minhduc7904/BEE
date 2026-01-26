// src/shared/constants/permissions/permissions.seed.ts

import { PERMISSION_DEFINITIONS } from './permission.definitions';

function flattenPermissionsForSeed(obj: any, prefix = '', parentGroup = '', parentIsSystem = false): any[] {
    const result: any[] = [];
    
    for (const [key, value] of Object.entries(obj)) {
        const currentPrefix = prefix ? `${prefix}.${key}` : key;
        
        if (value && typeof value === 'object') {
            if ('actions' in value) {
                // Has actions, process them
                const valueObj = value as any;
                const group = valueObj.group || parentGroup;
                const isSystem = valueObj.isSystem !== undefined ? valueObj.isSystem : parentIsSystem;
                const actions = valueObj.actions;
                
                for (const [actionKey, actionValue] of Object.entries(actions as Record<string, any>)) {
                    if (actionValue && typeof actionValue === 'object' && 'actions' in actionValue) {
                        // Nested actions (e.g., media.folder)
                        result.push(...flattenPermissionsForSeed(
                            { [actionKey]: actionValue },
                            currentPrefix,
                            group,
                            isSystem
                        ));
                    } else if (actionValue && typeof actionValue === 'object' && 'name' in actionValue) {
                        // Regular action
                        const meta = actionValue as any;
                        result.push({
                            code: `${currentPrefix}.${actionKey}`,
                            name: meta.name,
                            description: meta.description,
                            group,
                            isSystem: meta.isSystem !== undefined ? meta.isSystem : isSystem,
                        });
                    }
                }
            }
        }
    }
    
    return result;
}

export const PERMISSIONS = flattenPermissionsForSeed(PERMISSION_DEFINITIONS);
