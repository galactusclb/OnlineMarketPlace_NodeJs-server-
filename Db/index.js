const mysql = require('mysql')
const moment = require('moment')
const bcrypt = require('bcrypt');

const pool =mysql.createPool({
    password : '',
    user : 'root',
    database : 'grocery_db_node',
    host : 'localhost',
    port : '3306'
})

let grocerydb = {}

//user reg/login query
grocerydb.userRegister = (uName,uPass) =>{
    return new Promise ((resolve,reject)=>{
        pool.query('INSERT INTO users(uid,uname,password) VALUES(?,?,?) ',['0',uName,uPass], (err,results)=>{
            if (err) {
                return reject(err);
            }
            return resolve(results);
        })
    })
}
grocerydb.userLogin = (uName,uPass) =>{
    return new Promise ((resolve,reject)=>{
        pool.query('SELECT uname,password,role FROM users WHERE uname=? LIMIT 1',[uName],async (err,results)=>{
            if(err){
                status = 'No UserName Or Email found'
                return reject(status)
            }else{
                if (results.length == 0) {
                    status = 'No UserName Or Email found'
                    return reject(status)
                } else {
                    const isMatch =await bcrypt.compare(uPass,results[0].password);

                    if (isMatch == true) {
                        var tt = []
                        ress =  {
                            userName: results[0].uname,
                            role: results[0].role
                        } 
                        tt.push(ress);
                        
                        return resolve(tt)
                    }else{
                        status = 'Password is wrong'
                        return reject(status)
                    }
                }
            }
        })
    })
}




// products query 
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
        pool.query('SELECT * FROM products WHERE category = ? AND visible=1',[category] ,(err,results)=>{
            if (err) {
                return reject(err);
            }
            // console.log(results)
            return resolve(results);
        })
    })
}
grocerydb.getProductDetailsById = (id) =>{ //product-view component
    return new Promise ((resolve, reject)=>{
        pool.query('SELECT * FROM products WHERE id = ?',[id] ,(err,results)=>{
            if (err) {
                return reject(err);
            }
            return resolve(results);
        })
    })
}

grocerydb.updateProdcutsDetails = (id,name,category,price,discountOn,discount,qty,tags,visible) =>{ //product-view component
    return new Promise ((resolve, reject)=>{
        pool.query('UPDATE products SET name=?,price=?,discountOn=?,discount=?,qty=?,category=?,tags=?,visible=? WHERE id=?',[name,price,discountOn,discount,qty,category,tags,visible,id] ,(err,results)=>{
            if (err) {
                return reject(err);
            }
            return resolve(results);
        })
    })
}
grocerydb.updateProductImg = (fileName,id) =>{ //product-view component
    return new Promise ((resolve, reject)=>{
        pool.query('UPDATE products SET pic=? WHERE id=?',[fileName,id] ,(err,results)=>{
            if (err) {
                return reject(err);
            }
            return resolve(results);
        })
    })
}

grocerydb.getProductSoldById = (id) =>{ //product-view component
    return new Promise ((resolve, reject)=>{
        pool.query('SELECT * FROM products_sold WHERE productId = ? LIMIT 5 ',[id] ,(err,results)=>{
            if (err) {
                return reject(err);
            }
            return resolve(results);
        })
    })
}

grocerydb.addProduct = (pCategory,pName,pPrice,pDiscount,pQty,pPic,visible) =>{
    return new Promise ((resolve,reject)=>{
        pool.query('INSERT INTO products(name,price,discount,qty,category,pic,visible) VALUES(?,?,?,?,?,?,?) ',[pName,pPrice,pDiscount,pQty,pCategory,pPic,visible], (err,results)=>{
            if (err) {
                return reject(err);
            }
            return resolve(results);
        })
    })
}

