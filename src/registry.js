"use strict";
var domino = require("domino");
var Document = require('domino/lib/Document');
var Element = require('domino/lib/Element');

const _upgradedProp = '__$CE_upgraded';

const _customElements = () => CustomElementRegistry.instance();

/**
 * A registry of custom element definitions.
 *
 * See https://html.spec.whatwg.org/multipage/scripting.html#customelementsregistry
 *
 * Implementation based on https://github.com/webcomponents/custom-elements/blob/master/src/custom-elements.js
 *
 */
var _instance = null;
class CustomElementRegistry {

  static instance () {
    if ( ! _instance ) _instance = new CustomElementRegistry();
    return _instance;
  }

  constructor() {
    this._definitions = new Map();
    this._constructors = new Map();
    this._whenDefinedMap = new Map();

    this._newInstance = null;
  }

  // HTML spec part 4.13.4
  // https://html.spec.whatwg.org/multipage/scripting.html#dom-customelementsregistry-define
  /**
   * @param {string} name
   * @param {function(new:HTMLElement)} constructor
   * @param {{extends: string}} options
   * @return {undefined}
   */
  define(name, constructor, options) {
    // 1:
    if (typeof constructor !== 'function') {
      throw new TypeError('constructor must be a Constructor');
    }

    // 2. If constructor is an interface object whose corresponding interface
    //    either is HTMLElement or has HTMLElement in its set of inherited
    //    interfaces, throw a TypeError and abort these steps.
    //
    // It doesn't appear possible to check this condition from script

    // 3:
    const nameError = checkValidCustomElementName(name);
    if (nameError) throw nameError;

    // 4, 5:
    // Note: we don't track being-defined names and constructors because
    // define() isn't normally reentrant. The only time user code can run
    // during define() is when getting callbacks off the prototype, which
    // would be highly-unusual. We can make define() reentrant-safe if needed.
    if (this._definitions.has(name)) {
      throw new Error(`An element with name '${name}' is already defined`);
    }

    // 6, 7:
    if (this._constructors.has(constructor)) {
      throw new Error(`Definition failed for '${name}': ` +
          `The constructor is already used.`);
    }

    // 8:
    /** @type {string} */
    const localName = name;

    // 9, 10: We do not support extends currently.

    // 11, 12, 13: Our define() isn't rentrant-safe

    // 14.1:
    const prototype = constructor.prototype;

    // 14.2:
    if (typeof prototype !== 'object') {
      throw new TypeError(`Definition failed for '${name}': ` +
          `constructor.prototype must be an object`);
    }

    function getCallback(callbackName) {
      const callback = prototype[callbackName];
      if (callback !== undefined && typeof callback !== 'function') {
        throw new Error(`${localName} '${callbackName}' is not a Function`);
      }
      return callback;
    }

    // 3, 4:
    const connectedCallback = getCallback('connectedCallback');

    // 5, 6:
    const disconnectedCallback = getCallback('disconnectedCallback');

    // Divergence from spec: we always throw if attributeChangedCallback is
    // not a function.

    // 7, 9.1:
    const attributeChangedCallback = getCallback('attributeChangedCallback');

    // 8, 9.2, 9.3:
    const observedAttributes =
        (attributeChangedCallback && constructor.observedAttributes) || [];

    // 15:
    /** @type {CustomElementDefinition} */
    const definition = {
      name: name,
      localName: localName,
      constructor: constructor,
      connectedCallback: connectedCallback,
      disconnectedCallback: disconnectedCallback,
      attributeChangedCallback: attributeChangedCallback,
      observedAttributes: observedAttributes,
    };

    // 16:
    this._definitions.set(localName, definition);
    this._constructors.set(constructor, localName);

    // 17, 18, 19:
    // Since we are rendering server-side, no need to upgrade doc;
    // custom elements will be defined before rendering takes place.
    // this._upgradeDoc();

    // 20:
    const deferred = this._whenDefinedMap.get(localName);
    if (deferred) {
      deferred.resolve(undefined);
      this._whenDefinedMap.delete(localName);
    }
  }

