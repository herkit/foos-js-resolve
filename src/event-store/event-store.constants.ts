/**
 * DI token for the Emmett event store.
 * Kept in its own file so both the module and consumers can import it
 * without creating a circular dependency on the module.
 */
export const EVENT_STORE = Symbol('EVENT_STORE');
