"use strict";
var expect = require('chai').expect;

var components = require("../src/index.js");

describe("A component that renders on the server", () => {

    it("replaces itself with its children by default", () => {
        var itRan = false;

        components.registerTransformer("my-analytics", function (node) {
            itRan = true;
        });

        return components.renderFragment(
            "<p>One<my-analytics>Two<span>Things</span></my-analytics></p><div>Three</div>"
        ).then((output) => {
            expect(itRan).to.equal(true);
            expect(output).to.equal("<p>OneTwo<span>Things</span></p><div>Three</div>");
        });
    });

    it("replaces itself with its children by default (async)", () => {
        var itRan = false;

        components.registerTransformer("my-analytics", function (node) {
            itRan = true;
            return Promise.resolve();
        });

        return components.renderFragment(
            "<p>One<my-analytics>Two<span>Things</span></my-analytics></p><div>Three</div>"
        ).then((output) => {
            expect(itRan).to.equal(true);
            expect(output).to.equal("<p>OneTwo<span>Things</span></p><div>Three</div>");
        });
    });

    it("can remove itself and its children", () => {
        var itRan = false;

        components.registerTransformer("ghost", function (node) {
            itRan = true;
            return null;
        });

        return components.renderFragment(
            "<h1>One</h1><ghost><h2>Two</h2></ghost><h3>Three</h3>"
        ).then((output) => {
            expect(itRan).to.equal(true);
            expect(output).to.equal("<h1>One</h1><h3>Three</h3>");
        });
    });

    it("can replace itself with a new node via an HTML string", () => {
        components.registerTransformer("my-timestamp", function (node) {
            return `<div>123</div>`;
        });

        return components.renderFragment(
            "<p><my-timestamp></my-timestamp></p>"
        ).then((output) => {
            expect(output).to.equal("<p><div>123</div></p>");
        });
    });

    it("can replace itself with a child", () => {
        components.registerTransformer("latter", function (node) {
            return node.children[1];
        });

        return components.renderFragment(
            "<latter><h1>One</h1><h2>Two</h2></latter>"
        ).then((output) => {
            expect(output).to.equal("<h2>Two</h2>");
        });
    });

    it("can replace itself with its children", () => {
        var somethingHappened = false;
        components.registerTransformer("log", function (node) {
            somethingHappened = true;
            return node.children;
        });

        return components.renderFragment(
            "<log><h1>One</h1><h2>Two</h2></log>"
        ).then((output) => {
            expect(output).to.equal("<h1>One</h1><h2>Two</h2>");
        });
    });

    it("can make async requests", () => {
        components.registerTransformer("user-count", function (node) {
            return new Promise((resolve) => {
                setTimeout(() => resolve("<span>10</span>"), 25);
            });
        });

        return components.renderFragment(
            "<user-count></user-count>"
        ).then((output) => {
            expect(output).to.equal("<span>10</span>");
        });
    });

    it("can transform custom elements", () => {
        var itRan = false;
        var itRanToo = false;

        components.registerTransformer("double-render", function (node) {
            itRan = true;
            return new Promise((resolve) => {
                setTimeout(function () {
                    node.setAttribute('data-preset', JSON.stringify({ x: 10 }));
                    resolve();
                }, 5);
            });
        });

        class MyElement extends components.HTMLElement {
            connectedCallback() {
                itRanToo = true;
                this.textContent = this.getAttribute('data-preset');
                this.setAttribute('data-preset', '99');
            }
        }
        components.customElements.define("double-render", MyElement);

        return components.renderFragment(
            "<double-render></double-render>"
        ).then((output) => {
            expect(itRan).to.equal(true);
            expect(itRanToo).to.equal(true);
            expect(output).to.equal(`<double-render data-preset="99">{"x":10}</double-render>`);
        });
    });
});
