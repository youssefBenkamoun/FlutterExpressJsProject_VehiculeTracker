const http = require('http');
const server = http.createServer();
const {Server} = require("socket.io");
const io = new Server(server);

const PORT = process.env.PORT || 3700;

io.on("connection", (socket) => {
    socket.on("position-change",(data) =>{
        console.log(data);

    })
    socket.on("disconnect",() =>{
        
    })
    
  });

if (process.env.NODE_ENV != 'production'){
    require('dotenv').config()
}

const methodOverride = require('method-override')
const path = require('path');
const express = require('express');
const ejs = require('ejs');
var mongoose = require('mongoose');
var session = require('express-session');
const bodyParser = require('body-parser');
const app = express();
const {v4:uuidv4} =require("uuid");
const bcrypt = require('bcrypt');
const passport = require('passport')

const flash = require('express-flash')




const multer = require('multer');
app.use(express.static(path.join(__dirname, 'uploads')));
app.set('uploads',path.join(__dirname,'uploads'));
app.use(flash())
app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:false
}));
app.use(passport.initialize())
app.use(passport.session())

var storage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null,"./uploads");
    },
    filename: function(req,file,cb){
        console.log(file);
        cb(null,file.originalname);
    },
});
var upload = multer({
    storage: storage,
})

app.post("/upload", upload.single('photo'), (req,res) =>{
    res.send("Image Uploaded");
});

//connect to db
const mysql = require('mysql');
 
const connection=mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'',
    database:'vehiculedb'
});
 
connection.connect(function(error){
    if(!!error) console.log(error);
    else console.log('Database Connected!');
});

const users = []
let sql = "SELECT * FROM user";



//definir moteur de template
//set views file
app.set('views',path.join(__dirname,'views'));
//app.set('views/users',path.join(__dirname,'views/users'));
app.use(methodOverride('_method'))
			
//set view engine
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(express.static('uploads'));
app.use(bodyParser.urlencoded({ extended: false }));

//ajouter le chemin d'accueil et définir la page d'index des etudiants
app.get('/', (req, res) => {
    // res.send('CRUD Operation using NodeJS / ExpressJS / MySQL');
    let sql = "SELECT * FROM vehicule";
    let query = connection.query(sql, (err, rows) => {
        if(err) throw err;
        res.render('index', {
            title : '  GESTION VEHICULES',
            vehicule : rows
        });
    });
});

app.get('/add',(req, res) => {
    res.render('add', {
        title : 'Ajouter vehicules'
    });
});


app.post('/save',upload.single('photo'),(req, res) => {
    console.log(req.file.filename) ;
    let data = {type: req.body.type, marque: req.body.marque, matricule: req.body.matricule, photo: req.file.filename, dateMiseCirculation: req.body.date, position: '1'};
    let sql = "INSERT INTO vehicule SET ?";
    let query = connection.query(sql, data,(err, results) => {
      if(err) throw err;
      res.redirect('/');
    });
});

app.get('/edit/:Id',(req, res) => {
    const Id = req.params.Id;
    let sql = `Select * from vehicule where id = ${Id}`;
    let query = connection.query(sql,(err, result) => {
        if(err) throw err;
        res.render('edit', {
            title : 'Editer vehicule',
            e : result[0]
        });
    });
});


app.post('/update',(req, res) => {
    const Id = req.body.id;
    let sql = "update vehicule SET  type='"+req.body.type+"', marque='"+req.body.marque+"',  matricule='"+req.body.matricule+"',  dateMiseCirculation='"+req.body.date+"',  photo='"+req.body.photo+"' where id ="+Id;
    let query = connection.query(sql,(err, results) => {
      if(err) throw err;
      res.redirect('/');
    });
});
 

app.get('/delete/:Id',(req, res) => {
    const Id = req.params.Id;
    let sql = `DELETE from vehicule where id = ${Id}`;
    let query = connection.query(sql,(err, result) => {
        if(err) throw err;
        res.redirect('/');
    });
});

// gestion tracker

app.get('/tracker/index', (req, res) => {
    // res.send('CRUD Operation using NodeJS / ExpressJS / MySQL');
    let sql = "SELECT * FROM tracker";
    let query = connection.query(sql, (err, rows) => {
        if(err) throw err;
        res.render('tracker/index', {
            title : '  GESTION TRACKER',
            tracker : rows
        });
    });
});

