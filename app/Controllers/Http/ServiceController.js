"use strict";
const ServicesMod = use("App/Models/Services");
const Helpers = use("Helpers");
const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;
const Excel = require("exceljs");
const Env = use("Env");

class ServiceController {
  constructor() {
    this.WooCommerce = new WooCommerceRestApi({
      url: Env.get("url", ""),
      consumerKey: Env.get("consumerKey", ""),
      consumerSecret: Env.get("consumerSecret", ""),
      version: "wc/v3",
    });
  }

  async get_products({ request, response }) {
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
        p_currentSortDir
      );
      for (let i = 0; i < res.length; i++) {
        let tRow = await ServicesMod.get_products_location(res[i].ProductID);
        console.log(tRow);
        res[i] = {
          product_id: res[i].ProductID,
          product_name: res[i].productName,
          product_mode: res[i].excluded,
          product_status: res[i].published == 1 ? "Published" : "Unpublished",
          product_price: tRow.Price,
          product_stock: tRow.Stock,
          // product_price: 0,
          // product_stock: 0
        };
      }
      return response.status(200).send({ res, page_count });
    } catch (e) {
      console.log(e);
      return response.status(408).send(e.message);
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
        p_currentSortDir
      );
      return response.status(200).send({ res, page_count });
    } catch (e) {
      console.log(e);
      return response.status(408).send(e.message);
    }
  }

  async update_products_unpublished({ request, response }) {
    let { list_of_ids } = request.post("list_of_ids");
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
          // await ServicesMod.audit_trail(user_id, location_id, location_name, `INSERT PRODUCT ${product_id} PRICE: ${product_price} AND STOCK: ${product_stock}`)
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
    let { product_id, location_id, location_name, user_id } = request.post([
      "product_id",
      "location_id",
      "location_name",
      "user_id",
    ]);
    try {
      let data = {
        status: "draft",
      };

      let prodUpdate = await this.WooCommerce.put(
        `products/${product_id}`,
        data
      );
      if (prodUpdate.status == 200) {
        let row = await ServicesMod.update_products_status(product_id);
        if (row) {
          // await ServicesMod.audit_trail(user_id, location_id, location_name, `INSERT PRODUCT ${product_id} PRICE: ${product_price} AND STOCK: ${product_stock}`)
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
        p_orderType
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
        p_currentSortDir
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
      location_id,
      location_name,
      user_id,
    } = request.post([
      "product_id",
      "product_price",
      "product_price_ws",
      "product_mode",
      "product_mode_ws",
      "location_id",
      "location_name",
      "user_id",
    ]);
    try {
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
          data
        );
        console.log(prodUpdate);

        if (prodUpdate.status == 200) {
          let row = await ServicesMod.update_product_excluded(
            product_id,
            product_mode
          );
          if (row) {
            await ServicesMod.audit_trail(
              user_id,
              location_id,
              location_name,
              `MANUAL PRODUCT PRICING ${product_price}`
            );
            return response.status(200).send(true);
          }
        }
      } else {
        let row = await ServicesMod.update_product_excluded(
          product_id,
          product_mode
        );
        if (row) {
          await ServicesMod.audit_trail(
            user_id,
            location_id,
            location_name,
            `AUTO PRODUCT PRICING ${product_price}`
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
    let { order_id, status } = request.post(["order_id", "status"]);
    try {
      let row = await ServicesMod.update_order(order_id, status);
      return response.status(200).send(row);
    } catch (e) {
      console.log(e);
      return response.status(408).send(e.message);
    }
  }

  async get_users({ request, response }) {
    let { p_page, p_search, p_currentSort, p_currentSortDir } = request.post([
      "p_page",
      "p_search",
      "p_currentSort",
      "p_currentSortDir",
    ]);
    try {
      let [resF, page_count] = await ServicesMod.get_users(
        p_page,
        p_search,
        p_currentSort,
        p_currentSortDir
      );
      let res = [];
      for (const row of resF) {
        res.push({
          id: row.id,
          username: row.username,
          password: row.password,
          location_name: row.branch,
          user_role: row.user_role,
          user_role_details: await this.role_cheker(row.user_role),
        });
      }
      return response.status(200).send({ res, page_count });
    } catch (e) {
      console.log(e);
      return response.status(408).send(e.message);
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
    } = request.only([
      "username",
      "userpass",
      "userrole",
      "userbranch",
      "userfirstname",
      "userlastname",
    ]);
    try {
      let res = await ServicesMod.add_user(
        username,
        userpass.replace(/\s/g, ""),
        userrole,
        userbranch,
        userfirstname,
        userlastname
      );
      if (res) {
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
    let { user_id, password, user_role } = request.only([
      "user_id",
      "password",
      "user_role",
    ]);
    try {
      let res = await ServicesMod.update_user(user_id, password, user_role);
      return response.status(200).send(res);
    } catch (e) {
      console.log(e);
      return response.status(408).send(e.message);
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
        account_no
      );
      return response.status(200).send({ row });
    } catch (e) {
      console.log(e);
      return response.status(408).send(e.message);
    }
  }

  async get_total_order_count_month({ request, response }) {
    let { branch, account_no } = request.only(["branch", "account_no"]);
    try {
      let row = await ServicesMod.get_total_order_count_month(
        branch,
        account_no
      );
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
        p_currentSortDir
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
        branch
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
        return upload.error(), "AN ERROR OCCURED ON UPLOADING EXCEL FILE", 500;
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
              explanation.getCell("S" + i).value
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
            //         stock_quantity: ret_product[0].SellingArea
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
    imageUrl
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
          barcode_ret.toString()
        );
      } else {
        prod_details_ret = await ServicesMod.getStockPrice(
          sku.toString(),
          barcode_ret.toString()
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
        //await ProductMod.insertProductDB(result.data.id, result.data.sku, result.data.name, barcode_ret, 0, grams, by_barcode, uom)
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
        row.mainImageUrl
      );
      i++;
    }
  }
  // ./FOR PRODUCT BATCH UPLOAD ONLY

  // SAVING OF PRODUCTS AT DB
  async addProductsDB({ request, response }) {
    try {
      // let pageCounter = await ProductMod.getProductUpdateCounter()
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
            uom
          );
        }
      }
      // UPDATE PAGE COUNTER
      // let finalCounter = pageCounter+1
      // await ProductMod.updateProductUpdateCounter(finalCounter)
    } catch (Exception) {
      console.log(Exception);
    }
  }
  // ./SAVING OF PRODUCTS AT DB
}

module.exports = ServiceController;
