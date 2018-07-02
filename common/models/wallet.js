'use strict';
module.exports = function (Wallet) {
    Wallet.updateList = function (entityList, callback) {
        if (!entityList) {
            callback(null, "enter entityList");
            return;
        }
        let list = JSON.parse(entityList)
        list.forEach(function (entity) {
            Wallet.find({ where: { id: entity.id } }, function (err, model) {
                if (err)
                    callback(err)
                else {
                    model[0].updateAttributes(entity)
                }

            });
        });
        return callback(null, list);

    };

    /* /api/members/updateList?mobile=09196421264 */
    Wallet.remoteMethod("updateList", {
        accepts: [{
            arg: "entityList",
            type: "string"
        }],
        returns: {
            arg: "Wallet",
            type: "Wallet"
        },
        http: {
            path: "/updateList",
            verb: "get"
        }
    });


    Wallet.updateBalance = function (list, callback) {
        //walletList={memberId:1, walletName:'w1', amount:10}
        if (!list) {
            callback(null, "enter list");
            return;
        }
        let arrList = JSON.parse(list)
        let query = [];
        let i = 0;
        arrList.forEach(function (wallet) {
           
            Wallet.find({ where: { memberId: wallet.memberId } }, function (err, accounts) {

                if (err) {
                    callback(err);
                    return
                }

                if (!accounts[0]) {
                    callback("no exist wallet for memberId=" + wallet.memberId);
                    return
                }

                if (!accounts[0][wallet.walletName]) {
                    callback("no exist walletName=" + accounts[0][wallet.walletName]);
                    return
                }

                let newBance = accounts[0][wallet.walletName].balance + wallet.amount;
                let newValue = {};
                newValue.code = accounts[0][wallet.walletName].code;
                newValue.name = accounts[0][wallet.walletName].name
                newValue.balance = newBance
                accounts[0].updateAttribute(wallet.walletName, newValue, function (err, userWallet) {
                    query.push({ memberId: wallet.memberId });
                    if (query.length == arrList.length) {
                        //delete duplicate
                        query = query.filter((query, index, self) =>
                            index === self.findIndex((t) => (
                                t.memberId === query.memberId
                            ))
                        )
                        Wallet.find({ where: { or: query } }, callback);
                    }

                })
            });
        })

    };

    /* /api/members/updateBalance?mobile=09196421264 */
    Wallet.remoteMethod("updateBalance", {
        accepts: [{
            arg: "list",
            type: "string"
        }],
        returns: {
            arg: "list",
            type: "list"
        },
        http: {
            path: "/updateBalance",
            verb: "get"
        }
    });




};
