export const APP_NAME = 'Axon'
export const APP_NAME_HUMAN = "Axon Interface"

let AGGREGATOR_SERVER = `http://0.0.0.0:24338`
if (process.env.NODE_ENV === 'production') {
    AGGREGATOR_SERVER = `https://api.axon.technology`
}

export {
    AGGREGATOR_SERVER
}