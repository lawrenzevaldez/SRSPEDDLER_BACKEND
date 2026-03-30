const Model = use("Model");
const Db = use("Database");
const Env = use("Env");
const DbPrefix = Env.get("ONLINE_DB_PREFIX", "");
const moment = use("moment");
const locutus = require("locutus/php/var");

class Services extends Model {
  async get_products(p_page, p_search, p_currentSort, p_currentSortDir) {
    const search = p_search ? `%${p_search}%` : "%%";

    try {
      const row = await Db.select(
        "id",
        "ProductID",
        "productName",
        "published",
        "excluded",
      )
        .from("online_shop_products")
        .where("productName", "like", search)
        .andWhere("published", 1)
        .orderBy(p_currentSort || "ProductID", p_currentSortDir || "ASC")
        .paginate(p_page || 1, 10);

      return [row.data, row.lastPage];
    } catch (error) {
      console.error("Error in get_products:", error);
      throw error;
    }
  }

  async get_products_unpublished(
    p_page,
    p_search,
    p_currentSort,
    p_currentSortDir,
  ) {
    let search = p_search == null ? "%%" : `%${p_search}%`;
    let row = await Db.select("id", "ProductID", "productName")
      .from("online_shop_products")
      .where(`productName`, "like", search)
      .andWhere("published", 0)
      // .andWhere('post_status', 'publish')
      .orderBy(p_currentSort, p_currentSortDir)
      .paginate(p_page, 10);
    await Db.close();
    return [row.data, row.lastPage];
  }

  async update_products_unpublished(list_of_ids) {
    const trx = await Db.beginTransaction();
    try {
      let row = await trx
        .table("online_shop_products")
        .whereIn("ProductID", list_of_ids)
        .update("published", 1);

      await trx.commit();
      return row == 0 ? false : true;
    } catch (e) {
      console.log(e);
      await trx.rollback();
      return false;
    }
  }

  async update_product_excluded(product_id, product_mode) {
    const trx = await Db.beginTransaction();
    try {
      let row = await trx
        .table("online_shop_products")
        .where("ProductID", product_id)
        .update("excluded", product_mode);

      await trx.commit();
      return row == 0 ? false : true;
    } catch (e) {
      console.log(e);
      await trx.rollback();
      return false;
    }
  }

  async update_products_status(product_id) {
    const trx = await Db.beginTransaction();
    try {
      let row = await trx
        .table("online_shop_products")
        .where("ProductID", product_id)
        .update("published", 0);

      await trx.commit();
      return row == 0 ? false : true;
    } catch (e) {
      console.log(e);
      await trx.rollback();
      return false;
    }
  }

  async get_orders(
    p_page,
    p_search,
    p_currentSort,
    p_currentSortDir,
    p_orderType,
  ) {
    let search = p_search == null ? "%%" : `%${p_search}%`;
    let res = await Db.connection("online_mysql")
      .select("*")
      .from("wc_orders as wo")
      .where("wo.status", p_orderType)
      // .andWhere('post_type', 'shop_order')
      // .orderBy(p_currentSort, p_currentSortDir)
      // .leftJoin(`${DbPrefix}wc_orders`, `${DbPrefix}wc_orders_meta.order_id`, `${DbPrefix}wc_orders.id`)
      .innerJoin(
        `${DbPrefix}wc_order_addresses as woa`,
        `woa.order_id`,
        `wo.id`,
      )
      .where(`wo.status`, p_orderType)
      .andWhere(`wo.id`, "like", search)
      .andWhere(`woa.address_type`, "billing")
      .orderBy(`wo.${p_currentSort}`, p_currentSortDir)
      .paginate(p_page, 10);
    // let orderDetails = []
    // console.log(res)
    // for(const row of res.data) {
    //     orderDetails.push({
    //         id: row.ID,
    //         billing: {
    //             first_name: await this.getOrderListDetailsBFN(row.ID),
    //             last_name: await this.getOrderListDetailsBLN(row.ID)
    //         },
    //         payment_method_title: await this.getOrderListDetailsBMP(row.ID),
    //         status: 'processing',
    //         date_created: row.post_date
    //     })
    // }
    await Db.close();
    return [res.data, res.lastPage];
  }

  async getOrderListDetailsBFN(ID) {
    try {
      let getOrdersBFN = await Db.connection("online_mysql")
        .select("*")
        .from("postmeta")
        .where("post_id", ID)
        .andWhere("meta_key", "_billing_first_name");

      return getOrdersBFN.length == 0 ? "" : getOrdersBFN[0].meta_value;
    } catch (e) {
      console.log(e);
    }
  }

  async getOrderListDetailsBLN(ID) {
    try {
      let getOrdersBLN = await Db.connection("online_mysql")
        .select("*")
        .from("postmeta")
        .where("post_id", ID)
        .andWhere("meta_key", "_billing_last_name");

      return getOrdersBLN.length == 0 ? "" : getOrdersBLN[0].meta_value;
    } catch (e) {
      console.log(e);
    }
  }

  async getOrderListDetailsBMP(ID) {
    try {
      let getOrdersBMP = await Db.connection("online_mysql")
        .select("*")
        .from("postmeta")
        .where("post_id", ID)
        .andWhere("meta_key", "_payment_method_title");

      return getOrdersBMP.length == 0 ? "" : getOrdersBMP[0].meta_value;
    } catch (e) {
      console.log(e);
    }
  }

  async get_all_orders_by_location(
    order_ids,
    p_page,
    p_search,
    p_currentSort,
    p_currentSortDir,
    p_orderType,
  ) {
    let search = p_search == null ? "%%" : `%${p_search}%`;
    let row = await Db.connection("online_mysql")
      .select("wc_orders.*", "wc_order_addresses.*")
      .from("wc_orders")
      .leftJoin(
        `${DbPrefix}wc_order_addresses`,
        `${DbPrefix}wc_orders.id`,
        `${DbPrefix}wc_order_addresses.order_id`,
      )
      .whereIn(`${DbPrefix}wc_orders.id`, order_ids)
      .andWhere(`${DbPrefix}wc_orders.status`, p_orderType)
      .orderBy(`${DbPrefix}wc_orders.${p_currentSort}`, p_currentSortDir)
      .paginate(p_page, 10);
    await Db.close();
    return [row.data, row.lastPage];
  }

