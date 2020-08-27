const mysql = require('mysql');
const moment = require('moment');
const bcrypt = require('bcryptjs');

var async1 = require('async');

require('dotenv').config();

// production
// const pool = mysql.createPool({
// 	user: process.env.PROD_DB_USER,
// 	password: process.env.PROD_DB_PASSWORD,
// 	host: process.env.PROD_DB_HOST,
// 	database: process.env.PROD_DB_NAME,
// 	port: process.env.DB_PORT,
// 	multipleStatements: true,
// });

// localhost
const pool = mysql.createPool({
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	host: process.env.DB_HOST,
	port: process.env.DB_PORT,
	database: process.env.DB_NAME,
	multipleStatements: true,
});

let grocerydb = {};

//user reg/login query

grocerydb.findOneUser = (email, uname) => {
	return new Promise((resolve, reject) => {
		pool.query(
			'SELECT email,uname FROM users WHERE email=? LIMIT 1',
			[email],
			(err, results) => {
				if (err) {
					return reject(err);
				} else {
					if (results.length > 0) {
						return resolve(true);
					} else {
						return resolve(false);
					}
				}
			}
		);
	});
};
grocerydb.findOneUserById = (id) => {
	return new Promise((resolve, reject) => {
		pool.query(
			'SELECT email,uname FROM users WHERE id=? LIMIT 1',
			[id],
			(err, results) => {
				if (err) {
					return reject(err);
				} else {
					if (results.length > 0) {
						return resolve(true);
					} else {
						return resolve(false);
					}
				}
			}
		);
	});
};
grocerydb.userRegister = (email, uName, uPass, town, regToken, expireToken) => {
	//h
	return new Promise((resolve, reject) => {
		pool.query(
			'INSERT INTO users(uid,email,uname,password,town,regToken,expireToken) VALUES(?,?,?,?,?,?,?) ',
			['0', email, uName, uPass, town, regToken, expireToken],
			(err, results) => {
				if (err) {
					return reject(err);
				}
				return resolve(results);
			}
		);

		// pool.query('INSERT INTO users(regDate) VALUES(?) ',[null], (err,results)=>{
		//     if (err) {
		//         return reject(err);
		//     }else{
		//         function paddy(num, padlen, padchar) {
		//             var pad_char = typeof padchar !== 'undefined' ? padchar : '0';
		//             var pad = new Array(1 + padlen).join(pad_char);
		//             return (pad + num).slice(-pad.length);
		//         }
		//         const inserted_id = results.insertId;
		//         var fu = paddy(inserted_id, 10);

		//         const new_id = "-"+fu;

		//         return resolve(results);
		//     }
		// })
	});
};
grocerydb.confirmEmail = (token) => {
	const now = Date.now();
	return new Promise((resolve, reject) => {
		pool.query(
			'SELECT id,email,regToken,expireToken FROM users WHERE regToken=? AND expireToken > ? LIMIT 1',
			[token, now],
			(err, results) => {
				if (err) {
					return reject(err);
				} else {
					if (results.length > 0) {
						pool.query(
							'UPDATE users SET isConfirm=?,regToken=?,expireToken=? WHERE id=?',
							[1, null, null, results[0].id],
							(err, results) => {
								if (err) {
									return reject(err);
								}
								return resolve(true);
							}
						);
					} else {
						return resolve(false);
					}
				}
				// }
				//return resolve(results);
			}
		);
	});
};
grocerydb.userLogin = (uName, uPass) => {
	return new Promise((resolve, reject) => {
		pool.query(
			'SELECT id,uname,password,role,isConfirm FROM users WHERE uname=? LIMIT 1',
			[uName],
			async (err, results) => {
				if (err) {
					status = 'No UserName Or Email found';
					return reject(status);
				} else {
					if (results.length == 0) {
						status = 'No UserName Or Email found';
						return reject(status);
					} else if (results[0].isConfirm == 0) {
						status = 'verify your account';
						return reject(status);
					} else {
						const isMatch = await bcrypt.compare(uPass, results[0].password);

						if (isMatch == true) {
							var tt = [];
							ress = {
								id: results[0].id,
								userName: results[0].uname,
								role: results[0].role,
							};
							tt.push(ress);

							return resolve(tt);
						} else {
							status = 'Password is wrong';
							return reject(status);
						}
					}
				}
			}
		);
	});
};

