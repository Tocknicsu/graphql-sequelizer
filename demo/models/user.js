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
  }
  return user
}