app.get('/tracker/add',(req, res) => {
    let sql = "SELECT * FROM vehicule";
    let query = connection.query(sql, (err, rows) => {
        if(err) throw err;
        res.render('tracker/add', {
            title : 'Ajouter trackers',
            vehicule : rows
        });
    });
    
});
app.get('/tracker/add2/:Id',(req, res) => {
    const Id = req.params.Id;
    let sql = "SELECT * FROM vehicule";
    let query = connection.query(sql,(err, result) => {
        if(err) throw err;
        res.render('tracker/add2', {
            title : 'Associer tracker pour vehicule',
            e : Id,
            vehicule: result
        });
    });
});
app.get('/tracker/delete/:Id',(req, res) => {
    const Id = req.params.Id;
    console.log(Id);
    let sql = `DELETE from tracker where id = ${Id}`;
    let query = connection.query(sql,(err, result) => {
        if(err) throw err;
        res.redirect('/tracker/index');
    });
});;

app.post('/tracker/save',(req, res) => {
    let data = {simNumber: req.body.simNumber};
    let sql = "INSERT INTO tracker SET ?";
    let query = connection.query(sql, data,(err, results) => {
      if(err) throw err;
      res.redirect('/tracker/index');
    });
});
app.post('/tracker/save2',(req, res) => {
    let data = {simNumber: req.body.simNumber};
    let sql = "INSERT INTO tracker SET ?";
    let query = connection.query(sql, data,(err, results) => {
      if(err) throw err;
      res.redirect('/tracker/add2');
    });
});
app.post('/tracker/associer',(req, res) => {
    var ladate = new Date();
    var idVehicule = req.body.vehicule;
    var idTracker = req.body.tracker;
    var auj = ladate.getFullYear()+"-"+(ladate.getMonth()+1)+"-"+ladate.getDate();
    
    let sql = "update trackervehicule SET  dateFin='"+auj+"' where (vehicule ="+idVehicule+" and dateFin LIKE '0000-00-00') OR (tracker ="+idTracker+" and dateFin LIKE '0000-00-00')";
    let query = connection.query(sql,(err, results) => {
      if(err) throw err;
      let data = {vehicule: idVehicule, tracker: idTracker, dateDebut: ladate.getFullYear()+"-"+(ladate.getMonth()+1)+"-"+ladate.getDate()};
        console.log(data.dateDebut);
        let sql = "INSERT INTO trackervehicule SET ?";
        let query = connection.query(sql, data,(err, results) => {
        if(err) throw err;
        res.redirect('/tracker/index');
        });
    });
    
});

// historique ///

app.get('/historique', (req, res) => {
    // res.send('CRUD Operation using NodeJS / ExpressJS / MySQL');
    let sql = "select * from vehicule";
    let query = connection.query(sql,(err, results) => {
        let sql = "SELECT * FROM trackervehicule";
        let query = connection.query(sql, (err, rows) => {
            if(err) throw err;
            res.render('historique/index', {
                title : '  Historique d\'association',
                association : rows,
                vehicule: results
            });
        });
    });
});
app.get('/historique/choose/:Id',(req, res) => {
    const Id = req.params.Id;
    let sql = `SELECT * FROM trackervehicule where vehicule = ${Id}`;
    let query = connection.query(sql,(err, result) => {
        if(err) throw err;
        res.render('historique/choose', {
            title : 'Historique d\'Association',
            e : Id,
            vehicule: result
        });
    });
});
app.post('/choose',(req, res) => {
    
    var vehicule = req.body.vehicule ;
    let sql = "SELECT * FROM trackervehicule WHERE vehicule = ?";
    let query = connection.query(sql, vehicule,(err, results) => {
      if(err) throw err;
      res.render('historique/choose', {
        title : 'Historique d\'Association',
        vehicule: results
    });
    });
});

//ajouter le chemin d'accueil et définir la page d'index des positions
app.get('/position',(req, res) => {
    // res.send('CRUD Operation using NodeJS / ExpressJS / MySQL');
    let sql = "SELECT * FROM position";
    let query = connection.query(sql, (err, rows) => {
        if(err) throw err;
        res.render('index2', {
            title : 'gestion positions',
            position : rows
        });
    });
});

app.get('/pos/:Position',(req, res) => {
    const Position = req.params.Position;
    let sql = `Select * from position where id = ${Position}`;
    let query = connection.query(sql,(err, result, rows) => {
        if(err) throw err;
        res.render('map', {
            title : 'gestion vehicules',
            position : rows,
            p : result[0],
        });
    });
});

// Server Listening
app.listen(3700, () => {
    console.log('Server is running at port 3700');
});

