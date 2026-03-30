"use strict";
const ServicesMod = use("App/Models/Services");
const Helpers = use("Helpers");
const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;
const Excel = require("exceljs");
const Env = use("Env");
const ftp = require("basic-ftp");
const ExcelJS = require("exceljs");
const moment = use("moment");

class ServiceController {
  constructor() {
    this.WooCommerce = new WooCommerceRestApi({
      url: Env.get("url", ""),
      consumerKey: Env.get("consumerKey", ""),
      consumerSecret: Env.get("consumerSecret", ""),
      version: "wc/v3",
    });

    this.FTPClient = new ftp.Client();
    this.FTPSettings = {
      host: "ftp.srspeddler.com",
      user: "u460796533.srspeddler",
      password: "ZYhDoe5N0VZizq*H9f",
      secure: false,
    };
  }

  async get_products({ request, response }) {
    try {
      const { p_page, p_search, p_currentSort, p_currentSortDir } =
        request.post();

      const [products, page_count] = await ServicesMod.get_products(
        p_page,
        p_search,
        p_currentSort,
        p_currentSortDir,
      );

      if (!products.length) {
        return response.status(200).send({ res: [], page_count });
      }

      const productIDs = products.map((p) => p.ProductID);
      const locations = await ServicesMod.get_products_location(productIDs);
      const featureds = await ServicesMod.get_products_featured(productIDs);

      const locationMap = Object.fromEntries(
        locations.map((loc) => [loc.ProductID, loc]),
      );

      const featuredMap = Object.fromEntries(
        featureds.map((fet) => [fet.object_id, fet]),
      );

      const res = products.map((item) => {
        const loc = locationMap[item.ProductID] || {};
        return {
          product_id: item.ProductID,
          product_name: item.productName,
          product_mode: item.excluded,
          product_status: item.published === 1 ? "Published" : "Unpublished",
          product_featured: featuredMap[item.ProductID] ? 1 : 0,
          product_price: loc.Price ?? 0,
          product_stock: loc.Stock ?? 0,
        };
      });

      return response.status(200).send({ res, page_count });
    } catch (error) {
      console.error("Error in get_products:", error);
      return response.status(500).send({ message: error.message });
    }
  }

  async get_products_unpublished({ request, response }) {
    let { p_page, p_search, p_currentSort, p_currentSortDir } = request.post([
      "p_page",
      "p_search",
      "p_currentSort",
      "p_currentSortDir",
    ]);
    try {
      let [res, page_count] = await ServicesMod.get_products_unpublished(
        p_page,
        p_search,
        p_currentSort,
        p_currentSortDir,
      );
      return response.status(200).send({ res, page_count });
    } catch (e) {
      console.log(e);
      return response.status(408).send(e.message);
    }
  }

  async update_products_unpublished({ request, response }) {
    let { list_of_ids, display_name, user_id } = request.post([
      "list_of_ids",
      "display_name",
      "user_id",
    ]);
    try {
      let data = {
        status: "publish",
      };

      let pub_id = [];

      for (const id of list_of_ids) {
        let prodUpdate = await this.WooCommerce.put(`products/${id}`, data);
        if (prodUpdate.status == 200) {
          pub_id.push(id);
        }
      }

      if (pub_id.length == list_of_ids.length) {
        let row = await ServicesMod.update_products_unpublished(list_of_ids);
        if (row) {
          await ServicesMod.audit_trail(
            user_id,
            "",
            display_name,
            `INSERT PRODUCT ${list_of_ids}`,
          );
          return response.status(200).send("Successfully Inserted");
        }
      } else {
        return response.status(408).send({
          msg: "an error occured while updating the status of products.",
        });
      }
    } catch (e) {
      console.log(e);
      return response.status(408).send(e.message);
    }
  }

  async update_products_status({ request, response }) {
    let { product_id, display_name, user_id } = request.post([
      "product_id",
      "display_name",
      "user_id",
    ]);
    try {
      let data = {
        status: "draft",
      };

      let prodUpdate = await this.WooCommerce.put(
        `products/${product_id}`,
        data,
      );
      if (prodUpdate.status == 200) {
        let row = await ServicesMod.update_products_status(product_id);
        if (row) {
          await ServicesMod.audit_trail(
            user_id,
            "",
            display_name,
            `UNPUBLISHED PRODUCT ${product_id}`,
          );
          return response.status(200).send({ status: true });
        }
      } else {
        return response.status(408).send("Error");
      }
    } catch (e) {
      console.log(e);
      return response.status(408).send(e.message);
    }
  }

  async get_orders({ request, response }) {
    let { p_page, p_search, p_currentSort, p_currentSortDir, p_orderType } =
      request.post([
        "p_page",
        "p_search",
        "p_currentSort",
        "p_currentSortDir",
        "p_orderType",
      ]);
    let location_name = "srs-novaliches";
    try {
      let [res, page_count] = await ServicesMod.get_orders(
        p_page,
        p_search,
        p_currentSort,
        p_currentSortDir,
        p_orderType,
      );
      // let orders = []
      // for(const row of res) {
      //     orders.push(row.order_id)
      // }
      // let [resF, page_count] = await ServicesMod.get_all_orders_by_location(orders, p_page, p_search, p_currentSort, p_currentSortDir, p_orderType)
      return response.status(200).send({ res, page_count });
    } catch (e) {
      console.log(e);
      return response.status(408).send(e.message);
    }
  }

