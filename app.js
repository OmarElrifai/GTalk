
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const LocalStrategy = require('passport-local').Strategy;
const crypto = require("crypto");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const app = express();
const cors = require("cors");
const multer = require("multer");
let uploadsPhoto =[];
let pic = {
  path:""
};
let picture ='';
let assignurl = false;
app.use(cors({
  origin:"https://gtalk-b4978.web.app",
  credentials:true,
}))
const storage = multer.diskStorage({
  destination:(req,file, cb)=>{
    cb(null,__dirname+"/upload/")
  },
  filename:(req,file,cb)=>{
    cb(null,file.originalname)
  }
})
const fileFilter=(req,file,cb)=>{
  //  uploadsPhoto.forEach((photo)=>{
  //      if(file.originalname==photo){
  //        picture = true
  //      }else{
  //        null
  //      }
  //  })
  
   if(picture == true && uploadsPhoto.indexOf(file.originalname)!= -1 ){
    assignurl=false;
     cb(null,false);
   }else if(picture == true && uploadsPhoto.indexOf(file.originalname)== -1){
    picture=true;
    assignurl=true;
    // uploadsPhoto.push(file.originalname)
     cb(null,true)
   }else{
    picture=true;
    assignurl=true;
    // uploadsPhoto.push(file.originalname)
     cb(null,true)
   }
   console.log("picture inside filter:")
   console.log(picture)
}
const upload = multer({
  storage:storage,
  fileFilter:fileFilter
});



app.use(bodyParser.urlencoded({extended:true}));
app.use(express.json());
// app.use(express.static('website'));
app.use("/app/upload",express.static("upload"));




mongoose.connect("mongodb+srv://Rif:dolkadoz40@mflix.n3dih.mongodb.net/Gtalkdb",{useNewUrlParser: true, useUnifiedTopology: true})
// mongoose.connect("mongodb://localhost:27017/Gtalkdb",{useNewUrlParser: true, useUnifiedTopology: true})


// const store = new MongoDBStore({
//   uri:"mongodb+srv://Rif:dolkadoz40@mflix.n3dih.mongodb.net/Gtalkdb",
//   collection:"Sessions"
// })

app.use(session({
  secret:'high perminant security',
  resave:false,
  saveUninitialized:false
  // store:store
}))

app.use(passport.initialize());
app.use(passport.session());

const UserSchema = new mongoose.Schema({
    GoogleID:String,
    Username:String,
    Hash:String,
    Salt:String,
    Gender:String,
    DateOfBirth:Date,
    KnownAs:String,
    Created:Date,
    LastActive:Date,
    Introduction:String,
    Interests:String,
    City:String,
    Country:String,
    photos: [{
        url:String,
        isMain:Boolean
    }],
    Requests:[String],
    Friends:[String],
    Posts:[String]
}) 


// UserSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User",UserSchema);

// passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

const postCollectionSchema = new mongoose.Schema({
  user:UserSchema,
  posts:String
})
const postCollection = mongoose.model("pos",postCollectionSchema);
// passport.use(new LocalStrategy(
//   function(username, password, done) {
//     User.findOne({ Username: username }, function (err, user) {
//       if (err) { return done(err); }
//       if (!user) {
//         return done(null, false, { message: 'Incorrect username.' });
//       }
//       if (!user.validPassword(password)) {
//         return done(null, false, { message: 'Incorrect password.' });
//       }
//       return done(null, user);
//     });
//   }
// ));



passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

// passport.use(new GoogleStrategy({
//   clientID:process.env.CLIENT_ID,
//   clientSecret:process.env.CLIENT_SECRETS,
//   callbackURL:'http://localhost:3000/auth/google/secrets'
// },

// (accessToken,refreshToken,profile,cb)=>{
//     User.findOne({GoogleID:profile.id},(err,doc)=>{
//       err ? console.log(err.message):null;
//       if(!doc){
//         const user = new User({
//           GoogleID:profile.id,
//           Username:profile.name.givenName,
//           Hash:"googlepassword"
//         });
//         user.save((err,oneuser)=>{
//           console.log("oneuser = "+ oneuser)
//              return cb(err,oneuser);
//         })
//       }else{
//         console.log("doc = "+ doc)
//         return cb(err,doc);
        
