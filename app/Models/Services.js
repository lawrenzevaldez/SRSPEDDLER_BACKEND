const Model = use('Model')
const Db = use('Database')
const Env = use('Env')
const DbPrefix = Env.get('ONLINE_DB_PREFIX', '')
const moment = use('moment')

class Services extends Model {
    async get_products(p_page, p_search, p_currentSort, p_currentSortDir) {
        let search = (p_search == null) ? '%%' : `%${p_search}%`
        let row = await Db.select('id', 'ProductID', 'productName', 'published', 'excluded')
                .from('online_shop_products')
                .where(`productName`, 'like', search)
                .andWhere('published', 1)
                // .andWhere('post_type', 'product')
                // .andWhere('post_status', 'publish')
                .orderBy(p_currentSort, p_currentSortDir)
                .paginate(p_page, 10)
        await Db.close()
        return [row.data, row.lastPage]
    }

    async get_products_unpublished(p_page, p_search, p_currentSort, p_currentSortDir) {
        let search = (p_search == null) ? '%%' : `%${p_search}%`
        let row = await Db.select('id', 'ProductID', 'productName')
                .from('online_shop_products')
                .where(`productName`, 'like', search)
                .andWhere('published', 0)
                // .andWhere('post_status', 'publish')
                .orderBy(p_currentSort, p_currentSortDir)
                .paginate(p_page, 10)
        await Db.close()
        return [row.data, row.lastPage]
    }

    async update_products_unpublished(list_of_ids) {
        const trx = await Db.beginTransaction()
        try {
            let row = await trx.table('online_shop_products')
                    .whereIn('ProductID', list_of_ids)
                    .update('published', 1)

            await trx.commit()
            return (row == 0) ? false : true
        } catch(e) {
            console.log(e)
            await trx.rollback()
            return false
        }
    }

    async update_product_excluded(product_id, product_mode) {
        const trx = await Db.beginTransaction()
        try {
            let row = await trx.table('online_shop_products')
                    .where('ProductID', product_id)
                    .update('excluded', product_mode)

            await trx.commit()
            return (row == 0) ? false : true
        } catch(e) {
            console.log(e)
            await trx.rollback()
            return false
        }
    }

    async update_products_status(product_id) {
        const trx = await Db.beginTransaction()
        try {
            let row = await trx.table('online_shop_products')
                    .where('ProductID', product_id)
                    .update('published', 0)

            await trx.commit()
            return (row == 0) ? false : true
        } catch(e) {
            console.log(e)
            await trx.rollback()
            return false
        }
    }

    async get_orders(p_page, p_search, p_currentSort, p_currentSortDir, p_orderType) {
        let search = (p_search == null) ? '%%' : `%${p_search}%`
        let res = await Db.connection('online_mysql')
                .select('*')
                .from('wc_orders as wo')
                .where('wo.status', p_orderType)
                // .andWhere('post_type', 'shop_order')
                // .orderBy(p_currentSort, p_currentSortDir)
                // .leftJoin(`${DbPrefix}wc_orders`, `${DbPrefix}wc_orders_meta.order_id`, `${DbPrefix}wc_orders.id`)
                .innerJoin(`${DbPrefix}wc_order_addresses as woa`, `woa.order_id`, `wo.id`)
                .where(`wo.status`, p_orderType)
                .andWhere(`wo.id`, 'like', search)
                .andWhere(`woa.address_type`, 'billing')
                .orderBy(`wo.${p_currentSort}`, p_currentSortDir)
                .paginate(p_page, 10)
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
        await Db.close()
        return [res.data, res.lastPage]
    }

    async getOrderListDetailsBFN(ID) {
        try {
            let getOrdersBFN = await Db.connection('online_mysql')
                            .select('*')
                            .from('postmeta')
                            .where('post_id', ID)
                            .andWhere('meta_key', '_billing_first_name')

            return (getOrdersBFN.length == 0) ? '' : getOrdersBFN[0].meta_value
        } catch(e) {
            console.log(e)
        }
    }

