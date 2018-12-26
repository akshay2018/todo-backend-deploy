const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth')
const listController = require("./../../app/controllers/listController");
const appConfig = require("./../../config/appConfig")

module.exports.setRouter = (app) => {

let baseUrl = `${appConfig.apiVersion}/lists`;

app.get(`${baseUrl}/listStates/:userId`, auth.isAuthorized,listController.getUserListStates);
/**
     * @apiGroup List
     * @apiVersion  1.0.0
     * @api {get} /api/v1/lists/listStates/:userId Get User List States.
     *
     * @apiParam {string} userId userId of the user.
     * @apiParam {number} skip skip of the user (query param)
     * @apiParam {string} authToken The token for authentication.(Send authToken as query parameter, body parameter or as a header)
     * 
     * @apiSuccessExample {object} Success-Response:
         {
            "error": false,
            "message": "User Lists Found",
            "status": 200,
            "data": [
                {
                    "listId": string,
                    "present": number,
                    "creatorId": string
                }
            ]
        }
        @apiErrorExample {json} Error-Response:
	 *
	 * {
	    "error": true,
	    "message": "Failed to find userLists",
	    "status": 400,
	    "data": null
	   }
    */
app.get(`${baseUrl}/presentList/:listId/:presentState`, auth.isAuthorized,listController.getPresentListState);
/**
     * @apiGroup List
     * @apiVersion  1.0.0
     * @api {get} /api/v1/lists/presentList/:listId/:presentState Get List with present state.
     *
     * @apiParam {string} listId listId of the list.
     * @apiParam {number} presentState presentState of the list
     * @apiParam {string} authToken The token for authentication.(Send authToken as query parameter, body parameter or as a header)
     * 
     * @apiSuccessExample {object} Success-Response:
         {
            "error": false,
            "message": "List Found",
            "status": 200,
            "data": {
                "createdOn": date,
                "listId": string,
                "listName": string,
                "creatorId": string,
                "state": number,
                "private": boolean,
                "item": [
                    {
                        "_id": string,
                        "itemId": string,
                        "itemName": string,
                        "itemParentId": string,
                        "done": boolean
                    }
                ]
            }
        }
        @apiErrorExample {json} Error-Response:
	 *
	 * {
	    "error": true,
	    "message": "Failed to find Lists",
	    "status": 400,
	    "data": null
	   }
    */
app.get(`${baseUrl}/state/:listId/`, auth.isAuthorized,listController.getListState);
/**
     * @apiGroup List
     * @apiVersion  1.0.0
     * @api {get} /api/v1/lists/state/:listId/ Get List present state.
     *
     * @apiParam {string} listId listId of the list.
     * @apiParam {string} authToken The token for authentication.(Send authToken as query parameter, body parameter or as a header)
     * 
     * @apiSuccessExample {object} Success-Response:
         {
            "error": false,
            "message": "User List State Found",
            "status": 200,
            "data": {
                    "listId": string,
                    "present": number,
                    "creatorId": string
                }
        }
        @apiErrorExample {json} Error-Response:
	 *
	 * {
	    "error": true,
	    "message": "Failed to find List state",
	    "status": 400,
	    "data": null
	   }
    */
}