const functions = require('firebase-functions');
const express = require('express')
const app = express()

const admin = require('firebase-admin')
admin.initializeApp()

const firebaseConfig = {
    apiKey: "AIzaSyBYsy92CiRG2F_2V2uAQKbqm_bS5KfFf_Y",
    authDomain: "stock-tracker-be252.firebaseapp.com",
    databaseURL: "https://stock-tracker-be252.firebaseio.com",
    projectId: "stock-tracker-be252",
    storageBucket: "stock-tracker-be252.appspot.com",
    messagingSenderId: "263329144073",
    appId: "1:263329144073:web:9ee46d29d275959dd887d8",
    measurementId: "G-FCL4TS5YD9"
  };

const firebase = require('firebase')
firebase.initializeApp(firebaseConfig)


const db = admin.firestore()

app.get('/stocks', (req, res) =>{
    db.collection('stocks')
    .orderBy('createdAt', 'desc')
    .get()
    .then((data) => {
        let stocks = []
        data.forEach((doc) => {
            stocks.push({
                stockId: doc.id,
                username: doc.data().username,
                body: doc.data().body,
                createdAt: doc.data().createdAt
            })
        })
        return res.json(stocks)
    })
    .catch(err => console.error(err))
})

//verification middleware 
const FBAuth = (req, res, next) => {
    let idToken
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer ')){
        idToken = req.headers.authorization.split('Bearer ')[1]
    }else{
        console.error('token not found')
        return res.status(403).json({ error: 'unauthorized'})
    }
    admin.auth().verifyIdToken(idToken)
        .then(decodedToken => {
            req.user = decodedToken
            console.log(decodedToken)
            return db.collection('users')
                .where('userId', '==', req.user.uid ).limit(1).get()
        })
        .then(data => {
            req.user.username = data.docs[0].data().username
            return next()
        })
        .catch(err => {
            console.error('unverified token ', err)
            return res.status(403).json(err)
        })
}


app.post('/stock', FBAuth, (req, res) => {
    if (req.body.body.trim() === ''){
        return res.status(400).json({ body: 'field cant be empty' })
    }

    const newStock = {
        body: req.body.body,
        username: req.user.username,
        createdAt: new Date().toISOString()
    }

    db.collection('stocks').add(newStock)
    .then(doc => {
        res.json({ message: `document ${doc.id} created successfully`})
    })
    .catch(err => {
        res.status(500).json({ error: 'something went wrong'})
        console.error(err)
    })
})

const isEmail = (email) => {
    const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(email.match(regEx)) return true
    else return false
}

const isEmpty = (string) => {
    if(string.trim() === '') return true
    else return false
}

//signup
app.post('/signup', (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        username: req.body.username,
    }
    
    //validations
    let errors = {}
    
    if(isEmpty(newUser.email)){
        errors.email = 'field cant be empty'
    } else if(!isEmail(newUser.email)){
        errors.email = 'invalid email address'
    }

    if(isEmpty(newUser.password)) errors.password = 'field cant be empty'
    if(isEmpty(newUser.username)) errors.username = 'field cant be empty'
    if(newUser.password !== newUser.confirmPassword) errors.confirmPassword = 'Passwords dont match'

    if(Object.keys(errors).length > 0) return res.status(400).json(errors)

    let token, userId
    db.doc(`/users/${newUser.username}`).get()
        .then(doc=>{
            if(doc.exists){
                return res.status(400).json({ username: 'username is taken'})
            }else{
                return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password)
            }
        })
        .then(data =>{
            userId = data.user.uid
            return data.user.getIdToken()
        })
        .then(idToken =>{
            token = idToken
            const userCredentials = {
                username: newUser.username,
                email: newUser.email,
                createdAT: new Date().toISOString(),
                userId
            }
            db.doc(`/users/${newUser.username}`).set(userCredentials)
        })
        .then(() =>{
            return res.status(201).json({ token })
        })
        .catch(err => {
            console.error(err)
            if(err.code === 'auth/email-already-in-use'){
                return res.status(400).json({ email: 'Email is already in use'})
            }
            return res.status(500).json({ error: err.code })
        })
    
    
})

//login
app.post('/login', (req, res) => {
    const user = {
        email: req.body.email,
        password: req.body.password
    }

    //validations
    let errors = {}

    if(isEmpty(user.email)) errors.email = 'cant be empty'
    if(isEmpty(user.password)) errors.password = 'cant be empty'

    if(Object.keys(errors).length > 0) return res.status(400).json(errors)

    firebase.auth().signInWithEmailAndPassword(user.email, user.password)
        .then(data => {
            return data.user.getIdToken()
        })
        .then(token => {
            return res.json({ token })
        })
        .catch(err =>{
            console.error(err)
            if(err.code === 'auth/wrong-password'){
                return res.status(403).json({ general: 'wrong password' })
            }else if(err.code === "auth/user-not-found"){
                return res.status(403).json({ general: 'user not found' })
            }
            return res.status(500).json({ error: err.code })
        })
})

exports.api = functions.https.onRequest(app)