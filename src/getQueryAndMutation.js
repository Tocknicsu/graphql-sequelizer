import {
  attributeFields,
  resolver
} from 'graphql-sequelize'
import {
  mutationWithClientMutationId,
  fromGlobalId
} from 'graphql-relay'
import {
  GraphQLNonNull,
  GraphQLID,
  GraphQLInputObjectType
} from 'graphql'
import * as utils from './utils'
import defaults from 'defaults'

export default ({
  model,
  modelTypes
}) => {
  const modelType = modelTypes[utils.getTableName(model)]
  const modelConfig = utils.getModelGrapqhQLConfig(model)
  // const crudConfig = modelConfig.crud
  const result = {
    queries: {
    },
    mutations: {
    }
  }
  const nameResolver = utils.getQueryName
  const descriptionResolver = utils.getQueryDescription
  let graphqlObj
  // query all
  if (modelConfig.crud.read.all) {
    graphqlObj = modelConfig.crud.read.all({
      name: nameResolver(model, 'read', 'all'),
      description: descriptionResolver(model, 'read', 'all'),
      type: utils.createNonNullList(modelType),
      resolve: utils.createNonNullListResolver(resolver(model, {
        list: true
      }))
    })
    result.queries[graphqlObj.name] = graphqlObj
  }
  // query one
  if (modelConfig.crud.read.one) {
    graphqlObj = modelConfig.crud.read.one({
      name: nameResolver(model, 'read', 'one'),
      description: descriptionResolver(model, 'read', 'one'),
      type: modelType,
      args: {
        id: {
          type: new GraphQLNonNull(GraphQLID)
        }
      },
      resolve: resolver(model, {
        before: (findOptions, args) => {
          if (args.id) {
            let {type, id} = fromGlobalId(args.id)
            findOptions.where = {
              ...findOptions.where,
              id
            }
          }
          return findOptions
        }
      })
    })
    result.queries[graphqlObj.name] = graphqlObj
  }

  let defaultFields = attributeFields(model, defaults(modelConfig.fieldConfig, {
    commentToDescription: true
  }))

  utils.removePrimaryKeyOrAutoIncrement(model, defaultFields)
  utils.convertFieldsToGlobalId(model, defaultFields)

  const valuesFieldType = new GraphQLInputObjectType({
    name: `${utils.getTableName(model)}ValuesInput`,
    description: 'Values to create or update',
    fields: defaultFields
  })

  if (modelConfig.crud.create.one) {
    graphqlObj = modelConfig.crud.create.one({
      name: nameResolver(model, 'create', 'one'),
      description: descriptionResolver(model, 'create', 'one'),
      inputFields: () => {
        return {
          values: {
            type: valuesFieldType
          }
        }
      },
      outputFields: () => {
        return {
          [utils.getTableName(model)]: {
            type: modelType
          }
        }
      },
      mutateAndGetPayload: async (...args) => {
        utils.convertFieldsFromGlobalId(defaultFields, args[0].values)
        const instance = await model.create(args[0].values)
        return {
          [utils.getTableName(model)]: instance
        }
      }
    })
    result.mutations[graphqlObj.name] = mutationWithClientMutationId(graphqlObj)
  }

  if (modelConfig.crud.update.one) {
    graphqlObj = modelConfig.crud.update.one({
      name: nameResolver(model, 'update', 'one'),
      description: descriptionResolver(model, 'update', 'one'),
      inputFields: () => {
        return {
          id: {
            type: new GraphQLNonNull(GraphQLID)
          },
          values: {
            type: valuesFieldType
          }
        }
      },
      outputFields: () => {
        return {
          [utils.getTableName(model)]: {
            type: modelType
          }
        }
      },
      mutateAndGetPayload: async (...args) => {
        utils.convertFieldsFromGlobalId(defaultFields, args[0].values)
        args[0].id = fromGlobalId(args[0].id).id
        let instance = await model.findById(args[0].id)
        await instance.update(args[0].values)
        return {
          [utils.getTableName(model)]: instance
        }
      }
    })

    result.mutations[graphqlObj.name] = mutationWithClientMutationId(graphqlObj)
  }

  if (modelConfig.crud.delete.one) {
    graphqlObj = modelConfig.crud.delete.one({
      name: nameResolver(model, 'delete', 'one'),
      description: descriptionResolver(model, 'delete', 'one'),
      inputFields: () => {
        return {
          id: {
            type: new GraphQLNonNull(GraphQLID)
          }
        }
      },
      outputFields: () => {
        return {
        }
      },
      mutateAndGetPayload: async (...args) => {
        args[0].id = fromGlobalId(args[0].id).id
        let instance = await model.findById(args[0].id)
        await instance.destroy()
        return {
        }
      }
    })
    result.mutations[graphqlObj.name] = mutationWithClientMutationId(graphqlObj)
  }

  return result
}
