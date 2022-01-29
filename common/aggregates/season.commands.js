import { SEASON_STARTED } from "../event-types";
export default {
    startSeason: (state, { payload: { league } }) => {
      if (state.createdAt) throw new Error("The season already exists")
      if (!league) throw new Error("Must specify league")
      return {
        type: SEASON_STARTED,
        payload: { league }
      }
    }
  }