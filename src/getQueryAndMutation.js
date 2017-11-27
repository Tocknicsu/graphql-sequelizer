import {
  attributeFields,
  resolver
} from 'graphql-sequelize'
import {
  mutationWithClientMutationId
} from 'graphql-relay'
import {
  GraphQLNonNull,
  GraphQLID,
  GraphQLInputObjectType
} from 'graphql'
import * as utils from './utils'
import defaults from 'defaults'
import {
  fromGlobalId
} from 'graphql-relay'

export default ({
  model,
  modelTypes
}) => {
  const modelType = modelTypes[utils.getTableName(model)]
  // const modelConfig = utils.getModelGrapqhQLConfig(model)
  // const crudConfig = modelConfig.crud
  const result = {
    queries: {
    },
    mutations: {
    }
  }
  const nameResolver = utils.getQueryName
  const descriptionResolver = utils.getQueryDescription
  let name, description

  // query all
  // TODO: resolve: utils.funcWrapper(modelConfig.crud.read.one.resolve, [resolver(model)])
  name = nameResolver(model, 'read', 'all')
  description = descriptionResolver(model, 'read', 'all')
  result.queries[name] = {
    description,
    type: utils.createNonNullList(modelType),
    resolve: utils.createNonNullListResolver(resolver(model, {
      list: true
    }))
  }
  // query one
  name = nameResolver(model, 'read', 'one')
  description = descriptionResolver(model, 'read', 'one')
  result.queries[name] = {
    description,
    type: modelType,
    resolve: resolver(model)
  }

  const modelConfig = utils.getModelGrapqhQLConfig(model)
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
  // try {
  //   console.log(valuesFieldType.getFields().ownerId.type.toJSON() === 'ID!')
  // } catch(e) {
  // }

  name = nameResolver(model, 'create', 'one')
  description = descriptionResolver(model, 'create', 'one')
  result.mutations[name] = mutationWithClientMutationId({
    name,
    description,
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

  name = nameResolver(model, 'update', 'one')
  description = descriptionResolver(model, 'update', 'one')
  result.mutations[name] = mutationWithClientMutationId({
    name,
    description,
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

  name = nameResolver(model, 'delete', 'one')
  description = descriptionResolver(model, 'delete', 'one')
  result.mutations[name] = mutationWithClientMutationId({
    name,
    description,
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
  return result
}
