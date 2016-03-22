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

    recurseTree(doc, (node) => {
        if (node.tagName) {
            var nodeType = node.tagName.toLowerCase();
            var customElement = registeredElements[nodeType];
            if (customElement) customElement.createdCallback.call(node);
        }
    });

    return doc.documentElement.outerHTML;
};