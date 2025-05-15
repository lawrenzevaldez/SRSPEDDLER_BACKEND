'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const jwt = require('jsonwebtoken')
const Env = use('Env')

class CheckUser {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async handle ({ request }, next) {
    const header = request.header('Authorization')
    let bearer = header.split(' ')
    let token = bearer [1]
    try {
      jwt.verify(token, Env.get('NODE_ENV', 'APP_KEY'))
      return response.status(200).send({ status: 'loggedin' })
    } catch(e) {
        return response.status(403).send({ message: e.message, status: 'loggedout'})
    }
  }
}

module.exports = CheckUser
