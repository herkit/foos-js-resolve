import debugLevels from '@resolve-js/debug-levels'
const log = debugLevels('foosjs:auth:slack:route-login')

const routeLogin = async ({ resolve }, accessToken, refreshToken, profile) => {
  log.debug("accesstoken:", accessToken)
  log.debug("refreshtoken:", refreshToken)
  log.debug("profile:", profile)
}

export default routeLogin