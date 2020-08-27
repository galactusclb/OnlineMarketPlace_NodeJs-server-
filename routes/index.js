const express = require('express')
const jwt = require('jsonwebtoken')
const db = require('../Db/index')
const bodyParser = require('body-parser');
const multer = require('multer')
const path = require('path'); 
var async1 = require('async')
// var upload = multer({ dest: 'uploads/' })
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer')
const sendgridTranspoter = require('nodemailer-sendgrid-transport')
const unescape = require('../extra/unescape-middleware')

const sendGridAPiKey = "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";
const fromEmail = "chanakabit123@gmail.com";

const transpoter = nodemailer.createTransport(sendgridTranspoter({
    auth:{
        api_key: sendGridAPiKey
    }
}));

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


//login/reg routes

function verifyToken(req,res,next){
    if(!req.headers.authorization){
        return res.status(401).send('Unauthorized request-1')
    }
    let token = req.headers.authorization.split(' ')[1]
    if (token === 'null') {
        return res.status(401).send('Unauthorized request-2')
    }

    try {
        let payload = jwt.verify(token, 'mysecretKey');
        // if (!payload) {
        //     return res.status(401).send("Unothorized request-3")
        // }
        req.loggedUserDetails = payload.subject // this can use in next function
        next();
    } catch (error) {
        return res.status(401).send("Unothorized request-4")
    }
}

router.get('/getPermisionUser',verifyToken, async (req,res,next) =>{    //
    try{
        res.status(200).send(true);
    }catch(e){
        console.log(e)
        res.sendStatus(500);
    }
})

router.post('/register',
    [   check('email')
            .not().isEmpty().withMessage('Email is empty').isEmail().withMessage('Email is not valid')
            .trim().escape(),
        check('uName')
            .not().isEmpty().withMessage('Username is empty')
            .trim().escape(),
        check('uPass')
            .exists()
            .withMessage('Password should not be empty')
            .isLength({ min: 5 })
            .withMessage('Password should not be empty, minimum five characters')
            .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{5,}$/, "i")
            .withMessage('Password should not be empty, minimum five characters, at least one letter, one number and one special character'),
        check('town')
            .not().isEmpty().withMessage('Select city/town')
            .trim().escape(),
    ],
     async ( req,res,next)=>{
            console.log(req.body)
            const errors = validationResult(req)

            if (!errors.isEmpty()) {
                console.log(errors);
                res.status(422).send(errors);
            }else{
                let savedUser =  await db.findOneUser(req.body.email,req.body.uname)

                if (savedUser) {
                    //console.log('erororor')
                    return res.status(422).json("User already exists with that email/username.")
                }else{
                    const saltRound = 10;
                    const hashpassword = await bcrypt.hash(req.body.uPass, saltRound );

                    try {
                        crypto.randomBytes(32,async (err,buffer)=>{
                            if (err) {
                                console.log(err);
                            }
                            const token = buffer.toString("hex");
                            const expireToken = Date.now() + 24*60*60*1000;
                            //console.log(token)

                            await db.userRegister(req.body.email,req.body.uName,hashpassword,req.body.town,token,expireToken)
                                .then((result)=>{
                                    if(result){
                                        transpoter.sendMail({
                                            to: req.body.email,
                                            from: fromEmail,
                                            subject: "Welcome to ClbGrocery! Confirm Your Email",
                                            html:
                                                `
                                                <p>Let's confirm your email address</p>
                                                <span>User name : ${req.body.uName} </span>
                                                <h5>By clicking on the following link, you are confirming your email address.</h5>
                                                <a href="http://localhost:4200/confirm/${token}">Confirm Email Address</a>
                                                <br><span>This link will expire after 1 day</span>
                                                `
                                        })
                                        res.status(200).json({ message : 'Check your Email.'})
                                    }
                                }).catch(err=>{
                                    console.log(err)
                                }) 

                            
                        })
                    } catch (error) {
                        console.log(error)
                        res.sendStatus(409)
                    }
                }
            }            
})

