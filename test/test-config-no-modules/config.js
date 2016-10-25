module.exports = {
  basePath: "/desk",
  secret: "CHANGE THIS PLEASE",
  mainModuleName: "__main",

  db : {
    client: 'sqlite3',
    connection: {
      filename: ":memory:"
    },
    useNullAsDefault: true
  }
}
