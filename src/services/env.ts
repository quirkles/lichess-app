let hasLoadedEnv = false

export const loadEnv = () => {
    if(hasLoadedEnv) { return }
    require('dotenv').config()
    hasLoadedEnv = true
}
