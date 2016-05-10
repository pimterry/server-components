"use strict";

var domino = require("domino");
var validateElementName = require("validate-element-name");

/**
 * The DOM object (ServerComponents.dom) exposes tradition DOM objects (normally globally available
 * in browsers) such as the CustomEvent and various HTMLElement classes, for your component
 * implementations.
 */
exports.dom = domino.impl;

/**
 * Creates a returns a new custom HTML element prototype, extending the HTMLElement prototype.
 *
 * Note that this does *not* register the element. To do that, call ServerComponents.registerElement
 * with an element name, and options (typically including the prototype returned here as your
 * 'prototype' value).
 */
exports.newElement = function newElement() {
    return Object.create(domino.impl.HTMLElement.prototype);
};

var registeredElements = {};

/**
 * Registers an element, so that it will be used when the given element name is found during parsing.
 *
 * Element names are required to contain a hyphen (to disambiguate them from existing element names),
 * be entirely lower-case, and not start with a hyphen.
 *
 * The only option currently supported is 'prototype', which sets the prototype of the given element.
 * This prototype will have its various callbacks called when it is found during document parsing,
 * and properties of the prototype will be exposed within the DOM to other elements there in turn.
 */
exports.registerElement = function registerElement(name, options) {
    var nameValidationResult = validateElementName(name);
    if (!nameValidationResult.isValid) {
        throw new Error(`Registration failed for '${name}'. ${nameValidationResult.message}`);
    }

    registeredElements[name] = options.prototype;
};

function recurseTree(rootNode, callback) {
    for (let node of rootNode.childNodes) {
        callback(node);
        recurseTree(node, callback);
    }
}

/**
 * Take a string of HTML input, and render it into a full page, handling any custom elements found
 * within, and returning a promise for the resulting string of HTML.
 */
exports.render = function render(input) {
    let doc = domino.createDocument(input);

    let createdPromises = [];

    recurseTree(doc, (node) => {
        if (node.tagName) {
            let nodeType = node.tagName.toLowerCase();
            let customElement = registeredElements[nodeType];
            if (customElement) {
                // TODO: Should probably clone node, not change prototype, for performance
                Object.setPrototypeOf(node, customElement);
                if (customElement.createdCallback) {
                    createdPromises.push(new Promise((resolve) => {
                        resolve(customElement.createdCallback.call(node));
                    }));
                }
            }
        }
    });

    return Promise.all(createdPromises).then(() => doc.documentElement.outerHTML);
};