//       }
      
//     });
//     console.log("profile = "+ profile)

//   }
// ))

app.listen(process.env.PORT || 3001,()=>{
    console.log("Server is connected on 3001")
})

const outh = (req,res,next) =>{
  if(req.session.isAuth === true || req.isAuthenticated()){
    next()
  }else{
    res.redirect("/login")
  }
}

// app.get('/auth/google',passport.authenticate("google",{scope:["profile"]}));

// app.get('/auth/google/secrets',passport.authenticate('google',{failureRedirect:"/auth/google"}),(req,res)=>{
//   res.send({
//     UsernameExist:"",
//     UsernameAlready:"",
//     PasswordExist:"",
//     LoginFail:"Username or Password is incorrect",
//     AuthSuccess:true
//   })
// })

let url=""
app.post("/stats",upload.single("photo"),function(req,res){
  console.log("picture inside path:")
  // console.log(req.file) 
  
  // console.log(uploadsPhoto)
  
  if(assignurl) {
  
    url= req.file.path;
    uploadsPhoto.push(req.file.originalname)
  }

  res.send("Photo uploaded sucessfully")

})
app.post("/updatephoto/:id",upload.single("photo"),(req,res)=>{
  const id = req.params.id
  User.findOneAndUpdate({_id:id, "photos.isMain":true},{$set:{"photos.$.url":req.file.path}},(err)=>{
      err? console.log(err):null;
      picture='';
      console.log("Successfully updated")
      res.send("Successfully updated")
  })
  postCollection.updateMany({"user._id":id, "user.photos.isMain":true},{$set:{"photos.$.url":req.file.path}},(err)=>{
     err?console.log(err):console.log("all profiles updated successfully");
  })
})

app.get('/form',(req,res)=>{
 res.sendFile(__dirname+'/website/form.html')
})

app.route("/")
    
.post((req,res)=>{
//   User.register({username:req.body.Username},req.body.Hash,function(err,user){
//     if(err){
//       console.log(err.message);
//       res.redirect("/")
//     }else{
//      passport.authenticate("local")(req,res,function(){
//        res.redirect("/secrets")
//      }) 
//     }
// })
})

.get((req,res)=>{
    User.find((err,docs)=>{
        res.send(docs);
        console.log(docs);
    });
   
})

app.get("/secrets",function(req,res){
    // res.send([{authen:true}])
    if(req.session.isAuth === true || req.isAuthenticated()){
      res.send({
        UsernameExist:"",
        UsernameAlready:"",
        PasswordExist:"",
        LoginFail:"",
        AuthSuccess:true
      });
      console.log({
        UsernameExist:"",
        UsernameAlready:"",
        PasswordExist:"",
        LoginFail:"",
        AuthSuccess:true
      })
    }else{
      res.redirect("/login")
    }
})

