import { devTools } from './enhancers/redux-devtools'

const getRedux = (
) => {
  return {
    reducers: {
      jwt: (jwt = {}) => jwt,
    },
    enhancers: [devTools],
  }
}

export default getRedux