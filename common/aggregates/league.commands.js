import { LEAGUE_CREATED, SEASON_STARTED } from "../event-types";
export default {
    createLeague: (state, {payload: {name}}) => {
      if (state.createdAt) throw new Error("The league already exists")
      if (!name) throw new Error("name is required")
      return {
        type: LEAGUE_CREATED,
        payload: { name }
      }
    },
    startSeason: (state, { aggregateId, payload: { seasonid } }) => {
      if (state.currentSeason === seasonid)
        throw new Error("Season is currently in progress")
      if (state.seasons.find(s => s === seasonid))
        throw new Error("Season has been started before")
      return {
        type: SEASON_STARTED,
        payload: { seasonid, leagueid: aggregateId }
      }
    }
  }