app.route("/register")
.post(function(req,res){
  const post = req.body;
  console.log("picture inside /register")
   console.log(picture);
   console.log(post);
   
   if(post.Username){
     User.findOne({Username:post.Username},(err,user)=>{
      err ? console.log(err.message):null; 
      if(user){
        res.send({
          User:{},
          UsernameExist:"",
          UsernameAlready:"User already exists",
          PasswordExist:"",
          LoginFail:"",
          Interests:"",
            ProfilePic:"",
          AuthSuccess:false
        })
       }else{
        
        // console.log("url:")
        // console.log(url)
        
        
        if(post.Hash && post.Interests && picture ){
          const user = new User(post);
          user.Salt = crypto.randomBytes(255).toString('hex');
          const Hash = crypto.pbkdf2Sync(user.Hash,user.Salt,10000,255,'sha512').toString('hex');
          user.Hash = Hash;
          user.photos[0]={
            url:url,
            isMain:true
          }
          user.save((err)=>{
            if(err){ 
            res.send(err.message);
            console.log(err.message)
           }else{
             req.session.isAuth = true;
             picture=false;
             uploadsPhoto=[];
             res.send({
              User:user,
              UsernameExist:"",
              UsernameAlready:"",
              PasswordExist:"",
              LoginFail:"",
              Interests:"",
            ProfilePic:"",
              AuthSuccess:true
            });  
           }
          });
         }else if(!post.Hash && !post.Interests && picture){
          res.send({
            User:{},
            UsernameExist:"",
            UsernameAlready:"",
            PasswordExist:"Password must be provided",
            LoginFail:"",
            Interests:"Please specify your interests/hobbies",
            ProfilePic:"",
            AuthSuccess:false
          })
         }else if(!post.Hash && post.Interests && !picture){
          res.send({
            User:{},
            UsernameExist:"",
            UsernameAlready:"",
            PasswordExist:"Password must be provided",
            LoginFail:"",
            Interests:"",
            ProfilePic:"Please upload a picture",
            AuthSuccess:false
          })
         }else if(post.Hash && !post.Interests && !picture){
          res.send({
            User:{},
            UsernameExist:"",
            UsernameAlready:"",
            PasswordExist:"",
            LoginFail:"",
            Interests:"Please write your interests",
            ProfilePic:"Please upload a picture",
            AuthSuccess:false
          })
         }else if(!post.Hash && post.Interests && picture){
          res.send({
            User:{},
            UsernameExist:"",
            UsernameAlready:"",
            PasswordExist:"Password must be provided",
            LoginFail:"",
            Interests:"",
            ProfilePic:"",
            AuthSuccess:false
          })
         }else if(post.Hash && !post.Interests && picture){
          res.send({
            User:{},
            UsernameExist:"",
            UsernameAlready:"",
            PasswordExist:"",
            LoginFail:"",
            Interests:"Please write your interests",
            ProfilePic:"",
            AuthSuccess:false
          })
         }else if(post.Hash && post.Interests && !picture){
          res.send({
            User:{},
            UsernameExist:"",
            UsernameAlready:"",
            PasswordExist:"",
            LoginFail:"",
            Interests:"",
            ProfilePic:"Please upload a picture",
            AuthSuccess:false
          })
         }else{
          res.send({
            User:{},
            UsernameExist:"",
            UsernameAlready:"",
            PasswordExist:"Password must be provided",
            LoginFail:"",
            Interests:"Please specify your interests/hobbies",
            ProfilePic:"Please upload a picture",
            AuthSuccess:false
          })
         }

       }
     })
   
   }else{
    res.send({
      User:{},
      UsernameExist:"Username must be provided",
      UsernameAlready:"",
      PasswordExist:"",
      LoginFail:"",
      Interests:"",
      ProfilePic:"",
      AuthSuccess:false
    })
   }
   
   
})
.get((req,res)=>{ 
res.sendFile(__dirname+"/register.html");
})

app.patch("/update/:id",(req,res)=>{
    User.update(
      {_id:req.params.id},
      {$set:req.body},
      (err)=>{
        err? console.log(err):res.send("updated successfully");
      }
      )
})

app.route("/login")
.post(function(req,res){
    
    const {Username , Hash} = req.body;
    User.findOne({Username : Username},(err,user)=>{
         err ? console.log(err.message):null;
         if(!user){
           res.send({
            User:{},
            UsernameExist:"",
            UsernameAlready:"",
            PasswordExist:"",
            LoginFail:"Username or Password is incorrect",
            AuthSuccess:false
          })
         }else{
          const Hashed = crypto.pbkdf2Sync(Hash,user.Salt,10000,255,'sha512').toString('hex')
           if(Hashed === user.Hash ){
             req.session.isAuth = true;
             res.send({
              User:user,
              UsernameExist:"",
              UsernameAlready:"",
              PasswordExist:"",
              LoginFail:"",
              AuthSuccess:true
            })
           }else{
            res.send({
              User:{},
              UsernameExist:"",
              UsernameAlready:"",
              PasswordExist:"",
              LoginFail:"Username or Password is incorrect",
              AuthSuccess:false
            })
           }
         }
    })
})
.get((req,res)=>{
    res.sendFile(__dirname+"/login.html")
})

