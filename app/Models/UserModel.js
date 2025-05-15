const Model = use('Model')
const Db = use('Database')

class UserModel extends Model {
    async user_login(username, password) {
        let row = await Db.select('*')
                .from('srs_users')
                .where('username', username)
                .andWhere('password', password)

        await Db.close()

        return (row.length == 0) ? '' : row[0]
    }
}

module.exports = new UserModel