  async get_products_location(productIDs) {
    if (!Array.isArray(productIDs) || productIDs.length === 0) return [];

    try {
      const rows = await Db.connection("online_mysql")
        .select(
          "p.ID as ProductID",
          "product_price.meta_value as Price",
          "product_stock.meta_value as Stock",
        )
        .from("posts as p")
        .leftJoin(`${DbPrefix}postmeta as product_price`, function () {
          this.on("p.ID", "=", "product_price.post_id").andOn(
            "product_price.meta_key",
            "=",
            Db.raw("'_regular_price'"),
          );
        })
        .leftJoin(`${DbPrefix}postmeta as product_stock`, function () {
          this.on("p.ID", "=", "product_stock.post_id").andOn(
            "product_stock.meta_key",
            "=",
            Db.raw("'_stock'"),
          );
        })
        .whereIn("p.ID", productIDs);

      return rows;
    } catch (error) {
      console.error("Error in get_products_location_bulk:", error);
      throw error;
    }
  }

  async get_products_featured(productIDs) {
    if (!Array.isArray(productIDs) || productIDs.length === 0) return [];

    try {
      const rows = await Db.connection("online_mysql")
        .select("*")
        .from(`term_relationships`)
        .whereIn("object_id", productIDs)
        .andWhere("term_taxonomy_id", 1091);

      return rows;
    } catch (error) {
      console.error("Error in get_products_featured_bulk:", error);
      throw error;
    }
  }

  async update_product_details(ID, product_price, product_stock, location_id) {
    const trx = await Db.connection("online_mysql").beginTransaction();
    try {
      await trx
        .table("postmeta")
        .where("post_id", ID)
        .andWhere("meta_key", `wcmlim_regular_price_at_${location_id}`)
        .update("meta_value", product_price);

      await trx
        .table("postmeta")
        .where("post_id", ID)
        .andWhere("meta_key", `wcmlim_stock_at_${location_id}`)
        .update("meta_value", product_stock);

      await trx.commit();
      return true;
    } catch (e) {
      console.log(e);
      await trx.rollback();
      return e.message;
    }
  }

  async audit_trail(user_id, location_id = "", display_name, message) {
    try {
      await Db.table("audit_trail").insert({
        user_id,
        location_id: location_id,
        display_name: display_name,
        message: message,
      });
      await Db.close();
    } catch (e) {
      console.log(e);
      return e.message;
    }
  }

  async add_location_product(product_id, location_id) {
    const trx = await Db.connection("online_mysql").beginTransaction();
    try {
      await trx.table("postmeta").insert({
        post_id: product_id,
        meta_key: `wcmlim_regular_price_at_${location_id}`,
        meta_value: 0,
      });

      await trx.table("postmeta").insert({
        post_id: product_id,
        meta_key: `wcmlim_stock_at_${location_id}`,
        meta_value: 0,
      });

      await trx.commit();
      return true;
    } catch (e) {
      console.log(e);
      await trx.rollback();
      return false;
    }
  }

  async get_order_items(order_id) {
    let row = await Db.connection("online_mysql")
      .raw(`SELECT p.order_id, p.order_item_id, p.order_item_name, p.order_item_type,
                    max( CASE WHEN pm.meta_key = '_product_id' and p.order_item_id = pm.order_item_id THEN pm.meta_value END ) as productID,
                    max( CASE WHEN pm.meta_key = '_qty' and p.order_item_id = pm.order_item_id THEN pm.meta_value END ) as Qty,
                    MAX(CASE WHEN pm.meta_key = '_line_subtotal' AND p.order_item_id = pm.order_item_id THEN pm.meta_value END) / 
                    MAX(CASE WHEN pm.meta_key = '_qty' AND p.order_item_id = pm.order_item_id THEN pm.meta_value END) AS original_price,
                    max( CASE WHEN pm.meta_key = '_variation_id' and p.order_item_id = pm.order_item_id THEN pm.meta_value END ) as variationID,
                    max( CASE WHEN pm.meta_key = '_line_total' and p.order_item_id = pm.order_item_id THEN pm.meta_value END ) as lineTotal,
                    max( CASE WHEN pm.meta_key = '_line_subtotal_tax' and p.order_item_id = pm.order_item_id THEN pm.meta_value END ) as subTotalTax,
                    max( CASE WHEN pm.meta_key = '_line_tax' and p.order_item_id = pm.order_item_id THEN pm.meta_value END ) as Tax,
                    max( CASE WHEN pm.meta_key = '_tax_class' and p.order_item_id = pm.order_item_id THEN pm.meta_value END ) as taxClass,
                    max( CASE WHEN pm.meta_key = '_line_subtotal' and p.order_item_id = pm.order_item_id THEN pm.meta_value END ) as subtotal
                    FROM ${DbPrefix}woocommerce_order_items AS p, ${DbPrefix}woocommerce_order_itemmeta as pm WHERE order_item_type = 'line_item' AND
                    p.order_item_id = pm.order_item_id AND p.order_id = ${order_id} GROUP BY p.order_item_id
                    `);
    await Db.close();
    return row.length == 0 ? "" : row[0];
  }

  async update_order(order_id, status) {
    const trx = await Db.connection("online_mysql").beginTransaction();
    try {
      let row = await trx
        .table("wc_orders")
        .where("id", order_id)
        .update("status", status);

      await trx.commit();
      return row == 0 ? false : true;
    } catch (e) {
      console.log(e);
      await trx.rollback();
      return false;
    }
  }

  async get_users_old(p_page, p_search, p_currentSort, p_currentSortDir) {
    let search = p_search == null ? "%%" : `%${p_search}%`;
    let row = await Db.select("*")
      .from("srs_users")
      .where(`id`, "like", search)
      .orWhere("username", "like", search)
      .orderBy(p_currentSort, p_currentSortDir)
      .paginate(p_page, 10);
    await Db.close();
    return [row.data, row.lastPage];
  }