  async get_products_oos({ request, response }) {
    let { p_page, p_search, p_currentSort, p_currentSortDir } = request.post([
      "p_page",
      "p_search",
      "p_currentSort",
      "p_currentSortDir",
    ]);
    try {
      let [res, page_count] = await ServicesMod.get_products(
        p_page,
        p_search,
        p_currentSort,
        p_currentSortDir,
      );
      for (let i = 0; i < res.length; i++) {
        let tRow = await ServicesMod.get_products_location(res[i].ID);
        if (tRow.Stock <= 0) {
          res[i] = {
            product_id: res[i].ID,
            product_name: res[i].post_title,
            product_status: res[i].post_status,
            product_price: tRow.Price,
            product_stock: tRow.Stock,
          };
        }
      }
      return response.status(200).send({ res, page_count });
    } catch (e) {
      console.log(e);
      return response.status(408).send(e.message);
    }
  }

  async update_product_excluded({ request, response }) {
    let {
      product_id,
      product_price,
      product_price_ws,
      product_mode,
      product_mode_ws,
      product_featured,
      display_name,
      user_id,
    } = request.post([
      "product_id",
      "product_price",
      "product_price_ws",
      "product_mode",
      "product_mode_ws",
      "product_featured",
      "location_id",
      "display_name",
      "user_id",
    ]);
    try {
      await ServicesMod.isFeatured(product_id, product_featured);

      if (product_mode == 1) {
        let data = [];

        if (product_price_ws != 0) {
          data = {
            regular_price: product_price,
            status: "publish",
          };
        } else {
          data = {
            regular_price: product_price,
            status: "publish",
          };
        }

        let prodUpdate = await this.WooCommerce.put(
          `products/${product_id}`,
          data,
        );
        console.log(prodUpdate);
        if (prodUpdate.status == 200) {
          let row = await ServicesMod.update_product_excluded(
            product_id,
            product_mode,
          );
          if (row) {
            await ServicesMod.audit_trail(
              user_id,
              "",
              display_name,
              `MANUAL PRODUCT PRICING ${product_price} & FEATURED STATUS ${product_featured}`,
            );
            return response.status(200).send(true);
          }
        }
      } else {
        let row = await ServicesMod.update_product_excluded(
          product_id,
          product_mode,
        );
        if (row) {
          await ServicesMod.audit_trail(
            user_id,
            "",
            display_name,
            `AUTO PRODUCT PRICING ${product_price} & FEATURED STATUS ${product_featured}`,
          );
          return response.status(200).send(true);
        }
      }
    } catch (e) {
      console.log(e);
      return response.status(408).send(e.message);
    }
  }

  async get_order_items({ request, response }) {
    let { order_id } = request.post(["order_id"]);
    try {
      let row = await ServicesMod.get_order_items(order_id);
      return response.status(200).send(row);
    } catch (e) {
      console.log(e);
      return response.status(408).send(e.message);
    }
  }

  async update_order({ request, response }) {
    let { order_id, status, display_name, user_id, items } = request.post([
      "order_id",
      "status",
      "display_name",
      "user_id",
      "items",
    ]);

    try {
      // 1️⃣ Fetch current order from WooCommerce
      const { data: order } = await this.WooCommerce.get(`orders/${order_id}`);
      const wooItems = order.line_items || [];

      // 2️⃣ Clean status
      const cleanStatus = status.replace("wc-", "");

      let updatedLineItems = [];
      for (const row of items) {
        const qty = Number(row.Qty || 0);
        const productID = Number(row.productID);
        const variationID = Number(row.variationID || 0);

        const price = Number(row.price || 0); // ✅ UNIT PRICE
        const subtotal = Number(row.subtotal || 0); // ✅ TOTAL

        // 🛑 skip invalid
        if (!productID) continue;

        // 3️⃣ Find existing Woo line item by product_id + variation_id
        const existing = wooItems.find(
          (w) =>
            Number(w.product_id) === productID &&
            Number(w.variation_id || 0) === variationID,
        );

        // 4️⃣ Delete item if qty = 0
        if (qty === 0) {
          if (existing) {
            updatedLineItems.push({ id: existing.id, quantity: 0 });
          }
          continue; // skip further processing
        }

        // 5️⃣ Insert new item if it doesn’t exist
        if (!existing) {
          updatedLineItems.push({
            product_id: productID,
            variation_id: variationID || undefined,
            quantity: qty,
            subtotal: subtotal.toFixed(2),
            total: subtotal.toFixed(2),
          });
          continue;
        }

        // 6️⃣ Update existing item
        updatedLineItems.push({
          id: existing.id,
          quantity: qty,
          subtotal: subtotal.toFixed(2),
          total: subtotal.toFixed(2),
        });
      }

      // 7️⃣ Send update request
      const { data } = await this.WooCommerce.put(`orders/${order_id}`, {
        status: cleanStatus,
        line_items: updatedLineItems,
      });

      // 8️⃣ Audit trail
      await ServicesMod.audit_trail(
        user_id,
        "",
        display_name,
        `UPDATE ORDER ${order_id} STATUS: ${cleanStatus} LINEITEMS: ${JSON.stringify(updatedLineItems)}`,
      );
      return response.status(200).send({ status: true });
    } catch (e) {
      console.error(
        "WooCommerce update failed:",
        e.response?.data || e.message,
      );
      return response.status(500).send({
        status: false,
        message: e.response?.data?.message || e.message,
      });
    }
  }

