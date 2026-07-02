/**
 * Ambient types for the untyped `elo-rating` package.
 * https://www.npmjs.com/package/elo-rating
 */
declare module 'elo-rating' {
  export interface EloResult {
    playerRating: number;
    opponentRating: number;
  }

  export function calculate(
    playerRating: number,
    opponentRating: number,
    playerWins?: boolean,
    kFactor?: number,
  ): EloResult;

  const EloRating: { calculate: typeof calculate };
  export default EloRating;
}
