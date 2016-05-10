"use strict";

var domino = require("domino");
var validateElementName = require("validate-element-name");

/**
 * The DOM object (ServerComponents.dom) exposes tradition DOM objects (normally globally available
 * in browsers) such as the CustomEvent and various HTMLElement classes, for your component
 * implementations.
 */
exports.dom = domino.impl;

exports.newElement = function newElement() {
    return Object.create(domino.impl.HTMLElement.prototype);
};

var registeredElements = {};

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