router.post('/confirmemail', async (req,res,next) =>{    //
    console.log(req.body)
    try {
        await db.confirmEmail(req.body.details)
            .then((result)=>{
                if (result) {
                    res.status(200).json({message : 'your account has been confirmed' })
                }else{
                    res.status(400).json({message : 'the link has expired or invalid link' })
                }
            });
        
    } catch (error) {
        console.log(e);
        res.sendStatus(500)
    }
})

router.post('/login', async ( req,res,next)=>{
    console.log(req.body)
    try {
        let result = await db.userLogin(
            req.body.uName,
            req.body.uPass
        );
        if (result.length == 0) {
            result = 'Username or Password is wrong :( '
            res.status(200).send(result);
        }
        else{
            let payload = { subject: result }
            let jwtToken = jwt.sign(payload, 'mysecretKey', { expiresIn : "1h" })
            res.status(200).send({jwtToken});
        }
    } catch (error) {
        console.log(error);
        res.status(401).send(error);
    } 
})

router.get('/getbasicuserdetailsbyuid',verifyToken,async ( req,res,next)=>{           
    try{
        let results = await db.getBasicUserDetailsByUid(req.loggedUserDetails[0].id)
        res.json(results);
    } catch (error) {
        console.log(e);
        res.sendStatus(500)
    }                        
})


router.post('/updateprofile',
    [   check('email')
            .not().isEmpty().withMessage('email is empty').isEmail().withMessage('Email is not valid')
            .trim().escape(),
        check('fname')
            .not().isEmpty().withMessage('first name is empty')
            .trim().escape(),
        check('lname')
            .not().isEmpty().withMessage('last name is empty')
            .trim().escape(),
        check('uname')
            .not().isEmpty().withMessage('username is empty')
            .trim().escape(),
        check('town')
            .not().isEmpty().withMessage('select city/town')
            .trim().escape(),
        check('address')
            .not().isEmpty().withMessage('address is empty')
            .trim().escape(),
        check('phone')
            .not().isEmpty().withMessage('select city/town')
            .isLength({ min: 10, max:10 }).withMessage('enter valid phone number')
            .isNumeric().withMessage('enter valid phone number')
            .trim().escape(),
    ],
    verifyToken,
     async ( req,res,next)=>{
            console.log(req.body)
            // console.log(req.loggedUserDetails)
            // console.log(req.loggedUserDetails[0].id)
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                console.log(errors);
                res.status(422).send(errors);
            }else{
                try{
                    //await new Promise(resolve => setTimeout(resolve, 10000));

                    let results = await db.updateUserProfile(req.loggedUserDetails[0].id,req.body.fname,req.body.lname,req.body.uname,req.body.email,req.body.town,req.body.address,req.body.phone)
                    res.json(results);
                } catch (error) {
                    console.log(e);
                    res.sendStatus(500)
                }               
            }     
})

router.post('/updatepassword',
    [
        check('cPass')
            .not().isEmpty().withMessage('current password is empty')
            .trim().escape(),
        check('nPass')
            .not().isEmpty().withMessage('new password is empty')
            .trim().escape(),
        check('cnPass')
            .not().isEmpty().withMessage('confirm new password is empty')
            .trim().escape()
    ],
    verifyToken,
     async ( req,res,next)=>{
            console.log(req.body)
            // console.log(req.loggedUserDetails)
            // console.log(req.loggedUserDetails[0].id)
            const errors = validationResult(req)

            if (!errors.isEmpty()) {
                console.log(errors);
                res.status(422).send(errors);
            }else{
                let savedUser =  await db.findOneUserById(req.loggedUserDetails[0].id)

                if (!savedUser) {
                    return res.status(422).json("no user found")
                }else{
                    try{
                        let results = await db.updatePassword(req.loggedUserDetails[0].id,req.body.cPass,req.body.nPass)
                        res.status(200).json(results);
                    } catch (error) {
                        console.log(error);
                        const err = []
                        err['error']['errors'].push({msg : error})
                        res.status(422).send(err);
                        //res.status(500).json(error);
                    } 
                }            
            }     
})










