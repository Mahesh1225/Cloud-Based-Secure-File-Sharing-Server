//requiring packages
const express = require('express');
const multer = require('multer');
const path = require('path');
const File = require('../models/file');
const fs=require('fs');
const fs1=require('fs-extra');
require('dotenv').config();
const storageURL=process.env.FILE_STORAGE_URL;
//storage engine
const storage = multer.diskStorage({
   destination: storageURL,
   filename: function (req, file, cb) {
      return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
   }
});

//initializing upload
const upload = multer({
   storage: storage
})

//using express router
let router = express.Router();

//routes 
router.route('/')
.get(function (req, res) {

   File.find({}, function (err, files) {

      if (err) {
         res.send(err);
      }
      else {
         res.send(files);
      }
   })

})
.post(upload.array('files', 4), (req, res) => {

   var data = req.files;
   let isSuccess=true;

   for (var i in data) {
      console.log(data[i]);

      var x=storageURL+'/'+data[i].filename;
      var url=`http://localhost:3000/files/${data[i].filename}`;
      var ext=path.extname(data[i].filename);

      var file=new File({
         fileName:data[i].originalname,
         filePath:x,
         fileUrl:url,
         fileExt:ext
      });

      file.save((err)=>{
         if(err)
         {
            console.log(err);
            isSuccess=false;
         }
      });

   }

   res.json({
      success:isSuccess,
   });
});

router.route('/:id')
.put(function(req,res)
{
  

   File.find({ _id: req.params.id }, (err, data) => {
      if (err) {
         res.send(err);
      }
      else {
         var fileExt = data[0].fileExt;
         var ext=path.extname(req.body.fileName);
         var fileName=req.body.fileName;

         if(ext !== '')
         {
             ext=fileExt;
         }
         else
         {
            ext=fileExt;
            fileName=fileName+ext;
         }

    File.updateOne({_id:req.params.id},
      {$set:{fileName:fileName,fileExt:ext}},
      {overwrite:true},
      function(err){
         if(!err)
         {
           res.send("Record Updated");
         }
      });
     
      }
   });

})

.delete(function(req,res){

   File.findByIdAndRemove(req.params.id,function(err,data)
   {
         if(err)
         {
            res.send(err);
         }
         else{

            fs.unlink(data.filePath,function(err){
               if(err)
               {
                  console.log(err);
               }
               else{
                  console.log("success deletion");
               }
            });

            res.send("file deleted");
         }
   });

   
});
   

router.get('/download/:id', (req, res) => {

   File.find({ _id: req.params.id }, (err, data) => {
      if (err) {
         console.log(err);
      }
      else {
         var filePath = data[0].filePath;
         res.download(filePath,data[0].fileName);

         //send files and display on web page
         // var fileUrl=data[0].fileUrl;
         // res.send(`
         // <iframe
         // src=${fileUrl}
         // frameBorder="0"
         // scrolling="auto"
         // height="100%"
         // width="100%"></iframe>
         // `);

      }
   });

});



//folders route
router.route('/newfolder')
.post(function(req,res)
{
     var folder=storageURL+'/'+req.body.folderName;
     //console.log(req.body.folderName);
     try
     {
        if(!fs.existsSync(folder))
        {
           fs.mkdirSync(folder);
           res.json({
              isCreated:"true"
           });

        }
        else
        {
         res.json({
            isCreated:"false"
         });
        }
     }
     catch(err)
     {
        res.send(err);
     }

})

.put(function(req,res)
{
 
   var folder=storageURL+'/'+req.body.folderName;
   var newName=storageURL+'/'+req.body.newName;
   try {
      fs.renameSync(folder , newName);
      res.json({
         isSuccess:"true"
      });
    } catch (err) {
      res.send(err);
    }
})

.delete(function(req,res)
{
   const folder = storageURL+'/'+req.body.folderName;

   fs1.remove(folder, err => {
     res.send(err);
   });

   res.json({
      isSuccess:"true"
   });
   
});


//exproting router
module.exports = router;


