const mysql = require('mysql')

const pool =mysql.createPool({
    password : '',
    user : 'root',
    database : 'grocery_db_node',
    host : 'localhost',
    port : '3306'
})

let grocerydb = {}


grocerydb.getMainCategoryProducts = (category) =>{

        // return new Promise ((resolve, reject)=>{
        //     //console.log(category)

        //     var list = []
        //     for (let i = 0; i < category.length; i++) {
        //         console.log(category[i])
        //         pool.query('SELECT * FROM main_category_products WHERE category = ?',[category[i]] ,(err,results)=>{
        //             if (err) {
        //                 return reject(err);
        //             }else{
        //                 // var newUser = "user" + i;
        //                 // var newValue = results;
        //                 // list[newUser] = newValue;
        //                 console.log(results)
        //                 list.push(results)
        //             }
        //         })    
        //     }
        //     return resolve(list);
        // })

        

        return new Promise ((resolve, reject)=>{

            // main_category_products
            // pool.query('SELECT * FROM products WHERE category = ?',[category] ,(err,results)=>{
            // pool.query('SELECT * FROM products pd WHERE pd.id IN ( SELECT product_id FROM main_category_products mp WHERE mp.category = ?)',[category] ,(err,results)=>{
            pool.query('SELECT * FROM products INNER JOIN main_category_products ON products.id = main_category_products.product_id WHERE products.id IN ( SELECT product_id FROM main_category_products mp WHERE mp.category = ?)',[category] ,(err,results)=>{
                if (err) {
                    return reject(err);
                }
                console.log(results);
                return resolve(results);
            })
        })

}

grocerydb.getAllProducts = ()=>{
    return new Promise (( resolve,results)=>{
        pool.query('SELECT * FROM products ', (err,results)=>{
            if (err) {
                return reject(err);
            }
            return resolve(results);
        })
    })
}

grocerydb.getItems = (category) =>{
    return new Promise ((resolve, reject)=>{
        pool.query('SELECT * FROM products WHERE category = ?',[category] ,(err,results)=>{
            if (err) {
                return reject(err);
            }
            // console.log(results)
            return resolve(results);
        })
    })
}
grocerydb.getProductDetails = (id) =>{
    return new Promise ((resolve, reject)=>{
        pool.query('SELECT * FROM products WHERE id = ?',[id] ,(err,results)=>{
            if (err) {
                return reject(err);
            }
            return resolve(results);
        })
    })
}

grocerydb.addProduct = (pCategory,pName,pPrice,pDiscount,pQty,pPic) =>{
    return new Promise ((resolve,reject)=>{
        pool.query('INSERT INTO products(name,price,discount,qty,category,pic) VALUES(?,?,?,?,?,?) ',[pName,pPrice,pDiscount,pQty,pCategory,pPic], (err,results)=>{
            if (err) {
                return reject(err);
            }
            return resolve(results);
        })
    })
}
grocerydb.addMainCategoryProducts = (pCategory,pId) =>{
    return new Promise ((resolve,reject)=>{
        pool.query('INSERT INTO main_category_products(category,product_id) VALUES(?,?) ',[pCategory,pId], (err,results)=>{
            if (err) {
                return reject(err);
            }
            return resolve(results);
        })
    })
}
grocerydb.removeProductFromHome = (itemId) =>{
    return new Promise ((resolve,reject)=>{
        pool.query('DELETE FROM main_category_products WHERE id = ?',[itemId], (err,results)=>{
            if (err) {
                return reject(err);
            }
            return resolve(results);
        })
    })
}

module.exports = grocerydb;