const { db } = require('../util/admin')

exports.getAllStocks = (req, res) =>{
    db.collection('stocks')
    .orderBy('createdAt', 'desc')
    .get()
    .then((data) => {
        let stocks = []
        data.forEach((doc) => {
            stocks.push({
                stockId: doc.id,
                // username: doc.data().username,
                // body: doc.data().body,
                // createdAt: doc.data().createdAt
                ...doc.data()
                
            })
        })
        return res.json(stocks)
    })
    .catch(err => console.error(err))
}

exports.postOneStock = (req, res) => {
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
}

