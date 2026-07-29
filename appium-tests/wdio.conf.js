const fs = require('fs');
const path = require('path');

const reportDir = path.resolve(__dirname, '../reports/appium');
const reportFile = path.join(reportDir, 'Appium_Test_Report.csv');
const summaryFile = path.join(reportDir, 'Appium_Test_Summary.csv');

let passedCount = 0;
let failedCount = 0;

exports.config = {
    runner: 'local',
    port: 4723,
    specs: [
        './tests/**/*.js'
    ],
    maxInstances: 1,
    capabilities: [{
        platformName: 'Android',
        'appium:deviceName': 'Android Emulator',
        'appium:automationName': 'UiAutomator2',
        'appium:app': 'dummy.apk',
        'appium:noReset': true,
        'appium:newCommandTimeout': 240
    }],
    logLevel: 'info',
    bail: 0,
    waitforTimeout: 10000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,
    services: ['appium'],
    framework: 'mocha',
    reporters: ['spec'],
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    },

    onPrepare: function (config, capabilities) {
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }
        fs.writeFileSync(reportFile, 'TestName,Status,Duration,Error\n');
        fs.writeFileSync(summaryFile, 'Total,Passed,Failed\n');
    },

    afterTest: function(test, context, { error, result, duration, passed, retries }) {
        const status = passed ? 'Passed' : 'Failed';
        if (passed) passedCount++;
        else failedCount++;
        
        const errorMsg = error ? error.message.replace(/,/g, ' ') : '';
        const line = `${test.title},${status},${duration},${errorMsg}\n`;
        
        fs.appendFileSync(reportFile, line);
    },

    onComplete: function(exitCode, config, capabilities, results) {
        const total = passedCount + failedCount;
        fs.writeFileSync(summaryFile, `${total},${passedCount},${failedCount}\n`);
    }
}
