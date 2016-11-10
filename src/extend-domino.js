//
// Strict mode disallows us to overwrite Document.prototype properties.
// This file is to stay out of strict mode.
//
var domino = require("domino");
var Document = require('domino/lib/Document');
var Element = require('domino/lib/Element');


module.exports = function (newHTMLElement, _createElement) {
  var result = {};

  //
  // Patch document.createElement
  //
  Document.prototype.createElement = function(tagName, options) {
    return _createElement(this, tagName, options, true);
  };

  //
  // Patch HTMLElement
  //
  result.HTMLElement = newHTMLElement;
  result.HTMLElement.prototype = Object.create(domino.impl.HTMLElement.prototype, {
    constructor: {value: result.HTMLElement, configurable: true, writable: true},
  });


  //
  // Patch doc.createElementNS
  //
  var HTMLNS = 'http://www.w3.org/1999/xhtml';
  var _origCreateElementNS = Document.prototype.createElementNS;

  Document.prototype.createElementNS = function(namespaceURI, qualifiedName) {
    if (namespaceURI === 'http://www.w3.org/1999/xhtml') {
      return this.createElement(qualifiedName);
    } else {
      return _origCreateElementNS.call(this, namespaceURI, qualifiedName);
    }
  };

  return result;
};