//product routes
router.get('/getMainCategoriesList', async (req,res,next)=>{ //home component
    console.log(req.query)
    try {
        let results = await db.getMainCategoriesList();
        res.json(results);
        //console.log(results)
    } catch (error) {
        console.log(e);
        res.sendStatus(500)
    }
})
router.get('/getMainCategoriesListAdmin', async (req,res,next)=>{ //home component
    console.log(req.query)
    try {
        let results = await db.getMainCategoriesListAdmin();
        res.json(results);
    } catch (error) {
        console.log(e);
        res.sendStatus(500)
    }
})
router.get('/getMainCategoryProducts', async (req,res,next)=>{ //home component
    console.log(req.query)
    try {
        let results = await db.getMainCategoryProducts(req.query.category);
        res.json(results);
        //console.log(results)
    } catch (error) {
        console.log(e);
        res.sendStatus(500)
    }
})
router.get('/getAllProducts',verifyToken, async (req,res,next)=>{ //admin-productList
    try {
        let results = await db.getAllProducts();
        res.json(results);
    } catch (error) {
        console.log(e);
        res.sendStatus(500)
    }
})

router.get('/getItems', async (req,res,next)=>{ //shopping component
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
router.get('/getitemsbyids', async (req,res,next)=>{ //shopping component
      try {
          //await new Promise(resolve => setTimeout(resolve, 10000));
          let results = await db.getItemsByIds(req.query.idList);
          res.json(results);
      } catch (error) {
          console.log(error);
          res.sendStatus(500)
      }
  })

router.get('/getProductDetails', async (req,res,next)=>{  //productEdit component
    try {
        let results = await db.getProductDetailsById(req.query.productId);
        res.json(results);
    } catch (error) {
        res.sendStatus(500)
    }
})
router.get('/mainSearchProducts', async (req,res,next)=>{ //home component
    console.log(req.query)
    try {
        let results = await db.mainSearchProducts(req.query.details);
        res.json(results);
        //console.log(results)
    } catch (error) {
        console.log(error);
        res.sendStatus(500)
    }
})
router.post('/updateProdcutsDetails', async (req,res,next)=>{  //productEdt component
    console.log(req.body)
    var body = req.body
    try {
        let results = await db.updateProdcutsDetails(body.id,body.name,body.category,body.price,body.discountOn,body.discount,body.qty,body.tags,body.visible);
        res.status(200).json(results);
    } catch (error) {
        res.sendStatus(500)
    }
})
router.post('/updateProductTags', async (req,res,next)=>{  //productEdt component
    console.log(req.body.params)
    var x = req.body.params
    try {
        let results = await db.updateProductTags(x.tags,x.id);
        res.status(200).json(results);
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})

router.post('/updateProductImg', upload.single('image') , async ( req,res,next)=> { //productEdt component
    //console.log(req.body.prodcutId)
    try {
        let results = await db.updateProductImg(req.file.filename,req.body.prodcutId);
        res.status(200).json(results)
    } catch (error) {
        console.log(error);
        res.sendStatus(500)
    }
})


router.get('/getProductDetailsHistory', async (req,res,next)=>{ //product-view component
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

router.post('/addProduct', upload.single('image') , async ( req,res,next)=> { //product-add component
    // console.log(req.file.filename)
    // console.log(req.file.path)
    console.log(req.body.visible)

    try {
        let results = await db.addProduct(req.body.pCategory,req.body.pName,req.body.pPrice,req.body.pDiscount,req.body.pQty,req.file.filename,req.body.visible);
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
router.post('/updateProductDiscountOnOff', async ( req,res,next)=> { //admin-productList
    console.log(req.body.params)
    try {
        //await new Promise(resolve => setTimeout(resolve, 10000));
        let results = await db.updateProductDiscountOnOff(req.body.params.productId);
        //console.log(results)
        res.status(200).json(results)
    } catch (error) {
        console.log(error);
        res.sendStatus(500)
    }
})


router.post('/addMainCategoriesTitle', async ( req,res,next)=> { //edit-home component
    console.log(req.body)
    try {
        let results = await db.addMainCategoriesTitle(req.body.pCategory,req.body.visibilty);
        res.status(200).json(results)
    } catch (error) {
        console.log(error);
        res.sendStatus(500)
    }
})
router.post('/updateMainCategoryVisibilty', async ( req,res,next)=> { //admin-productList
    console.log(req.body.params.category)
    try {
        //await new Promise(resolve => setTimeout(resolve, 10000));
        let results = await db.updateMainCategoryVisibilty(req.body.params.category);
        //console.log(results)
        res.status(200).json(results)
    } catch (error) {
        console.log(error);
        res.sendStatus(500)
    }
})
router.post('/addMainCategoryProducts', async ( req,res,next)=> { //edit-home component
    console.log(req.body)
    try {
        let results = await db.addMainCategoryProducts(req.body.pCategory,req.body.pId);
        res.status(200).json(results)
    } catch (error) {
        console.log(error);
        res.sendStatus(500)
    }
})

router.post('/removeCategoryFromHome', async (req,res,next)=>{ //edit-home component
    console.log(req.body.params.category)
    try {
        // let results = await db.getOrderByTrackId(req.query.trackId);
        let results = await db.removeCategoryFromHome(req.body.params.category);
        res.status(200).json(results)
    } catch (error) {
        console.log(error);
        res.sendStatus(500)
    }
} )
router.post('/removeProductFromHome', async (req,res,next)=>{ //edit-home component
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
    console.log(req.body.params.orders)
    
    // try {
    //     let results = await db.productsOrderAndReduce(req.body.params.orders);
    //     res.status(200).json(results)
    // } catch (error) {
    //     console.log(error);
    //     res.sendStatus(500)
    // }
    
    async1.parallel([
            // async function(callback){
            //     for (let i = 1; i < req.body.params.orders.length; i++) {
            //         try {
            //                 let resultsx = await db.reduceItemAmountAfterOrder(req.body.params.orders[i]);
            //                 return resultsx;
            //             } catch (error) {
            //                 console.log(error)
            //                 return error
            //             }
            //     }
            // }
            // ,
            async function(inner_callback){
                try {
                    let results = await db.productsOrder(req.body.params.orders);
                    return results;
                    //inner_callback(results)
                } catch (error) {
                    console.log(error);
                    inner_callback(error)
                    return error
                }
            }
        ],function(err,results){
            if(err){
                //console.log(err )
                res.status(500).json({"status": "failed", "message": err })
            }else{
                res.status(200).json(results); //both result1 and result2 will be in results
            }
        })    
 })


router.get('/getOrderList',async (req,res,next)=>{ //order-request component
    try {
        let results = await db.getOrderList();
        res.status(200).json(results)
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})
router.get('/getOrderByTrackId',async (req,res,next)=>{ //order-details component
    try {
        let results = await db.getOrderByTrackId(req.query.trackId);
        res.status(200).json(results)
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})
router.get('/getOrderByUserId',async (req,res,next)=>{ //user order component
    try {
        let results = await db.getOrderByUserId(req.query.UserId);
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


router.get('/getOrderDetailsByTrackId', (req,res,next)=>{ //orderDetails component
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

//**********************************************************************************************************************//
// ************************************************ admin pges ********************************************************//
//********************************************************************************************************************//



router.get('/searchorderreqtable',async (req,res,next)=>{ //order-request component
    console.log(req.query)
    try {
        let results = await db.searchOrderReqTable(req.query.status,req.query.searchInput);
        res.status(200).json(results)
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})
router.post('/orderStatusChange', async (req,res,next)=>{ //orderRequests component
    //console.log(req.body.params)
    try {
        let results = await db.orderStatusChange(req.body.params.sid,req.body.params.status,);
        res.status(200).json(results)
    } catch (error) {
        console.log(error);
        res.sendStatus(500)
    }
} )




router.post('/uploadProductImg', async (res,req,next)=>{ //product-add component, product-edit component
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
