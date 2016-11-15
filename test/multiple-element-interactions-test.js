"use strict";
var expect = require('chai').expect;

var customElements = require("../src/index.js");

describe("When multiple DOM elements are present", () => {
    beforeEach(() => {
        customElements.customElements.reset();
    });

    describe("nested elements", () => {
        it("are rendered correctly", () => {
            class PrefixedElement extends customElements.HTMLElement {
                connectedCallback() {
                    this.innerHTML = "prefix:" + this.innerHTML;
                }
            }
            customElements.define("prefixed-element", PrefixedElement);

            return customElements.renderFragment(
                "<prefixed-element><prefixed-element>existing-content</prefixed-element></prefixed-element>"
            ).then((output) => {
                expect(output).to.equal(
                    "<prefixed-element>prefix:<prefixed-element>prefix:existing-content</prefixed-element></prefixed-element>"
                );
            });
        });
    });

    describe("parent elements", () => {
        it("can see child elements", () => {
            class ChildCountElement extends customElements.HTMLElement {
                connectedCallback() {
                    var newNode = this.doc.createElement("div");
                    newNode.textContent = this.childNodes.length + " children";
                    this.insertBefore(newNode, this.firstChild);
                }
            }
            customElements.define("child-count", ChildCountElement);

            return customElements.renderFragment(
                "<child-count><div>A child</div><div>Another child</div></child-count>"
            ).then((output) => {
                expect(output).to.equal(
                    "<child-count><div>2 children</div><div>A child</div><div>Another child</div></child-count>"
                );
            });
        });

        it("can read attributes from custom child element's prototypes", () => {
            class DataSource extends customElements.HTMLElement {
              get data() {
                return [10, 20, 30];
              }
            }
            customElements.define("data-source", DataSource);

            class DataDisplayer extends customElements.HTMLElement {
                connectedCallback() {
                    return new Promise((resolve) => {
                        // Has to be async, as child node prototypes aren't set: http://stackoverflow.com/questions/36187227/
                        // This is a web components limitation generally. TODO: Find a nicer pattern for handle this.
                        setTimeout(() => {
                            var data = this.childNodes[0].data;
                            this.textContent = "Data: " + JSON.stringify(data);
                            resolve();
                        }, 0);
                    });
                }
            }

            customElements.define("data-displayer", DataDisplayer);

            return customElements.renderFragment(
                "<data-displayer><data-source></data-source></data-displayer>"
            ).then((output) => {
                expect(output).to.equal(
                    "<data-displayer>Data: [10,20,30]</data-displayer>"
                );
            });
        });

        it("receive bubbling events from child elements", () => {
            class EventRecorder extends customElements.HTMLElement {
                connectedCallback(document) {
                    var resultsNode = document.createElement("p");
                    this.appendChild(resultsNode);

                    this.addEventListener("my-event", (event) => {
                        resultsNode.innerHTML = "Event received";
                    });
                }
            }
            customElements.define("event-recorder", EventRecorder);

            class EventElement extends customElements.HTMLElement {
                connectedCallback() {
                    this.dispatchEvent(new customElements.dom.CustomEvent('my-event', {
                        bubbles: true
                    }));
                }
            }
            customElements.define("event-source", EventElement);

            return customElements.renderFragment(
                "<event-recorder><event-source></event-source></event-recorder>"
            ).then((output) => {
                expect(output).to.equal(
                    "<event-recorder><event-source></event-source><p>Event received</p></event-recorder>"
                );
            });
        });
    });
});
