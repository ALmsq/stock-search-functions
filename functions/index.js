const functions = require('firebase-functions');
const express = require('express')
const app = express()

const FBAuth = require('./util/fbAuth')


const { getAllStocks, postOneStock } = require('./routes/stocks')
//stock routes
app.get('/stocks', getAllStocks)
app.post('/stock', FBAuth, postOneStock)


const { signup, login } = require('./routes/users')
//signup/login
app.post('/signup', signup)
app.post('/login', login)






exports.api = functions.https.onRequest(app)