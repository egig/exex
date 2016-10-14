module.exports = {
  basePath: "/desk",
  secret: "CHANGE THIS PLEASE",
  mainModuleName: "__main",

  // MYSQL
  db : {
    client: 'mysql',
    connection: {
      host     : '127.0.0.1',
      user     : 'root',
      password : 'pw',
      database : 'onlyp_test'
    }
  }
}
