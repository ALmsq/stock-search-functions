const admin = require('firebase-admin')

admin.initializeApp()

const db = admin.firestore()
const dbb = admin.firestore

module.exports = { admin, db, dbb }