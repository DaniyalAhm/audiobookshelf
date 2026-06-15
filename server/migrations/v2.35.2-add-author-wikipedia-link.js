/**
 * @typedef MigrationContext
 * @property {import('sequelize').QueryInterface} queryInterface - a Sequelize QueryInterface object.
 * @property {import('../Logger')} logger - a Logger object.
 *
 * @typedef MigrationOptions
 * @property {MigrationContext} context - an object containing the migration context.
 */

const migrationVersion = '2.35.2'
const migrationName = `${migrationVersion}-add-author-wikipedia-link`
const loggerPrefix = `[${migrationVersion} migration]`

/**
 * This migration script adds a wikipediaLink column to the authors table.
 *
 * @param {MigrationOptions} options - an object containing the migration context.
 * @returns {Promise<void>} - A promise that resolves when the migration is complete.
 */
async function up({ context: { queryInterface, logger } }) {
  logger.info(`${loggerPrefix} UPGRADE BEGIN: ${migrationName}`)

  if (await queryInterface.tableExists('authors')) {
    const tableDescription = await queryInterface.describeTable('authors')

    if (!tableDescription.wikipediaLink) {
      logger.info(`${loggerPrefix} Adding wikipediaLink column to authors table`)
      await queryInterface.addColumn('authors', 'wikipediaLink', {
        type: queryInterface.sequelize.Sequelize.DataTypes.STRING,
        allowNull: true
      })
    } else {
      logger.info(`${loggerPrefix} wikipediaLink column already exists in authors table`)
    }
  } else {
    logger.info(`${loggerPrefix} authors table does not exist`)
  }

  logger.info(`${loggerPrefix} UPGRADE END: ${migrationName}`)
}

/**
 * This migration script removes the wikipediaLink column from the authors table.
 *
 * @param {MigrationOptions} options - an object containing the migration context.
 * @returns {Promise<void>} - A promise that resolves when the migration is complete.
 */
async function down({ context: { queryInterface, logger } }) {
  logger.info(`${loggerPrefix} DOWNGRADE BEGIN: ${migrationName}`)

  if (await queryInterface.tableExists('authors')) {
    const tableDescription = await queryInterface.describeTable('authors')

    if (tableDescription.wikipediaLink) {
      logger.info(`${loggerPrefix} Removing wikipediaLink column from authors table`)
      await queryInterface.removeColumn('authors', 'wikipediaLink')
    } else {
      logger.info(`${loggerPrefix} wikipediaLink column does not exist in authors table`)
    }
  } else {
    logger.info(`${loggerPrefix} authors table does not exist`)
  }

  logger.info(`${loggerPrefix} DOWNGRADE END: ${migrationName}`)
}

module.exports = { up, down }
