'uses strict';

const config = require('./config/index');
const program = require('commander');
const { version } = require('./package.json');
const has = require('lodash.has');
const Log4js = require('log4js');
const MongoConnection = require('./infra/mongo');

if (has(config, 'logging')) {
  Log4js.configure(config.logging);
  global.logger = Log4js.getLogger();;
}

function increaseVerbosity(v, total) {
  return total + 1;
}

program
  .version(version)
  .option('-v, --verbose', 'A value that can be increased', increaseVerbosity, 0)
  .option('-l, --log', 'Log to a file')
  .description('GeoName Commands');

program
  .command('populate:db')
  .description('Populate DB wih Brazilian States and Cities')
  .option('--drop', 'Drop collections before inserting')

  // function to execute when command is uses
  .action(async function populateDB(options) {
    logger.info('Starting')

    const conn = await MongoConnection(global.logger, config.db);
    const db = conn.db(config.db.dbName);

    if (options.drop) {
      logger.info('dropping')
      await Promise.all([
        db.collection('states').deleteMany({}),
        db.collection('cities').deleteMany({})
      ]);
    }

    logger.info('Inserting states and cities');
    await Promise.all([
      db.collection('states').insertMany(require('./infra/db-seed/states.json')),
      db.collection('cities').insertMany(require('./infra/db-seed/cities.json'))
    ]);

    logger.info('Creating indexes');
    await db.collection("states").createIndex({ "$**": "text", "name": 1, "shortName": 1 })
    await db.collection("states").createIndex({ "shortName": 1 })
    await db.collection("cities").createIndex({ "name": 1 })
    await db.collection("cities").createIndex({ "$**": "text", "name": 1 })

    logger.info('Done.');
  });

// allow commander to parse `process.argv`
program.parse(process.argv);