grocerydb.getBasicUserDetailsByUid = (id) => {
	return new Promise((resolve, reject) => {
		pool.query(
			'SELECT fname,lname,uname,email,town,address,phone FROM users WHERE id=? LIMIT 1',
			[id],
			async (err, results) => {
				if (err) {
					status = 'no user found';
					return reject(status);
				} else {
					if (results.length == 0) {
						status = 'no user found';
						return reject(status);
					} else {
						return resolve(results);
					}
				}
			}
		);
	});
};

grocerydb.updateUserProfile = (
	id,
	fname,
	lname,
	uname,
	email,
	town,
	address,
	phone
) => {
	console.log(id);
	return new Promise((resolve, reject) => {
		pool.query(
			'UPDATE users SET fname=?,lname=?,uname=?,email=?,town=?,address=?,phone=? WHERE id=?',
			[fname, lname, uname, email, town, address, phone, id],
			(err, results) => {
				if (err) {
					return reject(err);
				}
				return resolve(results);
			}
		);
	});
};
grocerydb.updatePassword = (id, cpass, npass) => {
	return new Promise((resolve, reject) => {
		pool.query(
			'SELECT id,password,isConfirm FROM users WHERE id=? LIMIT 1',
			[id],
			async (err, results) => {
				if (err) {
					status = 'No UserName Or Email found';
					return reject(status);
				} else {
					if (results.length == 0) {
						status = 'No UserName Or Email found';
						return reject(status);
					} else if (results[0].isConfirm == 0) {
						status = 'verify your account';
						return reject(status);
					} else {
						const isMatch = await bcrypt.compare(cpass, results[0].password);

						if (isMatch == true) {
							const saltRound = 10;
							const hashpassword = await bcrypt.hash(npass, saltRound);
							pool.query(
								'UPDATE users SET password=? WHERE id=?',
								[hashpassword, id],
								(err, results) => {
									if (err) {
										return reject(err);
									}
									return resolve(results);
								}
							);
						} else {
							status = 'Password is wrong';
							return reject(status);
						}
					}
				}
			}
		);
	});
};

// products query
grocerydb.getMainCategoriesList = () => {
	return new Promise((resolve, reject) => {
		pool.query(
			'SELECT * FROM main_index_categories WHERE visibility=1',
			(err, results) => {
				if (err) {
					return reject(err);
				}
				console.log(results);
				return resolve(results);
			}
		);
	});
};
grocerydb.getMainCategoriesListAdmin = () => {
	return new Promise((resolve, reject) => {
		pool.query('SELECT * FROM main_index_categories', (err, results) => {
			if (err) {
				return reject(err);
			}
			console.log(results);
			return resolve(results);
		});
	});
};
grocerydb.getMainCategoryProducts = (category) => {
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

	return new Promise((resolve, reject) => {
		// main_category_products
		// pool.query('SELECT * FROM products WHERE category = ?',[category] ,(err,results)=>{
		// pool.query('SELECT * FROM products pd WHERE pd.id IN ( SELECT product_id FROM main_category_products mp WHERE mp.category = ?)',[category] ,(err,results)=>{
		pool.query(
			'SELECT * FROM products INNER JOIN main_category_products ON products.id = main_category_products.product_id WHERE products.id IN ( SELECT product_id FROM main_category_products mp WHERE mp.category = ?)',
			[category],
			(err, results) => {
				if (err) {
					return reject(err);
				}
				console.log(results);
				return resolve(results);
			}
		);
	});
};
grocerydb.mainSearchProducts = (title) => {
	return new Promise((resolve, reject) => {
		//(CONCAT (cid) LIKE "'+gg[0]+'%")
		pool.query(
			'SELECT * FROM products WHERE name LIKE "%' +
				title +
				'%" OR tags LIKE "%' +
				title +
				'%"',
			(err, results) => {
				if (err) {
					return reject(err);
				}
				//console.log(results);
				return resolve(results);
			}
		);
	});
};

grocerydb.getAllProducts = () => {
	return new Promise((resolve, results) => {
		pool.query('SELECT * FROM products ', (err, results) => {
			if (err) {
				return reject(err);
			}
			return resolve(results);
		});
	});
};

grocerydb.getItems = (category) => {
	return new Promise((resolve, reject) => {
		pool.query(
			'SELECT * FROM products WHERE category = ? AND visible=1',
			[category],
			(err, results) => {
				if (err) {
					return reject(err);
				}
				// console.log(results)
				return resolve(results);
			}
		);
	});
};

