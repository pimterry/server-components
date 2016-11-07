var expect = require('chai').expect;

var components = require("../src/index.js");

describe("A component that renders on the server", () => {

    it("removes itself by default", () => {
        var itRan = false;

        components.registerServerElement("my-analytics", function (node) {
            itRan = true;
        });

        return components.renderFragment(
            "<p>One<my-analytics>Two</my-analytics></p><div>Three</div>"
        ).then((output) => {
            expect(itRan).to.equal(true);
            expect(output).to.equal("<p>One</p><div>Three</div>");
        });
    });

    it("can replace itself with a new node via an HTML string", () => {
        components.registerServerElement("my-timestamp", function (node) {
            return `<div>123</div>`;
        });

        return components.renderFragment(
            "<p><my-timestamp></my-timestamp></p>"
        ).then((output) => {
            expect(output).to.equal("<p><div>123</div></p>");
        });
    });

    it("can replace itself with a child", () => {
        components.registerServerElement("latter", function (node) {
            return node.children[1];
        });

        return components.renderFragment(
            "<latter><h1>One</h1><h2>Two</h2></latter>"
        ).then((output) => {
            expect(output).to.equal("<h2>Two</h2>");
        });
    });

    it("can replace itself with its children", () => {
        var somethingHappened = false
        components.registerServerElement("log", function (node) {
            somethingHappened = true;
            return node.children;
        });

        return components.renderFragment(
            "<log><h1>One</h1><h2>Two</h2></log>"
        ).then((output) => {
            expect(output).to.equal("<h1>One</h1><h2>Two</h2>");
        });
    })

    it("can make async requests", () => {
        components.registerServerElement("user-count", function (node) {
            return new Promise((resolve) => {
                setTimeout(() => resolve("<span>10</span>"), 25)
            })
        });

        return components.renderFragment(
            "<user-count></user-count>"
        ).then((output) => {
            expect(output).to.equal("<span>10</span>");
        });
    })
});
