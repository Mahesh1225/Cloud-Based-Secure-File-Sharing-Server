//requiring packages
const express = require('express');
const multer = require('multer');
const path = require('path');
const File = require('../models/file');
const User = require('../models/user');
const fs = require('fs');
const fs1 = require('fs-extra');

require('dotenv').config();
const storageURL = process.env.FILE_STORAGE_URL;
const USER_SPACE_PATH = process.env.USER_SPACE_PATH;

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

// router.post('/test', async (req, res) => {
//    console.log(req.body);
//    res.send("got");
// });


//routes 
//return all files of indiviual user using user id nothing but email id
router.route('/:id')
   .get(function (req, res) {

      var userid = req.params.id;
      File.find({ userId: userid }, function (err, files) {

         if (err) {
            console.log(err);
         }
         else {
            res.status(200).send(files);
         }
      })

   });

router.route('/')
   .post(upload.array('files', 4), (req, res) => {

      var data = req.files;
      //console.log(req.body.userId);
      // var userId = req.userid;
      // var folderpath = req.userpath;
      console.log("form userid " + req.body.userid);
      console.log("form userpath " + req.body.userpath);
      console.log("form folderid " + req.body.parentfolderid);

      var userId = req.body.userid;
      var folderpath = req.body.userpath;
      var folderid = req.body.parentfolderid;

      User.find({ userId: userId }, (err, user) => {
         if (err) {
            console.log(err);
         }
         else {

            console.log(user);
            console.log(user[0].userPath);


            for (var i in data) {
               console.log(data[i]);

               //var x = user[0].userPath + '/' + data[i].filename;
               var x = folderpath + '/' + data[i].filename;;
               var url = `http://localhost:3000/view/${data[i].filename}`;
               var ext = path.extname(data[i].filename);

               var file = new File({
                  userId: user[0].userId,
                  parentFolderId: folderid,
                  folderPath: folderpath,
                  fileName: data[i].originalname,
                  filePath: x,
                  fileUrl: url,
                  fileExt: ext
               });

               file.save((err) => {
                  if (err) {
                     console.log(err);
                  }
               });
            }

            for (var i in data) {
               console.log(data[i]);

               var x = storageURL + '/' + data[i].filename;

               fs1.move(x,
                  folderpath + '/' + data[i].filename
                  , function (err) {
                     if (err) { console.log(err); }
                     else { console.log("file moved"); }
                  });

            }

         }

      });

      res.status(201).json({ isSuccess: "true" });

      // var data = req.files;
      // //console.log(req.body.userId);

      // for (var i in data) {
      //    console.log(data[i]);

      //    var x = storageURL + '/' + data[i].filename;
      //    var url = `http://localhost:3000/files/${data[i].filename}`;
      //    var ext = path.extname(data[i].filename);

      //    var file = new File({
      //       fileName: data[i].originalname,
      //       filePath: x,
      //       fileUrl: url,
      //       fileExt: ext
      //    });

      //    file.save((err) => {
      //       if (err) {
      //          console.log(err);
      //       }

      //    });

      // }


      // res.status(201).json({ isSuccess: "true" });




   });


router.route('/folder')
   .post(upload.array('files'), (req, res) => {

      var data = req.files;
      //console.log(req.body.userId);
      // var userId = req.userid;
      // var folderpath = req.userpath;
      console.log("form userid " + req.body.userid);
      console.log("form userpath " + req.body.userpath);
      console.log(data);
      var userId = req.body.userid;
      var folderpath = req.body.userpath;

      User.find({ userId: userId }, (err, user) => {
         if (err) {
            console.log(err);
         }
         else {

            console.log(user);
            console.log(user[0].userPath);


            for (var i in data) {
               console.log(data[i]);

               //var x = user[0].userPath + '/' + data[i].filename;
               var x = folderpath + '/' + data[i].filename;;
               var url = `http://localhost:3000/view/${data[i].filename}`;
               var ext = path.extname(data[i].filename);

               var file = new File({
                  userId: user[0].userId,
                  folderPath: folderpath,
                  fileName: data[i].originalname,
                  filePath: x,
                  fileUrl: url,
                  fileExt: ext
               });

               file.save((err) => {
                  if (err) {
                     console.log(err);
                  }
               });
            }

            for (var i in data) {
               console.log(data[i]);

               var x = storageURL + '/' + data[i].filename;

               fs1.move(x,
                  folderpath + '/' + data[i].filename
                  , function (err) {
                     if (err) { console.log(err); }
                     else { console.log("file moved"); }
                  });

            }

         }

      });

      res.status(201).json({ isSuccess: "true" });

   });

//route for sending file to user by id
router.route('/file/:id')
   .get((req, res) => {
      File.find({ _id: req.params.id }, (err, data) => {
         res.sendFile(data[0].filePath);
      });
   })
   .put(function (req, res) {


      File.find({ _id: req.params.id }, (err, data) => {
         if (err) {
            console.log(err);
         }
         else {
            var fileExt = data[0].fileExt;
            var ext = path.extname(req.body.fileName);
            var fileName = req.body.fileName;

            if (ext !== '') {
               ext = fileExt;
            }
            else {
               ext = fileExt;
               fileName = fileName + ext;
            }

            File.updateOne({ _id: req.params.id },
               { $set: { fileName: fileName, fileExt: ext } },
               { overwrite: true },
               function (err) {
                  if (!err) {
                     res.status(200).json({ isSuccess: "true" });
                  }
               });

         }

      });

   })

   .delete(function (req, res) {

      File.findByIdAndRemove(req.params.id, function (err, data) {
         if (err) {
            console.log(err);
         }
         else {

            fs.unlink(data.filePath, function (err) {
               if (err) {
                  console.log(err);
               }
               else {
                  res.status(200).json({ isSuccess: "true" });
               }
            });

         }
      });


   });


router.get('/file/download/:id', (req, res) => {

   File.find({ _id: req.params.id }, (err, data) => {
      if (err) {
         console.log(err);
      }
      else {
         var filePath = data[0].filePath;
         res.status(200).download(filePath, data[0].fileName);

         // send files and display on web page
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


//route for the move files

router.route('/move/file')
   .put(function (req, res) {

      var destfolderid = req.body.destFolderId;
      var fileid = req.body.fileId;


      File.updateOne({ _id: fileid },
         { $set: { parentFolderId: destfolderid } },
         { overwrite: true },
         function (err) {
            if (!err) {
               res.status(200).json({ isSuccess: "true" });
            }
         });

   });


//exproting router
module.exports = router;


