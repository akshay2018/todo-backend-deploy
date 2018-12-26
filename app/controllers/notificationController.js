const express = require('express')
const mongoose = require('mongoose');
const response = require('./../libs/responseLib')
const logger = require('./../libs/loggerLib');
const check = require('../libs/checkLib')

/* Models */
const NotificationModel = mongoose.model('Notification')

//getting notifications of particular user
let getNotifications = (req,res) => {
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

    let updateNotifications = () =>{
        return new Promise((resolve, reject) => {
            NotificationModel.update({recipientId : req.params.userId},{seen : true},{multi : true},(err,result)=>{
                if (err) {
                    logger.error(err.message, 'notification Controller : updateNotifications', 5)
                    let apiResponse = response.generate(true, 'Failed to find notifications', 400, null)
                    reject(apiResponse)
                } else if (check.isEmpty(result)) {
                    let apiResponse = response.generate(true, 'No Notifications found', 400, null)
                    reject(apiResponse)
                } else {
                    resolve()
                }
            })
        })
    }
    let getNotifications = () =>{
        return new Promise((resolve, reject) => {
            NotificationModel.find({recipientId : req.params.userId})
            .select('-_id -__v')
            .sort('-createdOn')
            .skip(parseInt(req.query.skip) || 0)
            .limit(10)
            .exec((err,result)=>{
                if (err) {
                    logger.error(err.message, 'notification Controller : getNotifications', 5)
                    let apiResponse = response.generate(true, 'Failed to find notifications', 400, null)
                    reject(apiResponse)
                } else if (check.isEmpty(result)) {
                    let apiResponse = response.generate(true, 'No notifications found', 400, null)
                    reject(apiResponse)
                } else {
                    resolve(result)
                }
            })
        })
    }
    validateUserInput(req,res)
        .then(updateNotifications)
        .then(getNotifications)
        .then((resolve)=>{
            let apiResponse = response.generate(false,'Notifications found',200,resolve)
            res.send(apiResponse)
        })
        .catch((err)=>{
            console.log(err)
            res.send(err)
        })
}

//getting unread notifications of the user
let getUnreadNotifications = (req,res) => {
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

    let getUnreadNotifications = () =>{
        return new Promise((resolve, reject) => {
            let findQuery = {$and:[{recipientId : req.params.userId},{seen:false}]}
            NotificationModel.find(findQuery)
                .select('-_id -__v')
                .exec((err, result) => {
                    if (err) {
                        logger.error(err.message, 'notification Controller : getUnreadNotifications', 5)
                        let apiResponse = response.generate(true, 'Failed to find notifications', 400, null)
                        reject(apiResponse)
                    } else if (check.isEmpty(result)) {
                        let apiResponse = response.generate(true, 'No Unread notifications found', 400, null)
                        reject(apiResponse)
                    } else {
                        resolve(result)
                    }
                })
        })
    }
    validateUserInput(req,res)
        .then(getUnreadNotifications)
        .then((resolve)=>{
            let apiResponse = response.generate(false,'Unread Notifications found',200,resolve)
            res.send(apiResponse)
        })
        .catch((err)=>{
            console.log(err)
            res.send(err)
        })
}

module.exports = {
    getNotifications: getNotifications,
    getUnreadNotifications : getUnreadNotifications
}