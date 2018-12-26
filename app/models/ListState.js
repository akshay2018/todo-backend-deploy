'use strict'
const mongoose = require('mongoose')
const Schema = mongoose.Schema;

let listStateSchema = new Schema({
  listId: {
    type: String,
    index: true,
    required: true,
    unique: true
  },
  present : {
      type : Number
  },
  creatorId : {
    type : String,
    required : true
  }
})

mongoose.model('ListState', listStateSchema);