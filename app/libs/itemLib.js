const mongoose = require('mongoose')
const check = require('../libs/checkLib')
const response = require('./../libs/responseLib')
const logger = require('./../libs/loggerLib');
const shortid = require('shortid')

/*Models*/
const ListModel = mongoose.model('List')
const ListStateModel = mongoose.model('ListState')

//pushing item in existing list 
eventEmitter.on('save-create-item', (data) => {
    let validateUserInput = () => {
        return new Promise((resolve, reject) => {
            if (check.isEmpty(data.itemName)) {
                let apiResponse = response.generate(true, 'itemName parameter is missing', 400, null)
                reject(apiResponse)
            } else if (check.isEmpty(data.itemParentId)) {
                let apiResponse = response.generate(true, 'itemParentId parameter is missing', 400, null)
                reject(apiResponse)
            } else if (check.isEmpty(data.listId)) {
                let apiResponse = response.generate(true, 'listId parameter is missing', 400, null)
                reject(apiResponse)
            } else if (check.isEmpty(data.creatorId)) {
                let apiResponse = response.generate(true, 'creatorId parameter is missing', 400, null)
                reject(apiResponse)
            } else {
                resolve()
            }
        })
    }

    //increasing user list state by 1 in liststate model
    let updateUserListState = () => {
        return new Promise((resolve, reject) => {
            ListStateModel.findOne({ listId: data.listId })
                .exec((err, result) => {
                    if (err) {
                        console.log(err)
                        logger.error(err.message, 'itemLib : updateUserListState', 10)
                        let apiResponse = response.generate(true, 'Failed to find the list state', 400, null)
                        reject(apiResponse)
                    } else if (check.isEmpty(result)) {
                        let apiResponse = response.generate(true, 'No List state found', 400, null)
                        reject(apiResponse)
                    } else {
                        result.present++;
                        result.save((err, saveList) => {
                            if (err) {
                                console.log(err)
                                logger.error(err.message, 'itemLib : updateUserListState', 10)
                                let apiResponse = response.generate(true, 'Failed to update the list state', 400, null)
                                reject(apiResponse)
                            } else {
                                resolve(saveList.present)
                            }
                        })
                    }
                })
        })
    }

    //finding previous list state to copy the list and save new list with state incremented
    let findPreviousStateList = (previousState) => {
        return new Promise((resolve, reject) => {
            let findQuery = { $and: [{ listId: data.listId }, { state: previousState - 1 }] }
            ListModel.findOne(findQuery)
                .select('-id -__v')
                .lean()
                .exec((err, result) => {
                    if (err) {
                        console.log(err)
                        logger.error(err.message, 'itemLib : findPreviousStateList', 10)
                        let apiResponse = response.generate(true, 'Failed to find the list', 400, null)
                        reject(apiResponse)
                    } else if (check.isEmpty(result)) {
                        let apiResponse = response.generate(true, 'No List found', 400, null)
                        reject(apiResponse)
                    } else {
                        resolve(result)
                    }
                })
        })
    }

    //new list with state incremented
    let newUserListWithStateInc = (saveList) => {
        return new Promise((resolve, reject) => {
            let newList = new ListModel({
                listId: saveList.listId,
                listName: saveList.listName,
                creatorId: saveList.creatorId,
                state: saveList.state + 1,
                createdOn: saveList.createdOn,
                private: saveList.private,
                item: saveList.item
            })
            newList.save((err, newList) => {
                if (err) {
                    console.log(err)
                    logger.error(err.message, 'itemLib : newUserListWithStateInc', 10)
                    let apiResponse = response.generate(true, 'Failed to create new list', 400, null)
                    reject(apiResponse)
                } else {
                    resolve(newList)
                }
            })
        })
    }

    //$push item in array
    let addItemToList = (newList) => {
        return new Promise((resolve, reject) => {
            let findQuery = { $and: [{ listId: newList.listId }, { state: newList.state }] }
            let updateQuery = {
                $push: {
                    item: {
                        itemId: shortid.generate(),
                        itemName: data.itemName,
                        itemParentId: data.itemParentId,
                        creatorId: data.creatorId,
                        done: false
                    }
                }
            }
            ListModel.findOneAndUpdate(findQuery, updateQuery, { new: true }, (err, newList) => {
                if (err) {
                    console.log(err)
                    logger.error(err.message, 'itemLib : addItemToList', 10)
                    let apiResponse = response.generate(true, 'Failed to additem', 400, null)
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
        .then(addItemToList)
        .then((resolve) => {
            let apiResponse = response.generate(false, 'Item successfully created', 200, resolve)
            io.sockets.in(data.creatorId).emit('update-list-real-time', apiResponse)
        })
        .catch((err) => {
            console.log(err)
        })
})

// save edited item in array
eventEmitter.on('save-edit-item', (data) => {
    let validateUserInput = () => {
        return new Promise((resolve, reject) => {
            if (check.isEmpty(data.itemId)) {
                let apiResponse = response.generate(true, 'itemId parameter is missing', 400, null)
                reject(apiResponse)
            } else if (check.isEmpty(data.itemName)) {
                let apiResponse = response.generate(true, 'itemName parameter is missing', 400, null)
                reject(apiResponse)
            } else if (check.isEmpty(data.listId)) {
                let apiResponse = response.generate(true, 'listId parameter is missing', 400, null)
                reject(apiResponse)
            } else {
                resolve()
            }
        })
    }

    let updateUserListState = () => {
        return new Promise((resolve, reject) => {
            ListStateModel.findOne({ listId: data.listId })
                .exec((err, result) => {
                    if (err) {
                        console.log(err)
                        logger.error(err.message, 'itemLib : updateUserListState', 10)
                        let apiResponse = response.generate(true, 'Failed to find the list', 400, null)
                        reject(apiResponse)
                    } else if (check.isEmpty(result)) {
                        let apiResponse = response.generate(true, 'No list state found', 400, null)
                        reject(apiResponse)
                    } else {
                        result.present++;
                        result.save((err, saveList) => {
                            if (err) {
                                console.log(err)
                                logger.error(err.message, 'itemLib : updateUserListState', 10)
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

    let findPreviousStateList = (previousState) => {
        return new Promise((resolve, reject) => {
            let findQuery = { $and: [{ listId: data.listId }, { state: previousState - 1 }] }
            ListModel.findOne(findQuery)
                .select('-id -__v')
                .lean()
                .exec((err, result) => {
                    if (err) {
                        console.log(err)
                        logger.error(err.message, 'itemLib : findPreviousStateList', 10)
                        let apiResponse = response.generate(true, 'Failed to find the list', 400, null)
                        reject(apiResponse)
                    } else if (check.isEmpty(result)) {
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
                listId: saveList.listId,
                listName: saveList.listName,
                creatorId: saveList.creatorId,
                state: saveList.state + 1,
                createdOn: saveList.createdOn,
                private: saveList.private,
                item: saveList.item
            })
            newList.save((err, newList) => {
                if (err) {
                    console.log(err)
                    logger.error(err.message, 'itemLib : newUserListWithStateInc', 10)
                    let apiResponse = response.generate(true, 'Failed to create new list', 400, null)
                    reject(apiResponse)
                } else {
                    resolve(newList)
                }
            })
        })
    }

    let updateItemToList = (newList) => {
        return new Promise((resolve, reject) => {
            let findQuery = { $and: [{ listId: newList.listId }, { state: newList.state }, { "item.itemId": data.itemId }] }
            let updateQuery = { $set: { 'item.$.itemName': data.itemName } }
            ListModel.findOneAndUpdate(findQuery, updateQuery, { new: true }, (err, newList) => {
                if (err) {
                    console.log(err)
                    logger.error(err.message, 'itemLib : updateItemToList', 10)
                    let apiResponse = response.generate(true, 'Failed to updateItem', 400, null)
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
        .then(updateItemToList)
        .then((resolve) => {
            let apiResponse = response.generate(false, 'Item successfully updated', 200, resolve)
            io.sockets.in(resolve.creatorId).emit('update-list-real-time', apiResponse)
        })
        .catch((err) => {
            console.log(err)
        })
})

//deleting item in list array
eventEmitter.on('save-delete-item', (data) => {
    let validateUserInput = () => {
        return new Promise((resolve, reject) => {
            if (check.isEmpty(data.itemId)) {
                let apiResponse = response.generate(true, 'itemId parameter is missing', 400, null)
                reject(apiResponse)
            } else if (check.isEmpty(data.listId)) {
                let apiResponse = response.generate(true, 'listId parameter is missing', 400, null)
                reject(apiResponse)
            } else {
                resolve()
            }
        })
    }

    let updateUserListState = () => {
        return new Promise((resolve, reject) => {
            ListStateModel.findOne({ listId: data.listId })
                .exec((err, result) => {
                    if (err) {
                        console.log(err)
                        logger.error(err.message, 'itemLib : updateUserListState', 10)
                        let apiResponse = response.generate(true, 'Failed to find the list', 400, null)
                        reject(apiResponse)
                    } else if (check.isEmpty(result)) {
                        let apiResponse = response.generate(true, 'No List state found', 400, null)
                        reject(apiResponse)
                    } else {
                        result.present++;
                        result.save((err, saveList) => {
                            if (err) {
                                console.log(err)
                                logger.error(err.message, 'itemLib : updateUserListState', 10)
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

    let findPreviousStateList = (previousState) => {
        return new Promise((resolve, reject) => {
            let findQuery = { $and: [{ listId: data.listId }, { state: previousState - 1 }] }
            ListModel.findOne(findQuery)
                .select('-id -__v')
                .lean()
                .exec((err, result) => {
                    if (err) {
                        console.log(err)
                        logger.error(err.message, 'itemLib : findPreviousStateList', 10)
                        let apiResponse = response.generate(true, 'Failed to find the list', 400, null)
                        reject(apiResponse)
                    } else if (check.isEmpty(result)) {
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
                listId: saveList.listId,
                listName: saveList.listName,
                creatorId: saveList.creatorId,
                state: saveList.state + 1,
                createdOn: saveList.createdOn,
                private: saveList.private,
                item: saveList.item
            })
            newList.save((err, newList) => {
                if (err) {
                    console.log(err)
                    logger.error(err.message, 'itemLib : newUserListWithStateInc', 10)
                    let apiResponse = response.generate(true, 'Failed to create new list', 400, null)
                    reject(apiResponse)
                } else {
                    resolve(newList)
                }
            })
        })
    }

    //deleting item
    let deleteItem = (newList) => {
        return new Promise((resolve, reject) => {
            let findQuery = { $and: [{ listId: newList.listId }, { state: newList.state }] }
            let updateQuery = { $pull: { item: { itemId: data.itemId } } }
            ListModel.findOneAndUpdate(findQuery, updateQuery, { new: true }, (err, newList) => {
                if (err) {
                    console.log(err)
                    logger.error(err.message, 'itemLib : deleteItem', 10)
                    let apiResponse = response.generate(true, 'Failed to deleteItem', 400, null)
                    reject(apiResponse)
                } else {
                    resolve(newList)
                }
            })
        })
    }

    // deleting subitems also if there are any
    let deleteChildren = (newList) => {
        return new Promise((resolve, reject) => {
            let findQuery = { $and: [{ listId: newList.listId }, { state: newList.state }] }
            let updateQuery = { $pull: { item: { itemParentId: data.itemId } } }
            ListModel.findOneAndUpdate(findQuery, updateQuery, { new: true }, (err, newList) => {
                if (err) {
                    console.log(err)
                    logger.error(err.message, 'itemLib : deleteChildren', 10)
                    let apiResponse = response.generate(true, 'Failed to deleteItem', 400, null)
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
        .then(deleteItem)
        .then(deleteChildren)
        .then((resolve) => {
            let apiResponse = response.generate(false, 'Item successfully deleted', 200, resolve)
            io.sockets.in(resolve.creatorId).emit('update-list-real-time', apiResponse)
        })
        .catch((err) => {
            console.log(err)
        })
})

// marking item as completed
eventEmitter.on('save-complete-item', (data) => {
    let validateUserInput = () => {
        return new Promise((resolve, reject) => {
            if (check.isEmpty(data.itemId)) {
                let apiResponse = response.generate(true, 'itemId parameter is missing', 400, null)
                reject(apiResponse)
            } else if (check.isEmpty(data.listId)) {
                let apiResponse = response.generate(true, 'listId parameter is missing', 400, null)
                reject(apiResponse)
            } else {
                resolve()
            }
        })
    }

    let updateUserListState = () => {
        return new Promise((resolve, reject) => {
            ListStateModel.findOne({ listId: data.listId })
                .exec((err, result) => {
                    if (err) {
                        console.log(err)
                        logger.error(err.message, 'itemLib : updateUserListState', 10)
                        let apiResponse = response.generate(true, 'Failed to find the list', 400, null)
                        reject(apiResponse)
                    } else if (check.isEmpty(result)) {
                        let apiResponse = response.generate(true, 'No List state found', 400, null)
                        reject(apiResponse)
                    } else {
                        result.present++;
                        result.save((err, saveList) => {
                            if (err) {
                                console.log(err)
                                logger.error(err.message, 'itemLib : updateUserListState', 10)
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

    let findPreviousStateList = (previousState) => {
        return new Promise((resolve, reject) => {
            let findQuery = { $and: [{ listId: data.listId }, { state: previousState - 1 }] }
            ListModel.findOne(findQuery)
                .select('-id -__v')
                .lean()
                .exec((err, result) => {
                    if (err) {
                        console.log(err)
                        logger.error(err.message, 'itemLib : findPreviousStateList', 10)
                        let apiResponse = response.generate(true, 'Failed to find the list', 400, null)
                        reject(apiResponse)
                    } else if (check.isEmpty(result)) {
                        let apiResponse = response.generate(true, 'No List found', 400, null)
                        reject(apiResponse)
                    } else {
                        resolve(result)
                    }
                })
        })
    }

    //marking complete the item and its children if any
    let doneItemAndChildren = (saveList) => {

        return new Promise((resolve, reject) => {
            let newList = new ListModel({
                listId: saveList.listId,
                listName: saveList.listName,
                creatorId: saveList.creatorId,
                state: saveList.state + 1,
                createdOn: saveList.createdOn,
                private: saveList.private,
                item: saveList.item
            })
            newList.item.forEach((item) => {
                (item.itemId === data.itemId || item.itemParentId === data.itemId) ? item.done = true : null
            })
            newList.save((err, result) => {
                if (err) {
                    console.log(err)
                    logger.error(err.message, 'itemLib : doneItemAndChildren', 10)
                    let apiResponse = response.generate(true, 'Failed to done items', 400, null)
                    reject(apiResponse)
                } else {
                    resolve(result)
                }
            })
        })
    }
    validateUserInput()
        .then(updateUserListState)
        .then(findPreviousStateList)
        .then(doneItemAndChildren)
        .then((resolve) => {
            let apiResponse = response.generate(false, 'item successfully completed', 200, resolve)
            io.sockets.in(resolve.creatorId).emit('update-list-real-time', apiResponse)
        })
        .catch((err) => {
            console.log(err)
        })
})

//marking item open which are completed
eventEmitter.on('save-open-item', (data) => {
    let validateUserInput = () => {
        return new Promise((resolve, reject) => {
            if (check.isEmpty(data.itemId)) {
                let apiResponse = response.generate(true, 'itemId parameter is missing', 400, null)
                reject(apiResponse)
            } else if (check.isEmpty(data.listId)) {
                let apiResponse = response.generate(true, 'listId parameter is missing', 400, null)
                reject(apiResponse)
            } else {
                resolve()
            }
        })
    }

    let updateUserListState = () => {
        return new Promise((resolve, reject) => {
            ListStateModel.findOne({ listId: data.listId })
                .exec((err, result) => {
                    if (err) {
                        console.log(err)
                        logger.error(err.message, 'itemLib : updateUserListState', 10)
                        let apiResponse = response.generate(true, 'Failed to find the list', 400, null)
                        reject(apiResponse)
                    } else if (check.isEmpty(result)) {
                        let apiResponse = response.generate(true, 'No List state found', 400, null)
                        reject(apiResponse)
                    } else {
                        result.present++;
                        result.save((err, saveList) => {
                            if (err) {
                                console.log(err)
                                logger.error(err.message, 'itemLib : updateUserListState', 10)
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

    let findPreviousStateList = (previousState) => {
        return new Promise((resolve, reject) => {
            let findQuery = { $and: [{ listId: data.listId }, { state: previousState - 1 }] }
            ListModel.findOne(findQuery)
                .select('-id -__v')
                .lean()
                .exec((err, result) => {
                    if (err) {
                        console.log(err)
                        logger.error(err.message, 'itemLib : findPreviousStateList', 10)
                        let apiResponse = response.generate(true, 'Failed to find the list', 400, null)
                        reject(apiResponse)
                    } else if (check.isEmpty(result)) {
                        let apiResponse = response.generate(true, 'No List found', 400, null)
                        reject(apiResponse)
                    } else {
                        resolve(result)
                    }
                })
        })
    }

    let openItemAndChildren = (saveList) => {

        return new Promise((resolve, reject) => {
            let newList = new ListModel({
                listId: saveList.listId,
                listName: saveList.listName,
                creatorId: saveList.creatorId,
                state: saveList.state + 1,
                createdOn: saveList.createdOn,
                private: saveList.private,
                item: saveList.item
            })
            newList.item.forEach((item) => {
                (item.itemId === data.itemId || item.itemParentId === data.itemId) ? item.done = false : null
            })
            newList.save((err, result) => {
                if (err) {
                    console.log(err)
                    logger.error(err.message, 'itemLib : openItemAndChildren', 10)
                    let apiResponse = response.generate(true, 'Failed to open items', 400, null)
                    reject(apiResponse)
                } else {
                    resolve(result)
                }
            })
        })
    }
    validateUserInput()
        .then(updateUserListState)
        .then(findPreviousStateList)
        .then(openItemAndChildren)
        .then((resolve) => {
            let apiResponse = response.generate(false, 'Item successfully opened', 200, resolve)
            io.sockets.in(resolve.creatorId).emit('update-list-real-time', apiResponse)
        })
        .catch((err) => {
            console.log(err)
        })
})