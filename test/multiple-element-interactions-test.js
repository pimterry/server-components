"use strict";
var expect = require('chai').expect;

var components = require("../src/index.js");

describe("When multiple DOM elements are present", () => {
    beforeEach(() => {
        components.customElements.reset();
    });

    describe("nested elements", () => {
        it("are rendered correctly", () => {
            class PrefixedElement extends components.HTMLElement {
                connectedCallback() {
                    this.innerHTML = "prefix:" + this.innerHTML;
                }
            }
            components.customElements.define("prefixed-element", PrefixedElement);

            return components.renderFragment(
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
            class ChildCountElement extends components.HTMLElement {
                connectedCallback() {
                    var newNode = this.doc.createElement("div");
                    newNode.textContent = this.childNodes.length + " children";
                    this.insertBefore(newNode, this.firstChild);
                }
            }
            components.customElements.define("child-count", ChildCountElement);

            return components.renderFragment(
                "<child-count><div>A child</div><div>Another child</div></child-count>"
            ).then((output) => {
                expect(output).to.equal(
                    "<child-count><div>2 children</div><div>A child</div><div>Another child</div></child-count>"
                );
            });
        });

        // Pending until we decide on a good solution
        xit("can read attributes from custom child element's prototypes", () => {
            class DataSource extends components.HTMLElement {
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
            DataSource.data = [10, 20, 30];

            components.customElements.define("data-displayer", DataSource);

            return components.renderFragment(
                "<data-displayer><data-source></data-source></data-displayer>"
            ).then((output) => {
                expect(output).to.equal(
                    "<data-displayer>Data: [10,20,30]</data-displayer>"
                );
            });
        });

        it("receive bubbling events from child elements", () => {
            class EventRecorder extends components.HTMLElement {
                connectedCallback(document) {
                    var resultsNode = document.createElement("p");
                    this.appendChild(resultsNode);

                    this.addEventListener("my-event", (event) => {
                        resultsNode.innerHTML = "Event received";
                    });
                }
            }
            components.customElements.define("event-recorder", EventRecorder);

            class EventElement extends components.HTMLElement {
                connectedCallback() {
                    this.dispatchEvent(new components.dom.CustomEvent('my-event', {
                        bubbles: true
                    }));
                }
            }
            components.customElements.define("event-source", EventElement);

            return components.renderFragment(
                "<event-recorder><event-source></event-source></event-recorder>"
            ).then((output) => {
                expect(output).to.equal(
                    "<event-recorder><event-source></event-source><p>Event received</p></event-recorder>"
                );
            });
        });
    });
});
