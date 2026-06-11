import { Audience, Region } from './document.dto';
import { Role } from './query.dto';

/**
 * Encodes the access control rules from the product spec.
 * Used in tests to assert correct filtering behaviour.
 */

/** Documents that must never surface for any user, regardless of region or role. */
export const FORBIDDEN_DOC_IDS = new Set(['D-003', 'D-005', 'D-009']);

/** Audiences a given role is permitted to see (own role + All Staff). */
export const ALLOWED_AUDIENCES: Record<Role, Set<string>> = {
  [Role.Employee]:    new Set([Audience.AllStaff]),
  [Role.Engineering]: new Set([Audience.AllStaff, Audience.Engineering]),
  [Role.Finance]:     new Set([Audience.AllStaff, Audience.Finance]),
  [Role.Manager]:     new Set([Audience.AllStaff, Audience.Managers]),
};

/** Regions a given user is permitted to see (own region + Global). */
export const ALLOWED_REGIONS: Record<Region, Set<string>> = {
  [Region.Americas]: new Set([Region.Americas, 'Global']),
  [Region.EMEA]:     new Set([Region.EMEA, 'Global']),
  [Region.APAC]:     new Set([Region.APAC, 'Global']),
};
