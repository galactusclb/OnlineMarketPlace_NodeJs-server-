const express = require('express')
const db = require('../Db/index')
const bodyParser = require('body-parser');
const multer = require('multer')
const path = require('path'); 
var async1 = require('async')
// var upload = multer({ dest: 'uploads/' })

const router = express.Router()

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// app.use('/img', express.static( '../img/products' ));
// const staticpath = path.join( __dirname , '../img/products');
// console.log(staticpath)
// app.use('/static', express.static(staticpath));
// app.use("/uploads/users", express.static("/uploads/users"));
// app.use(express.static('./img/products'));
// app.use("/uploads/users", express.static("/uploads/users"));
// app.use('/static', express.static('public'))



router.get('/uploads/products/:pic',(req,res)=>{
    try {
        res.sendFile(path.join( __dirname ,'../img/products/'+ req.params.pic))
    } catch (error) {
        console.log(error)
    }
})

const storage = multer.diskStorage({
    destination: './img/products',
    filename: function(req,file, cb){
        cb(null, Date.now() + '.' + file.mimetype.split('/')[1])
    }
})

const upload = multer({ storage: storage})

router.get('/getMainCategoryProducts', async (req,res,next)=>{
    console.log(req.query)
    try {
        let results = await db.getMainCategoryProducts(req.query.category);
        res.json(results);
        console.log(results)
    } catch (error) {
        console.log(e);
        res.sendStatus(500)
    }
})
router.get('/getAllProducts', async (req,res,next)=>{ //admin-productList
    try {
        let results = await db.getAllProducts();
        res.json(results);
    } catch (error) {
        console.log(e);
        res.sendStatus(500)
    }
})

router.get('/getItems', async (req,res,next)=>{
  //  console.log(req.query)
    try {
        let results = await db.getItems(req.query.category);
       // console.log(results)
        res.json(results);
    } catch (error) {
        console.log(e);
        res.sendStatus(500)
    }
})
router.get('/getProductDetails', async (req,res,next)=>{ //product-view component
      async1.parallel([
        async function(callback){
            try {
                let results = await db.getProductDetailsById(req.query.productId);
                return results
            } catch (error) {
                console.log(e);
            }
        }
        ,async function(callback){
            try {
                let results = await db.getProductSoldById(req.query.productId);
                return results 
            } catch (error) {
                console.log(error);
                // res.sendStatus(500)
            }
        }
    ],function(err,results){
        if(err){
            console.log(err)
            res.json({"status": "failed", "message": "None" })
        }else{
            console.log(results)
            res.send(results); //both result1 and result2 will be in results
        }
    })
  })

router.post('/addProduct', upload.single('image') , async ( req,res,next)=> {
    // console.log(req.file.filename)
    // console.log(req.file.path)
    console.log(req.body)

    try {
        let results = await db.addProduct(req.body.pCategory,req.body.pName,req.body.pPrice,req.body.pDiscount,req.body.pQty,req.file.filename);
        res.status(200).json(results)
    } catch (error) {
        console.log(error);
        res.sendStatus(500)
    }
})
router.post('/updateProductVisibilty', async ( req,res,next)=> { //admin-productList
    console.log(req.body.params)
    try {
        //await new Promise(resolve => setTimeout(resolve, 10000));
        let results = await db.updateProductVisibilty(req.body.params.productId);
        console.log(results)
        res.status(200).json(results)
    } catch (error) {
        console.log(error);
        res.sendStatus(500)
    }
})
router.post('/addMainCategoryProducts', async ( req,res,next)=> {
    console.log(req.body)
    try {
        let results = await db.addMainCategoryProducts(req.body.pCategory,req.body.pId);
        res.status(200).json(results)
    } catch (error) {
        console.log(error);
        res.sendStatus(500)
    }
})
router.post('/removeProductFromHome', async (req,res,next)=>{
    console.log(req.body.params.item)
    try {
        let results = await db.removeProductFromHome(req.body.params.item);
        res.status(200).json(results)
    } catch (error) {
        console.log(error);
        res.sendStatus(500)
    }
} )

// router.post('/productsOrder', async (req, res,next)=>{ //shopping-cart
//     console.log(req.body.params)
//     try {
//         let results = await db.productsOrder(req.body.params.orders);
//         res.status(200).json(results)
//     } catch (error) {
//         console.log(error);
//         res.sendStatus(500)
//     }
// })
router.post('/productsOrder', async (req, res,next)=>{ //shopping-cart
    async1.parallel([
            async function(callback){
               try {
                    let resultsx = await db.reduceItemAmountAfterOrder(req.body.params.orders);
                    return resultsx;
                } catch (error) {
                    console.log(error)
                    return error
                }
            }
            ,async function(callback){
                try {
                    let results = await db.productsOrder(req.body.params.orders);
                    return results;
                } catch (error) {
                    console.log(error);
                }
            }
        ],function(err,results){
            if(err){
                console.log(err)
                res.json({"status": "failed", "message": "None" })
            }else{
                res.sendStatus(200); //both result1 and result2 will be in results
            }
        })
})


router.get('/getOrderList',async (req,res,next)=>{
    try {
        let results = await db.getOrderList();
        res.status(200).json(results)
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})
router.get('/getOrderByTrackId',async (req,res,next)=>{
    try {
        let results = await db.getOrderByTrackId(req.query.trackId);
        res.status(200).json(results)
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})
// router.get('/getOrderDetailsByTrackId',async (req,res,next)=>{ //orderDetails pg
//     try {
//         let results = await db.getOrderDetailsByTrackId(req.query.trackId);
//         res.status(200).json(results)
//     } catch (error) {
//         console.log(error);
//         res.sendStatus(500);
//     }
// })


router.get('/getOrderDetailsByTrackId', (req,res,next)=>{ //orderDetails pg
    console.log("track id : " + req.query.trackId)
    async1.parallel([
            async function(callback){
               try {
                    let resultsx = await db.getOrderDetailsByTrackId(req.query.trackId);
                    return resultsx;
                } catch (error) {
                    console.log(error)
                    return error
                }
            }
            // ,async function(callback){
            //     try {
            //         let resultsx = await db.getOrderDetailsByTrackId(req.query.trackId);
            //         return resultsx;
            //     } catch (error) {
            //         console.log(error)
            //         return error
            //     }
            // }

            // function(callback){
            //     pool.query("SELECT * FROM products_sold " , function (error, result1) {
            //         console.log(result1)
            //         callback(error,result1)
            //     });
            // }
            
        ],function(err,results){
            if(err){
                console.log(err)
                res.json({"status": "failed", "message": "None" })
            }else{
                console.log("res  : "+ results)
                res.send(JSON.stringify(results)); //both result1 and result2 will be in results
            }
        })
})

//admin pges
router.post('/orderStatusChange', async (req,res,next)=>{ //orderRequests component
    console.log(req.body.params)
    try {
        let results = await db.orderStatusChange(req.body.params.sid,req.body.params.status,);
        res.sendStatus(200)
    } catch (error) {
        console.log(error);
        res.sendStatus(500)
    }
} )




router.post('/uploadProductImg', async (res,req,next)=>{
    console.log(res.file)
    try {
        // let results = await db.addProduct();
        res.sendStatus(200)
    } catch (error) {
        console.log(error);
        res.sendStatus(500)
    }
})



router.post('/profile', upload.single('image'),async (req,res,next)=>{
    console.log(req.file.filename)
    console.log(req.body)
})


// router.post('/profile', upload.single('image'), function (req, res, next) {
//     // req.file is the `avatar` file
//     // req.body will hold the text fields, if there were any
//     console.log(req.file)
//   })





module.exports = router
