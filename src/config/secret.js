module.exports = {
  port: process.env.NODE_ENV == 'production' ? process.env.PORT : 3001,
  bodyLimit: process.env.NODE_ENV === 'production' ? process.env.bodyLimit : "100kb",
}
