const _ = require('lodash');

const config = require('./config.json');
const defaultConfig = config.production;
const environment = process.env.NODE_ENV || 'production';
const environmentConfig = config[environment];
const finalConfig = _.merge(defaultConfig, environmentConfig);

global.gConfig = finalConfig;