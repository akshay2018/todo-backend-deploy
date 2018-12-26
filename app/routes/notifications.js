const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth')
const notificationController = require("./../../app/controllers/notificationController");
const appConfig = require("./../../config/appConfig")

module.exports.setRouter = (app) => {

let baseUrl = `${appConfig.apiVersion}/notifications`;

app.get(`${baseUrl}/user/:userId`, auth.isAuthorized, notificationController.getNotifications);
/**
     * @apiGroup Notification
     * @apiVersion  1.0.0
     * @api {get} /api/v1/notifications/user/:userId Get User Notifications.
     *
     * @apiParam {string} userId userId of the user.
     * @apiParam {number} skip skip of the user (query param)
     * @apiParam {string} authToken The token for authentication.(Send authToken as query parameter, body parameter or as a header)
     * 
     * @apiSuccessExample {object} Success-Response:
         {
            "error": false,
            "message": "Notifications Found",
            "status": 200,
            "data": [
                {
                    "seen": boolean,
                    "createdOn": date,
                    "notiId": string,
                    "profileId": string,
                    "senderId": string,
                    "description": string,
                    "type": string,
                    "recipientId": string
                }
            ]
        }
        @apiErrorExample {json} Error-Response:
	 *
	 * {
	    "error": true,
	    "message": "Failed to find Notifications",
	    "status": 400,
	    "data": null
	   }
    */

app.get(`${baseUrl}/unread/:userId`, auth.isAuthorized, notificationController.getUnreadNotifications);
/**
     * @apiGroup Notification
     * @apiVersion  1.0.0
     * @api {get} /api/v1/notifications/unread/:userId Get User UnRead Notifications.
     *
     * @apiParam {string} userId userId of the user.
     * @apiParam {string} authToken The token for authentication.(Send authToken as query parameter, body parameter or as a header)
     * 
     * @apiSuccessExample {object} Success-Response:
         {
            "error": false,
            "message": "Unread Notifications Found",
            "status": 200,
            "data": [
                {
                    "seen": boolean,
                    "createdOn": date,
                    "notiId": string,
                    "profileId": string,
                    "senderId": string,
                    "description": string,
                    "type": string,
                    "recipientId": string
                }
            ]
        }
        @apiErrorExample {json} Error-Response:
	 *
	 * {
	    "error": true,
	    "message": "Failed to find Notifications",
	    "status": 400,
	    "data": null
	   }
    */
}