  async add_user({ request, response }) {
    let {
      username,
      userpass,
      userrole,
      userbranch,
      userfirstname,
      userlastname,
      location_id,
      location_name,
      user_id,
    } = request.only([
      "username",
      "userpass",
      "userrole",
      "userbranch",
      "userfirstname",
      "userlastname",
      "location_id",
      "location_name",
      "user_id",
    ]);
    try {
      let res = await ServicesMod.add_user(
        username,
        userpass.replace(/\s/g, ""),
        userrole,
        userbranch,
        userfirstname,
        userlastname,
      );
      if (res) {
        await ServicesMod.audit_trail(
          user_id,
          location_id,
          location_name,
          `ADDED USER ${username}`,
        );
        return response.status(200).send(res);
      } else {
        return response.status(408).send(res.message);
      }
    } catch (e) {
      console.log(e);
      return response.status(408).send(e.message);
    }
  }

  async update_user({ request, response }) {
    const {
      admin_user_id,
      user_id,
      peddler_customer_no,
      peddler_customer_name,
      peddler_customer_percentage,
      user_login,
      display_name,
      user_role,
    } = request.only([
      "admin_user_id",
      "user_id",
      "peddler_customer_no",
      "peddler_customer_name",
      "peddler_customer_percentage",
      "user_login",
      "display_name",
      "user_role",
    ]);

    try {
      const res = await ServicesMod.update_website_user(
        user_id,
        peddler_customer_no,
        peddler_customer_name,
        peddler_customer_percentage,
        user_login,
        display_name,
        user_role,
      );

      await ServicesMod.audit_trail(
        admin_user_id,
        "",
        display_name,
        `UPDATE USER ${user_id}`,
      );

      return response.status(200).send(res);
    } catch (e) {
      console.error(e);
      return response.status(500).send({ status: "error", message: e.message });
    }
  }

  async role_cheker(user_role) {
    if (user_role == 1) {
      return "Peddler";
    } else if (user_role == 2) {
      return "Franchisee";
    } else if (user_role == 3) {
      return "Compal";
    } else if (user_role == 4) {
      return "Admin";
    } else {
      return "Employee";
    }
  }

  async get_branches({ request, response }) {
    try {
      let res = await ServicesMod.get_branches();
      return response.status(200).send({ res });
    } catch (e) {
      console.log(e);
      return response.status(408).send(e.message);
    }
  }

  async get_users_lists({ request, response }) {
    let { branch } = request.only(["branch"]);
    try {
      console.log(branch);
      let res = await ServicesMod.get_users_lists(branch);
      return response.status(200).send({ res });
    } catch (e) {
      console.log(e);
      return response.status(408).send(e.message);
    }
  }

  async get_user_details({ request, response }) {
    let { branch, account_no } = request.only(["branch", "account_no"]);
    try {
      let res = await ServicesMod.get_user_details(branch, account_no);
      if (res) {
        return response.status(200).send({ res });
      } else {
        res = "Account No. not found";
        return response.status(200).send({ res: res, status: false });
      }
    } catch (e) {
      console.log(e);
      return response.status(408).send(e.message);
    }
  }

  async get_total_order_amount({ request, response }) {
    let { branch, account_no } = request.only(["branch", "account_no"]);
    try {
      let row = await ServicesMod.get_total_order_amount(branch, account_no);
      return response.status(200).send({ row });
    } catch (e) {
      console.log(e);
      return response.status(408).send(e.message);
    }
  }

  async get_total_order_count({ request, response }) {
    let { branch, account_no } = request.only(["branch", "account_no"]);
    try {
      let row = await ServicesMod.get_total_order_count(branch, account_no);
      return response.status(200).send({ row });
    } catch (e) {
      console.log(e);
      return response.status(408).send(e.message);
    }
  }

  async get_total_order_amount_month({ request, response }) {
    let { branch, account_no } = request.only(["branch", "account_no"]);
    try {
      let row = await ServicesMod.get_total_order_amount_month(
        branch,
        account_no,
      );
      return response.status(200).send({ row });
    } catch (e) {
      console.log(e);
      return response.status(408).send(e.message);
    }
  }

  async get_total_order_count_month({ request, response }) {
    let { account_no } = request.only(["account_no"]);
    try {
      let row = await ServicesMod.get_total_order_count_month(account_no);
      return response.status(200).send({ row });
    } catch (e) {
      console.log(e);
      return response.status(408).send(e.message);
    }
  }

  async get_list_of_transactions({ request, response }) {
    let { p_page, p_currentSort, p_currentSortDir } = request.only([
      "p_page",
      "p_currentSort",
      "p_currentSortDir",
    ]);
    let account_no = "4272444737";
    let branch = "SRSMNOVA";
    try {
      let [res, count] = await ServicesMod.get_list_of_transactions(
        branch,
        account_no,
        p_page,
        p_currentSort,
        p_currentSortDir,
      );
      let page_count = parseInt(count / 10);
      return response.status(200).send({ res, page_count });
    } catch (e) {
      console.log(e);
      return response.status(408).send(e.message);
    }
  }

  async get_transaction_details({ request, response }) {
    let { TransactionNo, TerminalNo, branch } = request.only([
      "TransactionNo",
      "TerminalNo",
      "branch",
    ]);
    try {
      let res = await ServicesMod.get_transaction_details(
        TransactionNo,
        TerminalNo,
        branch,
      );
      return response.status(200).send({ res });
    } catch (e) {
      console.log(e);
      return response.status(408).send(e.message);
    }
  }

