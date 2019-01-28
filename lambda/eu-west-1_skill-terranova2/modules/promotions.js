const GetPromotionsIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'GetPromotionsIntent';
    },
    handle(handlerInput) {
        const categoryValue = handlerInput.requestEnvelope.request.intent.slots.category.value;
        const category = handlerInput.requestEnvelope.request.intent.slots.category.resolutions.resolutionsPerAuthority[0].values[0].value.name;
        const speechText = `Ecco le promozioni della categoria ${category}: bla, bla, bla. Vuoi sapere le offerte di altre categorie?`;

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt('Vuoi sapere le offerte di altre categorie?')
            .getResponse();
    }
};

const GetMyPromotionsIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'GetMyPromotionsIntent';
    },
    handle(handlerInput) {
        const {requestEnvelope} = handlerInput;
        const user = requestEnvelope.session.user;

        if (!user.accessToken) {
            // Richiesta login a servizio esterno
            return handlerInput.responseBuilder
                .speak('Per ricevere le promozioni personalizzate devi accedere al tuo account Terranova, inserisci usename e password nell\'app')
                .reprompt('Inserisci usename e password nell\'app')
                .withLinkAccountCard()
                .getResponse();
        }

        // Chiamata a mio web service per ricevere promozioni personalizzate, utilizzando accessToken
        // ...

        const speechText = `Ecco le promozioni dedicate a te: bla, bla, bla. Vuoi sapere le offerte di altre categorie?`;
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt('Vuoi sapere le offerte di altre categorie?')
            .getResponse();
    }
};

const ListCategoriesHandler = {
    canHandle(handlerInput) {
        const history = handlerInput.attributesManager.getSessionAttributes().history;
        const isListConfirm = history && history.length && history[history.length - 1].type === 'IntentRequest' && ['GetPromotionsIntent', 'GetMyPromotionsIntent'].indexOf(history[history.length - 1].intent.name) !== -1;

        return (handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'ListCategoriesIntent')
            ||
            (handlerInput.requestEnvelope.request.type === 'IntentRequest'
                && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.YesIntent'
                && isListConfirm);
    },
    handle(handlerInput) {
        const speechText = `Le categorie disponibili sono: pantaloni, maglioni, giacche, scarponi. Che offerte ti interessano?`;
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .withSimpleCard('Lista categorie', 'pantaloni\nmaglioni\ngiacche\nscarponi')
            .getResponse();
    }
};

module.exports = {
    GetPromotionsIntentHandler,
    GetMyPromotionsIntentHandler,
    ListCategoriesHandler
};
