const { db, dbb } = require('../util/admin')

const config = require('../util/config')

const firebase = require('firebase')
firebase.initializeApp(config)

const { validateSignupData, validateLoginData, reduceUserDetails } = require('../util/validators')


exports.signup = (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        username: req.body.username,
    }
    
    //validations
    const { valid, errors } = validateSignupData(newUser)

    if(!valid) return res.status(400).json(errors)

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
            }else if(err.code === 'auth/weak-password'){
                return res.status(400).json({ password: 'password must be more than 6 characters long'})
            }
            return res.status(500).json({ error: err.code })
        })
    
    
}

exports.login = (req, res) => {
    const user = {
        email: req.body.email,
        password: req.body.password
    }

    //validations
    const { valid, errors } = validateLoginData(user)

    if(!valid) return res.status(400).json(errors)


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
            }else if(err.code === "auth/invalid-email"){
                return res.status(403).json({ general: 'invalid email' })}
            return res.status(500).json({ error: err.code })
        })
}

//get user details
exports.getUserDetails = (req, res) => {
    let userData = {}
    db.doc(`/users/${req.user.username}`).get()
        .then(doc => {
            if(doc.exists){
                userData.credentials = doc.data()
                return db.collection('stocks').where('username', '==', req.user.username).get()
            }
        })
        .then(data => {
            userData.stocks = []
            data.forEach(doc => {
                userData.stocks.push(doc.data())
            })
            return res.json(userData)
        })
        .catch((err) => {
            console.error(err)
            return res.status(500).json({ error: err.code })
        })
}


//add stocks

exports.addStock = (req, res) => {
    // let userDetails = reduceUserDetails(req.body)
    let userDetails = {}
    
    // if(!isEmpty(data.trim()))
    userDetails.symbols = {}

    userDetails.symbols.name = req.body.name
    userDetails.symbols.displayName = req.body.displayName

    db.doc(`/users/${req.user.username}`).update({
        symbols: dbb.FieldValue.arrayUnion(userDetails.symbols)
    })
        .then(() => {
            return res.json({ userDetails })
        })
        .catch(err => {
            console.error(err)
            return res.status(500).json({ error: err.code })
        })
}

exports.removeStock = (req, res) => {
    let userDetails = reduceUserDetais(req.body)

    db.doc(`/users/${req.user.username}`).update({
        stocks: dbb.FieldValue.arrayRemove(userDetails.stocks)
    })
        .then(() => {
            return res.json({ userDetails })
        })
        .catch(err => {
            console.error(err)
            return res.status(500).json({ error: err.code })
        })
}