grocerydb.getItemsByIds = (idList) => {
	// there is one security issue in query

	var num = '';
	var ids = '';

	for (let i = 0; i < idList.length; i++) {
		if (i < idList.length - 1) {
			num += '?,';
			ids += "'" + idList[i] + "',";
		} else {
			num += '?';
			ids += "'" + idList[i] + "'";
		}
	}

	// console.log(num)
	// console.log(ids)
	return new Promise((resolve, reject) => {
		pool.query(
			'SELECT pd1.id,pd1.price,(SELECT pd2.discount FROM products pd2 WHERE discountOn = 1 AND pd1.id = pd2.id ) AS discount FROM products pd1 WHERE pd1.id IN (' +
				ids +
				')',
			(err, results) => {
				if (err) {
					return reject(err);
				}
				return resolve(results);
			}
		);
	});
};

grocerydb.getProductDetailsById = (id) => {
	//product-view component
	return new Promise((resolve, reject) => {
		pool.query('SELECT * FROM products WHERE id = ?', [id], (err, results) => {
			if (err) {
				return reject(err);
			}
			return resolve(results);
		});
	});
};

grocerydb.updateProdcutsDetails = (
	id,
	name,
	category,
	price,
	discountOn,
	discount,
	qty,
	tags,
	visible
) => {
	//product-view component
	return new Promise((resolve, reject) => {
		pool.query(
			'UPDATE products SET name=?,price=?,discountOn=?,discount=?,qty=?,category=?,tags=?,visible=? WHERE id=?',
			[name, price, discountOn, discount, qty, category, tags, visible, id],
			(err, results) => {
				if (err) {
					return reject(err);
				}
				return resolve(results);
			}
		);
	});
};

grocerydb.updateProductTags = (tags, id) => {
	//product-view component
	return new Promise((resolve, reject) => {
		pool.query(
			'UPDATE products SET tags=? WHERE id=?',
			[tags, id],
			(err, results) => {
				if (err) {
					return reject(err);
				} else {
					pool.query(
						'SELECT tags FROM products WHERE id=?',
						[id],
						(err, results) => {
							if (err) {
								return reject(err);
							}
							return resolve(results);
						}
					);
				}
				//return resolve(results);
			}
		);
	});
};

grocerydb.updateProductImg = (fileName, id) => {
	//product-view component
	return new Promise((resolve, reject) => {
		pool.query(
			'UPDATE products SET pic=? WHERE id=?',
			[fileName, id],
			(err, results) => {
				if (err) {
					return reject(err);
				}
				return resolve(results);
			}
		);
	});
};

grocerydb.getProductSoldById = (id) => {
	//product-view component
	return new Promise((resolve, reject) => {
		pool.query(
			'SELECT * FROM products_sold WHERE productId = ? LIMIT 5 ',
			[id],
			(err, results) => {
				if (err) {
					return reject(err);
				}
				return resolve(results);
			}
		);
	});
};

grocerydb.addProduct = (
	pCategory,
	pName,
	pPrice,
	pDiscount,
	pQty,
	pPic,
	visible
) => {
	return new Promise((resolve, reject) => {
		pool.query(
			'INSERT INTO products(name,price,discount,qty,category,pic,visible) VALUES(?,?,?,?,?,?,?) ',
			[pName, pPrice, pDiscount, pQty, pCategory, pPic, visible],
			(err, results) => {
				if (err) {
					return reject(err);
				}
				return resolve(results);
			}
		);
	});
};

