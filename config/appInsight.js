const appRoot = require('app-root-path');
const envHelper = require(`${appRoot}/api/helpers/envHelper`);
const appInsights = require('applicationinsights');

const envConstants = envHelper.getConstants();

appInsights.setup(envConstants.APP_INSIGHT_INSTRUMENTATION_KEY)
    .setAutoDependencyCorrelation(true)
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true, true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .setAutoCollectConsole(true)
    .setUseDiskRetryCaching(true)
    .setSendLiveMetrics(false)
    .setDistributedTracingMode(appInsights.DistributedTracingModes.AI);

appInsights.defaultClient.context.tags[appInsights.defaultClient.context.keys.cloudRole] =
    envConstants.APP_INSIGHT_ROLE_NAME;

appInsights
    .start();
