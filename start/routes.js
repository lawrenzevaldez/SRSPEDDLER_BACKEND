"use strict";

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| Http routes are entry points to your web application. You can create
| routes for different URL's and bind Controller actions to them.
|
| A complete guide on routing is available here.
| http://adonisjs.com/docs/4.1/routing
|
*/

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use("Route");
const Env = use("Env");

Route.on("/").render("welcome");

Route.group(() => {
  Route.post("/login", "UserController.auth_login");
  Route.post("/check_user", "UserController.check_user");
  Route.post("/get_products", "ServiceController.get_products");
  Route.post(
    "/get_products_unpublished",
    "ServiceController.get_products_unpublished"
  );
  Route.post(
    "/update_products_unpublished",
    "ServiceController.update_products_unpublished"
  );
  Route.post("/get_products_oos", "ServiceController.get_products_oos");
  Route.post("/get_orders", "ServiceController.get_orders");
  Route.post(
    "/update_product_excluded",
    "ServiceController.update_product_excluded"
  );
  Route.post(
    "/update_products_status",
    "ServiceController.update_products_status"
  );
  Route.post("/get_order_items", "ServiceController.get_order_items");
  Route.post("/update_order", "ServiceController.update_order");
  Route.post("/custom_batch_upload", "ServiceController.custom_batch_upload");
  Route.post("/get_users", "ServiceController.get_users");
  Route.post("/update_user", "ServiceController.update_user");
  Route.post("/add_user", "ServiceController.add_user");
  Route.post("/get_users_lists", "ServiceController.get_users_lists");
  Route.post("/get_user_details", "ServiceController.get_user_details");
  Route.get("/addProductsDB", "ServiceController.addProductsDB"); // FOR SAVING OF PRODUCTS AT DB
  Route.get("/getWooProducts", "ServiceController.getWooProducts");
  Route.get("/getproductcat", "ServiceController.getproductcat");
  Route.get("/get_branches", "ServiceController.get_branches");
  Route.get(
    "/get_total_order_amount",
    "ServiceController.get_total_order_amount"
  );
  Route.get(
    "/get_total_order_count",
    "ServiceController.get_total_order_count"
  );
  Route.get(
    "/get_total_order_amount_month",
    "ServiceController.get_total_order_amount_month"
  );
  Route.get(
    "/get_total_order_count_month",
    "ServiceController.get_total_order_count_month"
  );
  Route.get(
    "/get_list_of_transactions",
    "ServiceController.get_list_of_transactions"
  );
  Route.get(
    "/get_transaction_details",
    "ServiceController.get_transaction_details"
  );
}).prefix("api");

Route.any("*", function ({ view, request }) {
  const url =
    request.protocol() + "://" + request.hostname() + ":" + Env.get("PORT", "");

  if (request.hostname() === "srsnetwork.dyndns.org") {
    return view.render("index", { APP_URL: url });
  } else if (request.hostname() === "192.168.5.16") {
    return view.render("index", { APP_URL: url });
  } else {
    return view.render("index", { APP_URL: Env.get("APP_URL", "") });
  }
  // console.log( Env.get('APP_URL', ''))
});
