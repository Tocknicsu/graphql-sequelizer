export default (sequelize, DataTypes) => {
  const user = sequelize.define('user', {
    username: {
      type: DataTypes.STRING
    },
    password: {
      type: DataTypes.STRING
    }
  })
  user.associate = (models) => {
    user.hasMany(models.project, {foreignKey: 'ownerId'})
  }
  user.graphql = {
    name: (name) => name,
    fields: (fields, modelTypes) => {
      return fields
    },
    interfaces: (interfaces) => {
      return []
    },
    crud: {
      enable: true,
      read: {
        one: {
          type: type => type,
          args: args => args,
          resolve: (resolver) => {
            return (...args) => {
              resolver(...args)
            }
          }
        },
        all: false
      },
      delete: false
    }
    // associations: {
    //   projects: {
    //   }
    // }
  }
  return user
}