  /**
   * Returns the constructor defined for `name`, or `null`.
   *
   * @param {string} name
   * @return {Function|undefined}
   */
  get(name) {
    // https://html.spec.whatwg.org/multipage/scripting.html#custom-elements-api
    const def = this._definitions.get(name);
    return def ? def.constructor : undefined;
  }

  /**
   * Returns a `Promise` that resolves when a custom element for `name` has
   * been defined.
   *
   * @param {string} name
   * @return {!Promise}
   */
  whenDefined(name) {
    // https://html.spec.whatwg.org/multipage/scripting.html#dom-customelementsregistry-whendefined
    const nameError = checkValidCustomElementName(name);
    if (nameError) return Promise.reject(nameError);
    if (this._definitions.has(name)) return Promise.resolve();

    let deferred = this._whenDefinedMap.get(name);
    if (deferred) return deferred.promise;

    let resolve;
    const promise = new Promise(function(_resolve, _) {
     resolve = _resolve;
    });
    deferred = {promise, resolve};
    this._whenDefinedMap.set(name, deferred);
    return promise;
  }

  /**
   * @param {?HTMLElement} instance
   * @private
   */
  _setNewInstance(instance) {
    this._newInstance = instance;
  }

  /**
   * WARNING: NOT PART OF THE SPEC
   *
   * @param {string} localName
   * @return {?CustomElementDefinition}
   */
  getDefinition(localName) {
    return this._definitions.get(localName);
  }

  /**
   * WARNING: NOT PART OF THE SPEC
   *
   * @param {string} localName
   * @return {undefined}
   */
  reset() {
    this._definitions.clear();
    this._constructors.clear();
    this._whenDefinedMap.clear();
  }
}
exports = module.exports = CustomElementRegistry;


//
// - Overwrite domino's new element constructor
// - Patch domino's document.createElement
//
const origHTMLElement = domino.impl.HTMLElement;
const _origCreateElement = Document.prototype.createElement;

const newHTMLElement = function HTMLElement() {
  const customElements = _customElements();

  // If there's an being upgraded, return that
  if (customElements._newInstance) {
    const i = customElements._newInstance;
    customElements._newInstance = null;
    return i;
  }
  if (this.constructor) {
    // Find the tagname of the constructor and create a new element with it
    const tagName = customElements._constructors.get(this.constructor);
    // Domino does not need a doc as a `this` parameter
    return _createElement(null, tagName, undefined, false);
  }
  throw new Error('Unknown constructor. Did you call customElements.define()?');
};

/**
 * Creates a new element and upgrades it if it's a custom element.
 * @param {!Document} doc
 * @param {!string} tagName
 * @param {Object|undefined} options
 * @param {boolean} callConstructor whether or not to call the elements
 *   constructor after upgrading. If an element is created by calling its
 *   constructor, then `callConstructor` should be false to prevent double
 *   initialization.
 */
function _createElement(doc, tagName, options, callConstructor) {
  const customElements = _customElements();
  const element = options ? _origCreateElement.call(doc, tagName, options) :
    _origCreateElement.call(doc, tagName);
  const definition = customElements._definitions.get(tagName.toLowerCase());
  if (definition) {
    customElements._upgradeElement(element, definition, callConstructor);
  }
  return element;
}


var patched = require('./extend-domino')(newHTMLElement, _createElement);
exports.HTMLElement = patched.HTMLElement;


/**
 * 2.3
 * http://w3c.github.io/webcomponents/spec/custom/#dfn-element-definition
 * @typedef {{
 *  name: string,
 *  localName: string,
 *  constructor: function(new:HTMLElement),
 *  connectedCallback: (Function|undefined),
 *  disconnectedCallback: (Function|undefined),
 *  attributeChangedCallback: (Function|undefined),
 *  observedAttributes: Array<string>,
 * }}
 */
let CustomElementDefinition;


const reservedTagList = [
  'annotation-xml',
  'color-profile',
  'font-face',
  'font-face-src',
  'font-face-uri',
  'font-face-format',
  'font-face-name',
  'missing-glyph',
];

function checkValidCustomElementName(name) {
  if (!(/^[a-z][.0-9_a-z]*-[\-.0-9_a-z]*$/.test(name) &&
      reservedTagList.indexOf(name) === -1)) {
    return new Error(`The element name '${name}' is not valid.`);
  }
}
