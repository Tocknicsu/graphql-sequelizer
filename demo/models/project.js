export default (sequelize, DataTypes) => {
  const project = sequelize.define('project', {
    name: {
      type: DataTypes.STRING
    }
  })
  project.associate = (models) => {
    project.belongsTo(models.user, {foreignKey: 'ownerId', as: 'owner'})
  }
  project.graphql = {
    crud: {
      enable: false
    }
  }
  return project
}
