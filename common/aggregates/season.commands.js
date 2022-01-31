import { isArray } from "lodash";
import { SEASON_CREATED, SEASON_MATCH_REGISTERED } from "../event-types";
export default {
    createSeason: (state, { payload: { leagueid } }) => {
      if (state.createdAt)
        throw new Error("Season has already been created")
      return {
        type: SEASON_CREATED,
        payload: { leagueid: leagueid }
      }
    },
    registerMatch: (state, { payload: { matchid, winners, losers }}) => {
      if (!matchid)
        throw new Error("mathid must be set")
      if (state.matches[matchid])
        throw new Error("Match has already been registered")
      if (!isArray(winners) || !isArray(losers))
        throw new Error("winners and losers must be arrays")
      return {
        type: SEASON_MATCH_REGISTERED,
        payload: { matchid, winners, losers }
      }
    }
  }