    async getOrderListDetailsBLN(ID) {
        try {
            let getOrdersBLN = await Db.connection('online_mysql')
                            .select('*')
                            .from('postmeta')
                            .where('post_id', ID)
                            .andWhere('meta_key', '_billing_last_name')
            
            return (getOrdersBLN.length == 0) ? '' : getOrdersBLN[0].meta_value
        } catch(e) {
            console.log(e)
        }
    }

    async getOrderListDetailsBMP(ID) {
        try {
            let getOrdersBMP = await Db.connection('online_mysql')
                            .select('*')
                            .from('postmeta')
                            .where('post_id', ID)
                            .andWhere('meta_key', '_payment_method_title')
            
            return (getOrdersBMP.length == 0) ? '' : getOrdersBMP[0].meta_value
        } catch(e) {
            console.log(e)
        }
    }
    
    async get_all_orders_by_location(order_ids, p_page, p_search, p_currentSort, p_currentSortDir, p_orderType) {
        let search = (p_search == null) ? '%%' : `%${p_search}%`
        let row = await Db.connection('online_mysql')
                .select('wc_orders.*', 'wc_order_addresses.*')
                .from('wc_orders')
                .leftJoin(`${DbPrefix}wc_order_addresses`, `${DbPrefix}wc_orders.id`, `${DbPrefix}wc_order_addresses.order_id`)
                .whereIn(`${DbPrefix}wc_orders.id`, order_ids)
                .andWhere(`${DbPrefix}wc_orders.status`, p_orderType)
                .orderBy(`${DbPrefix}wc_orders.${p_currentSort}`, p_currentSortDir)
                .paginate(p_page, 10)
        await Db.close()
        return [row.data, row.lastPage]
    }

    async get_products_location(ID) {
        let row = await Db.connection('online_mysql')
                .select('product_price.meta_value as Price', 'product_stock.meta_value as Stock')
                .from('posts as p')
                .leftJoin(`${DbPrefix}postmeta as product_price`, function() {
                    this.on('p.ID', '=', 'product_price.post_id')
                })
                .leftJoin(`${DbPrefix}postmeta as product_stock`, function() {
                    this.on('p.ID', '=', 'product_stock.post_id')
                })
                .where('p.ID', ID)
                .andWhere('product_price.meta_key', '_regular_price')
                .andWhere('product_stock.meta_key', '_stock')
            await Db.close()
            return (row.length == 0) ? '' : row[0]
    }

    async update_product_details(ID, product_price, product_stock, location_id) {
        const trx = await Db.connection('online_mysql').beginTransaction()
        try {
            await trx.table('postmeta')
            .where('post_id', ID)
            .andWhere('meta_key', `wcmlim_regular_price_at_${location_id}`)
            .update('meta_value', product_price)

            await trx.table('postmeta')
            .where('post_id', ID)
            .andWhere('meta_key', `wcmlim_stock_at_${location_id}`)
            .update('meta_value', product_stock)

            await trx.commit()
            return true
        } catch (e) {
            console.log(e)
            await trx.rollback()
            return e.message
        }
    }

    async audit_trail(user_id, location_id, location_name, message) {
        try {
            await Db.table('audit_trail').insert({ user_id, location_id: location_id, location_name: location_name, message: message })
            await Db.close()
        } catch (e) {
            console.log(e)
            return e.message
        }
    }

    async add_location_product(product_id, location_id) {
        const trx = await Db.connection('online_mysql').beginTransaction()
        try {
            await trx
            .table('postmeta')
            .insert({ post_id: product_id, meta_key: `wcmlim_regular_price_at_${location_id}`, meta_value: 0 })

            await trx
            .table('postmeta')
            .insert({ post_id: product_id, meta_key: `wcmlim_stock_at_${location_id}`, meta_value: 0 })

            await trx.commit()
            return true
        } catch(e) {
            console.log(e)
            await trx.rollback()
            return false
        }
    }

