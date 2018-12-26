const mongoose = require('mongoose')
const check = require('../libs/checkLib')
const response = require('./../libs/responseLib')
const logger = require('./../libs/loggerLib');

/*Models*/
const FriendRequestModel = mongoose.model('FriendRequest')
const UserModel = mongoose.model('User')

// saving friend request as 'requested' in db
eventEmitter.on('save-add-friend-request', (data) => {

    let validateUserInput = () => {
        return new Promise((resolve, reject) => {
            if (check.isEmpty(data.senderId)) {
                let apiResponse = response.generate(true, 'senderId parameter is missing', 400, null)
                reject(apiResponse)
            } else if (check.isEmpty(data.recipientId)) {
                let apiResponse = response.generate(true, 'recepientId parameter is missing', 400, null)
                reject(apiResponse)
            } else {
                resolve()
            }
        })
    }

    let addFriendRequest = () => {
        return new Promise((resolve, reject) => {
            let findQuery = {
                $or: [
                    { $and: [{ senderId: data.senderId }, { recipientId: data.recipientId }] },
                    { $and: [{ senderId: data.recipientId }, { recipientId: data.senderId }] }]
            }
            FriendRequestModel.findOne(findQuery)
                .exec((err, result) => {
                    if (err) {
                        logger.error(err.message, 'friendLib : addFriendRequest', 5)
                        let apiResponse = response.generate(true, 'Failed to find Request', 400, null)
                        reject(apiResponse)
                    } else if (check.isEmpty(result)) {
                        let newRequest = new FriendRequestModel({
                            senderId: data.senderId,
                            recipientId: data.recipientId,
                            requestStatus: 'requested'
                        })
                        newRequest.save((err, newRequest) => {
                            if (err) {
                                console.log(err)
                                logger.error(err.message, 'friendLib : addFriendRequest', 10)
                                let apiResponse = response.generate(true, 'Failed to create new request', 400, null)
                                reject(apiResponse)
                            } else {
                                resolve(newRequest)
                            }
                        })
                    } else {
                        let apiResponse = response.generate(true, 'Request is already in database', 400, null)
                        reject(apiResponse)
                    }
                })
        })
    }

    validateUserInput()
        .then(addFriendRequest)
        .then((resolve) => {
            let apiResponse = response.generate(false, 'Friend Request sent', 200, resolve)
            console.log(apiResponse)
        })
        .catch((err) => {
            console.log(err)
        })
})

