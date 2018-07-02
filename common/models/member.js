'use strict';

module.exports = function (Member) {
    Member.beforeCreate = function (next, modelInstance) {
        return Member.find({ where: { mobile: modelInstance.mobile } }, function (err, members) {
            if (members.length > 0) {
                // let minuser = {};
                // minuser.id2 = members[0].id;
                // minuser.verifyState = members[0].verifyState;
                // minuser.index = members[0].index;
                // minuser.firstName = members[0].firstName
                //return next(minuser);
                //return Promise.resolve(next());
                next();
            } else {
                Member.find({ order: 'index DESC', limit: 1 }, function (err, memberList) {
                    modelInstance.index = memberList[0]?memberList[0].index + 1:0;
                    let tempPassword = Math.floor((Math.random() * 1000000) + 1).toString();
                    let invitationCode = Math.floor((Math.random() * 1000) + 1).toString() + modelInstance.index.toString();
                    modelInstance.tempPassword = tempPassword;
                    modelInstance.password = tempPassword;
                    modelInstance.invitationCode = invitationCode;
                    modelInstance.verifyState = 1;
                    modelInstance.profileImage = "profileNoImage.jpg";
                    modelInstance.username = modelInstance.mobile;
                    modelInstance.cdate = new Date().toJSON();
                    modelInstance.udate = new Date().toJSON();
                    next();
                });

            }

        });
    };
    Member.beforeRemote('login', function (context, user, next) {
        user.loginDate = new Date().toJSON();
        user.verifyState=4;
        Member.update(user)
        next();
    });

    // Member.observe('before save', function beforeSave(ctx, next) {
    //     Member.find({ where: { mobile: ctx.instance.mobile } }, function (err, members) {
    //         if (members.length > 0) {
    //             ctx.instance.id2 = members[0].id;
    //             ctx.instance.verifyState = members[0].verifyState;
    //             ctx.instance.index = members[0].index;
    //             next();
    //             return Promise.resolve();
    //             //return Promise.resolve(next());

    //         } else {
    //             Member.find({ order: 'index DESC', limit: 1 }, function (err, memberList) {
    //                 ctx.instance.index = memberList[0].index + 1;
    //                 let tempPassword = Math.floor((Math.random() * 1000000) + 1).toString();
    //                 let invitationCode = Math.floor((Math.random() * 1000) + 1).toString() + ctx.instance.index.toString();
    //                 ctx.instance.tempPassword = tempPassword;
    //                 ctx.instance.password = tempPassword;
    //                 ctx.instance.invitationCode = invitationCode;
    //                 ctx.instance.verifyState = 1;
    //                 ctx.instance.profileImage = "profileNoImage.jpg";
    //                 next();
    //             });

    //         }



    //     });
    // });
    Member.registerMember = function (mobile,registerLocationlat,registerLocationlng,registerAddress, callback) {
        if (!mobile) {
            callback(null, "enter mobile");
            return;
        }

        Member.find({ where: { mobile: mobile } }, function (err, memberList) {
            if (err)
                callback(err)
            else if (memberList.length == 0) {
                let location={lat:registerLocationlat,lng:registerLocationlng}
                return Member.create({mobile:mobile,registerLocation:location,registerAddress:registerAddress}) // I return a promise
                    .then(function (data) {
                        callback(err, data); // I return the data array...
                    })
                    .then(function (created2) {
                        console.log(created2); // Outputs the original data only, no ids
                    })
                    .catch((err) => {
                        return err;
                    })
            }
            else
                callback(err, { id: memberList[0].id, index: memberList[0].index,mobile: memberList[0].mobile, verifyState: memberList[0].verifyState })
        });
    };

    /* /api/members/registerMember?mobile=09196421264 */
    Member.remoteMethod("registerMember", {
        accepts: [{
            arg: "mobile",
            type: "string"
        },
        {
            arg: "registerLocationlat",
            type: "string"
        },
        {
            arg: "registerLocationlng",
            type: "string"
        },
        {
            arg: "registerAddress",
            type: "string"
        }],
        returns: {
            arg: "member",
            type: "string"
        },
        http: {
            path: "/registerMember",
            verb: "get"
        }
    });
    Member.isBamizMember = function (mobile, callback) {
        if (!mobile) {
            callback(null, "enter mobile");
            return;
        }
        Member.find({ where: { and: [{ mobile: mobile }, { verifyState: { neq: "1" } }] } }, function (err, memberList) {

            if (err) {
                callback(err)
            } else {
                callback(err, memberList.length)
            }
        });
    };

    /* /api/members/isBamizMember?mobile=09196421264 */
    Member.remoteMethod("isBamizMember", {
        accepts: {
            arg: "mobile",
            type: "string"
        },
        returns: {
            arg: "isBamizMember",
            type: "number"
        },
        http: {
            path: "/isBamizMember",
            verb: "get"
        }
    });
    Member.getReagent = function (invitationCode, callback) {
        if (!invitationCode) {
            callback(null, "enter invitationCode");
            return;
        }
        Member.find({ where: { and: [{ invitationCode: invitationCode }, { verifyState: { neq: "1" } }] } }, function (err, memberList) {
            if (err)
                callback(err)
            else if (memberList.length == 0)
                callback(err, null)
            else
                callback(err, { id: memberList[0].id, name: memberList[0].firstName + " " + memberList[0].lastName, city: memberList[0].location })
        });
    };

    /* /api/members/getReagent?mobile=09196421264 */
    Member.remoteMethod("getReagent", {
        accepts: {
            arg: "invitationCode",
            type: "string"
        },
        returns: {
            arg: "member",
            type: "member"
        },
        http: {
            path: "/getReagent",
            verb: "get"
        }
    });

    Member.loginMember = function (username, password, callback) {
        if (!username) {
            callback(null, "enter username");
            return;
        }
        Member.login({ username: username, password: password }, function (err, res) {
            console.log(res)
            if (err)
                callback(err)
            else if (res.id) {
                return Member.findById(res.userId, {include: ['wallets','shops', 'messages']},function (err2, member) {
                    if (err2)
                        callback(err2)
                    else{
                        member.token=res.id
                         callback(err, member);
                    }
                       
                });
            }

        });
    };

    /* /api/members/registerMember?mobile=09196421264 */
    Member.remoteMethod("loginMember", {
        accepts: [{
            arg: "username",
            type: "string"
        }, {
            arg: "password",
            type: "string"
        }],
        returns: {
            arg: "member",
            type: "user"
        },
        http: {
            path: "/loginMember",
            verb: "get"
        }
    });




};
