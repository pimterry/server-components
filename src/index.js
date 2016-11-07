"use strict";

var domino = require("domino");
var validateElementName = require("validate-element-name");

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

    if (options && options.prototype) {
        registeredElements[name] = options.prototype;
    } else {
        registeredElements[name] = exports.newElement();
    }

    return registeredElements[name].constructor;
};

/**
 * Registers an element that is intended to run server-side only, and thus
 * replaced with a resolved value or nothing.
 *
 * Server-side elements ARE NOT required to contain a hyphen.
 */
exports.registerServerElement = function registerServerElement(name, handler) {
    if ( registeredElements[name] && typeof registeredElements[name] !== 'function' ) {
        throw new Error(`Registration failed for '${name}'. Name is already taken by a non-server-side element.`);
    }
    registeredElements[name] = handler;
    return handler;
};



function transformTree(document, currentNode, callback) {

    var task = callback(currentNode);

    if ( task !== undefined ) {
        let replaceNode = function replaceNode (results) {
            if (results === null) {
                currentNode.parentNode.removeChild(currentNode)
                return Promise.resolve()
            }
            if (typeof results === 'string') {
                var temp = document.createElement('template');
                temp.innerHTML = results;
                results = temp.content.childNodes;
            }
            if (results) {
                var fragment = document.createDocumentFragment();
                var newNodes = results.length ? slice.call(results) : [results];

                newNodes.map( (newNode) => {
                    newNode.parentNode === currentNode && currentNode.removeChild(newNode);
                    fragment.appendChild(newNode);
                });
                currentNode.parentNode.replaceChild(fragment, currentNode);

                return Promise.all(
                    newNodes.map((child) => transformTree(document, child, callback))
                );
            }
            else {
                return Promise.all(
                    map(currentNode.childNodes, (child) => transformTree(document, child, callback))
                );
            }
        };

        if ( task === null ) {
            return replaceNode(null)
        }
        if ( task.then ) {
            // Promise task; potential transformation
            return task.then(replaceNode);
        }
        else {
            // Syncronous transformation
            return replaceNode(task);
        }
    }
    else {
        // This element has opted to do nothing to itself.
        // Recurse on its children.
        return Promise.all(
            map(currentNode.childNodes, (child) => transformTree(document, child, callback))
        );
    }
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

    return transformTree(document, rootNode, (foundNode) => {
        if (foundNode.tagName) {
            let nodeType = foundNode.tagName.toLowerCase();
            let customElement = registeredElements[nodeType];

            if (customElement && typeof customElement === 'function') {
                var subResult = customElement(foundNode, document);

                // Replace with children by default
                return (subResult === undefined) ? null : subResult;
            }
            else if (customElement) {
                // TODO: Should probably clone node, not change prototype, for performance
                Object.setPrototypeOf(foundNode, customElement);

                if (customElement.createdCallback) {
                    try {
                        var result = customElement.createdCallback.call(foundNode, document);
                        if ( result && result.then ) {
                            // Client-side custom elements never replace themselves;
                            // resolve with undefined to prevent such a scenario.
                            return result.then( () => undefined );
                        }
                    }
                    catch (err) {
                        return Promise.reject(err);
                    }
                }
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

function map (arrayLike, fn) {
    var results = [];
    for (var i=0; i < arrayLike.length; i++) {
        results.push( fn(arrayLike[i]) );
    }
    return results;
}

var slice = Array.prototype.slice;
