// James Quigley & Alireza Bahremand

'use strict';
const Alexa = require('alexa-sdk');
const AWS = require('aws-sdk');
AWS.config.update({
    region: 'us-east-1'
});

// Create the DynamoDB service object
const ddb = new AWS.DynamoDB({
    apiVersion: '2012-10-08'
});

const ddbTableName = 'DailyLogResponseTable';


const HELP_MESSAGE = 'You can say: the best part of my day was... or the worst part of my day was. Tell me about your day!';
const HELP_REPROMPT = 'Tell me about the best and worst parts of your day';
const STOP_MESSAGE = 'Goodbye!';

const WELCOME_MESSAGE = 'Good to talk to you! What was the best and worst parts of your day?';

const questions = {
    'best': 'What was the best part of your day?',
    'worst': 'What was the worst part of your day?'
}

const handlers = {
    'LaunchRequest': function () {
        this.emit('StartLogIntent');
    },
    'AMAZON.HelpIntent': function () {
        const speechOutput = HELP_MESSAGE;
        const reprompt = HELP_REPROMPT;

        this.response.speak(speechOutput).listen(reprompt);
        this.emit(':responseReady');
    },
    'AMAZON.CancelIntent': function () {
        this.response.speak(STOP_MESSAGE);
        this.emit(':responseReady');
    },
    'AMAZON.StopIntent': function () {
        this.response.speak(STOP_MESSAGE);
        this.emit(':responseReady');
    },
    'SessionEndedRequest': function () {
        this.emit('AMAZON.StopIntent');
    },
    'Undefined': function () {
        this.emit('AMAZON.HelpIntent')
    },
    'StartLogIntent': function () {
        this.response.speak(WELCOME_MESSAGE).listen('Tell me the best and worst parts of your day');
        this.emit(':responseReady');
    },
    'BestOfDayIntent': function () {
        let intent = this.event.request.intent.name;

        let best = isSlotValid(this.event.request, "best");

        console.log("best", best);
        console.log(JSON.stringify(this));

        let d = new Date();
        d.setHours(0, 0, 0, 0);
        ddb.getItem({
            TableName: ddbTableName,
            Key: {
                'user_id': {
                    S: this.event.session.user.userId
                },
                'date': {
                    N: `${d.getTime()}`
                }
            }
        }, (err, data) => {
            if (err) {
                console.log("DDB Error", err);
                this.response.speak('Something went wrong');
                this.emit(':responseReady');
                return;
            } else {
                console.log("DDB Success", data);
                if (data && data.Item && data.Item.best) {
                    this.response.speak("You've already told me the best part of your day. I look forward to hearing about your day tomorrow!");
                    this.emit(':responseReady');
                } else {
                    ddb.updateItem({
                        TableName: ddbTableName,
                        Key: {
                            'user_id': {
                                S: this.event.session.user.userId
                            },
                            'date': {
                                N: `${d.getTime()}`
                            }
                        },
                        UpdateExpression: "SET best = :best",
                        ExpressionAttributeValues: {
                            ":best": {
                                S: best
                            }
                        }
                    }, (writeErr, writeData) => {
                        if (writeErr) {
                            console.log("DDB Write Error", writeErr);
                            this.response.speak('Something went wrong');
                            this.emit(':responseReady');
                            return;
                        } else {
                            console.log("DDB Write Success", writeData);
                            this.response.speak(`Your best part of the day was ${best}. Thanks for telling me about your day. See you tomorrow!`);
                            this.emit(':responseReady');
                        }
                    });
                }
            }
        });

    },
    'WorstOfDayIntent': function () {
        let intent = this.event.request.intent.name;

        let worst = isSlotValid(this.event.request, "worst");

        console.log("worst", worst);
        console.log(JSON.stringify(this));

        let d = new Date();
        d.setHours(0, 0, 0, 0);
        ddb.getItem({
            TableName: ddbTableName,
            Key: {
                'user_id': {
                    S: this.event.session.user.userId
                },
                'date': {
                    N: `${d.getTime()}`
                }
            }
        }, (err, data) => {
            if (err) {
                console.log("DDB Error", err);
                this.response.speak('Something went wrong');
                this.emit(':responseReady');
                return;
            } else {
                console.log("DDB Success", data);
                if (data && data.Item && data.Item.worst) {
                    this.response.speak("You've already told me the worst part of your day. I look forward to hearing about your day tomorrow!");
                    this.emit(':responseReady');
                } else {
                    ddb.updateItem({
                        TableName: ddbTableName,
                        Key: {
                            'user_id': {
                                S: this.event.session.user.userId
                            },
                            'date': {
                                N: `${d.getTime()}`
                            }
                        },
                        UpdateExpression: "SET worst = :worst",
                        ExpressionAttributeValues: {
                            ":worst": {
                                S: worst
                            }
                        }
                    }, (writeErr, writeData) => {
                        if (writeErr) {
                            console.log("DDB Write Error", writeErr);
                            this.response.speak('Something went wrong');
                            this.emit(':responseReady');
                            return;
                        } else {
                            console.log("DDB Write Success", writeData);
                            this.response.speak(`Your worst part of the day was ${worst}. Thanks for telling me about your day. See you tomorrow!`);
                            this.emit(':responseReady');
                        }
                    });
                }
            }
        });
    },
    'SearchDayIntent': function () {
        let intent = this.event.request.intent.name;

        let date = isSlotValid(this.event.request, "date");

        date = new Date(date);
        date.setHours(0, 0, 0, 0);

        ddb.getItem({
            TableName: ddbTableName,
            Key: {
                'user_id': {
                    S: this.event.session.user.userId
                },
                'date': {
                    N: `${date.getTime()}`
                }
            }
        }, (err, data) => {
            if (err) {
                console.log("DDB Error", err);
                this.response.speak('Something went wrong');
                this.emit(':responseReady');
                return;
            } else if (data.Item) {
                console.log("DDB Success", data);
                let search = '';
                for (let question in questions) {
                    console.log("question", question);
                    if (data && data.Item && data.Item[question].S) {
                        console.log("answer", data.Item[question].S);
                        search += `${question} was ${data.Item[question].S}. `;
                    }
                }
                this.response.speak(`On that day. ${search}. That's all from that day`);
                this.emit(':responseReady');
            } else {
                this.response.speak(`No log was created on that day`);
                this.emit(':responseReady');
            }
        });
    }
};

exports.handler = function (event, context, callback) {
    const alexa = Alexa.handler(event, context, callback);
    alexa.registerHandlers(handlers);
    alexa.appId = "amzn1.ask.skill.a4ac824f-57d8-4af7-8479-90656f9b294d";
    alexa.execute();
};


function isSlotValid(request, slotName) {
    var slot = request.intent.slots[slotName];
    var slotValue;

    if (slot && slot.value) {
        slotValue = slot.value.toLowerCase();
        return slotValue;
    } else {
        return false;
    }
}