    async get_order_items(order_id) {
        let row = await Db.connection('online_mysql')
                .raw(`SELECT p.order_id, p.order_item_id, p.order_item_name, p.order_item_type,
                    max( CASE WHEN pm.meta_key = '_product_id' and p.order_item_id = pm.order_item_id THEN pm.meta_value END ) as productID,
                    max( CASE WHEN pm.meta_key = '_qty' and p.order_item_id = pm.order_item_id THEN pm.meta_value END ) as Qty,
                    max( CASE WHEN pm.meta_key = '_variation_id' and p.order_item_id = pm.order_item_id THEN pm.meta_value END ) as variationID,
                    max( CASE WHEN pm.meta_key = '_line_total' and p.order_item_id = pm.order_item_id THEN pm.meta_value END ) as lineTotal,
                    max( CASE WHEN pm.meta_key = '_line_subtotal_tax' and p.order_item_id = pm.order_item_id THEN pm.meta_value END ) as subTotalTax,
                    max( CASE WHEN pm.meta_key = '_line_tax' and p.order_item_id = pm.order_item_id THEN pm.meta_value END ) as Tax,
                    max( CASE WHEN pm.meta_key = '_tax_class' and p.order_item_id = pm.order_item_id THEN pm.meta_value END ) as taxClass,
                    max( CASE WHEN pm.meta_key = '_line_subtotal' and p.order_item_id = pm.order_item_id THEN pm.meta_value END ) as subtotal
                    FROM ${DbPrefix}woocommerce_order_items AS p, ${DbPrefix}woocommerce_order_itemmeta as pm WHERE order_item_type = 'line_item' AND
                    p.order_item_id = pm.order_item_id AND p.order_id = ${order_id} GROUP BY p.order_item_id
                    `)
        await Db.close()
        return (row.length == 0) ? '' : row[0]
    }

    async update_order(order_id, status) {
        const trx = await Db.connection('online_mysql').beginTransaction()
        try {
            let row = await trx.table('wc_orders')
                    .where('id', order_id)
                    .update('status', status)

            await trx.commit()
            return (row == 0) ? false : true
        } catch(e) {
            console.log(e)
            await trx.rollback()
            return false
        }
    }

    async get_users(p_page, p_search, p_currentSort, p_currentSortDir) {
        let search = (p_search == null) ? '%%' : `%${p_search}%`
        let row = await Db.select('*')
                .from('srs_users')
                .where(`id`, 'like', search)
                .orWhere('username', 'like', search)
                .orderBy(p_currentSort, p_currentSortDir)
                .paginate(p_page, 10)
        await Db.close()
        return [row.data, row.lastPage]
    }

    async update_user(user_id, password, user_role) {
        const trx = await Db.beginTransaction()
        try {
            let row = await trx.table('srs_users')
                    .where('id', user_id)
                    .update({ password: password /*, user_role: user_role*/ })

            await trx.commit()
            return (row == 0) ? false : true
        } catch(e) {
            console.log(e)
            await trx.rollback()
            return false
        }
    }

    async add_user(username, userpass, userrole, userbranch, userfirstname, userlastname) {
        const trx = await Db.beginTransaction()
        try {
            await trx
            .table('srs_users')
            .insert({ username: username, password: userpass, account_no: username, user_role: 0, branch: Env.get('BRANCH_NAME', ''), user_firstname: username, user_lastname: username })

            await trx.commit()
            return true
        } catch(e) {
            console.log(e)
            await trx.rollback()
            return false
        }
    }

    async get_branches() {
        try {
            let row = await Db.connection('mysql91')
                    .select('name', 'db_133')
                    .from('branches')
                    .orderBy('name', 'asc')
            await Db.close()
            return (row.length == 0) ? false : row
        } catch(e) {
            console.log(e)
            return false
        }
    }

    async get_users_lists(branch) {
        try {
            let res = await Db.connection(branch)
                    .select('customercode', 'description', 'last_name')
                    .from('peddler_customers')
                    .where('category', 'RESELLER')
                    .orWhere('category', 'WHOLESALE')
                    .orderBy('description', 'asc')
            await Db.close()
            return (res.length == 0) ? false : res
        } catch(e) {
            console.log(e)
        }
    }

