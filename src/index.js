"use strict";

var domino = require("domino");

/**
 * The DOM object (components.dom) exposes tradition DOM objects (normally globally available
 * in browsers) such as the CustomEvent and various HTMLElement classes, for your component
 * implementations.
 */
exports.dom = domino.impl;

/**
 * Creates a returns a new custom HTML element prototype, extending the HTMLElement prototype.
 *
 * Note that this does *not* register the element. To do that, call components.registerElement
 * with an element name, and options (typically including the prototype returned here as your
 * 'prototype' value).
 */
var CustomElementRegistry = require('./registry');
exports.customElements = CustomElementRegistry.instance();
exports.HTMLElement = CustomElementRegistry.HTMLElement;

const _upgradedProp = '__$CE_upgraded';


function transformTree(document, visitedNodes, currentNode, callback) {

    var task = visitedNodes.has(currentNode) ? undefined : callback(currentNode);

    visitedNodes.add(currentNode);

    let visitChildren = () => Promise.all(
        map(currentNode.childNodes, (child) => transformTree(document, visitedNodes, child, callback))
    );

    return Promise.resolve(task).then(visitChildren);
}

/**
 * Take a string of HTML input, and render it into a full page, handling any custom elements found
 * within, and returning a promise for the resulting string of HTML.
 */
exports.renderPage = function renderPage(input) {
    let document = domino.createDocument(input);
    return renderNode(document).then((renderedDocument) => renderedDocument.outerHTML);
};

/**
 * Take a string of HTML input, and render as a page fragment, handling any custom elements found
 * within, and returning a promise for the resulting string of HTML. Any full page content (<html>
 * and <body> tags) will be stripped.
 */
exports.renderFragment = function render(input) {
    let document = domino.createDocument();
    var template = document.createElement("template");
    // Id added for clarity, as this template is potentially visible
    // from JS running within, if it attempts to search its parent.
    template.id = "server-components-fragment-wrapper";
    template.innerHTML = input;

    return renderNode(template.content).then((template) => template.innerHTML);
};

/**
 * Takes a full Domino node object. Traverses within it and renders all the custom elements found.
 * Returns a promise for the document object itself, resolved when every custom element has
 * resolved, and rejected if any of them are rejected.
 */
function renderNode(rootNode) {
    let createdPromises = [];

    var document = getDocument(rootNode);
    var visitedNodes = new Set();
    var customElements = exports.customElements;

    return transformTree(document, visitedNodes, rootNode, function render (element) {

        const definition = customElements.getDefinition(element.localName);

        if (definition) {
            if ( element[_upgradedProp] ) {
                return;
            }
            upgradeElement(element, definition, true);

            if (definition.connectedCallback) {
                return new Promise(function(resolve, reject) {
                    resolve( definition.connectedCallback.call(element, document) );
                });
            }
        }
    })
        .then(() => rootNode);
}

/**
 * If rootNode is not a real document (e.g. while rendering a fragment), then some methods such as
 * createElement are not available. This method ensures you have a document equivalent object: if
 * you call normal document methods on it (createElement, querySelector, etc) you'll get what you
 * expect.
 *
 * That means methods independent of page hierarchy, especially those that are only present on
 * the true document object (createElement), should be called on the real document, and methods that
 * care about document hierarchy (querySelectorAll, getElementById) should be scope to the given node.
 */
function getDocument(rootNode) {
    // Only real documents have a null ownerDocument
    if (rootNode.ownerDocument === null) return rootNode;

    else {
        let document = rootNode.ownerDocument;

        var documentMethods = [
            'compatMode',
            'createTextNode',
            'createComment',
            'createDocumentFragment',
            'createProcessingInstruction',
            'createElement',
            'createElementNS',
            'createEvent',
            'createTreeWalker',
            'createNodeIterator',
            'location',
            'title',
            'onabort',
            'onreadystatechange',
            'onerror',
            'onload',
        ];

        documentMethods.forEach((propertyName) => {
            var property = document[propertyName];
            if (typeof(property) === 'function') property = property.bind(document);
            rootNode[propertyName] = property;
        });

        return rootNode;
    }
}

function upgradeElement (element, definition, callConstructor) {
    const prototype = definition.constructor.prototype;
    Object.setPrototypeOf(element, prototype);
    if (callConstructor) {
        CustomElementRegistry.instance()._setNewInstance(element);
        new (definition.constructor)();
        element[_upgradedProp] = true;
    }

    const observedAttributes = definition.observedAttributes;
    const attributeChangedCallback = definition.attributeChangedCallback;
    if (attributeChangedCallback && observedAttributes.length > 0) {

        // Trigger attributeChangedCallback for existing attributes.
        // https://html.spec.whatwg.org/multipage/scripting.html#upgrades
        for (let i = 0; i < observedAttributes.length; i++) {
            const name = observedAttributes[i];
            if (element.hasAttribute(name)) {
                const value = element.getAttribute(name);
                attributeChangedCallback.call(element, name, null, value, null);
            }
        }
    }
  }

//
// Helpers
//
function map (arrayLike, fn) {
    return Array.prototype.slice.call(arrayLike).map(fn);
}
