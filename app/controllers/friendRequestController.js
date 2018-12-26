const express = require('express')
const mongoose = require('mongoose');
const response = require('./../libs/responseLib')
const logger = require('./../libs/loggerLib');
const check = require('../libs/checkLib')

/* Models */
const FriendRequestModel = mongoose.model('FriendRequest')

// getting request status between two users
let getRequestStatus = (req,res) => {
    let validateUserInput = () => {
        return new Promise((resolve, reject) => {
            if (check.isEmpty(req.params.senderId)) {
                let apiResponse = response.generate(true, 'senderId parameter is missing', 400, null)
                reject(apiResponse)
            } else if(check.isEmpty(req.params.recipientId)) {
                let apiResponse = response.generate(true, 'recepientId parameter is missing', 400, null)
                reject(apiResponse)
            } else {
                resolve()
            }
        })
    }

    let friendRequest = () =>{
        return new Promise((resolve, reject) => {
            let findQuery = {$or:[
                {$and:[{senderId : req.params.senderId},{recipientId : req.params.recipientId}]},
                {$and : [{senderId : req.params.recipientId},{recipientId : req.params.senderId}]}]}
            FriendRequestModel.findOne(findQuery)
                .select('-_id -__v')
                .exec((err, result) => {
                    if (err) {
                        logger.error(err.message, 'friendRequestController : friendRequest', 5)
                        let apiResponse = response.generate(true, 'Failed to find Request', 400, null)
                        reject(apiResponse)
                    } else if (check.isEmpty(result)) {
                        let apiResponse = response.generate(true, 'No Request Found', 400, null)
                        reject(apiResponse)
                    } else {
                        resolve(result)
                    }
                })
        })
    }
    validateUserInput(req,res)
        .then(friendRequest)
        .then((resolve)=>{
            let apiResponse = response.generate(false,'Friend Request found',200,resolve)
            res.send(apiResponse)
        })
        .catch((err)=>{
            console.log(err)
            res.send(err)
        })
}

module.exports = {

    getRequestStatus: getRequestStatus

}