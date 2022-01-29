import { v4 as uuid } from 'uuid'
import { LEAGUE_CREATED } from "../event-types"

const LEAGUE = "League";

export default {
  handlers: {
    Init: async ({ store }) => {
      await store.defineTable(LEAGUE, {
        indexes: { leagueid: 'string' },
        fields: ['name'],
      })
    },
    [LEAGUE_CREATED]: async (store, sideEffects, event) => {
      await store.insert(LEAGUE, { leagueid: event.aggregateId, name: event.payload.name })
      await sideEffects.executeCommand({
        aggregateName: "Season",
        aggregateId: uuid(),
        type: "startSeasoon",
        payload: { league: event.aggregateId }
      })
    }
  },
  sideEffects: {
    
  },
}