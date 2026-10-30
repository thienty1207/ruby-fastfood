/**
 * @ruby/shared — types and validation schemas shared by client, admin, backend.
 *
 * This package intentionally holds ONLY data shapes and validators.
 * No framework code, no runtime deps beyond the validator itself.
 */

export * from './types.ts';
export * from './schemas.ts';
