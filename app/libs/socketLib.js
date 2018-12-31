const mongoose = require('mongoose')
const socketio = require('socket.io')
const events = require('events')
eventEmitter = new events.EventEmitter()
const nodemailer = require('nodemailer')
const tokenLib = require('./tokenLib')

/*including libraries to save friendrequests, lists and items*/
require('./friendLib')
require('./listLib')
require('./itemLib')
require('./notificationLib')

let setServer = (server) => {
    io = socketio.listen(server)
    let myIo = io.of('')  //namespace

    /*--------estabilishing connection using service.ts---------------*/
    myIo.on('connection', (socket) => {
        // Sending email which contains link to activate email
        /**
            * @api {emit} activate-email Sending activation email
            * @apiVersion 0.0.1
            * @apiGroup Emit 
            *@apiDescription This event <b>("activate-email")</b> has to be emitted when a user signs up to send activation email.
           *@apiExample The following data has to be emitted
               *{
                   "email":string,
                   "firstName":string,
                   "lastName" : string,
                   "activateUserToken":string
               }
           */
        socket.on('activate-email', (data) => {

            // create reusable transporter object using the default SMTP transport
            let transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: 'todolistakki@gmail.com',
                    pass: 'todolistakki77'
                }
            });
            let mailOptions = {
                from: '"ToDo" <Akki@ToDo.com>', // sender address
                to: data.email, // list of receivers
                subject: 'Welcome to ToDo', // Subject line
                html: `Hi ${data.firstName} ${data.lastName},<br><br>
                Welcome to the To Do App. It is used to create tasks with your friends and private as well.<br>Please Click <a href="https://akkirr.com/activate?activateToken=${data.activateUserToken}" >here</a> to verify your email and continue with our sevices.<br><br> Warm Regards,<br>Akshay R` // html body
            };
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return console.log(error);
                }
                console.log('Message sent: %s', info.messageId);
            });
        })

        /**
         * @api {emit} forgot-password Sending change password email
         * @apiVersion 0.0.1
         * @apiGroup Emit 
         *@apiDescription This event <b>("forgot-password")</b> has to be emitted when a user inputs his email to receive forget password email.
        *@apiExample The following data has to be emitted
            *{
                "email":string,
                "resetPasswordToken":string
            }
        */
        // sending email which contains link to reset the password
        socket.on('forgot-password', (data) => {
            // create reusable transporter object using the default SMTP transport
            let transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: 'todolistakki9@gmail.com',
                    pass: 'todolistakki77'
                }
            });
            let mailOptions = {
                from: '"ToDo" <Akki@Todo.com>', // sender address
                to: data.email, // list of receivers
                subject: 'Reset Password', // Subject line
                html: `Hi,<br><br>If you are receiving this email, You have forgotten the password on ToDo.<br>To reset the password Click the <a href="https://akkirr.com/reset?passwordToken=${data.resetPasswordToken}">link</a><br><b>The link will expire in 5 minutes</b><br><br>Warm Regards,<br>Akshay R` // html body
            };
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return console.log(error);
                }
                console.log('Message sent: %s', info.messageId);
            });
        })

        /**
         * @api {listen} verifyUser Verification of user
         * @apiVersion 0.0.1
         * @apiGroup Listen 
         *@apiDescription This event <b>("verifyUser")</b> has to be listened on the user's end to verify user or admin authentication.
        */
        //To initiate the user
        socket.emit('verifyUser', '')

        /**
         * @api {emit} set-user Setting user online
         * @apiVersion 0.0.1
         * @apiGroup Emit 
         *@apiDescription This event <b>("set-user")</b> has to be emitted when a user comes online. This is to verify if the user is normal user only
        */
        // verify normal user token
        socket.on('set-user', (authToken) => {
            tokenLib.verifyClaimWithoutSecret(authToken, (err, result) => {
                if (err) {
                    /**
                     * @api {listen} auth-error Emitting auth error on fail of token verification
                     * @apiVersion 0.0.1
                     * @apiGroup Listen 
                     *@apiDescription This event <b>("auth-error")</b> has to be listened by the current room and will be triggered if there comes any auth-token error
                        *@apiExample The example data as output
                        *{
                            "status": 500,
                            "error": Please provide correct auth token
                        }
                    */
                    socket.emit('auth-error', { status: 500, error: 'Please provide correct auth token' })
                } else {
                    /**
                     * @api {listen} start-room Starting the room
                     * @apiVersion 0.0.1
                     * @apiGroup Listen 
                     *@apiDescription This event <b>("start")</b> has to be listened while starting profile page. Only then the other events of user get to work.
                    */
                    // initiate the page of selected user by the admin
                    socket.emit('start', '')
                    /**
                     * @api {emit} join-room Joining the current room
                     * @apiVersion 0.0.1
                     * @apiGroup Emit 
                     *@apiDescription This event <b>("join-room")</b> has to be emitted when user opens the user page to check his dashboard or other's dashboard. Data that has to be passed here is <b>userId</b>
                    */
                    // here room is consider as the user page opened in front of admin
                    socket.on('join-room', (data) => {
                        socket.room = data
                        socket.join(data)
                    })
                    /**
                     * @api {emit} add-friend-request Sending friend request
                     * @apiVersion 0.0.1
                     * @apiGroup Emit 
                     *@apiDescription This event <b>("add-friend-request")</b> has to be emitted when user sends the friend request to other user.
                     *@apiExample The following data has to be emitted
                        *{
                            "senderId": string,
                            "recipientId": string,
                            "requestStatus": 'requested'
                        }
                    */
                    socket.on('add-friend-request', (data) => {
                        eventEmitter.emit('save-add-friend-request', data)
                    })
                    /**
                     * @api {emit} accept-friend-request Accepting friend request
                     * @apiVersion 0.0.1
                     * @apiGroup Emit 
                     *@apiDescription This event <b>("accept-friend-request")</b> has to be emitted when user accepts the friend request of other user.
                     *@apiExample The following data has to be emitted
                        *{
                            "senderId": string,
                            "recipientId": string,
                            "requestStatus": 'accepted'
                        }
                    */
                    socket.on('accept-friend-request', (data) => {
                        eventEmitter.emit('save-accept-friend-request', data)
                    })
                    /**
                     * @api {emit} reject-friend-request Rejecting friend request
                     * @apiVersion 0.0.1
                     * @apiGroup Emit 
                     *@apiDescription This event <b>("reject-friend-request")</b> has to be emitted when user rejects the friend request of other user and deletes the request from database. Hence no Request status is required.
                     *@apiExample The following data has to be emitted
                        *{
                            "senderId": string,
                            "recipientId": string
                        }
                    */
                    socket.on('reject-friend-request', (data) => {
                        eventEmitter.emit('save-reject-friend-request', data)
                    })
                    /**
                     * @api {emit} unfriend unfriending the friend
                     * @apiVersion 0.0.1
                     * @apiGroup Emit 
                     *@apiDescription This event <b>("unfriend")</b> has to be emitted when user unfriends the friend and deletes the request from database. Hence no Request status is required.
                     *@apiExample The following data has to be emitted
                        *{
                            "senderId": string,
                            "recipientId": string
                        }
                    */
                    socket.on('unfriend', (data) => {
                        eventEmitter.emit('save-unfriend', data)
                    })
                    /**
                     * @api {emit} create-list Create List
                     * @apiVersion 0.0.1
                     * @apiGroup Emit 
                     *@apiDescription This event <b>("create-list")</b> has to be emitted when user creates the list.
                     *@apiExample The following data has to be emitted
                        *{
                            "listName": string,
                            "creatorId": string,
                            "private": boolean
                        }
                    */
                    socket.on('create-list', (data) => {
                        eventEmitter.emit('save-create-list', data)
                    })
                    /**
                     * @api {emit} edit-list Edit List
                     * @apiVersion 0.0.1
                     * @apiGroup Emit 
                     *@apiDescription This event <b>("edit-list")</b> has to be emitted when user edits the list.
                     *@apiExample The following data has to be emitted
                        *{
                            "listId": string,
                            "listName": string,
                            "private": boolean
                        }
                    */
                    socket.on('edit-list', (data) => {
                        eventEmitter.emit('save-edit-list', data)
                    })
                    /**
                    * @api {emit} delete-list Delete List
                    * @apiVersion 0.0.1
                    * @apiGroup Emit 
                    *@apiDescription This event <b>("delete-list")</b> has to be emitted when user deletes the list. CreatorId is needed to display real time deletion.
                    *@apiExample The following data has to be emitted
                       *{
                           "listId": string,
                           "creatorId": string
                       }
                   */
                    socket.on('delete-list', (data) => {
                        eventEmitter.emit('save-delete-list', data)
                    })
                    /**
                     * @api {emit} undo-list Undo List
                     * @apiVersion 0.0.1
                     * @apiGroup Emit 
                     *@apiDescription This event <b>("undo-list")</b> has to be emitted when user undo the list.
                     *@apiExample The following data has to be emitted
                        *{
                            "listId": string
                        }
                    */
                    socket.on('undo-list', (data) => {
                        eventEmitter.emit('save-undo-list', data)
                    })
                    /**
                     * @api {emit} create-item Create Item
                     * @apiVersion 0.0.1
                     * @apiGroup Emit 
                     *@apiDescription This event <b>("create-item")</b> has to be emitted when user creates the item. CreatorId is required to display real time item creation.
                     *@apiExample The following data has to be emitted
                        *{
                            listId: string,
                            itemParentId: string,
                            itemName: string,
                            creatorId: creatorId,
                        }
                    */
                    socket.on('create-item', (data) => {
                        eventEmitter.emit('save-create-item', data)
                    })
                    /**
                     * @api {emit} edit-item Edit Item
                     * @apiVersion 0.0.1
                     * @apiGroup Emit 
                     *@apiDescription This event <b>("edit-item")</b> has to be emitted when user edits the item.
                     *@apiExample The following data has to be emitted
                        *{
                            listId: string,
                            itemId: string,
                            itemName: string
                        }
                    */
                    socket.on('edit-item', (data) => {
                        eventEmitter.emit('save-edit-item', data)
                    })
                    /**
                     * @api {emit} delete-item Delete Item
                     * @apiVersion 0.0.1
                     * @apiGroup Emit 
                     *@apiDescription This event <b>("delete-item")</b> has to be emitted when user deletes the item.
                     *@apiExample The following data has to be emitted
                        *{
                            listId: string,
                            itemId: string
                        }
                    */
                    socket.on('delete-item', (data) => {
                        eventEmitter.emit('save-delete-item', data)
                    })
                    /**
                    * @api {emit} complete-item Complete Item
                    * @apiVersion 0.0.1
                    * @apiGroup Emit 
                    *@apiDescription This event <b>("complete-item")</b> has to be emitted when user completes the item.
                    *@apiExample The following data has to be emitted
                       *{
                           listId: string,
                           itemId: string
                       }
                   */
                    socket.on('complete-item', (data) => {
                        eventEmitter.emit('save-complete-item', data)
                    })
                    /**
                     * @api {emit} open-item Open Item
                     * @apiVersion 0.0.1
                     * @apiGroup Emit 
                     *@apiDescription This event <b>("open-item")</b> has to be emitted when user opens the item.
                     *@apiExample The following data has to be emitted
                        *{
                            listId: string,
                            itemId: string
                        }
                    */
                    socket.on('open-item', (data) => {
                        eventEmitter.emit('save-open-item', data)
                    })

                    /**
                     * @api {emit} send-notification Send Notification
                     * @apiVersion 0.0.1
                     * @apiGroup Emit 
                     *@apiDescription This event <b>("send-notification")</b> has to be emitted when user does any action. type can be any of following options <b>'requested', 'accepted', 'createList', 'editList', 'deleteList', 'undoList', 'createItem', 'editItem', 'deleteItem', 'completeItem', 'openItem'</b>. itemName and listName will be required for items and only listName is required while doing aciton on list. No recipientId is required while doing action with lists as it will be taken from friend list. While doing friend requests recipientId is required to whom request is being sent or accepted.
                     *@apiExample The following data has to be emitted
                        *{
                            senderId: string,
                            profileId: string,
                            senderFullName: string,
                            type: string,
                            listName?: string,
                            itemName?: string,
                            recipientId? : string
                        }
                    */
                    socket.on('send-notification', (data) => {
                        eventEmitter.emit('save-send-notification', data)
                    })
                }
            })
        })
        socket.on('disconnect', () => {
            if (socket.room) {
                socket.leave(socket.room)
            }
        })
    })

}

module.exports = {
    setServer: setServer
}