app.get("/friends/:id",(req,res)=>{
    const id = req.params.id;
    User.findOne({_id:id},(err,doc)=>{
         err ? console.log(err):res.send(doc);
    })
})

app.get("/post/:id",(req,res)=>{
  res.sendFile(__dirname+"/post.html")
})

app.post("/post/:id",(req,res)=>{
  
  User.findOneAndUpdate({_id:req.params.id},{$push:{Posts:req.body.post}},(err,user)=>{
    if(!err) {
      
      const post = new postCollection({
        user:user,
        posts:req.body.post
      });
      post.save((err,entry)=>{
         !err? console.log(entry):console.log(err);
      });
      res.send("success")
    }else{
      console.log(err);
    }
  })
  
  // const post = new postCollection ({
  //   user:{
  //           Username: "Rose",
  //           Hash:"123456",
  //           Gender: "female",
  //           DateOfBirth: "1961-06-20",
  //           KnownAs: "Arlene",
  //           Created: "2019-09-18",
  //           LastActive: "2020-05-19",
  //           Introduction: "Esse sit in incididunt sunt aliqua. Consequat consectetur nostrud non in consequat laborum velit anim ipsum est sunt exercitation culpa magna. Nisi id cupidatat proident et magna adipisicing adipisicing pariatur commodo nisi non. Tempor excepteur cillum ullamco ad sint nisi et reprehenderit anim quis culpa sunt in aliquip.\r\n",
  //           Interests: "Id do excepteur nulla deserunt magna occaecat sint ipsum proident deserunt culpa.",
  //           City: "Nash",
  //           Country: "Panama",
  //           photos: [],
  //           Posts:"is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset"
  //         },
  //        
  // })
  // post.save((err,entry)=>{
  //          !err? console.log(entry):console.log(err);
  //       });
})
const result =[];
app.get("/getposts",async(req,res)=>{
 const posts = await postCollection.find()
  try {
    
    
    const reversed = posts.reverse();
    res.send(reversed)
  } catch(err){
     console.log(err)
  }
})

app.post("/logout",(req,res)=>{
  req.session.destroy((err)=>{
    res.redirect("/login")
  })
})

// const photo1 ={
//           url: "https://randomuser.me/api/portraits/women/92.jpg",
//           isMain: true
//         }

//         const photo2 = {
//           url: "https://randomuser.me/api/portraits/women/84.jpg",
//           isMain: true
//         }

//         const photo3 = {  
//           url: "https://randomuser.me/api/portraits/women/16.jpg",
//           isMain: true
//         }

//         const photo4 = {
//           url: "https://randomuser.me/api/portraits/women/53.jpg",
//           isMain: true
//         }

//         const photo5 = {
//           url: "https://randomuser.me/api/portraits/women/51.jpg",
//           isMain: true
//         }
        
// const user1 = new User({
//       Username: "Rose",
//       Hash:"123456",
//       Gender: "female",
//       DateOfBirth: "1950-09-12",
//       KnownAs: "Rose",
//       Created: "2019-01-21",
//       LastActive: "2020-06-09",
//       Introduction: "Culpa ullamco deserunt culpa ut enim reprehenderit sunt laboris mollit pariatur. Velit proident est quis cillum ipsum officia ut sit occaecat nulla aliqua ad laboris ad. Est ea fugiat elit sint consectetur nisi elit do minim laborum ex et cupidatat aute.\r\n",
//       Interests: "Enim consequat reprehenderit quis consequat exercitation laborum occaecat cillum sunt commodo quis proident aute id.",
//       City: "Loyalhanna",
//       Country: "Nepal",
//       photos: [photo1],
//       Posts:"is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset"
//     })
                         
