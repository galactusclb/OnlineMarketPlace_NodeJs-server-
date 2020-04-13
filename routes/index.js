const express = require('express')
const db = require('../Db/index')
const bodyParser = require('body-parser');
const multer = require('multer')
const path = require('path'); 
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
