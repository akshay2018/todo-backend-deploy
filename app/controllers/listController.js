const express = require('express')
const mongoose = require('mongoose');
const response = require('./../libs/responseLib')
const logger = require('./../libs/loggerLib');
const check = require('../libs/checkLib')

/* Models */
const ListStateModel = mongoose.model('ListState')
const ListModel = mongoose.model('List')

// getting all the list present state of particular user
let getUserListStates = (req, res) => {
    let validateUserInput = () => {
        return new Promise((resolve, reject) => {
            if (check.isEmpty(req.params.userId)) {
                let apiResponse = response.generate(true, 'userId parameter is missing', 400, null)
                reject(apiResponse)
            } else {
                resolve()
            }
        })
    }

    let getUserListStates = () => {
        return new Promise((resolve, reject) => {
            ListStateModel.find({ creatorId: req.params.userId })
                .select('-_id -__v')
                .limit(10)
                .skip(parseInt(req.query.skip) || 0)
                .exec((err, result) => {
                    if (err) {
                        logger.error(err.message, 'list Controller : getUserListStates', 5)
                        let apiResponse = response.generate(true, 'Failed to find userLists', 400, null)
                        reject(apiResponse)
                    } else if (check.isEmpty(result)) {
                        let apiResponse = response.generate(true, 'No user lists found', 400, null)
                        reject(apiResponse)
                    } else {
                        resolve(result)
                    }
                })
        })
    }
    validateUserInput(req, res)
        .then(getUserListStates)
        .then((resolve) => {
            let apiResponse = response.generate(false, 'User Lists found', 200, resolve)
            res.send(apiResponse)
        })
        .catch((err) => {
            console.log(err)
            res.send(err)
        })
}


//getting list of present state
let getPresentListState = (req, res) => {
    let validateUserInput = () => {
        return new Promise((resolve, reject) => {
            if (check.isEmpty(req.params.listId)) {
                let apiResponse = response.generate(true, 'listId parameter is missing', 400, null)
                reject(apiResponse)
            } else if (check.isEmpty(req.params.presentState)) {
                let apiResponse = response.generate(true, 'presentState parameter is missing', 400, null)
                reject(apiResponse)
            } else {
                resolve()
            }
        })
    }

    let getPresentListState = () => {
        return new Promise((resolve, reject) => {
            let findQuery = { $and: [{ listId: req.params.listId }, { state: req.params.presentState }] }
            ListModel.findOne(findQuery)
                .select('-_id -__v')
                .exec((err, result) => {
                    if (err) {
                        logger.error(err.message, 'list Controller : getPresentListState', 5)
                        let apiResponse = response.generate(true, 'Failed to find lists', 400, null)
                        reject(apiResponse)
                    } else if (check.isEmpty(result)) {
                        let apiResponse = response.generate(true, 'No lists found', 400, null)
                        reject(apiResponse)
                    } else {
                        resolve(result)
                    }
                })
        })
    }
    validateUserInput(req, res)
        .then(getPresentListState)
        .then((resolve) => {
            let apiResponse = response.generate(false, 'List found', 200, resolve)
            res.send(apiResponse)
        })
        .catch((err) => {
            console.log(err)
            res.send(err)
        })
}


//getting present state of the list
let getListState = (req, res) => {
    let validateUserInput = () => {
        return new Promise((resolve, reject) => {
            if (check.isEmpty(req.params.listId)) {
                let apiResponse = response.generate(true, 'listId parameter is missing', 400, null)
                reject(apiResponse)
            } else {
                resolve()
            }
        })
    }

    let getListState = () => {
        return new Promise((resolve, reject) => {
            ListStateModel.findOne({ listId: req.params.listId })
                .select('-_id -__v')
                .exec((err, result) => {
                    if (err) {
                        logger.error(err.message, 'list Controller : getListState', 5)
                        let apiResponse = response.generate(true, 'Failed to find list state', 400, null)
                        reject(apiResponse)
                    } else if (check.isEmpty(result)) {
                        let apiResponse = response.generate(true, 'No List state found', 400, null)
                        reject(apiResponse)
                    } else {
                        resolve(result)
                    }
                })
        })
    }
    validateUserInput(req, res)
        .then(getListState)
        .then((resolve) => {
            let apiResponse = response.generate(false, 'User List State found', 200, resolve)
            res.send(apiResponse)
        })
        .catch((err) => {
            console.log(err)
            res.send(err)
        })
}

module.exports = {
    getUserListStates: getUserListStates,
    getPresentListState: getPresentListState,
    getListState: getListState
}