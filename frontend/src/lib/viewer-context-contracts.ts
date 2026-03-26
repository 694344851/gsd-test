export type ViewerRole = 'manager' | 'doctor';

export interface ViewerContext {
  viewer_role: ViewerRole;
  viewer_id?: string;
  viewer_name?: string;
}

export function createManagerViewerContext(): ViewerContext {
  return {
    viewer_role: 'manager',
    viewer_id: 'manager-ui',
    viewer_name: '管理端默认角色',
  };
}