  // FOR PRODUCT BATCH UPLOAD ONLY
  async custom_batch_upload({ request, response }) {
    try {
      let upload = request.file("upload");
      let userid = "1";
      let fileName = `user~${userid}~products.${upload.extname}`;
      let dir = "products/";

      await upload.move(Helpers.publicPath(dir), {
        name: fileName,
        overwrite: true,
      });

      if (!upload.moved()) {
        return (
          upload.error(),
          "AN ERROR OCCURED ON UPLOADING EXCEL FILE",
          500
        );
      }

      let fileLocation = "public/" + dir + fileName;

      var workbook = new Excel.Workbook();
      workbook = await workbook.xlsx.readFile(fileLocation);
      let explanation = workbook.getWorksheet(1);
      let retItems = [];
      for (let i = 0; i <= explanation.rowCount; i++) {
        if (i >= 2) {
          if (
            explanation.getCell("A" + i).value == "" ||
            explanation.getCell("A" + i).value == null
          )
            continue;
          if (explanation.getCell("C" + i).value == "R") {
            if (
              explanation.getCell("O" + i).value == "" ||
              explanation.getCell("O" + i).value == null
            )
              continue;
            // console.log(explanation.getCell('A'+i).value, explanation.getCell('B'+i).value.toUpperCase(), explanation.getCell('E'+i).value.toUpperCase(), explanation.getCell('F'+i).value, explanation.getCell('G'+i).value, explanation.getCell('H'+i).value, explanation.getCell('I'+i).value, explanation.getCell('J'+i).value, explanation.getCell('K'+i).value, explanation.getCell('L'+i).value, explanation.getCell('M'+i).value, explanation.getCell('N'+i).value, explanation.getCell('O'+i).value, explanation.getCell('Q'+i).value, explanation.getCell('R'+i).value, explanation.getCell('S'+i).value)
            await this.createRProduct(
              explanation.getCell("A" + i).value,
              explanation.getCell("B" + i).value.toUpperCase(),
              explanation.getCell("E" + i).value.toUpperCase(),
              explanation.getCell("F" + i).value,
              explanation.getCell("G" + i).value,
              explanation.getCell("H" + i).value,
              explanation.getCell("I" + i).value,
              explanation.getCell("J" + i).value,
              explanation.getCell("K" + i).value,
              explanation.getCell("L" + i).value,
              explanation.getCell("M" + i).value,
              explanation.getCell("N" + i).value,
              explanation.getCell("O" + i).value,
              explanation.getCell("Q" + i).value,
              explanation.getCell("R" + i).value,
              explanation.getCell("S" + i).value,
            );
            // if(ret_product[0].status != false) {
            //     retItems.push({
            //         type: 'Retail',
            //         sku: explanation.getCell('A'+i).value,
            //         name: explanation.getCell('B'+i).value,
            //         uom: explanation.getCell('N'+i).value,
            //         barcode_ret: explanation.getCell('O'+i).value,
            //         barcode_ws: '',
            //         price: ret_product[0].price,
            //         stock_quantity: ret_product[0].ProductDetailslingArea
            //     })
            // }
          }
        }
      }
      // let finalData = []

      // for(const row of retItems) {
      //     finalData.push({
      //         type: 'Retail',
      //         sku: row.sku,
      //         name: row.name,
      //         uom: row.uom,
      //         barcode_ret: row.barcode_ret,
      //         barcode_ws: row.barcode_ws,
      //         price: row.price,
      //         stock_quantity: row.stock_quantity
      //     })
      // }

      // return response.status(200).send({ finalData })
    } catch (e) {
      console.log(e);
      // return response.status(403).send(e.message)
    }
  }

  async createRProduct(
    sku,
    productName,
    shortDescription,
    mainCat1,
    subCat1,
    mainCat2,
    subCat2,
    mainCat3,
    subCat3,
    mainCat4,
    subCat4,
    uom,
    barcode_ret,
    grams,
    by_barcode,
    imageUrl,
  ) {
    try {
      let prod_details_ret;
      if (
        by_barcode == "Y" ||
        by_barcode == "Yes" ||
        by_barcode == "yes" ||
        by_barcode == "y"
      ) {
        let temp_sku = sku;
        let temp_barcode = barcode_ret;
        sku = temp_barcode;
        barcode_ret = temp_sku;
        prod_details_ret = await ServicesMod.getStockPriceBarcode(
          sku.toString(),
          barcode_ret.toString(),
        );
      } else {
        prod_details_ret = await ServicesMod.getStockPrice(
          sku.toString(),
          barcode_ret.toString(),
        );
      }

      if (!prod_details_ret) {
        let msg = `INVALID GLOBAL ID ${sku} WITH PRODUCT NAME: ${productName} AND BARCODE ${barcode_ret}`;
        //await UserMaintenanceMod.upload_product_error(msg, user_id, full_name)
        // let data = []
        // data.push({
        //     status: false,
        //     message: msg
        // })
        // return data
        console.log(msg);
      }

      let itemPrice = prod_details_ret.srp;
      if (grams != null) {
        itemPrice = (prod_details_ret.srp / 1000) * grams;
      }
      const data = {
        sku: sku.toString(),
        name: productName.toString(),
        type: "simple",
        stock_quantity:
          parseInt(prod_details_ret.SellingArea) > 0
            ? parseInt(prod_details_ret.SellingArea)
            : 0,
        regular_price: itemPrice.toString(),
        short_description: shortDescription,
        categories: [
          {
            id: mainCat1,
          },
          subCat1 != null
            ? {
                id: subCat1,
              }
            : "",
          mainCat2 != null
            ? {
                id: mainCat2,
              }
            : "",
          subCat2 != null
            ? {
                id: subCat2,
              }
            : "",
          mainCat3 != null
            ? {
                id: mainCat3,
              }
            : "",
          subCat3 != null
            ? {
                id: subCat3,
              }
            : "",
          mainCat4 != null
            ? {
                id: mainCat4,
              }
            : "",
          subCat4 != null
            ? {
                id: subCat4,
              }
            : "",
        ],
        manage_stock: true,
        images: [
          {
            src: imageUrl,
            position: 0,
          },
        ],
        meta_data: [
          uom != null
            ? {
                key: "_woo_uom_input",
                value: uom.toString(),
              }
            : "",
          barcode_ret != null
            ? {
                key: "_srs_barcode",
                value: barcode_ret.toString(),
              }
            : "",
          grams != null
            ? {
                key: "_srs_weighing_scale",
                value: grams.toString(),
              }
            : "",
          by_barcode != null
            ? {
                key: "_srs_item_by_barcode_globalid",
                value: by_barcode.toString(),
              }
            : "",
        ],
      };

      let result = await this.WooCommerce.post("products", data);

      if (result.data.id != null) {
        //await ServicesMod.insertProductDB(result.data.id, result.data.sku, result.data.name, barcode_ret, 0, grams, by_barcode, uom)
        let message = `YOU SUCCESSFULLY UPLOADED RETAIL PRODUCT ID#: ${result.data.id}!`;
        //await UserMaintenanceMod.audit_trail(user_id, full_name, 'BATCH PRODUCT UPLOAD', message)
        // let retData = []
        // retData.push({
        //     qty: prod_details_ret.SellingArea,
        //     price: itemPrice
        // })
        // return retData
        console.log(message);
      } else {
        return false;
      }
    } catch (Exception) {
      console.log(Exception);
      // let data = []
      // let errMsg = Exception.response.data.message + ` ${sku} and Product Name: ${productName}`
      // data.push({
      //     status: false,
      //     message: errMsg
      // })
      // await UserMaintenanceMod.upload_product_error(Exception.response.data.message + ` ${sku} and Product Name: ${productName}`, user_id, full_name)
      // return data
    }
  }

