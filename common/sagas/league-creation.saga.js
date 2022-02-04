import { v4 as uuid } from 'uuid'
import { LEAGUE_CREATED, SEASON_CREATED } from "../event-types"

export default {
  handlers: {
    Init: async () => {
    },
    [LEAGUE_CREATED]: async ({sideEffects }, { aggregateId, payload: { rating } }) => {
      const seasonid = uuid()
      await sideEffects.executeCommand({
        aggregateName: "Season",
        aggregateId: seasonid,
        type: "createSeason",
        payload: { leagueid: aggregateId, rating }
      })
    },
    [SEASON_CREATED]: async ({sideEffects}, { aggregateId, payload: { leagueid }}) => {
      await sideEffects.executeCommand({
        aggregateName: "League",
        aggregateId: leagueid,
        type: "startSeason",
        payload: { seasonid: aggregateId }
      })
    }
  },
  sideEffects: {
    
  },
}