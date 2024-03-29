import _, { isArray } from "lodash";
import { SEASON_CREATED, SEASON_MATCH_REGISTERED } from "../event-types";
export default {
    createSeason: (state, { payload: { leagueid, rating } }) => {
      if (state.createdAt)
        throw new Error("Season has already been created")
      if (!leagueid)
        throw new Error("League must be specified")
      return {
        type: SEASON_CREATED,
        payload: { leagueid: leagueid, rating: rating ?? "basic" }
      }
    },
    registerMatch: (state, { payload: { matchid, winners, losers }}) => {
      if (!matchid)
        throw new Error("matchid must be set")
      if (state.matches[matchid])
        throw new Error("Match has already been registered")
      if (!isArray(winners) || !isArray(losers))
        throw new Error("winners and losers must be arrays")
      const all = [...winners,...losers]
      if (_.uniq(all).length != all.length)
        throw new Error("A user can only appear once in a game")
      return {
        type: SEASON_MATCH_REGISTERED,
        payload: { matchid, winners, losers }
      }
    }
  }