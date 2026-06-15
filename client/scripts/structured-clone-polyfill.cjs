if (typeof global.structuredClone !== 'function') {
  const { serialize, deserialize } = require('v8')

  global.structuredClone = (value) => deserialize(serialize(value))
}
