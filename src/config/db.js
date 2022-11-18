require('dotenv').config()
import mongoose from "mongoose";
import config from "./index.js";

export default callback => {

  mongoose.set('useFindAndModify', false);
  mongoose.connect(process.env.database, {
    useNewUrlParser: true,
    useFindAndModify: true,
    useCreateIndex: true,
    useUnifiedTopology: true
  });
  
  callback(db);
  let db = mongoose.connection;
  db.on('open', function() {
    console.log('connected to the database');
  })
  
  db.on('error', function(error) {
    console.log('Database connection error '+error);
  })
}