import { PLAYER_CREATED } from "../event-types";
export default {
    createPlayer: (state, {payload: {name, email, avatar}}) => {
      if (state.createdAt) throw new Error("The player already exists")
      if (!name) throw new Error("name is required")
      if (!email) throw new Error("email is required")
      if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))
        throw new Error("email is invalid");
      return {
        type: PLAYER_CREATED,
        payload: {name, email, avatar}
      }
    }
  }