//     const user2 = new User({
//       Username: "Dianna",
//       Hash:"123456",
//       Gender: "female",
//       DateOfBirth: "1987-06-11",
//       KnownAs: "Dianna",
//       Created: "2019-02-15",
//       LastActive: "2020-06-25",
//       Introduction: "Ad quis est id proident eiusmod. In laborum deserunt aute pariatur mollit est quis est laboris excepteur irure reprehenderit. Anim officia voluptate culpa esse enim cillum officia dolore anim veniam anim pariatur. Labore ea pariatur quis non eiusmod consequat nostrud occaecat ea enim. Nostrud est eiusmod est adipisicing magna laboris in pariatur eu dolor reprehenderit quis. Eiusmod Lorem aute eu sunt ad.\r\n",
//       Interests: "Id mollit commodo nostrud officia cillum do ipsum commodo Lorem quis ipsum incididunt veniam.",
//       City: "Imperial",
//       Country: "Papua New Guinea",
//       photos: [photo2],
//       Posts:"is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset"
//     })
    
//     const user3 = new User({
//       Username: "Jennifer",
//       Hash:"123456",
//       Gender: "female",
//       DateOfBirth: "1967-08-04",
//       KnownAs: "Jennifer",
//       Created: "2019-04-28",
//       LastActive: "2020-05-02",
//       Introduction: "Eu magna cupidatat est ut incididunt adipisicing magna proident elit ullamco ea. Anim irure excepteur dolor in et duis occaecat excepteur veniam velit. Occaecat eu nostrud aliqua irure laborum nulla ad ad. Mollit elit consequat minim esse consectetur id consequat sit pariatur do. Et qui ex cupidatat cillum esse nulla ut.\r\n",
//       Interests: "Sit Lorem commodo duis reprehenderit et eu aute cupidatat amet ex dolor.",
//       City: "Idamay",
//       Country: "Ukraine",
//       photos: [photo3],
//       Posts:"is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset"
//     })
    
    
//     const user4 = new User({
//       Username: "Trisha",
//       Hash:"123456",
//       Gender: "female",
//       DateOfBirth: "1994-06-13",
//       KnownAs: "Trisha",
//       Created: "2019-07-05",
//       LastActive: "2020-05-20",
//       Introduction: "Commodo laborum pariatur ad laborum consectetur pariatur qui commodo minim aliquip laboris est sunt nulla. Culpa pariatur eu sit aute deserunt nostrud nostrud amet quis. Laboris anim laboris tempor eu exercitation fugiat. Voluptate duis nisi elit veniam aliqua esse occaecat eiusmod ipsum. Est tempor dolor Lorem occaecat Lorem.\r\n",
//       Interests: "Amet sint laboris nostrud consequat ex qui tempor commodo nulla voluptate.",
//       City: "Heil",
//       Country: "Niue",
//       photos: [photo4],
//       Posts:"is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset"
//     })
    
    
//     const user5 = new User({
//       Username: "Arlene",
//       Hash:"123456",
//       Gender: "female",
//       DateOfBirth: "1961-06-20",
//       KnownAs: "Arlene",
//       Created: "2019-09-18",
//       LastActive: "2020-05-19",
//       Introduction: "Esse sit in incididunt sunt aliqua. Consequat consectetur nostrud non in consequat laborum velit anim ipsum est sunt exercitation culpa magna. Nisi id cupidatat proident et magna adipisicing adipisicing pariatur commodo nisi non. Tempor excepteur cillum ullamco ad sint nisi et reprehenderit anim quis culpa sunt in aliquip.\r\n",
//       Interests: "Id do excepteur nulla deserunt magna occaecat sint ipsum proident deserunt culpa.",
//       City: "Nash",
//       Country: "Panama",
//       photos: [photo5],
//       Posts:"is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset"
//     })
    
       
    
//photo.insertMany([photo1,photo2,photo3,photo4,photo5],(err)=>{
//        err ? console.log(err):console.log("added sucessfully")
//    })
// User.insertMany([user1,user2,user3,user4,user5],(err)=>{
//        err ? console.log(err):console.log("added sucessfully")
//    })