  async getWooProducts({ request, response }) {
    try {
      let result = await this.WooCommerce.get("products/24283");
      console.log(result.data.categories);
      return true;
    } catch (e) {
      console.log(e);
    }
  }

  async getproductcat({ request, response }) {
    let result = await ServicesMod.getproductcat();
    let res = [];
    for (const row of result) {
      let arr = [];
      let maincat = [];
      let subcat = [];
      if (row.categories == null) continue;
      arr = row.categories.split(",");
      for (let i = 0; i < arr.length; i++) {
        let catRes = await ServicesMod.getCatDets(arr[i]);
        if (catRes.type == "subcategories") {
          maincat.push({
            mainCategory: catRes.parent_id,
            subCategory: catRes.category_id,
          });
        }
      }
      res.push({
        GlobalID: row.GlobalID,
        productName: row.productName,
        priceModeCode: "R",
        productDescription: "",
        productShortDescription: "",
        mainCategory: maincat,
        uom: row.uom,
        Barcode: row.Barcode,
        grams: row.grams,
        byBarcode: row.by_barcode,
        mainImageUrl: row.mainImageUrl,
      });
    }
    let i = 1;
    for (const row of res) {
      console.log(i);
      let saveRes = await ServicesMod.saveRes(
        row.GlobalID,
        row.productName,
        row.priceModeCode,
        row.productDescription,
        row.productShortDescription,
        row.mainCategory,
        row.uom,
        row.Barcode,
        row.grams,
        row.byBarcode,
        row.mainImageUrl,
      );
      i++;
    }
  }
  // ./FOR PRODUCT BATCH UPLOAD ONLY

  // SAVING OF PRODUCTS AT DB
  async addProductsDB({ request, response }) {
    try {
      // let pageCounter = await ServicesMod.getProductUpdateCounter()
      // let prodPage = await this.WooCommerce.get('products')
      // let prodPageRes = prodPage.headers
      // console.log(prodPageRes)
      // if(pageCounter > 42) {
      //     pageCounter = 1
      // }

      for (let i = 1; i <= 67; i++) {
        const data = {
          per_page: 100,
          page: i,
        };

        let result = await this.WooCommerce.get("products", data);
        let res = result.data;
        console.log(i);
        for (const rows of res) {
          let barcode;
          let grams;
          let by_barcode;
          let uom;
          for (let i = 0; i < rows.meta_data.length; i++) {
            if (rows.meta_data[i].key == "_srs_barcode") {
              barcode = rows.meta_data[i].value;
            }
            if (rows.meta_data[i].key == "_srs_weighing_scale") {
              grams = rows.meta_data[i].value;
            }
            if (rows.meta_data[i].key == "_srs_item_by_barcode_globalid") {
              by_barcode = rows.meta_data[i].value;
            }
            if (rows.meta_data[i].key == "_woo_uom_input") {
              uom = rows.meta_data[i].value;
            }
          }
          await ServicesMod.insertProductDB(
            rows.id,
            rows.sku,
            rows.name,
            barcode,
            i,
            grams,
            by_barcode,
            uom,
          );
        }
      }
      // UPDATE PAGE COUNTER
      // let finalCounter = pageCounter+1
      // await ServicesMod.updateProductUpdateCounter(finalCounter)
    } catch (Exception) {
      console.log(Exception);
    }
  }
  // ./SAVING OF PRODUCTS AT DB

  // ONLINE WEBSITE
  async get_users({ request, response }) {
    let { p_page, p_search, p_currentSort, p_currentSortDir } = request.post([
      "p_page",
      "p_search",
      "p_currentSort",
      "p_currentSortDir",
    ]);
    try {
      let [res, page_count] = await ServicesMod.get_users(
        p_page,
        p_search,
        p_currentSort,
        p_currentSortDir,
      );
      return response.status(200).send({ res, page_count });
    } catch (e) {
      console.log(e);
      return response.status(408).send(e.message);
    }
  }

