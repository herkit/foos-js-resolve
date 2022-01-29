import { v4 as uuid } from 'uuid'
import { LEAGUE_CREATED } from "../event-types"

export default {
  handlers: {
    Init: async () => {
    },
    [LEAGUE_CREATED]: async ({sideEffects }, { aggregateId, payload: { name } }) => {
      console.log("League created: " + name)
      await sideEffects.executeCommand({
        aggregateName: "League",
        aggregateId: aggregateId,
        type: "startSeason",
        payload: { seasonid: uuid() }
      })
    }
  },
  sideEffects: {
    
  },
}