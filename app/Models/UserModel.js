const Model = use("Model");
const Db = use("Database");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const WPHash = require("wordpress-hash-node");

class UserModel extends Model {
  async user_login(username, password) {
    const row = await Db.select("*")
      .from("website_users")
      .where("user_login", username)
      .first();

    await Db.close();

    if (!row) return "";

    const isValid = await this.wpPasswordVerify(password, row.user_pass);

    return isValid ? row : "";
  }

  async wpPreHash(password) {
    if (typeof password === "string") {
      password = Buffer.from(password, "utf-8");
    }

    const hmac = crypto.createHmac("sha384", "wp-sha384");
    hmac.update(password);
    return hmac.digest();
  }

  async wpPasswordHash(password) {
    if (typeof password === "string") {
      password = Buffer.from(password, "utf-8");
    }
    const preHash = wpPreHash(password);
    const finalHash = await bcrypt.hash(preHash.toString("base64"), 10);
    return "$wp" + finalHash;
  }

  async wpPasswordVerify(password, hashedPassword) {
    if (!hashedPassword.startsWith("$wp")) {
      throw new Error("Not a WordPress >= 6.8 password hash");
    }

    hashedPassword = hashedPassword.slice(3);
    if (typeof password === "string") {
      password = Buffer.from(password, "utf-8");
    }

    const preHash = await this.wpPreHash(password);
    const isValid = await bcrypt.compare(
      preHash.toString("base64"),
      hashedPassword
    );
    return isValid;
  }
}

module.exports = new UserModel();
