import {
  attributeFields
} from 'graphql-sequelize'
import {
  GraphQLObjectType
} from 'graphql'
import defaults from 'defaults'

import * as utils from './utils'

const associationFields = ({model, modelTypes}) => {
  const fields = {}
  const associations = model.associations
  for (const associationKey in associations) {
    const connectionName = utils.connectionNameForAssociation(model, associationKey)
    fields[associationKey] = modelTypes[connectionName]
  }
  return fields
}

export default ({models, schemaConfig}) => {
  const modelTypes = {}
  // setup modelTypes
  for (let modelName in models) {
    const model = models[modelName]
    const modelConfig = utils.getModelGrapqhQLConfig(model)

    const modelType = new GraphQLObjectType(modelConfig.modelType({
      name: utils.getTableName(model),
      fields: () => {
        const defaultFields = attributeFields(model, defaults(modelConfig.fieldConfig, {
          globalId: true,
          commentToDescription: true
        }))
        const defaultAssociationFields = associationFields({model, modelTypes})
        return {
          ...defaultFields,
          ...defaultAssociationFields
        }
      },
      interfaces: () => {
        return []
      }
    }))
    modelTypes[utils.getTableName(model)] = modelType
  }
  // setup connectionType
  // TODO: need to customize here
  for (let modelName in models) {
    const model = models[modelName]
    const modelConfig = utils.getModelGrapqhQLConfig(model)
    const connectionWrapper = defaults(modelConfig.connection, {})

    const associations = model.associations
    for (let associationKey in associations) {
      const association = associations[associationKey]
      const { associationType, target } = association
      const targetType = modelTypes[target.name]
      const connectionName = utils.connectionNameForAssociation(model, associationKey)
      const connectionWrapperFunction = connectionWrapper[connectionName] || ((obj) => (obj))
      if (associationType === 'BelongsTo') {
        modelTypes[connectionName] = connectionWrapperFunction({
          type: targetType,
          resolve: schemaConfig.resolver(association)
        })
      } else {
        // TODO: complete BelongsToMany
        // HasMany
        const connection = schemaConfig.sequelizeConnection(connectionWrapperFunction({
          name: connectionName,
          nodeType: targetType,
          target: association
        }))
        modelTypes[connectionName] = {
          type: connection.connectionType,
          args: connection.connectionArgs,
          resolve: connection.resolve
        }
      }
    }
  }
  return modelTypes
}
