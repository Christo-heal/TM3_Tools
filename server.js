const express = require("express");
const multer = require("multer");
const session = require("express-session");
const { PDFDocument, BlendMode } = require("pdf-lib");

const fs = require("fs");
const path = require("path");

const app = express();

app.use(express.urlencoded({
    extended:true
}));

app.use(
session({
    secret:"tmmmwatermark",
    resave:false,
    saveUninitialized:false,

    cookie:{
        maxAge:5*60*1000
    }

})
);

/*
LOGIN PAGE
*/

app.get("/login",(req,res)=>{

res.sendFile(
path.join(
__dirname,
"public",
"login.html"
)

);

});


/*
LOGIN PROCESS
*/

app.post("/login",(req,res)=>{

const username=
req.body.username;

const password=
req.body.password;

if(
username==="tm3"
&&
password==="tmmmwatermark"
){

req.session.loggedin=true;

return res.redirect("/");

}

return res.send(
"Username / Password salah"
);

});


/*
LOGOUT
*/

app.get("/logout",(req,res)=>{

req.session.destroy();

res.redirect(
"/login"
);

});


/*
MIDDLEWARE AUTH
*/

app.use((req,res,next)=>{

/*
boleh akses login
*/

if(
req.path==="/login"
){

return next();

}

if(
req.session.loggedin
){

return next();

}

return res.redirect(
"/login"
);

});


/*
BARU static file setelah auth
*/

app.use(
express.static(
"public"
)
);

const upload=multer({

dest:"uploads/"

});

app.post(
"/watermark",
upload.single("pdf"),

async(
req,
res
)=>{

try{

if(
!req.file
){

return res
.status(400)
.send(
"PDF belum diupload"
);

}

const templateName=
req.body.template;

const pdfPath=
req.file.path;

const templatePath=
path.join(

__dirname,
"templates",

`${templateName}.png`

);

if(
!fs.existsSync(
templatePath
)
){

return res
.status(400)
.send(

`Template tidak ditemukan:
${templatePath}`

);

}

const pdfBytes=
fs.readFileSync(
pdfPath
);

const pdfDoc=
await PDFDocument.load(
pdfBytes
);

const imageBytes=
fs.readFileSync(
templatePath
);

const watermark=
await pdfDoc.embedPng(
imageBytes
);

const pages=
pdfDoc.getPages();

for(
const page
of pages
){

const {
width,
height
}
=
page.getSize();

page.drawImage(
watermark,
{

x:0,
y:0,

width:
width,

height:
height,

opacity:
0.15,

blendMode:
BlendMode.Multiply

}

);

}

const result=
await pdfDoc.save();

const originalName=
req.file.originalname;

const fileName=
path.parse(
originalName
).name;

const newFileName=

`${fileName}_watermarked.pdf`;

const outputPath=
path.join(

__dirname,
"output",

newFileName

);

fs.writeFileSync(
outputPath,
result
);

res.download(

outputPath,

newFileName

);

}
catch(err){

console.error(
err
);

res
.status(500)
.send(

"ERROR: "+
err.message

);

}

});

app.listen(
3000,
()=>{

console.log(
"PDF Watermark berjalan di port 3000"
);

}
);
