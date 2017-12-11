import {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLNonNull
} from 'graphql'

import getModelTypes from './getModalTypes'
import getQueryAndMutation from './getQueryAndMutation'
import defaults from 'defaults'
// import * as utils from './utils'

const getSchema = (sequelize, schemaConfig) => {
  schemaConfig = defaults(schemaConfig, {
    mutations: () => {},
    queries: () => {}
  })
  const models = sequelize.models

  const modelTypes = getModelTypes({models})

  const queries = {}
  const mutations = {}

  for (let modelName in models) {
    const model = models[modelName]
    const modelQueryAndMutation = getQueryAndMutation({model, modelTypes})
    for (let queryName in modelQueryAndMutation.queries) {
      queries[queryName] = modelQueryAndMutation.queries[queryName]
    }
    for (let mutationName in modelQueryAndMutation.mutations) {
      mutations[mutationName] = modelQueryAndMutation.mutations[mutationName]
    }
  }

  const queryRoot = new GraphQLObjectType({
    name: 'Root',
    description: 'Root of the Schema',
    fields: () => ({
      root: {
        // Cite: https://github.com/facebook/relay/issues/112#issuecomment-170648934
        type: new GraphQLNonNull(queryRoot),
        description: 'Self-Pointer from Root to Root',
        resolve: () => ({})
      },
      ...queries,
      ...schemaConfig.queries({modelTypes})
      // TODO: add nodeField
    })
  })

  const mutationRoot = new GraphQLObjectType({
    name: 'Mutations',
    fields: () => {
      return {
        ...mutations,
        ...schemaConfig.mutations({modelTypes})
      }
    }
  })

  return new GraphQLSchema({
    query: queryRoot,
    mutation: mutationRoot
  })
}

export default getSchema
