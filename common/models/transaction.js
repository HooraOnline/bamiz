'use strict';
var request = require('superagent')
var crypto = require("crypto")

var express = require('express'),
    ZarinpalCheckout = require('zarinpal-checkout'),
    bodyParser = require('body-parser'),
    app = express();


module.exports = function (Transaction) {
    // Transaction.remoteMethod('destroyAll', {
    //     isStatic: true,
    //     description: 'Delete all matching records',
    //     accessType: 'WRITE',
    //     accepts: { arg: 'where', type: 'object', description: 'filter.where object' },
    //     http: { verb: 'del', path: '/removeByCondition' }
    // });
    Transaction.connectToBank = function (amount, callbackURL, description, email, mobile, cb) {
        app.use(bodyParser.urlencoded({ extended: false }));
        app.use(bodyParser.json());
        /**
         * Initial ZarinPal module.
         * @param {String} '6aef8e20-6bca-11e7-949f-005056a205be' [MerchantID]
         * @param {bool} false [toggle `Sandbox` mode]
         */

        var zarinpal = ZarinpalCheckout.create('6aef8e20-6bca-11e7-949f-005056a205be', true);

        /**
         * Route: PaymentRequest [module]
         * @return {String} URL [Payement Authority]
         */
        var charg = {
            Amount: amount,
            CallbackURL: callbackURL || 'http://bamiz.ir',
            Description: description || 'شارژ حساب بامیز.',
            Email: email || 'hooraOnline@gmail.com',
            Mobile: mobile || '09196421264'
        }
        zarinpal.PaymentRequest(charg).then(function (response) {
            if (response.status == 100) {
                cb(null, response);
                //res.redirect(response.url);
            }
        }).catch(function (err) {
            cb(null, 'erroe: ' + err);
            console.log(err);
        });
    };

    /* /api/Transactions/connectToBank?amount=20000 */
    Transaction.remoteMethod("connectToBank", {
        accepts: [
            { arg: 'amount', type: 'string' },
            { arg: 'callbackURL', type: 'string' },
            { arg: 'description', type: 'string' },
            { arg: 'email', type: 'string' },
            { arg: 'mobile', type: 'string' },
        ],
        returns: {
            arg: "transaction",
            type: "string"
        },
        http: {
            path: "/connectToBank",
            verb: "get"
        }
    });
    //برای اینکریپت کردن رمز دوم کارت
    function encrypt(key, secret) {
        const hash = crypto.createHash('md5', 'utf-8').update(secret).digest()
        let cipher = crypto.createCipheriv('des-ede3', Buffer.concat([hash, hash.slice(0, 8)]), new Buffer(''))
        let ciph = cipher.update(key, 'utf8', 'base64')
        ciph += cipher.final('base64')
        return ciph
    }
    //finotech getBalance
    Transaction.getBalance = function (token, nid, deposit, callback) {
        var trackId = 'balance-' + crypto.randomBytes(10).toString('hex')
        var url = 'https://sandbox.finnotech.ir/oak/v1/' + nid + '/deposits/' + deposit + '/balance?trackId=' + trackId;
        request
            .get(url)
            .set('Authorization', 'Bearer ' + token)
            .end(function (err, res) {
                if (err) {
                    console.log(err)
                    callback(err)
                } else {
                    callback(err, res.body)
                }
            })
    }
    Transaction.remoteMethod('getBalance', {
        accepts: [
            { arg: 'token', type: 'string' },
            { arg: 'nid', type: 'string' },
            { arg: 'deposit', type: 'string' },

        ],
        returns: {
            arg: "balance",
            type: "string"
        },
        http: {
            path: "/getBalance",
            verb: "get"
        }
    });
    // واریز به حساب بانکی
    Transaction.transferTo = function (token, nid, amount, destinationNumber, paymentNumber, description, destinationFirstname, destinationLastname, callback) {
        var trackId = 'balance-' + crypto.randomBytes(10).toString('hex')
        var url = 'https://sandbox.finnotech.ir/oak/v1/' + nid + '/clients/bamiz/transferTo?trackId=' + trackId;
        request
            .post(url)
            .send({
                amount: amount,
                destinationNumber: destinationNumber,
                paymentNumber: paymentNumber,
                description: description,
                destinationFirstname: destinationFirstname,
                destinationLastname: destinationLastname,
            })
            .set('Authorization', 'Bearer ' + token)
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                if (err) {
                    console.log(err)
                    callback(err)
                } else {
                    callback(err, res.body)
                }
            })
    }
    Transaction.remoteMethod('transferTo', {
        accepts: [
            { arg: 'token', type: 'string' },
            { arg: 'nid', type: 'string' },
            { arg: 'amount', type: 'string' },
            { arg: 'destinationNumber', type: 'string' },
            { arg: 'paymentNumber', type: 'string' },
            { arg: 'description', type: 'string' },
            { arg: 'destinationFirstname', type: 'string' },
            { arg: 'destinationLastname', type: 'string' },
        ],
        returns: {
            arg: "body",
            type: "string"
        },
        http: {
            path: "/transferTo",
            verb: "post"
        }
    });
    //برداشت از حساب
    Transaction.withdrawalFrom = function (token, nid, amount, destinationNumber, description, callback) {
        var trackId = 'balance-' + crypto.randomBytes(10).toString('hex')
        var url = 'https://sandbox.finnotech.ir/oak/v1/' + nid + '/withdrawalFrom?trackId=' + trackId;
        request
            .post(url)
            .send({
                amount: amount,
                destinationNumber: destinationNumber,
                description: description
            })
            .set('Authorization', 'Bearer ' + token)
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                if (err) {
                    console.log(err)
                    callback(err)
                } else {
                    callback(err, res.body)
                }
            })
    }
    Transaction.remoteMethod('withdrawalFrom', {
        accepts: [
            { arg: 'token', type: 'string' },
            { arg: 'nid', type: 'string' },
            { arg: 'amount', type: 'string' },
            { arg: 'destinationNumber', type: 'string' },
            { arg: 'description', type: 'string' },
        ],
        returns: {
            arg: "body",
            type: "string"
        },
        http: {
            path: "/withdrawalFrom",
            verb: "post"
        }
    });
    //کارت به کارت
    Transaction.cardToCardTransfer = function (token, amount, sourceCard, pin, cvv2, expDate, destinationCard, mobile, callback) {
        var trackId = 'balance-' + crypto.randomBytes(10).toString('hex')
        var url = 'https://sandbox.finnotech.ir/mpg/v1/clients/bamiz/cardTransfer?trackId=' + trackId;
        request
            .post(url)
            .send({
                amount: amount,
                sourceCard: sourceCard,
                pin: pin,
                cvv2: cvv2,
                expDate: expDate,
                destinationCard: destinationCard,
                mobile: mobile,
            })
            .set('Authorization', 'Bearer ' + token)
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                if (err) {
                    console.log(err)
                    callback(err)
                } else {
                    callback(err, res.body)
                }
            })
    }
    Transaction.remoteMethod('cardToCardTransfer', {
        accepts: [
            { arg: 'token', type: 'string' },
            { arg: 'nid', type: 'string' },
            { arg: 'amount', type: 'string' },
            { arg: 'sourceCard', type: 'string' },
            { arg: 'pin', type: 'string' },
            { arg: 'cvv2', type: 'string' },
            { arg: 'expDate', type: 'string' },
            { arg: 'destinationCard', type: 'string' },
            { arg: 'mobile', type: 'string' },
        ],
        returns: {
            arg: "body",
            type: "string"
        },
        http: {
            path: "/cardToCardTransfer",
            verb: "post"
        }
    });
    Transaction.findTransactionUnder = function (value, cb) {
        Transaction.find({
            where: {
                price: {
                    lt: value
                }
            }
        }, cb);
    };



    /* /api/Transactions/findTransactionUnder?amount=20000 */
    Transaction.remoteMethod("findTransactionUnder", {
        accepts: {
            arg: "amount",
            type: "number"
        },
        returns: {
            arg: "transaction",
            type: "array"
        },
        http: {
            path: "/findTransactionUnder",
            verb: "get"
        }
    });
};
