/**
 * Durable processor id for the LeagueCreation saga's Emmett reactor.
 *
 * Shared with the migration (`migrate/seed-saga-checkpoint.ts`) so it can seed
 * this processor's checkpoint to the log head after an import — otherwise the
 * saga would replay the entire migrated history on first boot and re-act to
 * historical SEASON_CREATED events (see the migration header for details).
 */
export const LEAGUE_CREATION_SAGA_PROCESSOR_ID = 'league-creation-saga';
