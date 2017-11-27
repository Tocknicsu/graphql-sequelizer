import graphqlSequelizer from './../lib/index.js'
import models from './models'
import config from './config'
import express from 'express'
import expressPlayground from 'graphql-playground-middleware-express'
import graphqlHTTP from 'express-graphql';

(async () => {
  const app = express()
  models.sequelize.sync({
    force: false
  })
  const schema = graphqlSequelizer.getSchema(models.sequelize)

  app.use('/graphql', graphqlHTTP({
    schema,
    graphiql: true
  }))
  app.use('/playground', expressPlayground({ endpoint: '/graphql' }))
  app.listen(config.port, () => {
    console.log(`Listening on port ${config.port}`)
  })
})()
