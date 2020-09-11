const isEmail = (email) => {
    const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(email.match(regEx)) return true
    else return false
}

const isEmpty = (string) => {
    if(string.trim() === '') return true
    else return false
}

exports.validateSignupData = (data) => {
    let errors = {}
    
    if(isEmpty(data.email)){
        errors.email = 'field cant be empty'
    } else if(!isEmail(data.email)){
        errors.email = 'invalid email address'
    }

    if(isEmpty(data.password)) errors.password = 'field cant be empty'
    if(isEmpty(data.username)) errors.username = 'field cant be empty'
    if(data.password !== data.confirmPassword) errors.confirmPassword = 'Passwords dont match'

    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false //check if errors object is empty(no errors)
    }
}

exports.validateLoginData = (data) => {
    let errors = {}

    if(isEmpty(data.email)) errors.email = 'cant be empty'
    if(isEmpty(data.password)) errors.password = 'cant be empty'

    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false //check if errors object is empty(no errors)
    }
}

exports.reduceUserDetais = (data) => {
    let userDetails = {}

    if(!isEmpty(data.stocks.trim())) userDetails.stocks = data.stocks

    return userDetails
}