grocerydb.updateProductVisibilty = (id) => {
	//product-list component
	return new Promise((resolve, reject) => {
		pool.query(
			'SELECT visible FROM products WHERE id=?  ',
			[id],
			(err, results) => {
				if (err) {
					return reject(err);
				} else {
					var newValue;
					if (results[0].visible == 0) {
						console.log('hidden');
						newValue = 1;
					} else {
						console.log('show');
						newValue = 0;
					}
					pool.query(
						'UPDATE products SET visible=? WHERE id=?',
						[newValue, id],
						(err, results) => {
							if (err) {
								return reject(err);
							} else {
								//return results;
								if (newValue == 0) {
									return resolve('hidden');
								} else {
									return resolve('show');
								}
							}
						}
					);
				}
				//return resolve(results);
			}
		);
	});
};
grocerydb.updateProductDiscountOnOff = (id) => {
	//product-list component
	return new Promise((resolve, reject) => {
		pool.query(
			'SELECT discountOn FROM products WHERE id=?  ',
			[id],
			(err, results) => {
				if (err) {
					return reject(err);
				} else {
					var newValue;
					console.log(results[0].discountOn);
					if (results[0].discountOn == 0) {
						//console.log('hidden')
						newValue = 1;
					} else {
						// console.log('show')
						newValue = 0;
					}
					pool.query(
						'UPDATE products SET discountOn=? WHERE id=?',
						[newValue, id],
						(err, results) => {
							if (err) {
								return reject(err);
							} else {
								//return results;
								if (newValue == 0) {
									return resolve('hidden');
								} else {
									return resolve('show');
								}
							}
						}
					);
				}
				//return resolve(results);
			}
		);
	});
};

grocerydb.addMainCategoriesTitle = (pCategory, visible) => {
	return new Promise((resolve, reject) => {
		pool.query(
			'INSERT INTO main_index_categories(category,visibility) VALUES(?,?) ',
			[pCategory, visible],
			(err, results) => {
				if (err) {
					return reject(err);
				} else {
					pool.query('SELECT * FROM main_index_categories', (err, results) => {
						if (err) {
							return reject(err);
						}
						return resolve(results);
					});
				}
				//return resolve(results);
			}
		);
	});
};

grocerydb.updateMainCategoryVisibilty = (category) => {
	//product-list component
	return new Promise((resolve, reject) => {
		pool.query(
			'SELECT visibility FROM main_index_categories WHERE category=?  ',
			[category],
			(err, results) => {
				if (err) {
					return reject(err);
				} else {
					var newValue;
					console.log(results[0].visibility);
					if (results[0].visibility == 0) {
						//console.log('hidden')
						newValue = 1;
					} else {
						// console.log('show')
						newValue = 0;
					}
					pool.query(
						'UPDATE main_index_categories SET visibility=? WHERE category=?',
						[newValue, category],
						(err, results) => {
							if (err) {
								return reject(err);
							} else {
								//return results;
								if (newValue == 0) {
									return resolve('hidden');
								} else {
									return resolve('show');
								}
							}
						}
					);
				}
				//return resolve(results);
			}
		);
	});
};
grocerydb.addMainCategoryProducts = (pCategory, pId) => {
	return new Promise((resolve, reject) => {
		pool.query(
			'INSERT INTO main_category_products(category,product_id) VALUES(?,?) ',
			[pCategory, pId],
			(err, results) => {
				if (err) {
					return reject(err);
				}
				return resolve(results);
			}
		);
	});
};
grocerydb.removeCategoryFromHome = (category) => {
	return new Promise((resolve, reject) => {
		pool.query(
			'DELETE FROM main_index_categories WHERE category = ?',
			[category],
			(err, results) => {
				if (err) {
					return reject(err);
				}
				return resolve(results);
			}
		);
	});
};
grocerydb.removeProductFromHome = (itemId) => {
	return new Promise((resolve, reject) => {
		pool.query(
			'DELETE FROM main_category_products WHERE id = ?',
			[itemId],
			(err, results) => {
				if (err) {
					return reject(err);
				}
				return resolve(results);
			}
		);
	});
};

