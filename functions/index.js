const functions = require('firebase-functions');
const express = require('express')
const app = express()

const FBAuth = require('./util/fbAuth')

const cors = require('cors')
app.use(cors())


const { getAllStocks, postOneStock } = require('./routes/stocks')
const { signup, login, addStock, removeStock, getUserDetails } = require('./routes/users');
const fbAuth = require('./util/fbAuth');


//stock routes
app.get('/stocks', getAllStocks)
app.post('/stock', FBAuth, postOneStock)//separate db from users
app.post('/user', FBAuth, addStock)
app.post('/user/rm', fbAuth, removeStock)
app.get('/user', fbAuth, getUserDetails)


//signup/login
app.post('/signup', signup)
app.post('/login', login)






exports.api = functions.https.onRequest(app)