  async getDownlineCustomer({ request, response }) {
    try {
      const { p_search } = request.only(["p_search"]);

      const page = 1,
        limit = 20;

      const result = await ServicesMod.getFinishedPayments(
        page,
        limit,
        p_search,
      );

      return response.status(200).send(result);
    } catch (error) {
      console.error("Controller error:", error);
      return response.status(500).send({
        message: "Failed to fetch finished payments",
      });
    }
  }

  async getDownlineCustomerTransaction({ request, response }) {
    try {
      const { transactionNo, terminalNo, accountNo } = request.only([
        "transactionNo",
        "terminalNo",
        "accountNo",
      ]);
      let customercode = 0;

      const result = await ServicesMod.getDownlineCustomerTransaction(
        transactionNo,
        terminalNo,
      );

      let total = 0;

      for (const row of result) {
        total += row.Qty * row.Price;
      }

      return response.status(200).send({ result, total });
    } catch (e) {
      console.error("Controller error:", error);
      return response.status(500).send({
        message: "Failed to fetch finished payments",
      });
    }
  }

  async fetchBannerUrl({ response }) {
    try {
      const baseUrl = `${Env.get("url")}wp-content/uploads/sites/${Env.get("PRIMARY_BLOG")}`;

      const BANNER_COUNT = 2; // change to 3, 4, etc.

      const banners = Array.from(
        { length: BANNER_COUNT },
        (_, i) => `${baseUrl}/banner${i + 1}.jpg`,
      );

      return response.status(200).send(banners);
    } catch (e) {
      console.error("Controller error:", e);
      return response.status(500).send({
        message: "Failed to fetch banner URLs",
      });
    }
  }

  async uploadImage({ request, response }) {
    try {
      const media = request.file("media");
      const bannerIndex = Number(request.input("bannerIndex"));

      // basic validation
      if (!media) {
        return response.status(400).send({
          message: "No image file uploaded.",
        });
      }

      if (!bannerIndex || bannerIndex < 1) {
        return response.status(400).send({
          message: "Invalid banner index.",
        });
      }

      // upload with FIXED filename: banner{index}.jpg/png
      const res = await this.FTPUpload(media, bannerIndex);

      if (res && res.code === 226) {
        return response.status(200).send({
          message: `Banner ${bannerIndex} uploaded successfully.`,
        });
      }

      return response.status(500).send({
        message: "An error occurred while uploading the image.",
      });
    } catch (error) {
      console.error("uploadImage controller error:", error);
      return response.status(500).send({
        message: "An error occurred while uploading the image.",
      });
    }
  }

  async FTPUpload(media, bannerIndex) {
    try {
      // get original extension (.jpg, .png, etc)
      const ext = media.extname;

      // force filename
      const fixedFileName = `banner${bannerIndex}.${ext}`;

      // move locally with FIXED NAME
      await media.move(Helpers.publicPath("banner"), {
        name: fixedFileName,
        overwrite: true,
      });

      let fileLocation = Helpers.publicPath("banner") + "\\" + fixedFileName;

      let remotePath = `wp-content/uploads/sites/${Env.get("PRIMARY_BLOG")}/${fixedFileName}`;
      await this.FTPClient.access(this.FTPSettings);
      let res = await this.FTPClient.uploadFrom(fileLocation, remotePath);
      return res;
    } catch (error) {
      console.log("FTPUpload error:", error);
      throw error;
    } finally {
      this.FTPClient.close();
    }
  }