    async get_user_details(branch, account_no) {
        try {
            let row = await Db.connection(branch)
                    .select('customercode', 'last_name', 'first_name')
                    .from('peddler_customers')
                    .where('customercode', account_no)
            await Db.close()
            return (row.length == 0) ? false : row[0]
        } catch(e) {
            console.log(e)
            return e.message
        }
    }

    async get_total_order_amount(branch, account_no) {
        try {
            let row = await Db.connection(branch.toString())
                    .from('FinishedPayments')
                    .where('AccountNo', account_no.toString())
                    .andWhere('Remarks', 'peddler')
                    .sum('Amount as amount')
            await Db.close()
            return (row[0].amount == 0) ? 0 : row[0].amount
        } catch(e) {
            console.log(e)
            return e.message
        }
    }

    async get_total_order_count(branch, account_no) {
        try {
            let row = await Db.connection(branch.toString())
                    .from('FinishedPayments')
                    .where('AccountNo', account_no.toString())
                    .andWhere('Remarks', 'peddler')
                    .count('* as orders')
            await Db.close()
            return (row[0].orders == 0) ? 0 : row[0].orders
        } catch(e) {
            console.log(e)
            return e.message
        }
    }

    async get_total_order_amount_month(branch, account_no) {
        try {
            let startofMonth = moment().startOf('month').format('YYYY-MM-DD HH:mm:ss')
            let endofMonth = moment().endOf('month').format('YYYY-MM-DD HH:mm:ss')
            let row = await Db.connection(branch.toString())
                    .from('FinishedPayments')
                    .whereBetween('LogDate', [startofMonth, endofMonth])
                    .andWhere('AccountNo', account_no.toString())
                    .andWhere('Remarks', 'peddler')
                    .sum('Amount as amount')
            await Db.close()
            return (row[0].amount == 0) ? 0 : row[0].amount
        } catch(e) {
            console.log(e)
            return e.message
        }
    }

    async get_total_order_count_month(branch, account_no) {
        try {
            let startofMonth = moment().startOf('month').format('YYYY-MM-DD HH:mm:ss')
            let endofMonth = moment().endOf('month').format('YYYY-MM-DD HH:mm:ss')
            let row = await Db.connection(branch.toString())
                    .from('FinishedPayments')
                    .whereBetween('LogDate', [startofMonth, endofMonth])
                    .andWhere('AccountNo', account_no.toString())
                    .andWhere('Remarks', 'peddler')
                    .count('* as orders')
            await Db.close()
            return (row[0].orders == 0) ? 0 : row[0].orders
        } catch(e) {
            console.log(e)
            return e.message
        }
    }

    async get_list_of_transactions(branch, account_no, p_page, p_currentSort, p_currentSortDir) {
        let minPage
        let maxPage

        if(p_page == 1) {
            minPage = 1
            maxPage = 10
        } else {
            minPage = parseInt(p_page+0)
            maxPage = parseInt(minPage+10)
            minPage = minPage+1
        }

        try {
            let row = await Db.connection(branch.toString())
                    .raw(`SELECT 
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
                        WHERE RowNum BETWEEN ${minPage} AND ${maxPage};`)
            let lastPage = await Db.connection(branch.toString())
                        .from('FinishedPayments')
                        .where('AccountNo', account_no)
                        .andWhere('remarks', 'peddler')
                        .count('* as TotalRowCount')
            await Db.close()
            return [row, lastPage[0].TotalRowCount]
        } catch(e) {
            console.log(e)
        }
    }
    
    async get_transaction_details(TransactionNo, TerminalNo, branch) {
        try {
            let row = await Db.connection(branch.toString())
                    .select('Barcode', 'Description', 'UOM', 'TotalQty', 'Price', 'Points')
                    .from('FinishedSales')
                    .where('TransactionNo', TransactionNo)
                    .andWhere('TerminalNo', TerminalNo)
            return (row.length == 0) ? false : row
        } catch(e) {
            console.log(e)
        }
    }

