const Alexa = require('ask-sdk');
const {GetPromotionsIntentHandler, GetMyPromotionsIntentHandler, ListCategoriesHandler} = require('modules/promotions');

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    async handle(handlerInput) {
        const {requestEnvelope, serviceClientFactory, responseBuilder, attributesManager} = handlerInput;
        const attributes = await attributesManager.getPersistentAttributes();
        let speechText = '';

        // Get external user token
        const externalUser = requestEnvelope.session.user;

        // Get device user contact (UPS Service)
        try {
            const email = await serviceClientFactory.getUpsServiceClient().getProfileEmail();
            const givenName = await serviceClientFactory.getUpsServiceClient().getProfileGivenName();
            speechText += `Buongiorno ${givenName}`;
        } catch (e) {
            return responseBuilder
                .speak('Ho bisogno di più permessi')
                .withAskForPermissionsConsentCard(['alexa::profile:email:read', 'alexa::profile:given_name:read'])
                .getResponse();
        }

        if (Object.keys(attributes).length === 0) {
            speechText += ' con questa skill puoi conoscere lo stato dei tuoi ordini su Terranova oppure puoi chiedere le offerte del giorno per la categoria che più ti interessa';

            attributesManager.setPersistentAttributes({
                firstAccess: (new Date()).toLocaleString()
            });
        } else {
            speechText += ' vuoi conoscere le offerte o lo stato di un ordine?';
        }

        return responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};

const ExitHandler = {
    canHandle(handlerInput) {
        const history = handlerInput.attributesManager.getSessionAttributes().history;
        const isListDecline = history && history.length && history[history.length - 1].type === 'IntentRequest' && ['GetPromotionsIntent', 'GetMyPromotionsIntent'].indexOf(history[history.length - 1].intent.name) !== -1;

        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (
                handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent' ||
                handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent' ||
                (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.NoIntent' && isListDecline)
            );
    },
    handle(handlerInput) {
        const speechText = 'è stato bello, alla prossima!';
        return handlerInput.responseBuilder
            .speak(speechText)
            .withShouldEndSession(true)
            .getResponse();
    }
};

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`Error handled: ${error.message}`);

        return handlerInput.responseBuilder
            .speak('Mi dispiace, non ho capito. Puoi ripetere?')
            .reprompt('Mi dispiace, non ho capito. Puoi ripetere?')
            .getResponse();
    },
};

const SavePersistentAttributesResponseInterceptor = {
    async process(handlerInput) {
        // Save requests history in session attributes (to be used with yes/no intents)
        const history = handlerInput.attributesManager.getSessionAttributes().history || [];
        history.push(handlerInput.requestEnvelope.request);
        handlerInput.attributesManager.setSessionAttributes({history});

        // Save persistent attributes
        await handlerInput.attributesManager.savePersistentAttributes();
    }
};

exports.handler = Alexa.SkillBuilders.standard()
    .addResponseInterceptors(SavePersistentAttributesResponseInterceptor)
    .addRequestHandlers(
        LaunchRequestHandler,
        GetPromotionsIntentHandler,
        GetMyPromotionsIntentHandler,
        ListCategoriesHandler,
        ExitHandler
    )
    .addErrorHandlers(ErrorHandler)
    .withTableName('terranova')
    .withAutoCreateTable(true)
    .lambda();
