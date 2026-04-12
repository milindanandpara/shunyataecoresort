const path = require("path");

function policycontroller() {
    return {
        privacy(req, res) {
            res.render("privacy-policy");
        },
        terms(req, res) {
            res.render("term-condition");
        },
        refund(req, res) {
             res.render("cancelllation-refund-policy");
        },
        shipping(req, res) {
            res.render("shipping-policy");
        },
    };
}

module.exports = policycontroller;