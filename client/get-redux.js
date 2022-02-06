import { devTools } from './enhancers/redux-devtools'

const getRedux = ({}, history) => {
  return {
    reducers: {
      jwt: (jwt = { test: "data" }) => jwt,
    },
    enhancers: [devTools],
  }
}

export default getRedux