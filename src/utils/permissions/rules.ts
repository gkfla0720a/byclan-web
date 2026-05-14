import { PermissionAction } from './types';

export const DELEGATION_RULES = {
  master_to_admin: ['member.approve', 'match.manage', 'ladder.moderate'] as PermissionAction[],
  admin_to_elite: ['member.approve'] as PermissionAction[],
  developer_override: true,
} as const;

export const ROLE_CHANGE_RULES = {
  promotion_paths: {
    applicant: ['rookie'],
    rookie: ['member'],
    member: ['elite'],
    elite: ['admin'],
    admin: ['master'],
    master: [],
  },
  demotion_paths: {
    master: ['admin'],
    admin: ['elite'],
    elite: ['member'],
    member: ['rookie'],
    rookie: ['applicant'],
    applicant: [],
    developer: [],
  },
  requirements: {
    applicant_to_rookie: { days_in_clan: 7, ladder_games: 10, community_posts: 5 },
    rookie_to_member: { days_in_clan: 14 },
    member_to_elite: { days_in_clan: 30, ladder_games: 50, tournament_participation: 1 },
    elite_to_admin: { days_in_clan: 90, contribution_points: 1000, management_experience: true },
    admin_to_master: { days_in_clan: 180, leadership_approval: true, clan_contribution: 'exceptional' },
  },
} as const;