  async exportExcel({ request, response }) {
    try {
      const { date_from, date_to } = request.get();

      if (!date_from || !date_to) {
        return response.status(400).send({
          message: "date_from and date_to are required",
        });
      }

      const data = await ServicesMod.getFinishedPaymentsDateRange(
        date_from,
        date_to,
      );

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Finished Payments");

      worksheet.columns = [
        { header: "Transaction No", key: "TransactionNo", width: 20 },
        { header: "Customer Name", key: "customername", width: 30 },
        { header: "Tender Code", key: "TenderCode", width: 15 },
        { header: "Description", key: "Description", width: 25 },
        { header: "Amount", key: "Amount", width: 15 },
        { header: "Account No", key: "AccountNo", width: 15 },
        { header: "Approval No", key: "ApprovalNo", width: 20 },
        { header: "Remarks", key: "Remarks", width: 20 },
        { header: "Terminal No", key: "TerminalNo", width: 15 },
        { header: "Branch Code", key: "BranchCode", width: 15 },
        { header: "Log Date", key: "LogDate", width: 20 },
      ];

      data.forEach((row) => {
        worksheet.addRow(row);
      });

      response.header(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      response.header(
        "Content-Disposition",
        `attachment; filename=Peddler_Customers_${date_from}_to_${date_to}.xlsx`,
      );

      await workbook.xlsx.write(response.response);
      response.response.end();
    } catch (e) {
      console.log("exportExcel_error", e);
    }
  }

  async OnlineCreateCoupon({ request, response }) {
    try {
      const payload = request.only([
        "coupon_name",
        "couponDiscountType",
        "couponAmount",
        "couponFreeShipping",
        "couponExpiry",
        "couponMinimumSpend",
        "couponMaximumSpend",
        "couponExcludedCategories",
        "couponUsageLimitCoupon",
        "couponUsageLimitUser",
        "couponStatus",
        "display_name",
        "user_id",
      ]);

      const {
        coupon_name,
        couponAmount,
        couponFreeShipping,
        couponExpiry,
        couponMinimumSpend,
        couponMaximumSpend,
        couponExcludedCategories,
        couponUsageLimitCoupon,
        couponUsageLimitUser,
        couponStatus,
        display_name,
        user_id,
      } = payload;

      // Basic validation
      if (!coupon_name) {
        return response.status(422).send({
          code: 422,
          msg: "Coupon name and amount are required.",
        });
      }

      const formattedExpiry = couponExpiry || "";

      const result = await ServicesMod.OnlineCreateCoupon(
        coupon_name,
        couponAmount,
        couponFreeShipping == true ? "yes" : "no",
        formattedExpiry,
        couponMinimumSpend,
        couponMaximumSpend,
        couponExcludedCategories,
        couponUsageLimitCoupon,
        couponUsageLimitUser,
        couponStatus == 1 ? "publish" : "draft",
      );

      if (!result) {
        return response.status(400).send({
          code: 400,
          msg: "An error occurred during coupon creation.",
        });
      }

      await ServicesMod.audit_trail(
        user_id,
        "",
        display_name,
        `CREATE COUPON ${coupon_name}`,
      );

      return response.status(200).send({ msg: "success" });
    } catch (error) {
      console.error("OnlineCreateCoupon Error:", error);

      return response.status(500).send({
        code: 500,
        msg: "Internal server error.",
      });
    }
  }

  async getCouponDetails({ request, response }) {
    try {
      const { coupon_id } = request.only(["coupon_id"]);

      if (!coupon_id) {
        return response.status(422).send({
          code: 422,
          msg: "coupon_id is required",
        });
      }

      const result = await ServicesMod.getCouponDetails(coupon_id);

      if (!result || result.length === 0) {
        return response.status(404).send({
          code: 404,
          msg: "Coupon not found",
        });
      }

      const data = {
        coupon_name: result[0].post_title,
        coupon_status: result[0].post_status,
      };

      const metaMap = {
        usage_limit_per_user: "usage_limit_per_user",
        usage_limit: "usage_limit",
        maximum_amount: "maximum_amount",
        minimum_amount: "minimum_amount",
        coupon_amount: "coupon_amount",
        free_shipping: "free_shipping",
      };

      for (const row of result) {
        const { meta_key, meta_value } = row;

        if (!meta_key) continue;

        // Direct mappings
        if (metaMap[meta_key]) {
          data[meta_key] = meta_value;
        }

        // Expiry date
        if (meta_key === "date_expires" && meta_value) {
          data.date_expires = moment.unix(meta_value).format("YYYY-MM-DD");
        }

        // Excluded categories (serialized)
        if (meta_key === "exclude_product_categories" && meta_value) {
          data.exclude_product_categories = locutus.unserialize(meta_value);
        }
      }

      return response.status(200).send({ data });
    } catch (error) {
      console.error("getCouponDetails Error:", error);

      return response.status(500).send({
        code: 500,
        msg: "Internal server error",
      });
    }
  }

  async OnlineUpdateCoupon({ request, response }) {
    try {
      const payload = request.only([
        "coupon_id",
        "coupon_name",
        "couponDiscountType",
        "couponAmount",
        "couponFreeShipping",
        "couponExpiry",
        "couponMinimumSpend",
        "couponMaximumSpend",
        "couponExcludedCategories",
        "couponUsageLimitCoupon",
        "couponUsageLimitUser",
        "couponStatus",
        "display_name",
        "user_id",
      ]);

      const {
        coupon_id,
        coupon_name,
        couponAmount,
        couponFreeShipping,
        couponExpiry,
        couponMinimumSpend,
        couponMaximumSpend,
        couponExcludedCategories,
        couponUsageLimitCoupon,
        couponUsageLimitUser,
        couponStatus,
        display_name,
        user_id,
      } = payload;

      // ✅ Basic validation
      if (!coupon_id) {
        return response.status(422).send({
          code: 422,
          msg: "coupon_id is required",
        });
      }

      if (!coupon_name || !couponAmount) {
        return response.status(422).send({
          code: 422,
          msg: "Coupon name and amount are required",
        });
      }

      const formattedExpiry = couponExpiry || "";

      const result = await ServicesMod.OnlineUpdateCoupon(
        coupon_id,
        coupon_name,
        couponAmount,
        couponFreeShipping == true ? "yes" : "no",
        formattedExpiry,
        couponMinimumSpend,
        couponMaximumSpend,
        couponExcludedCategories,
        couponUsageLimitCoupon,
        couponUsageLimitUser,
        couponStatus == 1 ? "publish" : "draft",
      );

      if (!result) {
        return response.status(400).send({
          code: 400,
          msg: "An error occurred during coupon update.",
        });
      }

      await ServicesMod.audit_trail(
        user_id,
        "",
        display_name,
        `UPDATE COUPON ${coupon_name}`,
      );

      return response.status(200).send({ msg: "success" });
    } catch (error) {
      console.error("OnlineUpdateCoupon Error:", error);

      return response.status(500).send({
        code: 500,
        msg: "Internal server error",
      });
    }
  }

  async OnlineGetAllCoupons({ request, response }) {
    try {
      const { p_page, p_search, p_currentSort, p_currentSortDir } =
        request.only([
          "p_page",
          "p_search",
          "p_currentSort",
          "p_currentSortDir",
        ]);

      const result = await ServicesMod.OnlineGetAllCoupons(
        p_page,
        p_search,
        p_currentSort,
        p_currentSortDir,
      );

      if (!result) {
        return response.status(500).send({
          msg: "An error occurred when retrieving coupons",
        });
      }

      return response.status(200).send(result);
    } catch (error) {
      console.error("OnlineGetAllCoupons Controller Error:", error);

      return response.status(500).send({
        msg: "Internal server error",
      });
    }
  }

  async OnlineDeleteCoupon({ request, response }) {
    try {
      const { coupon_id, coupon_name, display_name, user_id } = request.only([
        "coupon_id",
        "coupon_name",
        "display_name",
        "user_id",
      ]);

      if (!coupon_id) {
        return response.status(422).send({
          code: 422,
          msg: "coupon_id is required",
        });
      }

      const result = await ServicesMod.OnlineDeleteCoupon(coupon_id);

      if (!result) {
        return response.status(400).send({
          msg: "An error occurred while deleting coupon",
        });
      }

      await ServicesMod.audit_trail(
        user_id,
        "",
        display_name,
        `DELETE COUPON ${coupon_name}`,
      );

      return response.status(200).send({
        msg: "success",
      });
    } catch (error) {
      console.error("OnlineDeleteCoupon Controller Error:", error);

      return response.status(500).send({
        msg: "Internal server error",
      });
    }
  }

  async getAllCategories({ response }) {
    const categories = await ServicesMod.getAllCategories();

    return response.status(200).send(categories);
  }

  async SearchProducts({ request, response }) {
    const { search } = request.only(["search"]);

    const row = await ServicesMod.SearchProducts(search);

    return response.status(200).send(row);
  }

  async ProductDetails({ request, response }) {
    const { ProductID } = request.only(["ProductID"]);

    let prodFetch = await this.WooCommerce.get(`products/${ProductID}`);

    return response.status(200).send(prodFetch.data.price);
  }

  async AuditLogs({ request, response }) {
    const { order_id, product_id, qty, admin_id, admin_name, desc } =
      request.only([
        "order_id",
        "product_id",
        "qty",
        "admin_id",
        "admin_name",
        "desc",
      ]);

    await ServicesMod.audit_trail(
      admin_id,
      "",
      admin_name,
      `${desc} ORDER-ID: ${order_id} PRODUCT-ID: ${product_id} NEW QTY: ${qty}`,
    );
  }

  async send_to_pos({ request, response }) {
    try {
      let { order_id, user_id, display_name } = request.post([
        "order_id",
        "user_id",
        "display_name",
      ]);

      const main_order = await this.WooCommerce.get(`orders/${order_id}`);
      let main_order_details = main_order.data;
      let couponsUsed = [];
      for (const row of main_order_details.coupon_lines) {
        if (row.discount > 0) {
          couponsUsed.push(row.code);
        }
      }

      let fAddress = `${main_order_details.billing.address_1} ${main_order_details.billing.address_2} ${main_order_details.billing.city}`;

      let order_header = {
        order_id: main_order_details.id,
        order_date: moment(main_order_details.date_created).format(
          "YYYY-MM-DD",
        ),
        customer_code: null,
        customer_name:
          main_order_details.billing.first_name +
          " " +
          main_order_details.billing.last_name,
        total_sales:
          main_order_details.shipping_total == "0.00"
            ? parseFloat(main_order_details.total)
            : parseFloat(main_order_details.total) - 149,
        with_shipping_fee:
          main_order_details.shipping_total == "0.00" ? 0 : 149,
        grand_total: parseFloat(main_order_details.total),
        payment_type: main_order_details.payment_method,
        order_status: 0,
        date_served: null,
        served_by_branch: Env.get("BRANCH_NAME"),
        TransactionNo: 0,
        TerminalNo: 0,
        total_discount: main_order_details.discount_total,
        coupons: couponsUsed.join(","),
        contact_no: main_order_details.billing.phone,
        address: fAddress,
      };

      let order_details = [];

      for (let i = 0; i < main_order_details.line_items.length; i++) {
        let prodDetails = await ServicesMod.getOnlineSearchProducts(
          main_order_details.line_items[i].product_id,
        );
        let fQty = prodDetails.grams
          ? (prodDetails.grams * main_order_details.line_items[i].quantity) /
            1000
          : main_order_details.line_items[i].quantity;
        let fSrp = prodDetails.grams
          ? await ServicesMod.getOriginalSRP(
              prodDetails.productName,
              prodDetails.by_barcode,
              prodDetails.GlobalID,
              prodDetails.Barcode,
            )
          : await ServicesMod.getOnlineSRP(prodDetails.ProductID);

        order_details.push({
          order_id: main_order_details.id,
          barcode:
            prodDetails.by_barcode == "Y" ||
            prodDetails.by_barcode == "Yes" ||
            prodDetails.by_barcode == "yes" ||
            prodDetails.by_barcode == "y"
              ? prodDetails.GlobalID
              : prodDetails.Barcode,
          description: prodDetails.productName,
          qty: fQty,
          srp: fSrp,
          subtotal: fQty * fSrp,
          qty_served: 0,
        });
      }

      if (order_details.length == 0) {
        let msg = "Hindi ma-process ang Order. Paki contact ang I.T";
        response.status(500).send({ msg });
      }

      let sendOrder = await ServicesMod.SendOrderPOS(
        order_header,
        order_details,
      );

      if (sendOrder == "existing") {
        let msg = "Ang Order na ito ay nasa POS na.";
        response.status(200).send({ msg });
      }

      if (sendOrder == false) {
        let msg = "Hindi ma-process ang Order. Paki contact ang I.T";
        response.status(500).send({ msg });
      }

      if (sendOrder == true) {
        await ServicesMod.audit_trail(
          user_id,
          "",
          display_name,
          `SEND ORDER ${main_order_details.id} TO POS`,
        );
        let msg = "Na-process na ang Order. Pwede na makita sa POS.";
        response.status(200).send({ msg });
      }
    } catch (e) {
      console.log(e);
    }
  }
}

module.exports = ServiceController;
