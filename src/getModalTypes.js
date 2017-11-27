import {
  relay,
  attributeFields,
  resolver
} from 'graphql-sequelize'
import {
  GraphQLObjectType
} from 'graphql'
import defaults from 'defaults'

import * as utils from './utils'

const {
  sequelizeConnection
} = relay

const associationFields = ({model, modelTypes}) => {
  const fields = {}
  const associations = model.associations
  for (const associationKey in associations) {
    const connectionName = utils.connectionNameForAssociation(model, associationKey)
    fields[associationKey] = modelTypes[connectionName]
  }
  return fields
}

export default ({models, cache = {}}) => {
  const modelTypes = {}
  // setup modelTypes
  for (let modelName in models) {
    const model = models[modelName]
    const modelConfig = utils.getModelGrapqhQLConfig(model)

    const modelType = new GraphQLObjectType({
      name: utils.funcWrapper(modelConfig.name, [utils.getTableName(model)]),
      fields: () => {
        const defaultFields = attributeFields(model, defaults(modelConfig.fieldConfig, {
          globalId: true,
          commentToDescription: true
        }))
        const defaultAssociationFields = associationFields({model, modelTypes})
        return utils.funcWrapper(modelConfig.fields, [{
          ...defaultFields,
          ...defaultAssociationFields
        }, modelTypes])
      },
      interfaces: () => {
        return utils.funcWrapper(modelConfig.interfaces, [[], modelTypes])
      }
    })
    modelTypes[utils.getTableName(model)] = modelType
  }
  // setup connectionType
  // TODO: need to customize here
  for (let modelName in models) {
    const model = models[modelName]

    const associations = model.associations
    for (let associationKey in associations) {
      const association = associations[associationKey]
      const { associationType, target } = association
      const targetType = modelTypes[target.name]
      const connectionName = utils.connectionNameForAssociation(model, associationKey)

      if (associationType === 'BelongsTo') {
        modelTypes[connectionName] = {
          type: targetType,
          resolve: resolver(association)
        }
      } else {
        // HasMany
        const connection = sequelizeConnection({
          name: connectionName,
          nodeType: targetType,
          target: association
        })
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
