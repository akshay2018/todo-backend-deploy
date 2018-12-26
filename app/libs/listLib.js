const mongoose = require('mongoose')
const check = require('../libs/checkLib')
const response = require('./../libs/responseLib')
const logger = require('./../libs/loggerLib');
const shortid = require('shortid')
const time = require('./timeLib');

/*Models*/
const ListModel = mongoose.model('List')
const ListStateModel = mongoose.model('ListState')

//saving created list in list model
eventEmitter.on('save-create-list', (data) => {
    let validateUserInput = () => {
        return new Promise((resolve, reject) => {
            if (check.isEmpty(data.listName)) {
                let apiResponse = response.generate(true, 'listName parameter is missing', 400, null)
                reject(apiResponse)
            } else if (check.isEmpty(data.creatorId)) {
                let apiResponse = response.generate(true, 'creatorId parameter is missing', 400, null)
                reject(apiResponse)
            } else if (check.isEmpty(data.private)) {
                let apiResponse = response.generate(true, 'private parameter is missing', 400, null)
                reject(apiResponse)
            } else {
                resolve()
            }
        })
    }

    let saveUserListState = () => {
        return new Promise((resolve, reject) => {
            let newListState = new ListStateModel({
                listId : shortid.generate(),
                present : 0,
                creatorId : data.creatorId
            })
            newListState.save((err, newList) => {
                if (err) {
                    console.log(err)
                    logger.error(err.message, 'listLib : saveUserListState', 10)
                    let apiResponse = response.generate(true, 'Failed to create new list', 400, null)
                    reject(apiResponse)
                } else {
                    data.listId = newList.listId
                    resolve()
                }
            })
        })
    }

    let saveUserList = () => {
        return new Promise((resolve, reject) => {
            let newList = new ListModel({
                listId : data.listId,
                listName : data.listName,
                creatorId : data.creatorId,
                state : 0,
                createdOn : time.now(),
                private : data.private
            })
            newList.save((err, newList) => {
                if (err) {
                    console.log(err)
                    logger.error(err.message, 'listLib : saveUserList', 10)
                    let apiResponse = response.generate(true, 'Failed to create new list', 400, null)
                    reject(apiResponse)
                } else {
                    resolve(newList)
                }
            })
        })
    }
    validateUserInput()
        .then(saveUserListState)
        .then(saveUserList)
        .then((resolve) => {
            let apiResponse = response.generate(false, 'List creation successful', 200, resolve)
            /**
                     * @api {listen} create-list-real-time Create List Real Time
                     * @apiVersion 0.0.1
                     * @apiGroup Listen 
                     *@apiDescription This event <b>("create-list-real-time")</b> has to be listened when list is created and display it in real time. It will be broadcasted in creator's room only.
                    */
            io.sockets.in(data.creatorId).emit('create-list-real-time',apiResponse)
        })
        .catch((err) => {
            console.log(err)
        })
})

