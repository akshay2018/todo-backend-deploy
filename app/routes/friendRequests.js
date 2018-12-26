const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth')
const friendRequestController = require("./../../app/controllers/friendRequestController");
const appConfig = require("./../../config/appConfig")

module.exports.setRouter = (app) => {

let baseUrl = `${appConfig.apiVersion}/friendRequests`;

app.get(`${baseUrl}/request/:senderId/:recipientId`, auth.isAuthorized,friendRequestController.getRequestStatus);
/**
     * @apiGroup Friend Request
     * @apiVersion  1.0.0
     * @api {get} /api/v1/friendRequests/request/:senderId/:recipientId Get Request status between two users.
     *
     * @apiParam {string} senderId senderId of the user.
     * @apiParam {string} recipientId recipientId of the user.
     * @apiParam {string} authToken The token for authentication.(Send authToken as query parameter, body parameter or as a header)
     * 
     * @apiSuccessExample {object} Success-Response:
         {
            "error": false,
            "message": "Friend Request Found",
            "status": 200,
            "data": {
                "senderId": string,
                "recipientId": string,
                "requestStatus": string
            }
        }
        @apiErrorExample {json} Error-Response:
	 *
	 * {
	    "error": true,
	    "message": "Failed to Find Request",
	    "status": 400,
	    "data": null
	   }
    */
}