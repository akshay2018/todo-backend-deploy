'use strict'
const mongoose = require('mongoose')
const Schema = mongoose.Schema;

let listSchema = new Schema({
  listId: {
    type: String,
    required : true
  },
  listName: {
    type: String,
    required: true
  },
  item: [{
    itemId: String,
    itemName : String,
    itemParentId : String,
    done : Boolean
  }],
  state : {
    type : Number,
    required : true
  },
  creatorId : {
      type : String,
      required : true
  },
  createdOn : {
      type : Date,
      default : Date.now()
  },
  private : {
      type : Boolean,
      required : true
  }
})

listSchema.index({listId: 1, state: 1}, {unique: true});

mongoose.model('List', listSchema);