//saving edited name of list
eventEmitter.on('save-edit-list', (data) => {
    let validateUserInput = () => {
        return new Promise((resolve, reject) => {
            if (check.isEmpty(data.listId)) {
                let apiResponse = response.generate(true, 'listId parameter is missing', 400, null)
                reject(apiResponse)
            } else if (check.isEmpty(data.listName)) {
                let apiResponse = response.generate(true, 'listName parameter is missing', 400, null)
                reject(apiResponse)
            }else if (check.isEmpty(data.private)) {
                let apiResponse = response.generate(true, 'private parameter is missing', 400, null)
                reject(apiResponse)
            } else {
                resolve()
            }
        })
    }

    let updateUserListState = () => {
        return new Promise((resolve, reject) => {
            ListStateModel.findOne({listId : data.listId})
            .exec((err, result) => {
                if (err) {
                    console.log(err)
                    logger.error(err.message, 'listLib : updateUserListState', 10)
                    let apiResponse = response.generate(true, 'Failed to find the list', 400, null)
                    reject(apiResponse)
                } else if(check.isEmpty(result)){
                    let apiResponse = response.generate(true, 'No List state found', 400, null)
                    reject(apiResponse)
                } else {
                    result.present++;
                    result.save((err,saveList)=>{
                        if (err) {
                            console.log(err)
                            logger.error(err.message, 'listLib : updateUserListState', 10)
                            let apiResponse = response.generate(true, 'Failed to update the list', 400, null)
                            reject(apiResponse)
                        } else {
                            resolve(saveList.present)
                        }
                    })
                }
            })
        })
    }

    let findPreviousStateList = (previousState) =>{
        return new Promise((resolve, reject) => {
            let findQuery = {$and:[{listId : data.listId},{state : previousState-1}]}
            ListModel.findOne(findQuery)
            .select('-id -__v')
            .lean()
            .exec((err, result) => {
                if (err) {
                    console.log(err)
                    logger.error(err.message, 'listLib : findPreviousStateList', 10)
                    let apiResponse = response.generate(true, 'Failed to find the list', 400, null)
                    reject(apiResponse)
                } else if(check.isEmpty(result)){
                    let apiResponse = response.generate(true, 'No List found', 400, null)
                    reject(apiResponse)
                } else {
                    resolve(result)
                }
            })
        })
    }

    let newUserListWithStateInc = (saveList) => {
        return new Promise((resolve, reject) => {
            let newList = new ListModel({
                listId : saveList.listId,
                listName : saveList.listName,
                creatorId : saveList.creatorId,
                state : saveList.state+1,
                createdOn : saveList.createdOn,
                private : saveList.private,
                item : saveList.item
            })
            newList.save((err, newList) => {
                if (err) {
                    console.log(err)
                    logger.error(err.message, 'listLib : newUserListWithStateInc', 10)
                    let apiResponse = response.generate(true, 'Failed to create new list', 400, null)
                    reject(apiResponse)
                } else {
                    resolve(newList)
                }
            })
        })
    }

    let updateListName = (newList) =>{
        return new Promise((resolve, reject) => {
            let findQuery = {$and:[{listId : newList.listId},{state : newList.state}]}
            let updateQuery = {listName : data.listName,private : data.private}
            ListModel.findOneAndUpdate(findQuery,updateQuery,{new:true},(err, newList) => {
                if (err) {
                    console.log(err)
                    logger.error(err.message, 'listLib : updateListName', 10)
                    let apiResponse = response.generate(true, 'Failed to update list name', 400, null)
                    reject(apiResponse)
                } else {
                    resolve(newList)
                }
            })
        })
    }
    validateUserInput()
        .then(updateUserListState)
        .then(findPreviousStateList)
        .then(newUserListWithStateInc)
        .then(updateListName)
        .then((resolve) => {
            let apiResponse = response.generate(false, 'List updation successful', 200, resolve)
            io.sockets.in(resolve.creatorId).emit('update-list-real-time',apiResponse)
        })
        .catch((err) => {
            console.log(err)
        })
})

//deleting list
eventEmitter.on('save-delete-list', (data) => {
    let validateUserInput = () => {
        return new Promise((resolve, reject) => {
            if (check.isEmpty(data.listId)) {
                let apiResponse = response.generate(true, 'listId parameter is missing', 400, null)
                reject(apiResponse)
            }else if (check.isEmpty(data.creatorId)) {
                let apiResponse = response.generate(true, 'creatorId parameter is missing', 400, null)
                reject(apiResponse)
            } else {
                resolve()
            }
        })
    }

    let deleteListState = () => {
        return new Promise((resolve, reject) => {
            ListStateModel.remove({listId : data.listId})
            .exec((err, result) => {
                if (err) {
                    console.log(err)
                    logger.error(err.message, 'listLib : deleteListState', 10)
                    let apiResponse = response.generate(true, 'Failed to delete the list', 400, null)
                    reject(apiResponse)
                } else if(check.isEmpty(result)){
                    let apiResponse = response.generate(true, 'No List state found', 400, null)
                    reject(apiResponse)
                } else {
                    resolve()
                }
            })
        })
    }

    let deleteList = () =>{
        return new Promise((resolve, reject) => {
            ListModel.deleteMany({listId : data.listId})
            .exec((err, result) => {
                if (err) {
                    console.log(err)
                    logger.error(err.message, 'listLib : deleteList', 10)
                    let apiResponse = response.generate(true, 'Failed to delete the list', 400, null)
                    reject(apiResponse)
                } else if(check.isEmpty(result)){
                    let apiResponse = response.generate(true, 'No List found', 400, null)
                    reject(apiResponse)
                } else {
                    resolve()
                }
            })
        })
    }
    validateUserInput()
        .then(deleteListState)
        .then(deleteList)
        .then(() => {
            let apiResponse = response.generate(false, 'List deletion successful', 200, {listId : data.listId})
            /**
                     * @api {listen} delete-list-real-time Delete List Real Time
                     * @apiVersion 0.0.1
                     * @apiGroup Listen 
                     *@apiDescription This event <b>("delete-list-real-time")</b> has to be listened when list is deleted and display it in real time. It will be broadcasted in creator's room only.
                    */
            io.sockets.in(data.creatorId).emit('delete-list-real-time',apiResponse)
        })
        .catch((err) => {
            console.log(err)
        })
})

