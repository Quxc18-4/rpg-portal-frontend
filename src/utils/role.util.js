import { ROLE_WEIGHT } from '../config/constants';

export function hasMinRole(currentRole = 'GUEST', requiredRole = 'GUEST') {
  const currentWeight = ROLE_WEIGHT[String(currentRole).toUpperCase()] ?? 0;
  const requiredWeight = ROLE_WEIGHT[String(requiredRole).toUpperCase()] ?? 0;
  return currentWeight >= requiredWeight;
}