// saving friend request as 'accepted' in db
eventEmitter.on('save-accept-friend-request', (data) => {

    let validateUserInput = () => {
        return new Promise((resolve, reject) => {
            if (check.isEmpty(data.senderId)) {
                let apiResponse = response.generate(true, 'senderId parameter is missing', 400, null)
                reject(apiResponse)
            } else if (check.isEmpty(data.recipientId)) {
                let apiResponse = response.generate(true, 'recepientId parameter is missing', 400, null)
                reject(apiResponse)
            } else {
                resolve()
            }
        })
    }

    //finding sendername to save sender in recipient friends array
    let findSenderName = () => {
        return new Promise((resolve, reject) => {
            UserModel.findOne({ userId: data.senderId }, (err, userDetails) => {
                if (err) {
                    console.log(err)
                    logger.error('Failed to Retrieve User Data', 'friendLib : findSenderName', 5)
                    let apiResponse = response.generate(true, 'Failed to find the user', 400, null)
                    reject(apiResponse)
                } else if (check.isEmpty(userDetails)) {
                    logger.error('No User Found', 'friendLib : findSenderName', 5)
                    let apiResponse = response.generate(true, 'No User Details Found', 400, null)
                    reject(apiResponse)
                } else {
                    logger.info('User Found', 'friendLib : findSenderName', 5)
                    // and this
                    resolve(userDetails.fullName)
                }
            })
        })
    }

    //adding sender in recipient friend list
    let addFriendToRecipientList = (senderFullName) => {
        return new Promise((resolve, reject) => {
            UserModel.update({ userId: data.recipientId }, { $push: { friends: { userId: data.senderId, userName: senderFullName } } }, (err, result) => {
                if (err) {
                    console.log(err)
                    logger.error(err.message, 'friendLib : addFriendToRecipientList', 10)
                    let apiResponse = response.generate(true, 'Failed to update friendlist', 400, null)
                    reject(apiResponse)
                } else {
                    resolve()
                }
            })
        })
    }

    //finding recipientName to save recipient in sender friends array
    let findRecipientName = () => {
        return new Promise((resolve, reject) => {
            UserModel.findOne({ userId: data.recipientId }, (err, userDetails) => {
                if (err) {
                    console.log(err)
                    logger.error('Failed to Retrieve User Data', 'friendLib : findRecipientName', 5)
                    let apiResponse = response.generate(true, 'Failed to find the user', 400, null)
                    reject(apiResponse)
                } else if (check.isEmpty(userDetails)) {
                    logger.error('No User Found', 'friendLib : findRecipientName', 5)
                    let apiResponse = response.generate(true, 'No User Details Found', 400, null)
                    reject(apiResponse)
                } else {
                    logger.info('User Found', 'friendLib : findRecipientName', 5)
                    // and this
                    resolve(userDetails.fullName)
                }
            })
        })
    }

    //adding recipient in sender list
    let addFriendToSenderList = (recipientFullName) => {
        return new Promise((resolve, reject) => {
            UserModel.update({ userId: data.senderId }, { $push: { friends: { userId: data.recipientId, userName: recipientFullName } } }, (err, result) => {
                if (err) {
                    console.log(err)
                    logger.error(err.message, 'friendLib : addFriendToSenderList', 10)
                    let apiResponse = response.generate(true, 'Failed to update friendlist', 400, null)
                    reject(apiResponse)
                } else {
                    resolve()
                }
            })
        })
    }

    //setting status of friend reqeust to accepted
    let acceptFriendRequest = () => {
        return new Promise((resolve, reject) => {
            let findQuery = {
                $or: [
                    { $and: [{ senderId: data.senderId }, { recipientId: data.recipientId }] },
                    { $and: [{ senderId: data.recipientId }, { recipientId: data.senderId }] }]
            }
            FriendRequestModel.findOne(findQuery)
                .exec((err, result) => {
                    if (err) {
                        logger.error(err.message, 'friendLib : acceptFriendRequest', 5)
                        let apiResponse = response.generate(true, 'Failed to find Request', 400, null)
                        reject(apiResponse)
                    } else if (check.isEmpty(result)) {
                        let apiResponse = response.generate(true, 'No Such request is present in database', 400, null)
                        reject(apiResponse)
                    } else {
                        result.requestStatus = 'accepted'
                        result.save((err, result) => {
                            if (err) {
                                logger.error(err.message, 'friendLib : acceptFriendRequest', 5)
                                let apiResponse = response.generate(true, 'Failed to find Request', 400, null)
                                reject(apiResponse)
                            } else {
                                resolve(result)
                            }
                        })
                    }
                })
        })
    }
    validateUserInput()
        .then(findSenderName)
        .then(addFriendToRecipientList)
        .then(findRecipientName)
        .then(addFriendToSenderList)
        .then(acceptFriendRequest)
        .then((resolve) => {
            let apiResponse = response.generate(false, 'Friend Request accepted', 200, resolve)
            console.log(apiResponse)
        })
        .catch((err) => {
            console.log(err)
        })
})