//saving list undo
eventEmitter.on('save-undo-list', (data) => {
    let validateUserInput = () => {
        return new Promise((resolve, reject) => {
            if (check.isEmpty(data.listId)) {
                let apiResponse = response.generate(true, 'listId parameter is missing', 400, null)
                reject(apiResponse)
            } else {
                resolve()
            }
        })
    }

    let updateUserListState = () => {
        return new Promise((resolve, reject) => {
            ListStateModel.findOne({listId : data.listId})
            .exec((err, result) => {
                if (err) {
                    console.log(err)
                    logger.error(err.message, 'listLib : updateUserListState', 10)
                    let apiResponse = response.generate(true, 'Failed to find the list', 400, null)
                    reject(apiResponse)
                } else if(check.isEmpty(result)){
                    let apiResponse = response.generate(true, 'No List found', 400, null)
                    reject(apiResponse)
                } else if(result.present===0){
                    let apiResponse = response.generate(true, 'Nothing left to undo', 400, null)
                    reject(apiResponse)
                } else {
                    result.present--;
                    data.present = result.present
                    result.save((err,saveList)=>{
                        if (err) {
                            console.log(err)
                            logger.error(err.message, 'listLib : updateUserListState', 10)
                            let apiResponse = response.generate(true, 'Failed to update the list', 400, null)
                            reject(apiResponse)
                        } else {
                            resolve()
                        }
                    })
                }
            })
        })
    }

    let removeCurrentList = () =>{
        return new Promise((resolve, reject) => {
            let findQuery = {$and:[{listId : data.listId},{state : data.present+1}]}
            ListModel.remove(findQuery)
            .exec((err, result) => {
                if (err) {
                    console.log(err)
                    logger.error(err.message, 'listLib : removeCurrentList', 10)
                    let apiResponse = response.generate(true, 'Failed to find the list', 400, null)
                    reject(apiResponse)
                } else if(check.isEmpty(result)){
                    let apiResponse = response.generate(true, 'No List found', 400, null)
                    reject(apiResponse)
                } else {
                    resolve()
                }
            })
        })
    }

    let findPreviousStateList = () =>{
        return new Promise((resolve, reject) => {
            let findQuery = {$and:[{listId : data.listId},{state : data.present}]}
            ListModel.findOne(findQuery)
            .select('-id -__v')
            .lean()
            .exec((err, result) => {
                if (err) {
                    console.log(err)
                    logger.error(err.message, 'listLib : findPreviousStateList', 10)
                    let apiResponse = response.generate(true, 'Failed to find the list', 400, null)
                    reject(apiResponse)
                } else if(check.isEmpty(result)){
                    let apiResponse = response.generate(true, 'No List found', 400, null)
                    reject(apiResponse)
                } else {
                    resolve(result)
                }
            })
        })
    }
    validateUserInput()
        .then(updateUserListState)
        .then(removeCurrentList)
        .then(findPreviousStateList)
        .then((resolve) => {
            let apiResponse = response.generate(false, 'List undo successful', 200, resolve)
            /**
                     * @api {listen} update-list-real-time Update List Real Time
                     * @apiVersion 0.0.1
                     * @apiGroup Listen 
                     *@apiDescription This event <b>("update-list-real-time")</b> has to be listened when list is updated and display it in real time. It will be broadcasted in creator's room only.
                    */
            io.sockets.in(resolve.creatorId).emit('update-list-real-time',apiResponse)
        })
        .catch((err) => {
            console.log(err)
        })
    })