const mongoose = require('mongoose')
const check = require('../libs/checkLib')
const response = require('./../libs/responseLib')
const logger = require('./../libs/loggerLib');
const shortid = require('shortid')
const time = require('./timeLib');

/*Models*/
const UserModel = mongoose.model('User')
const NotificationModel = mongoose.model('Notification')

eventEmitter.on('save-send-notification', (data) => {
    let validateUserInput =()=>{
        return new Promise((resolve, reject) => {
            if (check.isEmpty(data.profileId)) {
                let apiResponse = response.generate(true, 'profileId parameter is missing', 400, null)
                reject(apiResponse)
            } else if (check.isEmpty(data.type)) {
                let apiResponse = response.generate(true, 'type parameter is missing', 400, null)
                reject(apiResponse)
            } else if (check.isEmpty(data.senderId)) {
                let apiResponse = response.generate(true, 'senderId parameter is missing', 400, null)
                reject(apiResponse)
            } else if (check.isEmpty(data.senderFullName)) {
                let apiResponse = response.generate(true, 'senderFullName parameter is missing', 400, null)
                reject(apiResponse)
            } else {
                //recipient name is required for these type of notifications
                if((data.type==='requested' || data.type==='accepted') && check.isEmpty(data.recipientId)){
                    let apiResponse = response.generate(true, 'recepientId parameter is missing', 400, null)
                    reject(apiResponse)
                    // for other notificatoin types recipientid will be taken from friend list
                }else if((data.type==='createList' || data.type==='editList' || data.type==='deleteList' || data.type==='undoList') && check.isEmpty(data.listName)){
                    let apiResponse = response.generate(true, 'listName parameter is missing', 400, null)
                    reject(apiResponse)
                } else if((data.type==='createItem' || data.type==='editItem' || data.type==='deleteItem' || data.type==='completeItem' || data.type==='openItem') && (check.isEmpty(data.listName) || check.isEmpty(data.itemName))){
                    let apiResponse = response.generate(true, 'listName or itemName parameter is missing', 400, null)
                    reject(apiResponse)
                }else {
                    resolve()
                }
            }
        })
    }
    let getFriendList = () => {
        return new Promise((resolve, reject) => {
            UserModel.findOne({userId : data.profileId},(err, result) => {
                if (err) {
                    console.log(err)
                    logger.error(err.message, 'notificationLib : getFriendList', 10)
                    let apiResponse = response.generate(true, 'Failed to find Friend List', 400, null)
                    reject(apiResponse)
                } else {
                    resolve(result.friends)
                }
            })
        })
    }

    let sendNotification = (friends) =>{
        if(data.type==='accepted' || data.type==='requested'){
            return new Promise((resolve, reject) => {
                if(data.type==='requested'){
                    data.description = `<b>${data.senderFullName}</b>&nbsp;sent you a friend request`
                } else if(data.type==='accepted'){
                    data.description = `<b>${data.senderFullName}</b>&nbsp;accepted your friend request`
                } else {
                    let apiResponse = response.generate(true, 'wrong notification type', 400, null)
                    reject(apiResponse)
                }
                let newRequest = new NotificationModel({
                    notiId : shortid.generate(),
                    profileId : data.profileId,
                    senderId : data.senderId,
                    recipientId : data.recipientId,
                    description : data.description,
                    type : data.type,
                    createdOn : time.now()
                })
                newRequest.save((err, newRequest) => {
                    if (err) {
                        console.log(err)
                        logger.error(err.message, 'notificationLib : sendNotification', 10)
                        let apiResponse = response.generate(true, 'Failed to create new notificaioin', 400, null)
                        reject(apiResponse)
                    } else {
                        resolve(newRequest)
                    }
                })
            })
        } else {
            return new Promise((resolve, reject) => {
                if(data.type==='createList'){
                    data.description = `<b>${data.senderFullName}</b>&nbsp;has created a list&nbsp;<b>${data.listName}</b>`
                } else if(data.type==='editList'){
                    data.description = `<b>${data.senderFullName}</b>&nbsp;has edited the list&nbsp;<b>${data.listName}</b>`
                } else if(data.type==='deleteList'){
                    data.description = `<b>${data.senderFullName}</b>&nbsp;has deleted the list&nbsp;<b>${data.listName}</b>`
                } else if(data.type==='undoList'){
                    data.description = `<b>${data.senderFullName}</b>&nbsp;has undone the list&nbsp;<b>${data.listName}</b>`
                } else if(data.type==='createItem'){
                    data.description = `<b>${data.senderFullName}</b>&nbsp;has created an item&nbsp;<b>${data.itemName}</b>&nbsp;in list&nbsp;<b>${data.listName}</b>`
                } else if(data.type==='editItem'){
                    data.description = `<b>${data.senderFullName}</b>&nbsp;has edited an item&nbsp;<b>${data.itemName}</b>&nbsp;in list&nbsp;<b>${data.listName}</b>`
                } else if(data.type==='deleteItem'){
                    data.description = `<b>${data.senderFullName}</b>&nbsp;has deleted an item&nbsp;<b>${data.itemName}</b>&nbsp;in list&nbsp;<b>${data.listName}</b>`
                } else if(data.type==='completeItem'){
                    data.description = `<b>${data.senderFullName}</b>&nbsp;has marked an item&nbsp;<b>${data.itemName}</b>&nbsp;completed in list&nbsp;<b>${data.listName}</b>`
                } else if(data.type==='openItem'){
                    data.description = `<b>${data.senderFullName}</b>&nbsp;has opened an item&nbsp;<b>${data.itemName}</b>&nbsp;in list&nbsp;<b>${data.listName}</b>`
                } else {
                    let apiResponse = response.generate(true, 'wrong notification type', 400, null)
                    reject(apiResponse)
                }
                for(let friend of friends){
                    let newRequest = new NotificationModel({
                        notiId : shortid.generate(),
                        profileId : data.profileId,
                        senderId : data.senderId,
                        description : data.description,
                        type : data.type,
                        createdOn : time.now()
                    })
                    //senderId is one of the friend who is editing, replacing that friend with the owner of list id and sending notification to all(the friend present in friend list should not see notification if he is editing the list)
                    if(friend.userId === data.senderId){
                        newRequest.recipientId = data.profileId
                        // else do the normal, send notificaions to friend list
                    } else {
                        newRequest.recipientId = friend.userId
                    }
                    newRequest.save((err, newRequest) => {
                        if (err) {
                            console.log(err)
                            logger.error(err.message, 'notificationLib : sendNotification', 10)
                            let apiResponse = response.generate(true, 'Failed to create new notification', 400, null)
                            reject(apiResponse)
                        } else {
                            // resolving this doesnt send notification to all
                            let apiResponse = response.generate(false, 'Notification successful', 200, newRequest)
                            /**
                             * @api {listen} userId Receiving Notification
                             * @apiVersion 0.0.1
                             * @apiGroup Listen 
                             *@apiDescription This event <b>("userId")</b> has to be listened when to get notifications. userId will be friend's userId.
                            */
                            io.emit(newRequest.recipientId, apiResponse)
                        }
                    })
                }
            })
        }
    }

    validateUserInput()
            .then(getFriendList)
            .then(sendNotification)
            .then((resolve) => {
                let apiResponse = response.generate(false, 'Notification successful', 200, resolve)
                io.emit(resolve.recipientId, apiResponse)
            })
            .catch((err) => {
                console.log(err)
            })
})