  async update_user(user_id, password, user_role) {
    const trx = await Db.beginTransaction();
    try {
      let row = await trx
        .table("srs_users")
        .where("id", user_id)
        .update({ password: password, user_role: user_role });

      await trx.commit();
      return row == 0 ? false : true;
    } catch (e) {
      console.log(e);
      await trx.rollback();
      return false;
    }
  }

  async add_user(
    username,
    userpass,
    userrole,
    userbranch,
    userfirstname,
    userlastname,
  ) {
    const trx = await Db.beginTransaction();
    try {
      await trx.table("srs_users").insert({
        username: username,
        password: userpass,
        account_no: username,
        user_role: 0,
        branch: Env.get("BRANCH_NAME", ""),
        user_firstname: username,
        user_lastname: username,
      });

      await trx.commit();
      return true;
    } catch (e) {
      console.log(e);
      await trx.rollback();
      return false;
    }
  }

  async get_branches() {
    try {
      let row = await Db.connection("mysql91")
        .select("name", "db_133")
        .from("branches")
        .orderBy("name", "asc");
      await Db.close();
      return row.length == 0 ? false : row;
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  async get_users_lists(branch) {
    try {
      let res = await Db.connection(branch)
        .select("customercode", "description", "last_name")
        .from("peddler_customers")
        .where("category", "RESELLER")
        .orWhere("category", "WHOLESALE")
        .orderBy("description", "asc");
      await Db.close();
      return res.length == 0 ? false : res;
    } catch (e) {
      console.log(e);
    }
  }

  async get_user_details(branch, account_no) {
    try {
      let row = await Db.connection(branch)
        .select("customercode", "last_name", "first_name")
        .from("peddler_customers")
        .where("customercode", account_no);
      await Db.close();
      return row.length == 0 ? false : row[0];
    } catch (e) {
      console.log(e);
      return e.message;
    }
  }

  async get_total_order_amount(branch, account_no) {
    try {
      let row = await Db.connection("mssql")
        .from("FinishedPayments")
        .where("AccountNo", account_no.toString())
        .andWhere("Remarks", "peddler")
        .sum("Amount as amount");
      await Db.close();
      return row[0].amount == 0 ? 0 : row[0].amount;
    } catch (e) {
      console.log(e);
      return e.message;
    }
  }

  async get_total_order_count(branch, account_no) {
    try {
      let row = await Db.connection("mssql")
        .from("FinishedPayments")
        .where("AccountNo", account_no.toString())
        .andWhere("Remarks", "peddler")
        .count("* as orders");
      await Db.close();
      return row[0].orders == 0 ? 0 : row[0].orders;
    } catch (e) {
      console.log(e);
      return e.message;
    }
  }

  async get_total_order_amount_month(branch, account_no) {
    try {
      let startofMonth = moment()
        .startOf("month")
        .format("YYYY-MM-DD HH:mm:ss");
      let endofMonth = moment().endOf("month").format("YYYY-MM-DD HH:mm:ss");
      let row = await Db.connection("mssql")
        .from("FinishedPayments")
        .whereBetween("LogDate", [startofMonth, endofMonth])
        .andWhere("AccountNo", account_no.toString())
        .andWhere("Remarks", "peddler")
        .sum("Amount as amount");
      await Db.close();
      return row[0].amount == 0 ? 0 : row[0].amount;
    } catch (e) {
      console.log(e);
      return e.message;
    }
  }

  async get_total_order_count_month(account_no) {
    try {
      let startofMonth = moment()
        .startOf("month")
        .format("YYYY-MM-DD HH:mm:ss");
      let endofMonth = moment().endOf("month").format("YYYY-MM-DD HH:mm:ss");
      let row = await Db.connection("mssql")
        .from("FinishedPayments")
        .whereBetween("LogDate", [startofMonth, endofMonth])
        .andWhere("AccountNo", account_no.toString())
        .andWhere("Remarks", "peddler")
        .count("* as orders");
      await Db.close();
      return row[0].orders == 0 ? 0 : row[0].orders;
    } catch (e) {
      console.log(e);
      return e.message;
    }
  }

  async get_list_of_transactions(
    branch,
    account_no,
    p_page,
    p_currentSort,
    p_currentSortDir,
  ) {
    let minPage;
    let maxPage;

    if (p_page == 1) {
      minPage = 1;
      maxPage = 10;
    } else {
      minPage = parseInt(p_page + 0);
      maxPage = parseInt(minPage + 10);
      minPage = minPage + 1;
    }

    try {
      let row = await Db.connection("mssql").raw(`SELECT 
                            TransactionNo, 
                            TerminalNo, 
                            Amount, 
                            Description, 
                            LogDate
                        FROM (
                            SELECT 
                                TransactionNo, 
                                TerminalNo, 
                                Amount, 
                                Description, 
                                LogDate, 
                                ROW_NUMBER() OVER (ORDER BY ${p_currentSort} ${p_currentSortDir}) AS RowNum
                            FROM FinishedPayments
                            WHERE AccountNo = '${account_no}' AND remarks = 'peddler'
                        ) AS PaginatedPayments
                        WHERE RowNum BETWEEN ${minPage} AND ${maxPage};`);
      let lastPage = await Db.connection("mssql")
        .from("FinishedPayments")
        .where("AccountNo", account_no)
        .andWhere("remarks", "peddler")
        .count("* as TotalRowCount");
      await Db.close();
      return [row, lastPage[0].TotalRowCount];
    } catch (e) {
      console.log(e);
    }
  }

  async get_transaction_details(TransactionNo, TerminalNo, branch) {
    try {
      let row = await Db.connection("mssql")
        .select("Barcode", "Description", "UOM", "TotalQty", "Price", "Points")
        .from("FinishedSales")
        .where("TransactionNo", TransactionNo)
        .andWhere("TerminalNo", TerminalNo);
      return row.length == 0 ? false : row;
    } catch (e) {
      console.log(e);
    }
  }

  async insertProductDB(
    id,
    sku,
    name,
    barcode,
    pageCounter,
    grams,
    by_barcode,
    uom,
  ) {
    const trx = await Db.beginTransaction();
    try {
      let data = {
        ProductID: id,
        page: pageCounter,
        GlobalID: sku,
        productName: name,
        Barcode: barcode,
        grams: grams,
        by_barcode: by_barcode,
        LastDateModified: Db.fn.now(),
        uom: uom,
      };
      let row = await trx.insert(data).into("online_shop_products");
      await trx.commit();
      await Db.close();
      return row == 0 ? false : true;
    } catch (error) {
      await trx.rollback();
      console.log(error);
    }
  }

  async getOnlineSearchProducts(product_id) {
    try {
      let row = await Db.select("*")
        .from("online_shop_products")
        .where("ProductID", product_id);

      return row.length == 0 ? "" : row[0];
    } catch (error) {
      console.log(error);
    }
  }

  async getOriginalSRP(name, by_barcode, GlobalID, Barcode) {
    try {
      let row;
      if (
        by_barcode == "Y" ||
        by_barcode == "y" ||
        by_barcode == "Yes" ||
        by_barcode == "yes"
      ) {
        row = await this.getStockPriceBarcode(GlobalID, Barcode);
      } else {
        row = await this.getStockPrice(GlobalID, Barcode);
      }

      return row.srp;
    } catch (e) {
      console.log(e);
    }
  }

  async getStockPriceBarcode(barcode, globalid) {
    try {
      let row = await Db.connection("mssql_srspos")
        .select(
          "A.srp",
          "A.qty",
          "A.LastDateModified",
          "B.SellingArea",
          "A.Description",
        )
        .joinRaw(
          "FROM POS_Products A INNER JOIN Products B on A.ProductID = B.ProductID",
        )
        .where("B.globalid", globalid)
        .andWhere("A.Barcode", barcode)
        .andWhere("A.PriceModeCode", "R");
      await Db.close();
      return row.length == 0 ? "" : row[0];
    } catch (error) {
      console.log(error);
    }
  }

  async getStockPrice(globalid, barcode) {
    try {
      let row = await Db.connection("mssql_srspos")
        .select(
          "A.srp",
          "A.qty",
          "A.LastDateModified",
          "B.SellingArea",
          "B.Description",
        )
        .joinRaw(
          "FROM POS_Products A INNER JOIN Products B on A.ProductID = B.ProductID",
        )
        .where("B.globalid", globalid)
        .andWhere("A.Barcode", barcode)
        .andWhere("A.PriceModeCode", "R")
        .groupBy(
          "A.srp",
          "A.qty",
          "A.LastDateModified",
          "B.SellingArea",
          "B.Description",
        )
        .orderBy("A.LastDateModified", "desc");
      await Db.close();
      return row.length == 0 ? "" : row[0];
    } catch (error) {
      console.log(error);
    }
  }

  async getOnlineSRP(productID) {
    try {
      let row = await Db.connection("online_mysql")
        .select("meta_value AS regular_price")
        .from("postmeta")
        .where("post_id", productID)
        .andWhere("meta_key", "_regular_price");

      return row.length > 0 ? row[0].regular_price : 0;
    } catch (e) {
      console.log(e);
    }
  }

  async SendOrderPOS(order_header, order_details) {
    const trx = await Db.connection("mysql_srspos").beginTransaction();
    try {
      let checkOrderId = await trx
        .select("order_id")
        .from("order_header")
        .where("order_id", "=", order_header.order_id);

      if (checkOrderId.length >= 1) {
        await trx.rollback();
        return "existing";
      }

      let orderHeader = await trx.insert(order_header).into("order_header");

      if (!orderHeader) {
        await trx.rollback();
        return false;
      }

      for (let i = 0; i < order_details.length; i++) {
        let orderDetails = await trx
          .insert(order_details[i])
          .into("order_details");

        if (!orderDetails) {
          await trx.rollback();
          return false;
        }
      }

      await this.SaveOrderIdByBranch(order_header.order_id);
      await trx.commit();
      return true;
    } catch (error) {
      console.log(error);
      await trx.rollback();
      return false;
    }
  }

  async SaveOrderIdByBranch(order_id) {
    const trx = await Db.beginTransaction();
    try {
      let checkOrderId = await trx
        .select("order_id")
        .from("online_shop_order_assigned")
        .where("order_id", "=", order_id)
        .andWhere("branch", Env.get("BRANCH_NAME"));

      if (checkOrderId.length >= 1) {
        await trx.rollback();
        return "existing";
      }

      let orderIDHeader = await trx
        .insert({
          order_id: order_id,
          branch: Env.get("BRANCH_NAME"),
          date_added: moment().format("YYYY-MM-DD hh:mm:ss"),
        })
        .into("online_shop_order_assigned");

      if (!orderIDHeader) {
        await trx.rollback();
        return false;
      }

      await trx.commit();
      return true;
    } catch (error) {
      console.log(error);
      await trx.rollback();
      return false;
    }
  }

  //FOR PRODUCT BATCH UPLOAD ONLY

  async getproductcat() {
    try {
      let res = await Db.connection("mysql91")
        .select("*")
        .from("online_shop_products");
      // .where('id', 8080)
      // .limit(50)
      await Db.close();
      return res;
    } catch (e) {
      console.log(e);
    }
  }

  async getCatDets(cat_id) {
    try {
      let res = await Db.connection("mysql91")
        .select("type", "category_id", "parent_id")
        .from("online_shop_categories")
        .where("category_id", cat_id);
      await Db.close();
      return res[0];
    } catch (e) {
      console.log(e);
    }
  }

  async saveRes(
    GlobalID,
    productName,
    priceModeCode,
    productDescription,
    productShortDescription,
    mainCategory,
    uom,
    Barcode,
    grams,
    byBarcode,
    mainImageUrl,
  ) {
    const trx = await Db.connection("mysql91").beginTransaction();

    try {
      let maincategory1 = "",
        subcategory1 = "",
        maincategory2 = "",
        subcategory2 = "",
        maincategory3 = "",
        subcategory3 = "",
        maincategory4 = "",
        subcategory4 = "";
      for (let i = 0; i < mainCategory.length; i++) {
        // maincategory[i+1] = mainCategory[i].mainCategory
        // subcategory[i+1] = mainCategory[i].subCategory
        if (i == 0) {
          maincategory1 = mainCategory[i].mainCategory;
          subcategory1 = mainCategory[i].subCategory;
        } else if (i == 1) {
          maincategory2 = mainCategory[i].mainCategory;
          subcategory2 = mainCategory[i].subCategory;
        } else if (i == 2) {
          maincategory3 = mainCategory[i].mainCategory;
          subcategory3 = mainCategory[i].subCategory;
        } else if (i == 4) {
          maincategory4 = mainCategory[i].mainCategory;
          subcategory4 = mainCategory[i].subCategory;
        }
      }

      let data = {
        globalid: GlobalID,
        productName: productName,
        pricemodecode: priceModeCode,
        productdescription: productDescription,
        productshortdescription: productShortDescription,
        maincategory1: maincategory1,
        subcategory1: subcategory1,
        maincategory2: maincategory2,
        subcategory2: subcategory2,
        maincategory3: maincategory3,
        subcategory3: subcategory3,
        maincategory4: maincategory4,
        subcategory4: subcategory4,
        uom: uom,
        barcode: Barcode,
        grams: grams,
        bybarcode: byBarcode,
        mainimageurl: mainImageUrl,
      };

      await trx.insert(data).into("0_peddler_items");

      await trx.commit();
    } catch (e) {
      console.log(e);
      await trx.rollback();
    }
  }
  // ./FOR PRODUCT BATCH UPLOAD ONLY

  // ONLINE WEBSITE
  async get_users(p_page, p_search, p_currentSort, p_currentSortDir) {
    const searchCondition =
      p_search && p_search.trim() !== ""
        ? `AND (
         CAST(wp_users.ID AS CHAR) LIKE '%${p_search}%' 
         OR wp_users.user_login LIKE '%${p_search}%'
         OR wp_users.display_name LIKE '%${p_search}%'
       )`
        : "";

    const sql = `
    SELECT 
      wp_users.ID,
      wp_users.display_name,
      wp_users.user_login,
      MAX(CASE WHEN wp_usermeta.meta_key = '_peddler_customer_no' THEN wp_usermeta.meta_value END) AS peddler_customer_no,
      MAX(CASE WHEN wp_usermeta.meta_key = '_peddler_customer_name' THEN wp_usermeta.meta_value END) AS peddler_customer_name,
      MAX(CASE WHEN wp_usermeta.meta_key = '_peddler_customer_percentage' THEN wp_usermeta.meta_value END) AS peddler_customer_percentage,
      MAX(CASE WHEN wp_usermeta.meta_key = '_peddler_user_role' THEN wp_usermeta.meta_value END) AS user_role
    FROM wp_users
    LEFT JOIN wp_usermeta ON wp_usermeta.user_id = wp_users.ID
    WHERE EXISTS (
      SELECT 1 FROM wp_usermeta um
      WHERE um.user_id = wp_users.ID
        AND um.meta_key = 'primary_blog'
        AND um.meta_value = '5'
    )
    ${searchCondition}
    GROUP BY wp_users.ID
    ORDER BY ${p_currentSort} ${p_currentSortDir}
    LIMIT ${(p_page - 1) * 10}, 10
  `;

    const row = await Db.connection("online_mysql").raw(sql);

    const totalSql = `
    SELECT COUNT(*) AS total
    FROM wp_users
    WHERE EXISTS (
      SELECT 1 FROM wp_usermeta um
      WHERE um.user_id = wp_users.ID
        AND um.meta_key = 'primary_blog'
        AND um.meta_value = '5'
    )
    ${searchCondition}
  `;
    const totalRow = await Db.connection("online_mysql").raw(totalSql);

    const total = totalRow[0][0].total;
    const lastPage = Math.ceil(total / 10);

    return row[0] ? [row[0], lastPage] : [[], 0];
  }

  async update_website_user(
    user_id,
    peddler_customer_no,
    peddler_customer_name,
    peddler_customer_percentage,
    user_login,
    display_name,
    user_role,
  ) {
    const trxLocal = await Db.beginTransaction();
    const trxRemote = await Db.connection("online_mysql").beginTransaction();

    try {
      const wpUserRaw = await trxRemote.raw(
        "SELECT user_pass FROM wp_users WHERE ID = ? LIMIT 1",
        [user_id],
      );

      const wpUser = wpUserRaw[0][0] || wpUserRaw[0];
      const user_pass = wpUser ? wpUser.user_pass : null;

      if (!user_pass) {
        response.message = "User password not found in wp_users";
        await trxLocal.rollback();
        await trxRemote.rollback();
        return response;
      }

      const upsertLocalQuery = `
      INSERT INTO website_users
        (user_id, user_pass, peddler_no, user_login, display_name, role)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        user_pass = VALUES(user_pass),
        peddler_no = VALUES(peddler_no),
        user_login = VALUES(user_login),
        display_name = VALUES(display_name),
        role = VALUES(role)
    `;
      await trxLocal.raw(upsertLocalQuery, [
        user_id,
        user_pass,
        peddler_customer_no,
        user_login,
        display_name,
        user_role,
      ]);

      const existingMetaRaw = await trxRemote.raw(
        "SELECT meta_key FROM wp_usermeta WHERE user_id = ?",
        [user_id],
      );
      const existingMetaKeys = (existingMetaRaw[0] || []).map(
        (row) => row.meta_key,
      );

      const metaData = [
        ["_peddler_customer_no", peddler_customer_no],
        ["_peddler_customer_name", peddler_customer_name],
        ["_peddler_customer_percentage", peddler_customer_percentage],
        ["_peddler_user_role", user_role],
      ];

      for (const [meta_key, meta_value] of metaData) {
        if (existingMetaKeys.includes(meta_key)) {
          await trxRemote.raw(
            "UPDATE wp_usermeta SET meta_value = ? WHERE user_id = ? AND meta_key = ?",
            [meta_value, user_id, meta_key],
          );
        }
      }

      const insertMissing = metaData.filter(
        ([meta_key]) => !existingMetaKeys.includes(meta_key),
      );
      if (insertMissing.length > 0) {
        const values = insertMissing.map(() => "(?, ?, ?)").join(", ");
        const bindings = insertMissing.flatMap(([meta_key, meta_value]) => [
          user_id,
          meta_key,
          meta_value,
        ]);
        const insertQuery = `INSERT INTO wp_usermeta (user_id, meta_key, meta_value) VALUES ${values}`;
        await trxRemote.raw(insertQuery, bindings);
      }

      await trxLocal.commit();
      await trxRemote.commit();

      return true;
    } catch (e) {
      console.log(e);
      await trxLocal.rollback();
      await trxRemote.rollback();
      return false;
    }
  }

  async syncToMssql() {
    const CHUNK_SIZE = 500;
    let page = 1;

    while (true) {
      const peddler_customers = await Db.connection("mysql_srspos")
        .from("peddler_customers")
        .forPage(page, CHUNK_SIZE);

      if (!peddler_customers.length) break;

      for (const c of peddler_customers) {
        await Db.connection("mssql_srspos")
          .table("peddler_customers")
          .where("customercode", c.customercode)
          .update({
            description: c.description,
            first_name: c.first_name,
            middle_name: c.middle_name,
            last_name: c.last_name,
            branch: c.branch,
            street: c.street,
            barangay: c.barangay,
            city: c.city,
            address: c.address,
            phone: c.phone,
            email: c.email,
            category: c.category,
            date_created: c.date_created,
            inactive: c.inactive,
            reference_1: c.reference_1,
            reference_2: c.reference_2,
            is_premium_peddler: c.is_premium_peddler,
          })
          .then(async (affected) => {
            if (!affected) {
              await Db.connection("mssql_srspos")
                .table("peddler_customers")
                .insert({
                  customercode: c.customercode,
                  description: c.description,
                  first_name: c.first_name,
                  middle_name: c.middle_name,
                  last_name: c.last_name,
                  branch: c.branch,
                  street: c.street,
                  barangay: c.barangay,
                  city: c.city,
                  address: c.address,
                  phone: c.phone,
                  email: c.email,
                  category: c.category,
                  date_created: c.date_created,
                  inactive: c.inactive,
                  reference_1: c.reference_1,
                  reference_2: c.reference_2,
                  is_premium_peddler: c.is_premium_peddler,
                });
            }
          });
      }

      page++;
    }

    return true;
  }

  async syncWordpressUsers() {
    const CHUNK_SIZE = 500;
    let page = 1;

    while (true) {
      const result = await Db.connection("online_mysql").raw(
        `
        SELECT
          u.ID AS user_id,
          u.user_login,
          u.user_pass,
          u.display_name,
          um2.meta_value AS peddler_customer_no
        FROM wp_users u
        INNER JOIN wp_usermeta um1 
          ON u.ID = um1.user_id
          AND um1.meta_key = 'primary_blog'
        INNER JOIN wp_usermeta um2 
          ON u.ID = um2.user_id
          AND um2.meta_key = '_peddler_customer_no'
        WHERE um1.meta_value = ?
        LIMIT ? OFFSET ?
        `,
        [Env.get("PRIMARY_BLOG", ""), CHUNK_SIZE, (page - 1) * CHUNK_SIZE],
      );

      const users = result[0];

      if (!users.length) break;

      for (const u of users) {
        await Db.table("website_users")
          .where("user_id", u.user_id)
          .update({
            user_login: u.user_login,
            user_pass: u.user_pass,
            display_name: u.display_name,
            peddler_no: u.peddler_customer_no,
            updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
          })
          .then(async (affected) => {
            if (!affected) {
              await Db.table("website_users").insert({
                user_id: u.user_id,
                user_login: u.user_login,
                user_pass: u.user_pass,
                display_name: u.display_name,
                peddler_no: u.peddler_customer_no,
                date_added: moment().format("YYYY-MM-DD HH:mm:ss"),
                updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
              });
            }
          });
      }

      page++;
    }
  }

  async getCustomerCodes() {
    try {
      return await Db.connection("mysql_srspos")
        .select("customercode")
        .from("peddler_customers");
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  async getFinishedPayments(page = 1, limit = 20, search = null) {
    try {
      const query = Db.connection("mssql_srspos")
        .from("FinishedPayments as fp")
        .innerJoin("peddler_customers as pc", "pc.customercode", "fp.AccountNo")
        .where("fp.Remarks", "peddler");

      if (search) {
        query.andWhere(function () {
          this.where("fp.TransactionNo", "like", `%${search}%`)
            .orWhere("fp.ApprovalNo", "like", `%${search}%`)
            .orWhere("fp.TerminalNo", "like", `%${search}%`)
            .orWhere("pc.description", "like", `%${search}%`);
        });
      }

      const result = await query
        .select([
          "fp.TransactionNo",
          "fp.TenderCode",
          "fp.Description",
          "fp.Amount",
          "fp.AccountNo",
          "fp.ApprovalNo",
          "fp.Remarks",
          "fp.TerminalNo",
          "fp.BranchCode",
          "fp.LogDate",
          "pc.description as customername",
        ])
        .orderBy("fp.LogDate", "desc")
        .paginate(page, limit);

      return {
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.perPage,
        pageCount: result.lastPage,
      };
    } catch (error) {
      console.error("getFinishedPayments error:", error);
      return {
        data: [],
        total: 0,
        page,
        limit,
        pageCount: 0,
      };
    }
  }

  async getDownlineCustomerTransaction(transactionNo, terminalNo) {
    try {
      const finished_sales = await Db.connection("mssql_srspos")
        .from("FinishedSales")
        .select([
          "Barcode",
          Db.raw("SUM(Qty) AS Qty"),
          Db.raw("MAX(ProductID) AS ProductID"),
          Db.raw("MAX(Description) AS Description"),
          Db.raw("MAX(UOM) AS UOM"),
          Db.raw("MAX(Price) AS Price"),
        ])
        .where("TransactionNo", transactionNo)
        .andWhere("TerminalNo", terminalNo)
        .groupBy("Barcode");

      return finished_sales;
    } catch (e) {
      console.log(e);
    }
  }

  async isFeatured(product_id, product_featured) {
    let isVerify = await Db.connection("online_mysql")
      .select("*")
      .from(`term_relationships`)
      .where("object_id", product_id)
      .andWhere("term_taxonomy_id", 1091);

    if (product_featured == 1) {
      if (isVerify.length) {
        return;
      } else {
        await Db.connection("online_mysql").raw(
          `
            INSERT IGNORE INTO wp_5_term_relationships
            (object_id, term_taxonomy_id)
            VALUES (?, ?)
          `,
          [product_id, 1091],
        );

        await this.clearWooCache();
      }
    } else {
      if (isVerify.length) {
        await Db.connection("online_mysql")
          .table(`term_relationships`)
          .where("object_id", product_id)
          .where("term_taxonomy_id", 1091)
          .delete();

        await this.clearWooCache();
      }
    }
    try {
    } catch (e) {
      console.log("isFeatured_error", e);
    }
  }

  async clearWooCache() {
    try {
      await Db.connection("online_mysql")
        .table(`options`)
        .where((builder) => {
          builder
            .where("option_name", "like", "_transient_wc_%")
            .orWhere("option_name", "like", "_transient_timeout_wc_%");
        })
        .delete();
    } catch (e) {
      console.log("clearWooCache", e);
    }
  }

  async getFinishedPaymentsDateRange(dateFrom, dateTo) {
    try {
      const result = await Db.connection("mssql_srspos")
        .from("FinishedPayments as fp")
        .innerJoin("peddler_customers as pc", "pc.customercode", "fp.AccountNo")
        .where("fp.Remarks", "peddler")
        .whereBetween("fp.LogDate", [dateFrom, dateTo])
        .select([
          "fp.TransactionNo",
          "fp.TenderCode",
          "fp.Description",
          "fp.Amount",
          "fp.AccountNo",
          "fp.ApprovalNo",
          "fp.Remarks",
          "fp.TerminalNo",
          "fp.BranchCode",
          "fp.LogDate",
          "pc.description as customername",
        ])
        .orderBy("fp.LogDate", "asc");

      return result;
    } catch (error) {
      console.error("getFinishedPaymentsByDateRange error:", error);
      return [];
    }
  }

  async OnlineCreateCoupon(
    coupon_name,
    couponAmount,
    couponFreeShipping,
    couponExpiry,
    couponMinimumSpend,
    couponMaximumSpend,
    couponExcludeCategories = [],
    couponUsageLimitCoupon,
    couponUsageLimitUser,
    couponStatus,
  ) {
    const trx = await Db.connection("online_mysql").beginTransaction();

    try {
      const now = moment().format("YYYY-MM-DD HH:mm:ss");

      const postData = {
        post_author: 1,
        post_date: now,
        post_date_gmt: now,
        post_title: coupon_name.toUpperCase(),
        post_status: couponStatus,
        comment_status: "closed",
        ping_status: "closed",
        post_name: coupon_name.toLowerCase(),
        menu_order: 0,
        post_type: "shop_coupon",
        post_content: "",
        post_excerpt: "",
        to_ping: "",
        pinged: "",
        post_content_filtered: "",
        post_parent: 0,
        post_mime_type: "",
        guid: "",
      };

      const [postId] = await trx.insert(postData).into("posts");

      // Use env variable instead of hardcoded domain
      const baseUrl = process.env.url || "https://www.srspeddler.com";

      await trx("posts")
        .where("ID", postId)
        .update({
          guid: `${baseUrl}/?post_type=shop_coupon&#038;p=${postId}`,
        });

      const wp_postmeta = [];

      const pushMeta = (key, value) => {
        wp_postmeta.push({
          post_id: postId,
          meta_key: key,
          meta_value: value,
        });
      };

      // Required metas
      pushMeta("coupon_amount", couponAmount ?? 0);
      pushMeta("free_shipping", couponFreeShipping ?? 0);
      pushMeta("usage_limit", couponUsageLimitCoupon ?? 0);
      pushMeta("usage_limit_per_user", couponUsageLimitUser ?? 0);

      // Optional metas
      if (couponMinimumSpend !== "" && couponMinimumSpend !== null)
        pushMeta("minimum_amount", couponMinimumSpend);

      if (couponMaximumSpend !== "" && couponMaximumSpend !== null)
        pushMeta("maximum_amount", couponMaximumSpend);

      if (
        Array.isArray(couponExcludeCategories) &&
        couponExcludeCategories.length
      )
        pushMeta(
          "exclude_product_categories",
          locutus.serialize(couponExcludeCategories),
        );

      if (couponExpiry) pushMeta("date_expires", moment(couponExpiry).unix());

      // Default WooCommerce metas
      const defaultMetas = {
        discount_type: "fixed_cart",
        individual_use: "no",
        limit_usage_to_x_items: 0,
        exclude_sale_items: "no",
        _wjecf_products_and: "no",
        _wjecf_payment_methods: 'a:2:{i:0;s:3:"cod";}',
        _wjecf_is_auto_coupon: "no",
        _wjecf_apply_silently: "no",
      };

      Object.entries(defaultMetas).forEach(([key, value]) =>
        pushMeta(key, value),
      );

      await trx.insert(wp_postmeta).into("postmeta");

      await trx.commit();
      return true;
    } catch (error) {
      console.error("OnlineCreateCoupon Model Error:", error);
      await trx.rollback();
      return false;
    }
  }

  async getCouponDetails(coupon_id) {
    try {
      if (!coupon_id) return null;

      const rows = await Db.connection("online_mysql")
        .select(
          "wp.ID",
          "wp.post_title",
          "wp.post_status",
          "wpm.meta_key",
          "wpm.meta_value",
        )
        .from(`posts as wp`)
        .innerJoin(`${DbPrefix}postmeta as wpm`, "wp.ID", "wpm.post_id")
        .where("wp.ID", coupon_id)
        .andWhere("wp.post_type", "shop_coupon")
        .andWhereNot("wpm.meta_key", "_used_by");

      return rows.length ? rows : null;
    } catch (error) {
      console.error("getCouponDetails Model Error:", error);
      return null;
    }
  }

  async OnlineUpdateCoupon(
    coupon_id,
    coupon_name,
    couponAmount,
    couponFreeShipping,
    couponExpiry,
    couponMinimumSpend,
    couponMaximumSpend,
    couponExcludeCategories = [],
    couponUsageLimitCoupon,
    couponUsageLimitUser,
    couponStatus,
  ) {
    const trx = await Db.connection("online_mysql").beginTransaction();

    try {
      const now = moment().format("YYYY-MM-DD HH:mm:ss");

      // ✅ Update wp_posts
      await trx("posts").where("ID", coupon_id).update({
        post_title: coupon_name.toUpperCase(),
        post_status: couponStatus,
        comment_status: "closed",
        ping_status: "closed",
        post_name: coupon_name.toLowerCase(),
        post_modified: now,
        post_modified_gmt: now,
      });

      const updateMeta = async (key, value) => {
        await trx("postmeta")
          .where({ post_id: coupon_id, meta_key: key })
          .update({ meta_value: value });
      };

      // Required metas
      await updateMeta("coupon_amount", couponAmount ?? 0);
      await updateMeta("free_shipping", couponFreeShipping ?? 0);
      await updateMeta("usage_limit", couponUsageLimitCoupon ?? 0);
      await updateMeta("usage_limit_per_user", couponUsageLimitUser ?? 0);

      // Optional metas
      if (couponMinimumSpend !== "" && couponMinimumSpend !== null)
        await updateMeta("minimum_amount", couponMinimumSpend);

      if (couponMaximumSpend !== "" && couponMaximumSpend !== null)
        await updateMeta("maximum_amount", couponMaximumSpend);

      if (Array.isArray(couponExcludeCategories))
        await updateMeta(
          "exclude_product_categories",
          couponExcludeCategories.length
            ? locutus.serialize(couponExcludeCategories)
            : "",
        );

      if (couponExpiry) {
        const timestamp = moment(couponExpiry, "YYYY-MM-DD").unix();

        const existing = await trx("postmeta")
          .where({
            post_id: coupon_id,
            meta_key: "date_expires",
          })
          .first();

        if (existing) {
          await trx("postmeta")
            .where({
              post_id: coupon_id,
              meta_key: "date_expires",
            })
            .update({ meta_value: timestamp });
        } else {
          await trx("postmeta").insert({
            post_id: coupon_id,
            meta_key: "date_expires",
            meta_value: timestamp,
          });
        }
      } else {
        await trx("postmeta")
          .where({
            post_id: coupon_id,
            meta_key: "date_expires",
          })
          .delete();
      }

      await trx.commit();
      return true;
    } catch (error) {
      console.error("OnlineUpdateCoupon Model Error:", error);
      await trx.rollback();
      return false;
    }
  }

  async OnlineGetAllCoupons(
    p_page = 1,
    p_search = "",
    p_currentSort = "ID",
    p_currentSortDir = "desc",
  ) {
    try {
      const allowedSortColumns = ["ID", "post_title", "post_status"];
      const allowedSortDir = ["asc", "desc"];

      const sortColumn = allowedSortColumns.includes(p_currentSort)
        ? p_currentSort
        : "ID";

      const sortDirection = allowedSortDir.includes(
        (p_currentSortDir || "").toLowerCase(),
      )
        ? p_currentSortDir
        : "desc";

      const query = Db.connection("online_mysql")
        .from("posts")
        .select("ID", "post_title", "post_status")
        .where("post_type", "shop_coupon")
        .whereIn("post_status", ["publish", "draft"]);

      if (p_search) {
        query.andWhere((builder) => {
          builder.where("post_title", "like", `%${p_search}%`);
        });
      }

      const result = await query
        .orderBy(sortColumn, sortDirection)
        .paginate(p_page, 20);

      return {
        data: result,
        page_count: result.lastPage,
      };
    } catch (error) {
      console.error("OnlineGetAllCoupons Model Error:", error);
      return null;
    }
  }

  async OnlineDeleteCoupon(coupon_id) {
    const trx = await Db.connection("online_mysql").beginTransaction();

    try {
      const coupon = await trx("posts")
        .where({
          ID: coupon_id,
          post_type: "shop_coupon",
        })
        .first();

      if (!coupon) {
        await trx.rollback();
        return false;
      }

      await trx("postmeta").where("post_id", coupon_id).del();

      await trx("posts").where("ID", coupon_id).del();

      await trx.commit();
      return true;
    } catch (error) {
      console.error("OnlineDeleteCoupon Model Error:", error);
      await trx.rollback();
      return false;
    }
  }

  async getAllCategories() {
    const row = await Db.connection("online_mysql").raw(`
      WITH RECURSIVE category_tree AS (
          -- Parent categories
          SELECT 
              t.term_id,
              t.name,
              tt.parent,
              0 AS level,
              LPAD(t.term_id, 6, '0') AS sort_path
          FROM ${DbPrefix}terms t
          JOIN ${DbPrefix}term_taxonomy tt 
              ON t.term_id = tt.term_id
          WHERE tt.taxonomy = 'product_cat'
            AND tt.parent = 0

          UNION ALL

          -- Child categories
          SELECT 
              t.term_id,
              t.name,
              tt.parent,
              ct.level + 1,
              CONCAT(ct.sort_path, '-', LPAD(t.term_id, 6, '0'))
          FROM ${DbPrefix}terms t
          JOIN ${DbPrefix}term_taxonomy tt 
              ON t.term_id = tt.term_id
          JOIN category_tree ct 
              ON tt.parent = ct.term_id
          WHERE tt.taxonomy = 'product_cat'
      )

      SELECT 
          term_id,
          CONCAT(REPEAT('— ', level), name) AS category_name
      FROM category_tree
      ORDER BY sort_path
    `);

    const result = row[0];

    return result.map((row) => ({
      term_id: row.term_id,
      category_name: row.category_name.replace(/&amp;/gi, "&"),
    }));
  }

  async SearchProducts(search) {
    try {
      const fSearch = search ? `%${search}%` : "%%";

      let res = await Db.select("ProductID", "productName")
        .from("online_shop_products")
        .where("productName", "like", fSearch)
        .limit(10);

      return res;
    } catch (e) {
      console.log(e);
    }
  }
}

module.exports = new Services();