grocerydb.updateProductVisibilty = (id) =>{ //product-list component
    return new Promise ((resolve,reject)=>{
        pool.query('SELECT visible FROM products WHERE id=?  ',[id], (err,results)=>{
            if (err) {
                return reject(err);
            }else{
                var newValue;
                if (results[0].visible == 0) {
                    console.log('hidden')
                    newValue = 1
                } else {
                    console.log('show')
                    newValue = 0
                }
                pool.query('UPDATE products SET visible=? WHERE id=?',[newValue,id], (err,results)=>{
                    if (err) {
                        return reject(err)
                    }else{
                        //return results;   
                        if (newValue==0) {
                            return resolve('hidden')
                        } else {
                            return resolve('show')
                        }
                    }
                })  
            }
            //return resolve(results);

            
        })
    })
}
grocerydb.updateProductDiscountOnOff = (id) =>{ //product-list component
    return new Promise ((resolve,reject)=>{
        pool.query('SELECT discountOn FROM products WHERE id=?  ',[id], (err,results)=>{
            if (err) {
                return reject(err);
            }else{
                var newValue;
                console.log(results[0].discountOn)
                if (results[0].discountOn == 0) {
                    //console.log('hidden')
                    newValue = 1
                } else {
                   // console.log('show')
                    newValue = 0
                }
                pool.query('UPDATE products SET discountOn=? WHERE id=?',[newValue,id], (err,results)=>{
                    if (err) {
                        return reject(err)
                    }else{
                        //return results;   
                        if (newValue==0) {
                            return resolve('hidden')
                        } else {
                            return resolve('show')
                        }
                    }
                })  
            }
            //return resolve(results);

            
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

grocerydb.productsOrder = (orders) =>{ // shopping-cart
    return new Promise ((resolve,reject)=>{

        pool.query('INSERT INTO orders( date) VALUES(?)',[''], (err,results)=>{
            if (err) {
                return reject(err)
            }else{
                function paddy(num, padlen, padchar) {
                    var pad_char = typeof padchar !== 'undefined' ? padchar : '0';
                    var pad = new Array(1 + padlen).join(pad_char);
                    return (pad + num).slice(-pad.length);
                }
                const inserted_id = results.insertId;
                var fu = paddy(inserted_id, 8);
                
                const new_id = "OR-"+fu;
                
                var timpstamp = moment().format('YYYY-MM-DD H:m:sZ');
                

                pool.query('UPDATE orders SET orderTrackId=?,totPrice=?,totItemsType=?,discount=?,date=?,status=? WHERE sid=?',[new_id,orders[0].cost,(orders.length-1),0,timpstamp,'pending',inserted_id], (err,results)=>{
                    if (err) {
                        return reject(err)
                    }else{
                        for (let i = 1; i < orders.length; i++) {
                            const prod = orders[i]

                            try {
                                pool.query('INSERT INTO products_sold( trackId,productId,uid,amount,date,price,status) VALUES(?,?,?,?,?,?,?)',[new_id,prod.id,'chana',prod.Quantity,timpstamp,prod.price,'pending'], (err,results)=>{
                                    if (err) {
                                        return reject(err);
                                    }
                                    return results;
                                })
                            } catch (error) {
                                console.log(error)
                            }
                            
                        }
                        return resolve(results);
                    }
                })
            }
        })
    }
)}
grocerydb.reduceItemAmountAfterOrder = (orders) =>{ // shopping-cart
    return new Promise ((resolve,reject)=>{

        for (let i = 1; i < orders.length; i++) {
            try {
                pool.query('SELECT * FROM products WHERE id=?',[orders[i].id], (err,results)=>{
                    if (err) {
                        return reject(err);
                    }else{
                        const itemAmount = parseInt(results[0].qty)
                        const itemSold = parseInt(results[0].itemSold)

                        const orderItems = parseInt(orders[i].Quantity)

                        const newAmount = itemAmount-orderItems;
                        const newSoldItems = itemSold+orderItems

                        console.log('new amount : ' +(newAmount) + ' sold items : ' + newSoldItems )
                        pool.query('UPDATE products SET qty=?,itemSold=? WHERE id=?',[newAmount,newSoldItems,orders[i].id], (err,results)=>{
                            if (err) {
                                return reject(err)
                            }else{
                                return results;   
                            }
                        })                        
                    }
                })
            } catch (error) {
                console.log(error)
            }   
        }
    }
)}

grocerydb.getOrderList = () =>{
    return new Promise ((resolve, reject)=>{
        pool.query('SELECT * FROM orders',[''] ,(err,results)=>{
            if (err) {
                return reject(err);
            }
            return resolve(results);
        })
    })
}
grocerydb.getOrderByTrackId = (id) =>{
    return new Promise ((resolve, reject)=>{
        pool.query('SELECT * FROM orders WHERE orderTrackId=?',[id] ,(err,results)=>{
            if (err) {
                return reject(err);
            }
            return resolve(results);
        })
    })
}
grocerydb.getOrderDetailsByTrackId = (id) =>{
    return new Promise ((resolve, reject)=>{
        pool.query('SELECT * FROM products_sold WHERE trackId=?',[id] ,(err,results)=>{
            if (err) {
                return reject(err);
            }
            return resolve(results);
        })
    })
}

grocerydb.orderStatusChange = (id,status) =>{
    return new Promise (( resolve,reject)=>{
        pool.query('UPDATE orders SET status=? WHERE sid=?',[status,id], (err,results)=>{
            if (err) {
                return reject(err)
            }
            return resolve(results)
        })
    })
}


module.exports = grocerydb;