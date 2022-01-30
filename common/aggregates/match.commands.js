import { SINGLEMATCH_PLAYED, DOUBLEMATCH_PLAYED } from "../event-types";
import _ from "lodash";

export default {
    registerSingleMatch: (state, {payload: { winner, loser, season}}) => {
      if (state.playedAt) throw new Error("The match already exists")
      if (!winner) throw new Error("winner is required")
      if (!loser) throw new Error("loser is required")
      if (winner === loser) throw new Error("winner cannot be same player as loser")
      return {
        type: SINGLEMATCH_PLAYED,
        payload: {winner, loser, season}
      }
    },
    registerDoubleMatch: (state, {payload: { winner1, winner2, loser1, loser2, season}}) =>
    {
      if (state.playedAt) {
        throw new Error('Match already exist')
      }
      if (!winner1) throw new Error("winner1 is required")
      if (!winner2) throw new Error("winner2 is required")
      if (!loser1) throw new Error("loser1 is required")
      if (!loser2) throw new Error("loser2 is required")
      const players = [winner1, winner2, loser1, loser2];
      if (_.uniq(players).length != players.length) throw new Error("No player can appear more than once in a match")
      return {
        type: DOUBLEMATCH_PLAYED,
        payload: { winner1, winner2, loser1, loser2, season }
      }
    }
  }