/**
 * The framework-free auth module. `AuthContext` wires the production adapters; tests
 * construct `AuthService` with fake ports (the interface is the test surface).
 */
export { AuthService } from './AuthService'
export { createFirebaseAuthPort } from './firebaseAuthPort'
export { createFirebaseProfilePort } from './firebaseProfilePort'
export { shouldReconcileEmailOnToken, needsEmailReconcile } from './emailReconcile'
export type { TokenSnapshot } from './emailReconcile'
export type { AuthIdentity, AuthPort, ProfilePort } from './ports'
