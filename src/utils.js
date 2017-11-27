import camelcase from 'camelcase'
import defaults from 'defaults'
import pluralize from 'pluralize'
import {
  GraphQLNonNull,
  GraphQLList,
  GraphQLID
} from 'graphql'
import {
  fromGlobalId
} from 'graphql-relay'

export const getTableName = (model) => {
  return model.name
}

export const funcWrapper = (obj, args) => {
  if (typeof obj === 'function') {
    return obj(...args)
  }
  return obj
}

export const connectionNameForAssociation = (model, associationName) => {
  return camelcase(`${getTableName(model)}_to_${associationName}`)
}

export const getModelGrapqhQLConfig = (model) => {
  const config = defaults(model.graphql, {
    name: (name) => name,
    fields: (fields) => fields,
    interfaces: (interfaces) => interfaces
    // crud: {}
  })
  // const crudBooleanTable = _.clone(config.crud)
  // const crudDefaultEnable = config.crud.enable
  //
  // for (let crudType of ['create', 'read', 'update', 'delete']) {
  // }
  // if (_.isBoolean(config.crud)) {
  //   config.crud = {
  //     enable: config.crud
  //   }
  // }
  // config.crud = defaults(config.crud, {
  //   enable: true
  // })
  // for (let crudType of ['create', 'read', 'update', 'delete']) {
  //   if (!config.crud[crudType] && !config.crud.enable) {
  //     config.crud[crudType] = false
  //   }
  //   if (config.crud[crudType] === false) continue
  //   if (_.isBoolean(config.crud[crudType]) || !config.crud[crudType]) {
  //     config.crud[crudType] = {}
  //   }
  //   for (let type of ['one', 'all']) {
  //     if (!config.crud[crudType][type] && !config.crud.enable) {
  //       config.crud[crudType][type] = false
  //     }
  //     if (config.crud[crudType][type] === false) continue
  //     config.crud[crudType][type] = defaults(config.crud[crudType][type], {
  //       type: type => type,
  //       args: args => args,
  //       resolve: resolve => resolve
  //     })
  //   }
  // }
  return config
}

export const getQueryName = (model, type, countType) => {
  if (type === 'read') {
    if (countType === 'all') {
      return camelcase(pluralize.plural(getTableName(model)))
    } else if (countType === 'one') {
      return camelcase(getTableName(model))
    }
  } else if (['create', 'update', 'delete'].indexOf(type) !== -1) {
    if (countType === 'all') {
      return camelcase(`${type}_${pluralize.plural(getTableName(model))}`)
    } else if (countType === 'one') {
      return camelcase(`${type}_${getTableName(model)}`)
    }
  }
  console.warn('Unknown query type: ', type)
  return camelcase(`${type}_${countType}_${getTableName(model)}`)
}

export const getQueryDescription = (model, type, countType) => {
  const tableName = getTableName(model)
  if (countType === 'all') {
    return `${type} ${countType} ${pluralize.plural(tableName)}.`
  } else if (countType === 'one') {
    return `${type} ${countType} ${tableName}.`
  } else {
    return `${type} ${countType} ${tableName}.`
  }
}

export const createNonNullList = (modelType) => {
  return new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(modelType)))
}

export const createNonNullListResolver = (resolver) => {
  return async (...args) => {
    const results = await resolver(...args)
    if (results === null) {
      return []
    } else if (Array.isArray(results)) {
      return results
    } else {
      return [results]
    }
  }
}

// export function convertFieldsFromGlobalId(model, data) {
//   const rawAttributes = attributesForModel(model)
//   _.each(Object.keys(data), (key) => {
//     if (key === 'clientMutationId') {
//       return
//     }
//     // Check if reference attribute
//     const attr = rawAttributes[key]
//     if (!attr) {
//       return
//     }
//     if (attr.references || attr.primaryKey) {
//       const { id } = fromGlobalId(data[key]);
//
//       // Check if id is numeric.
//       if (!_.isNaN(_.toNumber(id))) {
//         data[key] = parseInt(id);
//       } else {
//         data[key] = id;
//       }
//     }
//   });
// }

export const removePrimaryKeyOrAutoIncrement = (model, fields) => {
  for (let field in fields) {
    const attribute = model.rawAttributes[field]
    if (attribute._autoGenerated || attribute.autoIncrement) {
      delete fields[field]
    }
  }
}

export const globalIdInputField = (modelName) => {
  return {
    name: 'id',
    description: `The ID for ${modelName}`,
    type: new GraphQLNonNull(GraphQLID)
  }
}

export const convertFieldsToGlobalId = (model, fields) => {
  for (let field in fields) {
    const attribute = model.rawAttributes[field]
    if (attribute.references) {
      const modelName = attribute.references.model
      fields[field] = globalIdInputField(modelName)
    }
  }
}

export const convertFieldsFromGlobalId = (fields, data) => {
  for (let field in fields) {
    const type = fields[field].type.toJSON()
    if (data[field] === undefined) continue
    if (type === 'ID' || type === 'ID!') {
      data[field] = fromGlobalId(data[field]).id
    }
  }
}
