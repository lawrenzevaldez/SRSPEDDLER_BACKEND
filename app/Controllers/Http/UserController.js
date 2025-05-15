'use strict'

const jwt = require('jsonwebtoken')
const Env = use('Env')
const UserModel = use('App/Models/UserModel')

class UserController {
    async auth_login({ request, response }) {
        const { username, password } = request.only(['username', 'password'])
        try {
            let checkUser = await UserModel.user_login(username, password)
            if(checkUser) {
                let user_id = checkUser.id
                let token = jwt.sign({user_id, username}, Env.get('NODE_ENV', 'APP_KEY'), { expiresIn: '1h' })
                return response.status(200).json({
                    user_id: user_id,
                    account_no: checkUser.account_no,
                    branch: checkUser.branch,
                    user_role: checkUser.user_role,
                    user_firstname: checkUser.user_firstname,
                    user_lastname: checkUser.user_lastname,
                    status: 'ok',
                    message: 'User logged in',
                    token: token
                })
            } else {
                return response.status(401).json({
                    status: 'failed',
                    message: 'User not found'
                })
            }

        } catch(e) {
            console.log(e)
            return response.status(403).json({
                status: 'error',
                message: e.message
            })
        }
    }

    async check_user({ request, response }) {
        const header = request.header('Authorization')
        let bearer = header.split(' ')
        let token = bearer [1]
        try {
            let checker = jwt.verify(token, Env.get('NODE_ENV', 'APP_KEY'))
            console.log(checker)
        } catch(e) {
            return response.status(403).send(e.message)
        }
    }
}

module.exports = UserController
