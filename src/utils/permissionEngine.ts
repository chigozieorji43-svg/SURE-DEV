import { WorkspaceAction } from '../types';

export const ROLE_PERMISSIONS: Record<'employer' | 'developer' | 'admin', WorkspaceAction[]> = {
  employer: [
    'create_milestone',
    'edit_milestone',
    'delete_milestone',
    'approve_deliverable',
    'reject_deliverable',
    'schedule_meeting',
    'join_meeting',
    'modify_contract',
    'invite_participant',
    'archive_contract',
    'upload_file',
    'delete_file',
    'create_task',
    'edit_task',
    'request_revision',
    'request_amendment'
  ],
  developer: [
    'submit_milestone',
    'upload_file',
    'create_task',
    'edit_task',
    'request_revision',
    'request_amendment',
    'join_meeting'
  ],
  admin: [
    'create_milestone',
    'edit_milestone',
    'delete_milestone',
    'submit_milestone',
    'approve_deliverable',
    'reject_deliverable',
    'schedule_meeting',
    'join_meeting',
    'modify_contract',
    'invite_participant',
    'archive_contract',
    'restore_contract',
    'upload_file',
    'delete_file',
    'create_task',
    'edit_task',
    'request_revision',
    'request_amendment',
    'override_permissions',
    'lock_contract',
    'unlock_contract',
    'moderate_dispute',
    'suspend_workspace'
  ]
};

export function hasPermission(
  userRole: 'employer' | 'developer' | 'admin',
  action: WorkspaceAction,
  customOverrides?: WorkspaceAction[]
): boolean {
  if (userRole === 'admin') return true;

  const allowedActions = customOverrides || ROLE_PERMISSIONS[userRole] || [];
  return allowedActions.includes(action);
}

export function getActionLabel(action: WorkspaceAction): string {
  const labels: Record<WorkspaceAction, string> = {
    create_milestone: 'Create Milestones',
    edit_milestone: 'Edit Milestones',
    delete_milestone: 'Delete Milestones',
    submit_milestone: 'Submit Milestones',
    approve_deliverable: 'Approve Deliverables',
    reject_deliverable: 'Reject Deliverables',
    schedule_meeting: 'Schedule Meetings',
    join_meeting: 'Join Video/Audio Calls',
    modify_contract: 'Modify Contract Specs',
    invite_participant: 'Invite Workspace Members',
    archive_contract: 'Archive Contract Workspace',
    restore_contract: 'Restore Archived Contract',
    upload_file: 'Upload Vault Files',
    delete_file: 'Delete Vault Files',
    create_task: 'Create Kanban Tasks',
    edit_task: 'Edit Kanban Tasks',
    request_revision: 'Request Deliverable Revisions',
    request_amendment: 'Request Contract Amendments',
    override_permissions: 'Override Permissions',
    lock_contract: 'Lock Contract Specs',
    unlock_contract: 'Unlock Contract Specs',
    moderate_dispute: 'Moderate Workspace Disputes',
    suspend_workspace: 'Suspend Workspace'
  };
  return labels[action] || action;
}