// removing friend request status from friend request collection
eventEmitter.on('save-reject-friend-request', (data) => {

    let validateUserInput = () => {
        return new Promise((resolve, reject) => {
            if (check.isEmpty(data.senderId)) {
                let apiResponse = response.generate(true, 'senderId parameter is missing', 400, null)
                reject(apiResponse)
            } else if (check.isEmpty(data.recipientId)) {
                let apiResponse = response.generate(true, 'recepientId parameter is missing', 400, null)
                reject(apiResponse)
            } else {
                resolve()
            }
        })
    }

    let rejectFriendRequest = () => {
        return new Promise((resolve, reject) => {
            let findQuery = {
                $or: [
                    { $and: [{ senderId: data.senderId }, { recipientId: data.recipientId }] },
                    { $and: [{ senderId: data.recipientId }, { recipientId: data.senderId }] }]
            }
            FriendRequestModel.remove(findQuery)
                .exec((err, result) => {
                    if (err) {
                        logger.error(err.message, 'friendLib : rejectFriendRequest', 5)
                        let apiResponse = response.generate(true, 'Failed to find Request', 400, null)
                        reject(apiResponse)
                    } else {
                        resolve(result)
                    }
                })
        })
    }
    validateUserInput()
        .then(rejectFriendRequest)
        .then((resolve) => {
            let apiResponse = response.generate(false, 'Friend Request rejected', 200, resolve)
            console.log(apiResponse)
        })
        .catch((err) => {
            console.log(err)
        })
})

// to unfriend the existing friend
eventEmitter.on('save-unfriend', (data) => {

    let validateUserInput = () => {
        return new Promise((resolve, reject) => {
            if (check.isEmpty(data.senderId)) {
                let apiResponse = response.generate(true, 'senderId parameter is missing', 400, null)
                reject(apiResponse)
            } else if (check.isEmpty(data.recipientId)) {
                let apiResponse = response.generate(true, 'recepientId parameter is missing', 400, null)
                reject(apiResponse)
            } else {
                resolve()
            }
        })
    }

    let removeFriendFromRecipientList = () => {
        return new Promise((resolve, reject) => {
            UserModel.update({ userId: data.recipientId }, { $pull: { friends: { userId: data.senderId } } }, (err, result) => {
                if (err) {
                    console.log(err)
                    logger.error(err.message, 'friendLib : removeFriendFromRecipientList', 10)
                    let apiResponse = response.generate(true, 'Failed to update friendlist', 400, null)
                    reject(apiResponse)
                } else {
                    console.log(result)
                    resolve()
                }
            })
        })
    }

    let removeFriendFromSenderList = () => {
        return new Promise((resolve, reject) => {
            UserModel.update({ userId: data.senderId }, { $pull: { friends: { userId: data.recipientId } } }, (err, result) => {
                if (err) {
                    console.log(err)
                    logger.error(err.message, 'friendLib : removeFriendFromSenderList', 10)
                    let apiResponse = response.generate(true, 'Failed to update friendlist', 400, null)
                    reject(apiResponse)
                } else {
                    resolve()
                }
            })
        })
    }

    let deleteFriendRequest = () => {
        return new Promise((resolve, reject) => {
            let findQuery = {
                $or: [
                    { $and: [{ senderId: data.senderId }, { recipientId: data.recipientId }] },
                    { $and: [{ senderId: data.recipientId }, { recipientId: data.senderId }] }]
            }
            FriendRequestModel.remove(findQuery)
                .exec((err, result) => {
                    if (err) {
                        logger.error(err.message, 'friendLib : deleteFriendRequest', 5)
                        let apiResponse = response.generate(true, 'Failed to find Request', 400, null)
                        reject(apiResponse)
                    } else if (check.isEmpty(result)) {
                        let apiResponse = response.generate(true, 'No Such request is present in database', 400, null)
                        reject(apiResponse)
                    } else {
                        resolve(result)
                    }
                })
        })
    }
    validateUserInput()
        .then(removeFriendFromRecipientList)
        .then(removeFriendFromSenderList)
        .then(deleteFriendRequest)
        .then((resolve) => {
            let apiResponse = response.generate(false, 'Unfriended', 200, resolve)
            console.log(apiResponse)
        })
        .catch((err) => {
            console.log(err)
        })
})