    async insertProductDB(id, sku, name, barcode, pageCounter, grams, by_barcode, uom) {
        const trx = await Db.beginTransaction()
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
                uom: uom
            }
            let row = await trx.insert(data)
                            .into('online_shop_products')
            await trx.commit()
            await Db.close()
            return (row == 0) ? false : true
        } catch(error) {
            await trx.rollback()
            console.log(error)
        }
    }

    //FOR PRODUCT BATCH UPLOAD ONLY
    async getStockPriceBarcode(barcode, globalid) {
        try {
            let row = await Db.connection('mssql')
                        .select('A.srp', 'A.qty', 'A.LastDateModified', 'B.SellingArea', 'A.Description')
                        .joinRaw('FROM POS_Products A INNER JOIN Products B on A.ProductID = B.ProductID')
                        .where('B.globalid', globalid)
                        .andWhere('A.Barcode', barcode)
                        .andWhere('A.PriceModeCode', 'R')
                        // .groupBy('A.srp', 'A.qty', 'A.LastDateModified', 'B.SellingArea', 'B.Description')
                        // .orderBy('A.LastDateModified', 'desc')
                        // .andWhere('UOM', 'PC')
            await Db.close()
            return (row.length == 0) ? '' : row[0]
        } catch(error) {
            console.log(error)
        }
    }

    async getStockPrice(globalid, barcode) {
        try {
            let row = await Db.connection('mssql')
                        .select('A.srp', 'A.qty', 'A.LastDateModified', 'B.SellingArea', 'B.Description')
                        .joinRaw('FROM POS_Products A INNER JOIN Products B on A.ProductID = B.ProductID')
                        .where('B.globalid', globalid)
                        .andWhere('A.Barcode', barcode)
                        .andWhere('A.PriceModeCode', 'R')
                        .groupBy('A.srp', 'A.qty', 'A.LastDateModified', 'B.SellingArea', 'B.Description')
                        .orderBy('A.LastDateModified', 'desc')
                        // .andWhere('UOM', 'PC')
            await Db.close()
            return (row.length == 0) ? '' : row[0]
        } catch(error) {
            console.log(error)
        }
    }

    async getproductcat() {
        try {
            let res = await Db.connection('mysql91')
                    .select('*')
                    .from('online_shop_products')
                    // .where('id', 8080)
                    // .limit(50)
            await Db.close()
            return res
        } catch(e) {
            console.log(e)
        }
    }
    
    async getCatDets(cat_id) {
        try {
            let res = await Db.connection('mysql91')
                    .select('type', 'category_id', 'parent_id')
                    .from('online_shop_categories')
                    .where('category_id', cat_id)
            await Db.close()
            return res[0]
        } catch(e) {
            console.log(e)
        }
    }

    async saveRes(GlobalID, productName, priceModeCode, productDescription, productShortDescription, mainCategory, uom, Barcode, grams, byBarcode, mainImageUrl) {
        const trx = await Db.connection('mysql91').beginTransaction()

        try {
            let maincategory1 = '', subcategory1 = '', maincategory2 = '', subcategory2 = '', maincategory3 = '', subcategory3 = '', maincategory4 = '', subcategory4 = ''
            for(let i = 0; i < mainCategory.length; i++) {
                // maincategory[i+1] = mainCategory[i].mainCategory
                // subcategory[i+1] = mainCategory[i].subCategory
                if(i == 0) {
                    maincategory1 = mainCategory[i].mainCategory
                    subcategory1 = mainCategory[i].subCategory
                } else if(i == 1) {
                    maincategory2 = mainCategory[i].mainCategory
                    subcategory2 = mainCategory[i].subCategory
                } else if(i == 2) {
                    maincategory3 = mainCategory[i].mainCategory
                    subcategory3 = mainCategory[i].subCategory
                } else if(i == 4) {
                    maincategory4 = mainCategory[i].mainCategory
                    subcategory4 = mainCategory[i].subCategory
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
                mainimageurl: mainImageUrl
            }

            await trx.insert(data).into('0_peddler_items')

            await trx.commit()
        } catch(e) {
            console.log(e)
            await trx.rollback()
        }
    }
    // ./FOR PRODUCT BATCH UPLOAD ONLY

}

module.exports = new Services