grocerydb.productsOrder = (orders) => {
	// shopping-cart
	return new Promise((resolve, reject) => {
		pool.query('INSERT INTO orders( date) VALUES(?)', [''], (err, results) => {
			if (err) {
				return reject(err);
			} else {
				function paddy(num, padlen, padchar) {
					var pad_char = typeof padchar !== 'undefined' ? padchar : '0';
					var pad = new Array(1 + padlen).join(pad_char);
					return (pad + num).slice(-pad.length);
				}
				const inserted_id = results.insertId;
				var fu = paddy(inserted_id, 8);

				const new_id = 'OR-' + fu;

				var timpstamp = moment().format('YYYY-MM-DD H:m:sZ');

				const userId = orders[0].userId;
				const totCost = orders[0].cost;
				console.log('totCost : ' + totCost);

				pool.query(
					'UPDATE orders SET orderTrackId=?,userId=?,totPrice=?,totItemsType=?,discount=?,date=?,status=? WHERE sid=?',
					[
						new_id,
						userId,
						totCost,
						orders.length - 1,
						0,
						timpstamp,
						'pending',
						inserted_id,
					],
					(err, results) => {
						if (err) {
							return reject(err);
						} else {
							for (let i = 1; i < orders.length; i++) {
								const prod = orders[i];

								try {
									pool.query(
										'INSERT INTO products_sold( trackId,productId,uid,amount,date,price,status) VALUES(?,?,?,?,?,?,?)',
										[
											new_id,
											prod.id,
											userId,
											prod.Quantity,
											timpstamp,
											prod.price,
											'pending',
										],
										(err, results) => {
											if (err) {
												return reject(err);
											}
											return results;
										}
									);
								} catch (error) {
									console.log(error);
								}
							}
							return resolve(results);
						}
					}
				);
			}
		});
	});
};
grocerydb.reduceItemAmountAfterOrder = (orders) => {
	// shopping-cart
	return new Promise((resolve, reject) => {
		//for (let i = 1; i < orders.length; i++) {
		try {
			pool.query(
				'SELECT * FROM products WHERE id=?',
				[orders.id],
				(err, results) => {
					if (err) {
						return reject(err);
					} else {
						console.log(results[0]);
						console.log(orders);
						const itemAmount = parseInt(results[0].qty);
						const itemSold = parseInt(results[0].itemSold);

						const orderItems = parseInt(orders.Quantity);

						const newAmount = itemAmount - orderItems;
						const newSoldItems = itemSold + orderItems;

						console.log(
							'new amount : ' + newAmount + ' sold items : ' + newSoldItems
						);
						pool.query(
							'UPDATE products SET qty=?,itemSold=? WHERE id=?',
							[newAmount, newSoldItems, orders.id],
							(err, results) => {
								if (err) reject(err);
								else {
									return results;
								}
							}
						);
					}
				}
			);
		} catch (error) {
			console.log(error);
		}
		//}
	});
};

grocerydb.getOrderList = () => {
	return new Promise((resolve, reject) => {
		pool.query('SELECT * FROM orders', [''], (err, results) => {
			if (err) {
				return reject(err);
			}
			return resolve(results);
		});
	});
};

grocerydb.searchOrderReqTable = (status, searchInput) => {
	return new Promise((resolve, reject) => {
		var where = '';
		param = [];

		if (status && (searchInput == '' || searchInput == null)) {
			where = 'WHERE status = ? ';
			param = [status];
		} else if (searchInput && (status == '' || status == null)) {
			var variable = '%' + searchInput + '%';
			//name LIKE "%'+title+'%" OR tags LIKE "%'+title+'%"
			where = 'WHERE ( orderTrackId LIKE ? ) OR ( userId LIKE ? )';
			param = [variable, variable];
		} else if (status && searchInput) {
			var variable = '%' + searchInput + '%';
			where = 'WHERE status = ? AND ( orderTrackId LIKE ? OR userId LIKE ? )';
			param = [status, variable, variable];
		} else {
			where = '';
			param = [];
		}

		pool.query('SELECT * FROM orders ' + where, param, (err, results) => {
			if (err) {
				return reject(err);
			}
			return resolve(results);
		});
	});
};
grocerydb.getOrderByTrackId = (id) => {
	return new Promise((resolve, reject) => {
		pool.query(
			'SELECT * FROM orders WHERE orderTrackId=?',
			[id],
			(err, results) => {
				if (err) {
					return reject(err);
				}
				return resolve(results);
			}
		);
	});
};
grocerydb.getOrderByUserId = (id) => {
	return new Promise((resolve, reject) => {
		pool.query('SELECT * FROM orders WHERE userId=?', [id], (err, results) => {
			if (err) {
				return reject(err);
			}
			return resolve(results);
		});
	});
};
grocerydb.getOrderDetailsByTrackId = (id) => {
	return new Promise((resolve, reject) => {
		pool.query(
			'SELECT * FROM products_sold WHERE trackId=?',
			[id],
			(err, results) => {
				if (err) {
					return reject(err);
				}
				return resolve(results);
			}
		);
	});
};

grocerydb.orderStatusChange = (id, status) => {
	return new Promise((resolve, reject) => {
		pool.query(
			'UPDATE orders SET status=? WHERE sid=?',
			[status, id],
			(err, results) => {
				if (err) {
					return reject(err);
				}
				return resolve(results);
			}
		);
	});
};

module.exports = grocerydb;
