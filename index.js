// James Quigley & Alireza Bahremand
// Need CI/CD to work


/* eslint-disable  func-names */
/* eslint quote-props: ["error", "consistent"]*/
/**
 * This sample demonstrates a simple skill built with the Amazon Alexa Skills
 * nodejs skill development kit.
 * This sample supports multiple lauguages. (en-US, en-GB, de-DE).
 * The Intent Schema, Custom Slots and Sample Utterances for this skill, as well
 * as testing instructions are located at https://github.com/alexa/skill-sample-nodejs-fact
 **/

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

//=========================================================================================================================================
//TODO: The items below this comment need your attention.
//=========================================================================================================================================

//Replace with your app ID (OPTIONAL).  You can find this value at the top of your skill's page on http://developer.amazon.com.
//Make sure to enclose your value in quotes, like this: const APP_ID = 'amzn1.ask.skill.bb4045e6-b3e8-4133-b650-72923c5980f1';
const APP_ID = undefined;

const SKILL_NAME = 'Space Facts';
const GET_FACT_MESSAGE = "Here's your fact: ";
const HELP_MESSAGE = 'You can say tell me a space fact, or, you can say exit... What can I help you with?';
const HELP_REPROMPT = 'What can I help you with?';
const STOP_MESSAGE = 'Goodbye!';

const WELCOME_MESSAGE = 'Good to talk to you! What was the best and worst parts of your day?';

const questions = {
    'highOfDay': 'What was the best part of your day?',
    'lowOfDay': 'What was the worst part of your day?'
}

//=========================================================================================================================================
//TODO: Replace this data with your own.  You can find translations of this data at http://github.com/alexa/skill-sample-node-js-fact/data
//=========================================================================================================================================
const data = [
    'This is our first custom fact',
];

//=========================================================================================================================================
//Editing anything below this line might break your skill.
//=========================================================================================================================================

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
    'StartLogIntent': function () {
        // const factArr = data;
        // const factIndex = Math.floor(Math.random() * factArr.length);
        // const randomFact = factArr[factIndex];
        // const speechOutput = GET_FACT_MESSAGE + randomFact;

        // this.response.cardRenderer(SKILL_NAME, randomFact);
        // this.response.speak(speechOutput);

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
};

exports.handler = function (event, context, callback) {
    const alexa = Alexa.handler(event, context, callback);
    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};


function isSlotValid(request, slotName) {
    var slot = request.intent.slots[slotName];
    //console.log("request = "+JSON.stringify(request)); //uncomment if you want to see the request
    var slotValue;

    //if we have a slot, get the text and store it into speechOutput
    if (slot && slot.value) {
        //we have a value in the slot
        slotValue = slot.value.toLowerCase();
        return slotValue;
    } else {
        //we didn't get a value in the slot.
        return false;
    }
}