"use strict";

var domino = require("domino");

exports.newElement = function newElement() {
    return {};
};

var registeredElements = {};

exports.registerElement = function registerElement(name, options) {
    registeredElements[name] = options.prototype;
};

function recurseTree(rootNode, callback) {
    for (let node of rootNode.childNodes) {
        callback(node);
        recurseTree(node, callback);
    }
}

exports.render = function render (input) {
    var doc = domino.createDocument(input);

    var createdPromises = [];

    recurseTree(doc, (node) => {
        if (node.tagName) {
            var nodeType = node.tagName.toLowerCase();
            var customElement = registeredElements[nodeType];
            if (customElement) {
                var createdResult = customElement.createdCallback.call(node);
                createdPromises.push(Promise.resolve(createdResult));
            }
        }
    });

    return Promise.all(createdPromises).then(() => doc.documentElement.outerHTML);
};