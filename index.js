"use strict";

// const { request } = require('express');

// Imports dependencies and set up http server
const express = require("express"),
  firebase = require("firebase"),
  fs = require("fs"),
  Blob = require("node-blob"),
  LocalStorage = require("node-localstorage").LocalStorage,
  bodyParser = require("body-parser"),
  fetch = require("node-fetch"),
  //admin = require("@")
  storage2 = require("@firebase/storage"),
  app = express(),
  request = require("request"); // creates express http server
const { Storage } = require("@google-cloud/storage");
const storage = new Storage({
  projectId: "todo-app-25565",
  keyFilename: "serviceAccountKey.json",
});
const {
  projectId,
  BucketUrl,
  WebHookAccesToken,
} = require("./privateFiles/config");
const bucket = storage.bucket("gs://todo-app-25565.appspot.com");
let code = "";
let userData = [];
let order = false;

app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
const imageFilter = function (req, file, cb) {
  // Accept images only
  //console.log(file)
  if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
    req.fileValidationError = "Only image files are allowed!";
    return cb(new Error("Only image files are allowed!"), false);
  }
  cb(null, true);
};
var cors = require("cors");

var firebaseConfig = {
  apiKey: "AIzaSyAlFGoZEPc0rEYAYiUTnNYZmDbnkQdP20c",
  authDomain: "todo-app-25565.firebaseapp.com",
  databaseURL: "https://todo-app-25565.firebaseio.com",
  projectId: "todo-app-25565",
  storageBucket: "gs://todo-app-25565.appspot.com",
  messagingSenderId: "600592089866",
  appId: "1:600592089866:web:1535bd7732529489",
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
let storagedb = firebase.storage();
let db = firebase.database();
//var localStorage = new LocalStorage('./scratch');
// Creates the endpoint for our webhook
//admin.initializeApp({
//	credential: admin.credential.applicationDefault(),
//	databaseURL: 'https://<DATABASE_NAME>.firebaseio.com'
//  });
app.use(cors());
const multer = require("multer");
const { send } = require("process");
const Multerstorage = multer.diskStorage({
  destination: function (req, file, cb) {
    //console.log(file, req)
    cb(null, __dirname + "/Images");
  },
  filename: function (req, file, cb) {
    //console.log(file, req)
    cb(null, new Date().getTime() + file.originalname);
  },
});

const upload = multer({
  storage: Multerstorage,
});
const uploader = multer({
  storage: multer.memoryStorage(),
  dest: __dirname + "/Images/",
  limits: {
    fileSize: 5 * 1024 * 1024, // keep images size < 5 MB
  },
  fileFilter: imageFilter,
});

app.post("/webhook", (req, res) => {
  let body = req.body;

  // Checks this is an event from a page subscription
  if (body.object === "page") {
    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach((entry) => {
      // console.log(userData)
      // Gets the message. entry.messaging is an array, but
      // will only ever contain one message, so we get index 0
      let webhook_event = entry.messaging[0];
      //let Code = localStorage.getItem('checkout_order_code')
      let PSID = webhook_event.sender.id;
      // console.log(webhook_event.sender)
      var textmes = webhook_event.message.text;
      //if (PSID && textmes === code && code !== 'no code') {
      // console.log(textmes, PSID)
      if (PSID && textmes) {
        // console.log(userData[userData.length - 1].code, textmes)
        let obj = userData.filter((a) => a.code == textmes);
        let obj2 = userData.filter((a) => {
          if (a.data) {
            return a.data[0].PSID === PSID;
          } else {
            return false;
          }
        });
        // console.log(obj2.length)
        if (obj.length && !obj[0].order) {
          // console.log(Object.values(obj[0].data))
          // console.log(obj)
          for (let i = 0; i < Object.values(obj[0].data).length; i++) {
            postBack(PSID, obj[0].data[i]);
            if (i === Object.values(obj[0].data).length - 1) {
              // obj[0].order = true
              // console.log("abc====================================")
              setTimeout(() => {
                greetings(PSID, obj[0]);
              }, 2000);
            }
          }
          // firebase.database().ref('orders').child(`${obj.code}${PSID}`).set(obj)
          // 	.then((res) => {

          // 	})
        }
        // console.log(obj2[0].data)
        // console.log(PSID)
        // console.log(obj2[0].order === "false", obj2[0].order)
        if (obj2.length) {
          if (obj2[obj2.length - 1].data) {
            console.log(obj2[obj2.length - 1].data[0].PSID);
            if (obj2[obj2.length - 1].nameBoolean) {
              obj2[obj2.length - 1].name = textmes;
              obj2[obj2.length - 1].nameBoolean = false;
              obj2[obj2.length - 1].addressBoolean = true;
              obj2[obj2.length - 1].cityBoolean = false;
              obj2[obj2.length - 1].lastConfirmation = false;
            }
            if (obj2[obj2.length - 1].addressBoolean) {
              obj2[obj2.length - 1].name = textmes;
              obj2[obj2.length - 1].addressBoolean = false;
              obj2[obj2.length - 1].cityBoolean = true;
              obj2[obj2.length - 1].lastConfirmation = false;
              address(PSID, obj2[obj2.length - 1]);
            } else if (obj2[obj2.length - 1].cityBoolean) {
              obj2[obj2.length - 1].address = textmes;
              obj2[obj2.length - 1].cityBoolean = false;
              obj2[obj2.length - 1].lastConfirmation = false;
              obj2[obj2.length - 1].addressBoolean = false;
              obj2[obj2.length - 1].phoneNoBoolean = true;
              city(PSID, obj2[obj2.length - 1]);
            } else if (obj2[obj2.length - 1].phoneNoBoolean) {
              obj2[obj2.length - 1].city = textmes;
              obj2[obj2.length - 1].cityBoolean = false;
              obj2[obj2.length - 1].lastConfirmation = true;
              obj2[obj2.length - 1].addressBoolean = false;
              obj2[obj2.length - 1].phoneNoBoolean = false;
              phoneNo(PSID, obj2[obj2.length - 1]);
            } else if (obj2[obj2.length - 1].lastConfirmation) {
              obj2[obj2.length - 1].phoneNo = textmes;
              obj2[obj2.length - 1].cityBoolean = false;
              obj2[obj2.length - 1].lastConfirmation = false;
              obj2[obj2.length - 1].addressBoolean = false;
              obj2[obj2.length - 1].phoneNoBoolean = false;
              obj2[obj2.length - 1].settingObj = true;
              lastConfirmation(PSID, obj2[obj2.length - 1]);
              // getUserDetails(PSID, obj2[obj2.length - 1])
            } else if (obj2[obj2.length - 1].settingObj) {
              obj2[obj2.length - 1].settingObj = false;
              if (textmes === "Yes") {
                obj2[obj2.length - 1].settingObj = false;
                getUserDetails(PSID, obj2[obj2.length - 1]);
              } else if (textmes === "No") {
                obj2[obj2.length - 1].order = true;
                obj2[obj2.length - 1].nameBoolean = true;
                obj2[obj2.length - 1].cityBoolean = false;
                obj2[obj2.length - 1].lastConfirmation = false;
                obj2[obj2.length - 1].addressBoolean = false;
                obj2[obj2.length - 1].settingObj = false;
                greetingsTwo(PSID, obj2[obj2.length - 1]);
              }
            }
            if (
              obj2.length &&
              PSID === obj2[obj2.length - 1].data[0].PSID &&
              !obj2[obj2.length - 1].order
            ) {
              if (textmes === "Confirm") {
                obj2[obj2.length - 1].order = true;
                obj2[obj2.length - 1].nameBoolean = true;
                obj2[obj2.length - 1].cityBoolean = false;
                obj2[obj2.length - 1].lastConfirmation = false;
                obj2[obj2.length - 1].addressBoolean = false;
                // console.log(obj2[obj2.length - 1].order === "false", obj2[obj2.length - 1].order)

                greetingsTwo(PSID, obj2[obj2.length - 1]);
                // obj2[0].Confirm = true
              }
            }
          }
        }
      }
      //console.log({ webhook_event: entry, messaging: webhook_event });
    });

    // Returns a '200 OK' response to all requests
    res.status(200).send(body);
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
});

function greetings(PSID, obj) {
  // obj.PSID = PSID
  // console.log(obj.PSID)
  request({
    uri: "https://graph.facebook.com/v7.0/me/messages",
    qs: { access_token: WebHookAccesToken },
    method: "POST",
    json: {
      // 			"recipient": {
      // 				"id": PSID
      // 			},
      // 			"message": {
      // 				"text": `Thanks for shopping.. \n
      // kindly give us your
      // Name:
      // Complete Address:
      // Phone No:
      // for confirmation process \n
      // Total: ${obj.total}
      // 				`,
      // 			},
      recipient: {
        id: PSID,
      },
      messaging_type: "RESPONSE",
      message: {
        text: `Total Amount: ${obj.total} \n Confirm your order by clicking confirm`,
        quick_replies: [
          {
            content_type: "text",
            title: "Confirm",
            payload: "Confirm",
            // "image_url": "http://example.com/img/red.png"
          },
          {
            content_type: "text",
            title: "Cancel",
            payload: "Cancel",
            // "image_url": "http://example.com/img/green.png"
          },
        ],
      },
    },
  });
}

function lastConfirmation(PSID, obj) {
  // obj.PSID = PSID
  // console.log(obj.PSID)
  request({
    uri: "https://graph.facebook.com/v7.0/me/messages",
    qs: { access_token: WebHookAccesToken },
    method: "POST",
    json: {
      // 			"recipient": {
      // 				"id": PSID
      // 			},
      // 			"message": {
      // 				"text": `Thanks for shopping.. \n
      // kindly give us your
      // Name:
      // Complete Address:
      // Phone No:
      // for confirmation process \n
      // Total: ${obj.total}
      // 				`,
      // 			},
      recipient: {
        id: PSID,
      },
      messaging_type: "RESPONSE",
      message: {
        text: `Name: ${obj.name} \n City: ${obj.city} \n Phone No: ${obj.phoneNo} \n Address: ${obj.address} \n\n Is this information correct ?`,
        quick_replies: [
          {
            content_type: "text",
            title: "Yes",
            payload: "Yes",
            // "image_url": "http://example.com/img/red.png"
          },
          {
            content_type: "text",
            title: "No",
            payload: "No",
            // "image_url": "http://example.com/img/green.png"
          },
        ],
      },
    },
  });
}

function greetingsTwo(PSID, obj) {
  // obj.PSID = PSID
  // console.log(obj.PSID + "===22222222222222222222222222222222")
  request({
    uri: "https://graph.facebook.com/v7.0/me/messages",
    qs: { access_token: WebHookAccesToken },
    method: "POST",
    json: {
      recipient: {
        id: PSID,
      },
      // 			"message": {
      // 				"text": `Thanks for shopping.. \n
      // kindly give us your
      // Name:
      // Complete Address:
      // Phone No:
      // for confirmation process \n
      // Total: ${obj.total}
      // 							`,
      // 			},
      message: {
        text: `Kindly send us your name`,
      },
      // "recipient": {
      // 	"id": PSID
      // },
      // "messaging_type": "RESPONSE",
      // "message": {
      // 	"text": "Is this your orders ?",
      // 	"quick_replies": [
      // 		{
      // 			"content_type": "text",
      // 			"title": "Yes",
      // 			"payload": "<POSTBACK_PAYLOAD>",
      // 			// "image_url": "http://example.com/img/red.png"
      // 		}, {
      // 			"content_type": "text",
      // 			"title": "No",
      // 			"payload": "<POSTBACK_PAYLOAD>",
      // 			// "image_url": "http://example.com/img/green.png"
      // 		}
      // 	]
      // }
    },
  });
}

function city(PSID, obj) {
  // obj.PSID = PSID
  // console.log(obj.PSID + "===22222222222222222222222222222222")
  request({
    uri: "https://graph.facebook.com/v7.0/me/messages",
    qs: { access_token: WebHookAccesToken },
    method: "POST",
    json: {
      recipient: {
        id: PSID,
      },
      // 			"message": {
      // 				"text": `Thanks for shopping.. \n
      // kindly give us your
      // Name:
      // Complete Address:
      // Phone No:
      // for confirmation process \n
      // Total: ${obj.total}
      // 							`,
      // 			},
      message: {
        text: `Kindly send us your city name`,
      },
      // "recipient": {
      // 	"id": PSID
      // },
      // "messaging_type": "RESPONSE",
      // "message": {
      // 	"text": "Is this your orders ?",
      // 	"quick_replies": [
      // 		{
      // 			"content_type": "text",
      // 			"title": "Yes",
      // 			"payload": "<POSTBACK_PAYLOAD>",
      // 			// "image_url": "http://example.com/img/red.png"
      // 		}, {
      // 			"content_type": "text",
      // 			"title": "No",
      // 			"payload": "<POSTBACK_PAYLOAD>",
      // 			// "image_url": "http://example.com/img/green.png"
      // 		}
      // 	]
      // }
    },
  });
}

function phoneNo(PSID, obj) {
  // obj.PSID = PSID
  // console.log(obj.PSID + "===22222222222222222222222222222222")
  request({
    uri: "https://graph.facebook.com/v7.0/me/messages",
    qs: { access_token: WebHookAccesToken },
    method: "POST",
    json: {
      recipient: {
        id: PSID,
      },
      // 			"message": {
      // 				"text": `Thanks for shopping.. \n
      // kindly give us your
      // Name:
      // Complete Address:
      // Phone No:
      // for confirmation process \n
      // Total: ${obj.total}
      // 							`,
      // 			},
      message: {
        text: `Kindly send us your phone number`,
      },
      // "recipient": {
      // 	"id": PSID
      // },
      // "messaging_type": "RESPONSE",
      // "message": {
      // 	"text": "Is this your orders ?",
      // 	"quick_replies": [
      // 		{
      // 			"content_type": "text",
      // 			"title": "Yes",
      // 			"payload": "<POSTBACK_PAYLOAD>",
      // 			// "image_url": "http://example.com/img/red.png"
      // 		}, {
      // 			"content_type": "text",
      // 			"title": "No",
      // 			"payload": "<POSTBACK_PAYLOAD>",
      // 			// "image_url": "http://example.com/img/green.png"
      // 		}
      // 	]
      // }
    },
  });
}

function address(PSID, obj) {
  // obj.PSID = PSID
  // console.log(obj.PSID + "===22222222222222222222222222222222")
  request({
    uri: "https://graph.facebook.com/v7.0/me/messages",
    qs: { access_token: WebHookAccesToken },
    method: "POST",
    json: {
      recipient: {
        id: PSID,
      },
      // 			"message": {
      // 				"text": `Thanks for shopping.. \n
      // kindly give us your
      // Name:
      // Complete Address:
      // Phone No:
      // for confirmation process \n
      // Total: ${obj.total}
      // 							`,
      // 			},
      message: {
        text: `Kindly send us your complete address`,
      },
      // "recipient": {
      // 	"id": PSID
      // },
      // "messaging_type": "RESPONSE",
      // "message": {
      // 	"text": "Is this your orders ?",
      // 	"quick_replies": [
      // 		{
      // 			"content_type": "text",
      // 			"title": "Yes",
      // 			"payload": "<POSTBACK_PAYLOAD>",
      // 			// "image_url": "http://example.com/img/red.png"
      // 		}, {
      // 			"content_type": "text",
      // 			"title": "No",
      // 			"payload": "<POSTBACK_PAYLOAD>",
      // 			// "image_url": "http://example.com/img/green.png"
      // 		}
      // 	]
      // }
    },
  });
}

function postBack(PSID, obj) {
  obj.PSID = PSID;
  request(
    {
      uri: "https://graph.facebook.com/v7.0/me/messages",
      qs: { access_token: WebHookAccesToken },
      method: "POST",
      json: {
        recipient: {
          // id: "3273760249321146"    saqib id
          id: PSID,
        },
        message: {
          attachment: {
            type: "template",
            payload: {
              template_type: "generic",
              elements: [
                {
                  title: `${obj.title} (${obj.quantity})`,
                  image_url: obj.imageUrl[0],
                  subtitle: obj.subTitle,
                  default_action: {
                    type: "web_url",
                    url: obj.imageUrl[0],
                    webview_height_ratio: "tall",
                  },
                },
              ],
            },
          },
        },
      },
    },
    (err, res, body) => {
      if (!err) {
        //console.log('message sent!')
      } else {
        //console.log({ err, res })
      }
    }
  );
}

function getUserDetails(PSID, obj) {
  // console.log(obj)
  // request({
  // 	"uri": `https://graph.facebook.com/${PSID}?fields=first_name,last_name,profile_pic&access_token=${WebHookAccesToken}`,
  // }, (err, res, body) => {
  // 	if (!err) {
  // 		console.log(res.)
  // 	} else {
  // 		//console.log({ err, res })
  // 	}
  // })
  fetch(
    `https://graph.facebook.com/${PSID}?fields=first_name,last_name,profile_pic&access_token=${WebHookAccesToken}`
  )
    .then((res) => res.json())
    .then((body) => {
      obj.customerDetail = body;
      firebase.database().ref("orders").child(obj.code).set(obj);
    });
}

// Adds support for GET requests to our webhook

// function postBack(PSID, obj) {
// 	console.log(PSID + "============")
// 	request({
// 		"uri": "https://graph.facebook.com/v7.0/me/messages",
// 		"qs": { "access_token": WebHookAccesToken },
// 		"method": "POST",
// 		"json": {
// 			"recipient": {
// 				"id": PSID
// 			},
// 			"message": {
// 				"attachment": {
// 					"type": "template",
// 					"payload": {
// 						"template_type": "receipt",
// 						"recipient_name": "Stephane Crozatier",
// 						"order_number": "12345678902",
// 						"currency": "USD",
// 						"payment_method": "Visa 2345",
// 						"order_url": "http://petersapparel.parseapp.com/order?order_id=123456",
// 						"timestamp": "1428444852",
// 						"address": {
// 							"street_1": "1 Hacker Way",
// 							"street_2": "",
// 							"city": "Menlo Park",
// 							"postal_code": "94025",
// 							"state": "CA",
// 							"country": "US"
// 						},
// 						"summary": {
// 							"subtotal": 75.00,
// 							"shipping_cost": 4.95,
// 							"total_tax": 6.19,
// 							"total_cost": 56.14
// 						},
// 						"adjustments": [
// 							{
// 								"name": "New Customer Discount",
// 								"amount": 20
// 							},
// 							{
// 								"name": "$10 Off Coupon",
// 								"amount": 10
// 							}
// 						],
// 						"elements": [
// 							{
// 								"title": "Classic White T-Shirt",
// 								"subtitle": "100% Soft and Luxurious Cotton",
// 								"quantity": 2,
// 								"price": 50,
// 								"currency": "USD",
// 								"image_url": "https://firebasestorage.googleapis.com/v0/b/todo-app-25565.appspot.com/o/1596012787068dscn0022_optimized.jpg?alt=media&fbclid=IwAR3Kvw9duJK2BjtIBRHwB1r4xuxQTo0DLw1jW8AJ3bTNg-PIOnQokye3dXc"
// 							},
// 							{
// 								"title": "Classic Gray T-Shirtt",
// 								"subtitle": "100% Soft and Luxurious Cotton",
// 								"quantity": 1,
// 								"price": 25,
// 								"currency": "USD",
// 								"image_url": "https://firebasestorage.googleapis.com/v0/b/todo-app-25565.appspot.com/o/1596004562381DSCN0027.JPG?alt=media&fbclid=IwAR0AhzagjCiVTpGaRmp9tvIdgj2EALf3cANZmvaxSZmBSrq_-eHMeAA6-wQ"
// 							}
// 						]
// 					}
// 				}
// 			}
// 		}

// 	}, (err, res, body) => {
// 		if (!err) {
// 			//console.log('message sent!')
// 		} else {
// 			//console.log({ err, res })
// 		}
// 	})
// }

app.get("/webhook", (req, res, next) => {
  //console.log('runn get')
  // Your verify token. Should be a random string.
  let VERIFY_TOKEN = "<YOUR_VERIFY_TOKEN>";

  // Parse the query params
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
    // Checks the mode and token sent is correct
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      // Responds with the challenge token from the request
      //console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});

let arr = [];
let filterArr = [];

app.get("/get_allProducts", (req, res) => {
  // console.log("abc")
  firebase
    .database()
    .ref("all_products")
    .once("value")
    .then((snapshot) => {
      // ...
      //   });
      // .on('value', (snapShot) => {
      arr = Object.values(snapshot.val());
      arr = arr.sort(function (a, b) {
        return Number(b.code) - Number(a.code);
      });
      let filterData = [];
      let start = req.query.start;
      let end = req.query.end;
      for (let i = 0; i < arr.length; i++) {
        // if (i >= start && i <= end) {
        filterData.push(arr[i]);
        // }
      }
      if (req.query.admin) {
        res.status(200).send({ data: arr, length: arr.length });
      } else {
        res.status(200).send({ data: filterData, length: arr.length });
      }
    });
  if (!arr.length) {
    // console.log(arr.length)
  } else {
    // console.log(req.query)
    // arr = arr.sort(function (a, b) { return Number(b.code) - Number(a.code) });
    // filterArr = arr
    res.status(200).send({ data: arr, length: arr.length });
  }
});
// app.get('/get_allProducts', (req, res) => {

// 	// console.log("abc")
// 	firebase.database().ref('all_products').
// 		once('value').then((snapshot) => {
// 			// ...
// 			//   });
// 			// .on('value', (snapShot) => {
// 			arr = Object.values(snapshot.val())
// 			arr = arr.sort(function (a, b) { return Number(b.code) - Number(a.code) });
// 			let filterData = []
// 			let start = req.query.start
// 			let end = req.query.end
// 			for (let i = 0; i < arr.length; i++) {
// 				// if (i >= start && i <= end) {
// 					filterData.push(arr[i])
// 				// }
// 			}
// 			// if (req.query.admin) {
// 			// 	res.status(200).send({ data: arr, length: arr.length })
// 			// } else {
// 			// 	res.status(200).send({ data: filterData, length: arr.length })
// 			// }
// 		})
// 	if (!arr.length) {
// 		// console.log(arr.length)
// 	}
// 	else {

// 		// console.log(req.query)
// 		arr = arr.sort(function (a, b) { return Number(b.code) - Number(a.code) });
// 		filterArr = arr

// 		// console.log(filterArr)
// 		let mainCategory = req.query.mainCategory
// 		console.log('mainCategory', mainCategory)
// 		let category = req.query.category
// 		console.log('category', category)
// 		if (mainCategory === 'normalWear') {
// 			console.log('mainCategory----normalwaer se phele', mainCategory)
// 			let normalWear = filterArr.filter(val => val.subCategory === 'normalWear')
// 			// console.log('mainCategory----normalwaer bad', normalWear)

// 			if (category === 'newArrival') {
// 				if (normalWear) {
// 					let normalNewArrival = normalWear.filter(val => val.featured === 'newArrival')

// 					res.status(200).send({ data: normalNewArrival })

// 				}
// 			}
// 			else if (category === 'featured') {
// 				if (normalWear) {
// 					let normalFeatured = normalWear.filter(val => val.featured === 'featured')

// 					res.status(200).send({ data: normalFeatured })
// 				}
// 			} else if (category === 'bestSeller') {
// 				if (normalWear) {
// 					let normalWearSeller = normalWear.filter(val => val.featured === 'bestSeller')
// 					res.status(200).send({ data: normalWearSeller })
// 				}
// 			}

// 		}

// 		else if (mainCategory === 'exclusive') {

// 			let exclusive = filterArr.filter(val => val.subCategory === 'exclusiveWear')

// 			if (category === 'newArrival') {

// 				if (exclusive) {
// 					let exclusiveNewArrival = exclusive.filter(val => val.featured === 'newArrival')
// 					res.status(200).send({ data: exclusiveNewArrival })

// 				}

// 			} else if (category === 'featured') {
// 				if (exclusive) {

// 					let exclusiveFeatured = exclusive.filter(val => val.featured === 'featured')

// 					// console.log(exclusiveFeatured)
// 					res.status(200).send({ data: exclusiveFeatured })
// 				}
// 			}
// 			else if (category === 'bestSeller') {

// 				if (exclusive) {
// 					let exclusiveBestSeller = exclusive.filter(val => val.featured === 'bestSeller')

// 					res.status(200).send({ data: exclusiveBestSeller })
// 				}

// 			}

// 		}
// 		else if (mainCategory === 'toprated') {

// 			let toprated = filterArr.filter(val => val.subCategory === 'toprated')

// 			if (category === 'newArrival') {
// 				if (toprated) {
// 					let topratedNewArrival = toprated.filter(val => val.featured === 'newArrival')

// 					res.status(200).send({ data: topratedNewArrival })
// 				}

// 			} else if (category === 'featured') {
// 				if (toprated) {
// 					let topratedFeatured = toprated.filter(val => val.featured === 'featured')

// 					res.status(200).send({ data: topratedFeatured })
// 				}

// 				// let exclusiveFeatured=exclusiveWear.filter(val=>val.featured==='featured')
// 			}
// 			else if (category === 'bestSeller') {
// 				if (toprated) {
// 					let topratedBestSeller = toprated.filter(val => val.featured === 'bestSeller')

// 					res.status(200).send({ data: topratedBestSeller })

// 				}
// 			}

// 		}
// 		// else {
// 		// 	console.log('No data')
// 		// }
// 		let mainCategoryAllProducts = req.query.mainCategoryAllProducts

// 		if (mainCategoryAllProducts) {
// 			// 	let Size ={
// 			// 	}
// 			// 	let SizeL =[],
// 			// 	SizeM=[],
// 			// 	SizeXs=[],
// 			// 	SizeXl=[],
// 			// 	SizeS=[]

// 			// filterArr.filter(val  =>{
// 			// 		if(val.tags){
// 			// 			SizeL.push(val.tags.includes('L'))
// 			// 			SizeS.push(val.tags.includes('S'))
// 			// 			SizeXs.push(val.tags.includes('Xs'))
// 			// 			SizeXl.push(val.tags.includes('Xl'))
// 			// 			SizeM.push(val.tags.includes('M'))

// 			// 		}
// 			// 	})
// 			// 	Size.SizeL= SizeL.length
// 			// 	Size.SizeM= SizeM.length
// 			// 	Size.SizeXl= SizeXl.length
// 			// 	Size.SizeXs= SizeXs.length
// 			// 	Size.SizeS= SizeS.length
// 			// 	console.log(Size)
// 			let stiched = filterArr.filter(val => val.category === 'stiched')
// 			let unStiched = filterArr.filter(val => val.category === 'unstiched')
// 			let sizeL = filterArr.filter(val => val.tags.includes('L'))
// 			let sizeM = filterArr.filter(val => val.tags.includes('M'))
// 			let sizeXl = filterArr.filter(val => val.tags.includes('XL'))
// 			let sizeXs = filterArr.filter(val => val.tags.includes('XS'))
// 			let sizeS = filterArr.filter(val => val.tags.includes('XS'))
// 			let colorRed = filterArr.filter(val => val.color ? val.color.includes('RED') : null)
// 			let colorBlack = filterArr.filter(val => val.color ? val.color.includes('BLACK') : null)
// 			let colorGreen = filterArr.filter(val => val.color ? val.color.includes('GREEN') : null)
// 			let colorWhite = filterArr.filter(val => val.color ? val.color.includes('WHITE') : null)
// 			let colorFlagGreen = filterArr.filter(val => val.color ? val.color.includes('FLAG-GREEN') : null)
// 			let colorNavyBlue = filterArr.filter(val => val.color ? val.color.includes('BLACK') : null)
// 			let colorOrange = filterArr.filter(val => val.color ? val.color.includes('NAVY-BLUE') : null)
// 			let colorMaroon = filterArr.filter(val => val.color ? val.color.includes('MAROON') : null)
// 			// let colorPink = filterArr.filter(val => val.color ? val.color.includes('PINK') : null)
// 			res.status(200).send(200, {
// 				// size:Size
// 				sizes: {
// 					sizeL: sizeL.length, sizeM: sizeM.length, sizeS: sizeS.length, sizeXl: sizeXl.length, sizeXs: sizeXs.length
// 				},
// 				colors: {
// 					colorNavyBlue: colorNavyBlue.length, colorBlack: colorBlack.length, colorOrange: colorOrange.length, colorWhite: colorWhite.length, colorFlagGreen: colorFlagGreen.length, colorMaroon: colorMaroon.length, colorGreen: colorGreen.length, colorRed: colorRed.length,
// 				},
// 				stiched: stiched.length,
// 				unstiched: unStiched.length
// 			});
// 			// if(Size){
// 			// 	res.status(200).send(Size)
// 			// }
// 		}

// 		let mainCategoryColor = req.query.mainCategoryColor
// 		if (mainCategoryColor) {
// 			if (mainCategoryColor === 'RED') {
// 				console.log(mainCategoryColor)
// 				let colorProducts = filterArr.filter(val => val.color ? val.color.includes(mainCategoryColor) : null)
// 				res.send(200, { data: colorProducts })

// 				// res.send(200, { data: colorProducts })

// 			}
// 			else if (mainCategoryColor === 'BLACK') {
// 				let colorProducts = filterArr.filter(val => val.color ? val.color.includes(mainCategoryColor) : null)
// 				res.send(200, { data: colorProducts })

// 			}
// 			else if (mainCategoryColor === 'MAROON') {
// 				let colorProducts = filterArr.filter(val => val.color ? val.color.includes(mainCategoryColor) : null)
// 				res.send(200, { data: colorProducts })

// 			}
// 			else if (mainCategoryColor === 'ORANGE') {
// 				let colorProducts = filterArr.filter(val => val.color ? val.color.includes(mainCategoryColor) : null)
// 				res.send(200, { data: colorProducts })

// 			}
// 			else if (mainCategoryColor === 'NAVY-BLUE') {
// 				let colorProducts = filterArr.filter(val => val.color ? val.color.includes(mainCategoryColor) : null)
// 				res.send(200, { data: colorProducts })

// 			}
// 			else if (mainCategoryColor === 'GREEN') {
// 				let colorProducts = filterArr.filter(val => val.color ? val.color.includes(mainCategoryColor) : null)
// 				res.send(200, { data: colorProducts })

// 			}
// 			else if (mainCategoryColor === 'FLAG-GREEN') {
// 				let colorProducts = filterArr.filter(val => val.color ? val.color.includes(mainCategoryColor) : null)
// 				res.send(200, { data: colorProducts })

// 			}

// 		}

// 		let mainCategoryPrice = req.query.mainCategoryPrice

// 		if (mainCategoryPrice) {
// 			if (mainCategoryPrice < 2000) {

// 				let priceData = filterArr.filter(val => val.price <= 2000 && val.price > 100)
// 				res.send(200, { data: priceData })
// 			}
// 			else if (mainCategoryPrice < 4000) {

// 				let priceData = filterArr.filter(val => val.price <= 4000 && val.price > 2000)
// 				res.send(200, { data: priceData })
// 			}
// 			else if (mainCategoryPrice < 6000) {

// 				let priceData = filterArr.filter(val => val.price <= 6000 && val.price > 4000)
// 				res.send(200, { data: priceData })
// 			}
// 			else if (mainCategoryPrice < 8000) {

// 				let priceData = filterArr.filter(val => val.price <= 8000 && val.price > 6000)
// 				res.send(200, { data: priceData })
// 			}
// 			else if (mainCategoryPrice < 10000) {

// 				let priceData = filterArr.filter(val => val.price <= 10000 && val.price > 8000)
// 				res.send(200, { data: priceData })
// 			}

// 		}

// 		let mainCategorySize = req.query.mainCategorySize
// 		console.log(mainCategorySize)
// 		// "XS,S,M,L,XL"
// 		if (mainCategorySize === 'M') {
// 			let sizeM = filterArr.filter(val => val.tags.includes(mainCategorySize))
// 			res.send(200, { data: sizeM })

// 		}
// 		else if (mainCategorySize === 'XL') {
// 			let sizeXl = filterArr.filter(val => val.tags.includes(mainCategorySize))
// 			res.send(200, { data: sizeXl })

// 		}
// 		else if (mainCategorySize === 'S') {
// 			let sizeS = filterArr.filter(val => val.tags.includes(mainCategorySize))
// 			res.send(200, { data: sizeS })

// 		}
// 		else if (mainCategorySize === 'XS') {
// 			let sizeXs = filterArr.filter(val => val.tags.includes(mainCategorySize))

// 			res.send(200, { data: sizeXs })

// 		}
// 		else if (mainCategorySize === 'L') {
// 			let sizeL = filterArr.filter(val => val.tags.includes(mainCategorySize))

// 			res.send(200, { data: sizeL })

// 		}

// 		let mainCategoryStiched = req.query.mainCategoryStiched
// 		let mainCategoryUnstiched = req.query.mainCategoryunStiched

// 		if (mainCategoryStiched === "stiched" && mainCategoryUnstiched === "false") {
// 			filterArr = filterArr.filter((a) => a.category.toUpperCase() === mainCategoryStiched.toUpperCase())
// 		} else if (mainCategoryStiched === "false" && mainCategoryUnstiched === "unstiched") {
// 			filterArr = filterArr.filter((a) => a.category.toUpperCase() === mainCategoryUnstiched.toUpperCase())
// 		} else if (mainCategoryStiched && mainCategoryUnstiched) {
// 			filterArr = arr
// 		}

// 		let kurti = req.query.kurti
// 		let twoPiece = req.query.twoPiece
// 		let threePiece = req.query.threePiece

// 		if (kurti === "kurti" && twoPiece === 'false' && threePiece === 'false') {
// 			kurti = kurti.toUpperCase()
// 			let re = new RegExp(kurti);
// 			filterArr = filterArr.filter((a) => a.title.toUpperCase().match(re))
// 		} else if (kurti === "kurti" && twoPiece === 'twoPiece' && threePiece === 'false') {
// 			let twoPiece1 = '2'
// 			let twoPiece2 = 'piece'

// 			kurti = kurti.toUpperCase()
// 			twoPiece1 = twoPiece1.toUpperCase()
// 			twoPiece2 = twoPiece2.toUpperCase()

// 			let re = new RegExp(kurti);
// 			let re1 = new RegExp(twoPiece1);
// 			let re2 = new RegExp(twoPiece2);

// 			filterArr = filterArr.filter((a) => {
// 				return (
// 					a.title.toUpperCase().match(re1) && a.title.toUpperCase().match(re2)
// 					|| a.subTitle.toUpperCase().match(re1) && a.subTitle.toUpperCase().match(re2)
// 					|| a.title.toUpperCase().match(re)
// 				)
// 			})
// 		} else if (kurti === "kurti" && twoPiece === 'false' && threePiece === 'threePiece') {
// 			let threePiece1 = '3'
// 			let threePiece2 = 'piece'

// 			kurti = kurti.toUpperCase()
// 			threePiece1 = threePiece1.toUpperCase()
// 			threePiece2 = threePiece2.toUpperCase()

// 			let re = new RegExp(kurti);
// 			let re1 = new RegExp(threePiece1);
// 			let re2 = new RegExp(threePiece2);

// 			filterArr = filterArr.filter((a) => {
// 				return (
// 					a.title.toUpperCase().match(re1) && a.title.toUpperCase().match(re2)
// 					|| a.subTitle.toUpperCase().match(re1) && a.subTitle.toUpperCase().match(re2)
// 					|| a.title.toUpperCase().match(re)
// 				)
// 			})
// 		} else if (kurti === "false" && twoPiece === 'twoPiece' && threePiece === 'false') {
// 			let twoPiece1 = '2'
// 			let twoPiece2 = 'piece'

// 			twoPiece1 = twoPiece1.toUpperCase()
// 			twoPiece2 = twoPiece2.toUpperCase()

// 			let re1 = new RegExp(twoPiece1);
// 			let re2 = new RegExp(twoPiece2);

// 			filterArr = filterArr.filter((a) => {
// 				return (
// 					a.title.toUpperCase().match(re1) && a.title.toUpperCase().match(re2)
// 					|| a.subTitle.toUpperCase().match(re1) && a.subTitle.toUpperCase().match(re2)
// 				)
// 			})
// 		} else if (kurti === "false" && twoPiece === 'false' && threePiece === 'threePiece') {
// 			let threePiece1 = '3'
// 			let threePiece2 = 'piece'

// 			threePiece1 = threePiece1.toUpperCase()
// 			threePiece2 = threePiece2.toUpperCase()

// 			let re1 = new RegExp(threePiece1);
// 			let re2 = new RegExp(threePiece2);

// 			filterArr = filterArr.filter((a) => {
// 				return (
// 					a.title.toUpperCase().match(re1) && a.title.toUpperCase().match(re2)
// 					|| a.subTitle.toUpperCase().match(re1) && a.subTitle.toUpperCase().match(re2)
// 					|| a.title.toUpperCase().match(re)
// 				)
// 			})
// 		} else if (kurti === "kurti" && twoPiece === 'twoPiece' && threePiece === 'false') {
// 			let twoPiece1 = '2'
// 			let twoPiece2 = 'piece'
// 			let threePiece1 = '3'
// 			let threePiece2 = 'piece'

// 			twoPiece1 = twoPiece1.toUpperCase()
// 			twoPiece2 = twoPiece2.toUpperCase()
// 			threePiece1 = threePiece1.toUpperCase()
// 			threePiece2 = threePiece2.toUpperCase()

// 			let re1 = new RegExp(twoPiece1);
// 			let re2 = new RegExp(twoPiece2);
// 			let re3 = new RegExp(threePiece1);
// 			let re4 = new RegExp(threePiece2);

// 			filterArr = filterArr.filter((a) => {
// 				return (
// 					a.title.toUpperCase().match(re1) && a.title.toUpperCase().match(re2)
// 					|| a.subTitle.toUpperCase().match(re1) && a.subTitle.toUpperCase().match(re2)
// 					|| a.title.toUpperCase().match(re3) && a.title.toUpperCase().match(re3)
// 					|| a.subTitle.toUpperCase().match(re4) && a.subTitle.toUpperCase().match(re4)
// 				)
// 			})
// 		}

// 		let priceArr = req.query.priceArr;

// 		if (priceArr) {
// 			priceArr = priceArr.split(',')
// 			let startingVal = Number(priceArr[0])
// 			let endingVal = Number(priceArr[1])
// 			// console.log(startingVal, endingVal)
// 			filterArr = filterArr.filter((a) => startingVal <= Number(a.price) && endingVal >= Number(a.price))
// 		}

// 		let searchValue = req.query.searchValue

// 		if (searchValue) {
// 			// searchValue = searchValue.toUpperCase()
// 			// let arr = searchValue.split(" ")
// 			// let filterArr2 = []
// 			// let filterObj = {}
// 			// // console.log(arr)
// 			// // for (let i = 0; i < arr.length; i++) {
// 			// // 	if (arr[i] !== "") {
// 			// // 		let ree = new RegExp(arr[i])
// 			// // 		filterObj[`arr${i}`] = filterArr.filter((a) => {
// 			// // 			return (
// 			// // 				a.title.toUpperCase().match(ree)
// 			// // 				|| a.subTitle.toUpperCase().match(ree)
// 			// // 			)
// 			// // 		})
// 			// // 	}
// 			// // }
// 			// let re = new RegExp(searchValue);
// 			// filterArr = filterArr.filter((a) => {
// 			// 	return (
// 			// 		a.title.toUpperCase().match(re)
// 			// 		|| a.subTitle.toUpperCase().match(re)
// 			// 	)
// 			// })
// 			// // filterArr = []
// 			// // for (const property in filterObj) {
// 			// // 	let abc = filterObj[property]

// 			// // }

// 			filterArr = filterArr.filter(function (item) {
// 				return item.title.toLowerCase().search(
// 					searchValue.toLowerCase()) !== -1
// 					||
// 					item.subTitle.toLowerCase().search(
// 						searchValue.toLowerCase()) !== -1
// 					;
// 			});
// 		}

// 		let filterData = []
// 		let start = req.query.start
// 		let end = req.query.end
// 		for (let i = 0; i < filterArr.length; i++) {
// 			if (i >= start && i <= end) {
// 				filterData.push(filterArr[i])
// 			}
// 		}
// 		if (req.query.admin) {
// 			res.status(200).send({ data: arr, length: arr.length })
// 		} else {
// 			res.status(200).send({ data: filterData, length: filterArr.length })
// 		}
// 	}

// 	// firebase.database().ref('all_products').remove()
// 	// firebase.database().ref('all_products').limitToFirst(1).endAt(7).on('value', (snapShot) => {
// 	// 	res.status(200).send(snapShot.val())
// 	// })
// 	// firebase.database().ref('all_products').orderByChild('sku').equalTo('02PDEMELV106').on('value', (snapShot) => {
// 	// 			res.status(200).send(snapShot.val())
// 	// 		})
// })

app.post("/get_colors", (req, res) => {
  let arr = [];
  firebase
    .database()
    .ref("all_products")
    .once("value")
    .then((snapshot) => {
      // ...
      //   });
      // .on('value', (snapShot) => {

      arr = Object.values(snapshot.val());

      // let mainCategoryColor = req.body
      let mainCategoryColor = req.body.colors;
      // console.log('MainCategory------------->',JSON.parse(mainCategoryColor).length)
      console.log("MainCategory------------->", mainCategoryColor.length);

      if (mainCategoryColor) {
        const filteredColor = arr.filter((obj) =>
          mainCategoryColor.filter((colorVal) => colorVal === obj.color)[0]
            ? obj
            : null
        );
        res.status(200).send({ data: filteredColor });
        console.log("Filtered data ==>", filteredColor);
        // })

        // if (mainCategoryColor === 'RED') {
        // 	console.log(mainCategoryColor)
        // 	let colorProducts = arr.filter(val => val.color ? val.color.includes(mainCategoryColor) : null)
        // 	console.log('colorProducts', colorProducts)

        // 	res.send(200, { data: colorProducts })

        // 	// res.send(200, { data: colorProducts })

        // }
        // else if (mainCategoryColor === 'BLACK') {
        // 	let colorProducts = arr.filter(val => val.color ? val.color.includes(mainCategoryColor) : null)
        // 	res.send(200, { data: colorProducts })

        // }
        // else if (mainCategoryColor === 'MAROON') {
        // 	let colorProducts = arr.filter(val => val.color ? val.color.includes(mainCategoryColor) : null)
        // 	res.send(200, { data: colorProducts })

        // }
        // else if (mainCategoryColor === 'ORANGE') {
        // 	let colorProducts = arr.filter(val => val.color ? val.color.includes(mainCategoryColor) : null)
        // 	res.send(200, { data: colorProducts })

        // }
        // else if (mainCategoryColor === 'NAVY-BLUE') {
        // 	let colorProducts = arr.filter(val => val.color ? val.color.includes(mainCategoryColor) : null)
        // 	res.send(200, { data: colorProducts })

        // }
        // else if (mainCategoryColor === 'GREEN') {
        // 	let colorProducts = arr.filter(val => val.color ? val.color.includes(mainCategoryColor) : null)
        // 	res.send(200, { data: colorProducts })

        // }
        // else if (mainCategoryColor === 'FLAG-GREEN') {
        // 	let colorProducts = arr.filter(val => val.color ? val.color.includes(mainCategoryColor) : null)
        // 	res.send(200, { data: colorProducts })

        // }
      }
      // arr = arr.sort(function (a, b) { return Number(b.code) - Number(a.code) });
      // let filterData = []
      // let start = req.query.start
      // let end = req.query.end
      // for (let i = 0; i < arr.length; i++) {
      // 	if (i >= start && i <= end) {
      // 		filterData.push(arr[i])
      // 	}
      // }
      // if (req.query.admin) {
      // 	res.status(200).send({ data: arr, length: arr.length })
      // } else {
      // 	res.status(200).send({ data: filterData, length: arr.length })
      // }
    });
  // let mainCategoryColor = req.query.mainCategoryColor
});

app.post("/filter", (req, res) => {
  firebase
    .database()
    .ref("all_products")
    .once("value")
    .then((snapshot) => {
      let arr = [];
      arr = Object.values(snapshot.val());
      if (!arr.length) {
      } else {
        const mainCategory = req.body.mainCategory;
        let prices = req.body.prices;
        let colors = req.body.colors;
        let sizes = req.body.sizes;
        const minPrice = prices[0];
        const maxPrice = prices[1];
        if (mainCategory) {
          arr = arr.filter((obj) => obj.category == mainCategory);
        }
        if (prices) {
          let priceFilterData = arr.filter(
            (val) => val.price >= minPrice && val.price <= maxPrice
          );
          arr = [...priceFilterData];
          console.log("price wala ha kam ye--->", priceFilterData);
        }
        if (colors) {
          let colorData = arr.filter((val) =>
            colors.filter((col) =>
              (val.color !== null) & (val.color !== undefined)
                ? val.color.includes(col)
                : null
            )[0]
              ? val
              : null
          );
          console.log("colorData wala ha kam ye--->", colorData);
          arr = [...colorData];
        }

        if (sizes) {
          let dataSize = arr.filter((val2) =>
            sizes.filter((siz) => val2.tags.includes(siz)) ? val2 : null
          );
          arr = [...dataSize];
          console.log("dataSize wala ha kam ye--->", dataSize);
        }
        res.status(200).send(arr);
      }
    });
});

app.post("/clothesStatus", (req, res) => {
  firebase
    .database()
    .ref("all_products")
    .once("value")
    .then((snapshot) => {
      let arr = [];
      arr = Object.values(snapshot.val());
      const subCategory = req.body.subCategory;
      const featured = req.body.featured;
      if (arr.length) {
        arr = arr.filter((val) => val.subCategory === subCategory);
        let array = arr.filter((val) => val.featured === featured);
        arr = [...array];
        res.status(200).send(arr);
      } else {
      }
    });
});

// app.post("/single", (req, res) => {
//   let arr = [];

//   firebase
//     .database()
//     .ref("all_products")
//     .once("value")
//     .then((snapshot) => {
//       arr = Object.values(snapshot.val());
//     });
//   if (!arr.length) {
//   } else {
//     let prices = req.body.prices;
//     let colors = req.body.colors;
//     let stichedStatus = req.body.stichedStatus;
//     let sizes = req.body.sizes;
//     let filteredData = arr.filter((val) =>
//       colors.filter((col) => val.color === col)
//     );
//     res.status(200).send(filteredData);
//   }
// });

// app.get("/get_prices", (req, res) => {
//   let arr = [];

//   firebase
//     .database()
//     .ref("all_products")
//     .once("value")
//     .then((snapshot) => {
//       arr = Object.values(snapshot.val());
//       // arr = arr.sort(function (a, b) { return Number(b.code) - Number(a.code) });
//       // let filterData = []
//       // let start = req.query.start
//       // let end = req.query.end
//       // for (let i = 0; i < arr.length; i++) {
//       // 	if (i >= start && i <= end) {
//       // 		filterData.push(arr[i])
//       // 	}
//       // }

//       if (!arr.length) {
//       } else {
//         // let mainCategoryPrice = req.query.mainCategoryPrice;
//         let mainCategoryPrice = req.body.data;
//         arr = Object.values(snapshot.val());

//         // let mainCategoryColor = req.body
//         // let mainCategoryColor = req.body.data;
//         const maxPrice = mainCategoryPrice.reduce((a, b) => {
//           return Math.max(a, b);
//         });
//         const minPrice = mainCategoryPrice.reduce((a, b) => {
//           return Math.max(a, b);
//         });
// 		// const singlePrice=mainCategoryPrice[0]

//         if (mainCategoryPrice) {

// 				let priceFilterData = arr.filter((val) =>{
// 						 (val.price <= maxPrice) && (val.price >= minPrice)[0]  ? val:null
// 						 (val.price > maxPrice) && (val.price > minPrice) [0] ?  val : null
// 						});
// 						res.send(200, { data: priceFilterData });

// 				// else{
//         //   if (singlePrice < 2000) {
//         //     let priceData = arr.filter(
//         //       (val) => val.price <= 2000 && val.price > 100
//         //     );
//         //     res.send(200, { data: priceData });
//         //   } else if (singlePrice < 4000) {
//         //     let priceData = arr.filter(
//         //       (val) => val.price <= 4000 && val.price > 2000
//         //     );
//         //     res.send(200, { data: priceData });
//         //   } else if (singlePrice < 6000) {
//         //     let priceData = arr.filter(
//         //       (val) => val.price <= 6000 && val.price > 4000
//         //     );
//         //     res.send(200, { data: priceData });
//         //   } else if (singlePrice < 8000) {
//         //     let priceData = arr.filter(
//         //       (val) => val.price <= 8000 && val.price > 6000
//         //     );
//         //     res.send(200, { data: priceData });
//         //   } else if (singlePrice < 10000) {
//         //     let priceData = arr.filter(
//         //       (val) => val.price <= 10000 && val.price > 8000
//         //     );
//         //     res.send(200, { data: priceData });
//         //   }
//         // }

//       }

//       if (req.query.admin) {
//         res.status(200).send({ data: arr, length: arr.length });
//       } else {
//         res.status(200).send({ data: filterData, length: arr.length });
//       }}

// });

app.get("/get_sizes", (req, res) => {
  let arr = [];
  let filterArr = [];
  firebase
    .database()
    .ref("all_products")
    .once("value")
    .then((snapshot) => {
      arr = Object.values(snapshot.val());
      arr = arr.sort(function (a, b) {
        return Number(b.code) - Number(a.code);
      });
      let filterData = [];
      // console.log('arr=======>',arr)
      // console.log('req.query=======>',req.query)
      // let start = req.query.start
      // let end = req.query.end
      for (let i = 0; i < arr.length; i++) {
        // if (i >= start && i <= end) {
        filterData.push(arr[i]);
        console.log("filterData==========", arr[i]);
        // }
      }
      // console.log('Main hopn me==============>?<><><<><><', req.query.mainCategorySize)
      if (req.query.admin) {
        res.status(200).send({ data: arr, length: arr.length });
      } else {
        res.status(200).send({ data: filterData, length: arr.length });
      }
    });

  if (!arr.length) {
  } else {
    let mainCategorySize = req.query.mainCategorySize;
    // console.log('mainCategorySize====>',mainCategorySize)
    // "XS,S,M,L,XL"
    if (mainCategorySize === "M") {
      let sizeM = filterArr.filter((val) =>
        val.tags.includes(mainCategorySize)
      );
      res.send(200, { data: sizeM });
    } else if (mainCategorySize === "XL") {
      let sizeXl = filterArr.filter((val) =>
        val.tags.includes(mainCategorySize)
      );
      res.send(200, { data: sizeXl });
    } else if (mainCategorySize === "S") {
      let sizeS = filterArr.filter((val) =>
        val.tags.includes(mainCategorySize)
      );
      res.send(200, { data: sizeS });
    } else if (mainCategorySize === "XS") {
      let sizeXs = filterArr.filter((val) =>
        val.tags.includes(mainCategorySize)
      );

      res.send(200, { data: sizeXs });
    } else if (mainCategorySize === "L") {
      let sizeL = filterArr.filter((val) =>
        val.tags.includes(mainCategorySize)
      );

      res.send(200, { data: sizeL });
    }
    let mainCategoryStiched = req.query.mainCategoryStiched;
    let mainCategoryUnstiched = req.query.mainCategoryunStiched;
  }
});

app.get("/get_topRatted_newArrival", (req, res) => {
  let arr = [];
  let filterArr = [];

  firebase
    .database()
    .ref("all_products")
    .once("value")
    .then((snapshot) => {
      arr = Object.values(snapshot.val());
      arr = arr.sort(function (a, b) {
        return Number(b.code) - Number(a.code);
      });
      let filterData = [];
      // let start = req.query.start
      // let end = req.query.end
      for (let i = 0; i < arr.length; i++) {
        // if (i >= start && i <= end) {
        filterData.push(arr[i]);
        // }
      }
      // if (req.query.admin) {
      // 	res.status(200).send({ data: arr, length: arr.length })
      // } else {
      // 	res.status(200).send({ data: filterData, length: arr.length })
      // }

      let mainCategory = req.query.mainCategory;
      let category = req.query.category;
      if (mainCategory === "toprated") {
        console.log("mainCategory----normalwaer se phele", mainCategory);
        let topratedWear = arr.filter((val) => val.subCategory === "toprated");
        // console.log('mainCategory----normalwaer bad', normalWear)

        if (category === "newArrival") {
          if (topratedWear) {
            let topratedNewArrival = topratedWear.filter(
              (val) => val.featured === "newArrival"
            );

            res.status(200).send({ data: topratedNewArrival });
          }
        }
      }
    });
  // if (!arr.length) {
  // 	// console.log(arr.length)
  // }
  // else {

  // console.log(req.query)

  // arr = arr.sort(function (a, b) { return Number(b.code) - Number(a.code) });
  // filterArr = arr

  // 	}
});

app.get("/get_topRatted_bestSeller", (req, res) => {
  let arr = [];
  let filterArr = [];
  // let mainCategorySize = req.query.mainCategorySize
  // 	console.log(mainCategorySize)

  let mainCategoryStiched = req.query.mainCategoryStiched;
  let mainCategoryUnstiched = req.query.mainCategoryunStiched;

  firebase
    .database()
    .ref("all_products")
    .once("value")
    .then((snapshot) => {
      // ...
      //   });
      // .on('value', (snapShot) => {
      arr = Object.values(snapshot.val());
      arr = arr.sort(function (a, b) {
        return Number(b.code) - Number(a.code);
      });
      let filterData = [];
      let start = req.query.start;
      let end = req.query.end;
      for (let i = 0; i < arr.length; i++) {
        // if (i >= start && i <= end) {
        filterData.push(arr[i]);
        // }
      }

      // if (req.query.admin) {
      // 	res.status(200).send({ data: arr, length: arr.length })
      // } else {
      // 	res.status(200).send({ data: filterData, length: arr.length })
      // }
    });

  arr = arr.sort(function (a, b) {
    return Number(b.code) - Number(a.code);
  });
  filterArr = arr;
  // console.log(filterArr)
  let mainCategory = req.query.mainCategory;
  // console.log('mainCategory', mainCategory)
  let category = req.query.category;
  // console.log('category', category)
  if (mainCategory === "toprated") {
    // console.log('mainCategory----normalwaer se phele', mainCategory)
    let topratedBestSeller = arr.filter(
      (val) => val.subCategory === "toprated"
    );
    // console.log('mainCategory----normalwaer bad', normalWear)

    if (category === "bestSeller") {
      if (topratedBestSeller) {
        let toprattedSeller2 = topratedBestSeller.filter(
          (val) => val.featured === "bestSeller"
        );
        res.status(200).send({ data: toprattedSeller2 });
      }
    }
  }
  // console.log(req.query)
});
app.get("/get_topRatted_featured", (req, res) => {
  // console.log("abc")
  let arr = [];
  let filterArr = [];

  firebase
    .database()
    .ref("all_products")
    .once("value")
    .then((snapshot) => {
      // ...
      //   });
      // .on('value', (snapShot) => {
      arr = Object.values(snapshot.val());
      arr = arr.sort(function (a, b) {
        return Number(b.code) - Number(a.code);
      });
      let filterData = [];
      // let start = req.query.start
      // let end = req.query.end
      for (let i = 0; i < arr.length; i++) {
        // if (i >= start && i <= end) {
        filterData.push(arr[i]);
        // }
      }
      // if (req.query.admin) {
      // 	res.status(200).send({ data: arr, length: arr.length })
      // } else {
      // 	res.status(200).send({ data: filterData, length: arr.length })
      // }
    })
    .then((success) => console.log(success))
    .catch((err) => console.log(err));

  // if (!arr.length) {
  // 	// console.log(arr.length)
  // }
  // else {

  // console.log(req.query)

  // }

  // arr = arr.sort(function (a, b) { return Number(b.code) - Number(a.code) });
  // filterArr = arr
  // console.log(filterArr)
  let mainCategory = req.query.mainCategory;
  // console.log('mainCategory', mainCategory)
  let category = req.query.category;
  // console.log('category', category)
  if (mainCategory === "toprated") {
    // console.log('mainCategory----normalwaer se phele', mainCategory)
    let toprated2 = arr.filter((val) => val.subCategory === "toprated");
    // console.log('mainCategory----normalwaer bad', normalWear)

    if (category === "featured") {
      if (toprated2) {
        let topRattedFeatured = toprated2.filter(
          (val) => val.featured === "featured"
        );

        res.status(200).send({ data: topRattedFeatured });
      }
    }
  }
});

app.get("/get_exclusive_featured", (req, res) => {
  let arr = [];
  let filterArr = [];
  firebase
    .database()
    .ref("all_products")
    .once("value")
    .then((snapshot) => {
      arr = Object.values(snapshot.val());
      arr = arr.sort(function (a, b) {
        return Number(b.code) - Number(a.code);
      });
      let filterData = [];
      // let start = req.query.start
      // let end = req.query.end
      for (let i = 0; i < arr.length; i++) {
        // if (i >= start && i <= end) {
        filterData.push(arr[i]);
        // }
      }
      // if (req.query.admin) {
      // 	res.status(200).send({ data: arr, length: arr.length })
      // } else {
      // 	res.status(200).send({ data: filterData, length: arr.length })
      // }
    });
  if (!arr.length) {
    // console.log(arr.length)
  } else {
    // console.log(req.query)

    // arr = arr.sort(function (a, b) { return Number(b.code) - Number(a.code) });
    // filterArr = arr
    // console.log(filterArr)
    let mainCategory = req.query.mainCategory;
    // console.log('mainCategory', mainCategory)
    let category = req.query.category;
    // console.log('category', category)
    if (mainCategory === "exclusiveWear") {
      // console.log('mainCategory----normalwaer se phele', mainCategory)
      let exclusiveFeatured = arr.filter(
        (val) => val.subCategory === "exclusiveWear"
      );
      // console.log('mainCategory----normalwaer bad', normalWear)

      if (category === "featured") {
        if (exclusiveFeatured) {
          let exclusiveWearFeatured = exclusiveFeatured.filter(
            (val) => val.featured === "featured"
          );

          res.status(200).send({ data: exclusiveWearFeatured });
        }
      }
    }
  }
});
app.get("/get_exclusive_bestSeller", (req, res) => {
  let arr = [];
  let filterArr = [];
  // let mainCategorySize = req.query.mainCategorySize
  // 	console.log(mainCategorySize)

  let mainCategoryStiched = req.query.mainCategoryStiched;
  let mainCategoryUnstiched = req.query.mainCategoryunStiched;

  firebase
    .database()
    .ref("all_products")
    .once("value")
    .then((snapshot) => {
      // ...
      //   });
      // .on('value', (snapShot) => {
      arr = Object.values(snapshot.val());
      arr = arr.sort(function (a, b) {
        return Number(b.code) - Number(a.code);
      });
      let filterData = [];
      let start = req.query.start;
      let end = req.query.end;
      for (let i = 0; i < arr.length; i++) {
        // if (i >= start && i <= end) {
        filterData.push(arr[i]);
        // }
      }
      // if (req.query.admin) {
      // 	res.status(200).send({ data: arr, length: arr.length })
      // } else {
      // 	res.status(200).send({ data: filterData, length: arr.length })
      // }
    })
    .then((success) => console.log("success", success))
    .catch((err) => console.log(err));
  // if (!arr.length) {
  // 	// console.log(arr.length)
  // }
  // else {

  // console.log(req.query)

  // arr = arr.sort(function (a, b) { return Number(b.code) - Number(a.code) });
  // filterArr = arr
  // console.log(filterArr)
  // let mainCategory = req.query.mainCategory
  // console.log('mainCategory', mainCategory)
  let category = req.query.category;
  console.log("category", category);
  if (mainCategory === "exclusiveWear") {
    // console.log('mainCategory----normalwaer se phele', mainCategory)
    let exclusiveWear = arr.filter(
      (val) => val.subCategory === "exclusiveWear"
    );
    // console.log('mainCategory----normalwaer bad', normalWear)

    if (category === "bestSeller") {
      if (exclusiveWear) {
        let exclusiveWearbestSeller = exclusiveWear.filter(
          (val) => val.featured === "bestSeller"
        );

        res.status(200).send({ data: exclusiveWearbestSeller });
      }
    }
  }

  // }
});
app.get("/get_exclusive_newArrival", (req, res) => {
  let arr = [];
  let filterArr = [];
  // let mainCategorySize = req.query.mainCategorySize
  // 	console.log(mainCategorySize)

  let mainCategoryStiched = req.query.mainCategoryStiched;
  let mainCategoryUnstiched = req.query.mainCategoryunStiched;

  firebase
    .database()
    .ref("all_products")
    .once("value")
    .then((snapshot) => {
      // ...
      //   });
      // .on('value', (snapShot) => {
      arr = Object.values(snapshot.val());
      arr = arr.sort(function (a, b) {
        return Number(b.code) - Number(a.code);
      });
      let filterData = [];
      let start = req.query.start;
      let end = req.query.end;
      for (let i = 0; i < arr.length; i++) {
        // if (i >= start && i <= end) {
        filterData.push(arr[i]);
        // }
      }
      if (req.query.admin) {
        res.status(200).send({ data: arr, length: arr.length });
      } else {
        res.status(200).send({ data: filterData, length: arr.length });
      }
    });
  if (!arr.length) {
    // console.log(arr.length)
  } else {
    // console.log(req.query)

    arr = arr.sort(function (a, b) {
      return Number(b.code) - Number(a.code);
    });
    filterArr = arr;
    // console.log(filterArr)
    // let mainCategory = req.query.mainCategory
    // console.log('mainCategory', mainCategory)
    let category = req.query.category;
    console.log("category", category);
    if (mainCategory === "exclusiveWear") {
      // console.log('mainCategory----exlcusive se phele', mainCategory)
      let exclusiveWear = filterArr.filter(
        (val) => val.subCategory === "exclusiveWear"
      );
      // console.log('mainCategory----normalwaer bad', normalWear)

      if (category === "newArrival") {
        if (exclusiveWear) {
          let exclusiveNewArrival = exclusiveWear.filter(
            (val) => val.featured === "newArrival"
          );
          res.status(200).send({ data: exclusiveNewArrival });
        }
      }
    }
  }
});

app.get("/get_normal_featured", (req, res) => {
  let arr = [];
  let filterArr = [];
  let mainCategoryStiched = req.query.mainCategoryStiched;
  let mainCategoryUnstiched = req.query.mainCategoryunStiched;

  firebase
    .database()
    .ref("all_products")
    .once("value")
    .then((snapshot) => {
      // ...
      //   });
      // .on('value', (snapShot) => {
      arr = Object.values(snapshot.val());
      arr = arr.sort(function (a, b) {
        return Number(b.code) - Number(a.code);
      });
      let filterData = [];
      let start = req.query.start;
      let end = req.query.end;
      for (let i = 0; i < arr.length; i++) {
        if (i >= start && i <= end) {
          filterData.push(arr[i]);
        }
      }
      if (req.query.admin) {
        res.status(200).send({ data: arr, length: arr.length });
      } else {
        res.status(200).send({ data: filterData, length: arr.length });
      }
    });
  if (!arr.length) {
    // console.log(arr.length)
  } else {
    // console.log(req.query)

    arr = arr.sort(function (a, b) {
      return Number(b.code) - Number(a.code);
    });
    filterArr = arr;
    // console.log(filterArr)
    let mainCategory = req.query.mainCategory;
    // console.log('mainCategory', mainCategory)
    let category = req.query.category;
    console.log("category", category);
    if (mainCategory === "normalWear") {
      console.log("mainCategory----normalwaer se phele", mainCategory);
      let normalWear = filterArr.filter(
        (val) => val.subCategory === "normalWear"
      );
      // console.log('mainCategory----normalwaer bad', normalWear)

      if (category === "featured") {
        if (normalWear) {
          let normalFeatured = normalWear.filter(
            (val) => val.featured === "featured"
          );

          res.status(200).send({ data: normalFeatured });
        }
      }
    }
  }
});
app.get("/get_normal_newArrival", (req, res) => {
  let arr = [];
  let filterArr = [];
  // let mainCategorySize = req.query.mainCategorySize
  // 	console.log(mainCategorySize)

  let mainCategoryStiched = req.query.mainCategoryStiched;
  let mainCategoryUnstiched = req.query.mainCategoryunStiched;

  firebase
    .database()
    .ref("all_products")
    .once("value")
    .then((snapshot) => {
      // ...
      //   });
      // .on('value', (snapShot) => {
      arr = Object.values(snapshot.val());
      arr = arr.sort(function (a, b) {
        return Number(b.code) - Number(a.code);
      });
      let filterData = [];
      // let start = req.query.start
      // let end = req.query.end
      for (let i = 0; i < arr.length; i++) {
        // if (i >= start && i <= end) {
        filterData.push(arr[i]);
        // 	}
      }
      if (req.query.admin) {
        res.status(200).send({ data: arr, length: arr.length });
      } else {
        res.status(200).send({ data: filterData, length: arr.length });
      }
    });
  if (!arr.length) {
    // console.log(arr.length)
  } else {
    // console.log(req.query)

    arr = arr.sort(function (a, b) {
      return Number(b.code) - Number(a.code);
    });
    filterArr = arr;
    // console.log(filterArr)
    // let mainCategory = req.query.mainCategory
    // console.log('mainCategory', mainCategory)
    let category = req.query.category;
    console.log("category", category);
    if (mainCategory === "normalWear") {
      console.log("mainCategory----normalwaer se phele", mainCategory);
      let normalWear = filterArr.filter(
        (val) => val.subCategory === "normalWear"
      );
      // console.log('mainCategory----normalwaer bad', normalWear)

      if (category === "newArrival") {
        if (normalWear) {
          let normalNewArrival = normalWear.filter(
            (val) => val.featured === "newArrival"
          );

          res.status(200).send({ data: normalNewArrival });
        }
      }
    }
  }
});

app.get("/get_normal_bestSeller", (req, res) => {
  let arr = [];
  let filterArr = [];
  // let mainCategorySize = req.query.mainCategorySize
  // 	console.log(mainCategorySize)

  let mainCategoryStiched = req.query.mainCategoryStiched;
  let mainCategoryUnstiched = req.query.mainCategoryunStiched;

  firebase
    .database()
    .ref("all_products")
    .once("value")
    .then((snapshot) => {
      // ...
      //   });
      // .on('value', (snapShot) => {
      arr = Object.values(snapshot.val());
      arr = arr.sort(function (a, b) {
        return Number(b.code) - Number(a.code);
      });
      let filterData = [];
      // let start = req.query.start
      // let end = req.query.end
      for (let i = 0; i < arr.length; i++) {
        // if (i >= start && i <= end) {
        filterData.push(arr[i]);
        // }
      }
      if (req.query.admin) {
        res.status(200).send({ data: arr, length: arr.length });
      } else {
        res.status(200).send({ data: filterData, length: arr.length });
      }
    });
  if (!arr.length) {
    // console.log(arr.length)
  } else {
    // console.log(req.query)

    arr = arr.sort(function (a, b) {
      return Number(b.code) - Number(a.code);
    });
    filterArr = arr;
    // console.log(filterArr)
    let mainCategory = req.query.mainCategory;
    // console.log('mainCategory', mainCategory)
    let category = req.query.category;
    console.log("category", category);
    if (mainCategory === "normalWear") {
      // console.log('mainCategory----normalwaer se phele', mainCategory)
      let normalWear = filterArr.filter(
        (val) => val.subCategory === "normalWear"
      );
      // console.log('mainCategory----normalwaer bad', normalWear)

      if (category === "bestSeller") {
        if (normalWear) {
          let normalWearSeller = normalWear.filter(
            (val) => val.featured === "bestSeller"
          );
          res.status(200).send({ data: normalWearSeller });
        }
      }
    }
  }
});

app.get("/get_unStiched", (req, res) => {
  let arr = [];
  let filterArr = [];

  firebase
    .database()
    .ref("all_products")
    .once("value")
    .then((snapshot) => {
      // ...
      //   });
      // .on('value', (snapShot) => {
      arr = Object.values(snapshot.val());
      arr = arr.sort(function (a, b) {
        return Number(b.code) - Number(a.code);
      });
      let filterData = [];
      // let start = req.query.start
      // let end = req.query.end
      for (let i = 0; i < arr.length; i++) {
        // if (i >= start && i <= end) {
        filterData.push(arr[i]);
        // }
      }

      let mainCategoryUnstiched = req.query.mainCategoryUnstiched;
      arr = arr.sort(function (a, b) {
        return Number(b.code) - Number(a.code);
      });
      if (mainCategoryUnstiched === "unstiched") {
        let filteredUnstiched = arr.filter(
          (val) => val.category === "unstiched"
        );
        res.status(200).send({ data: filteredUnstiched });
      }
    });
});

app.get("/get_stiched", (req, res) => {
  let arr = [];
  let filterArr = [];
  firebase
    .database()
    .ref("all_products")
    .once("value")
    .then((snapshot) => {
      arr = Object.values(snapshot.val());
      arr = arr.sort(function (a, b) {
        return Number(b.code) - Number(a.code);
      });
      let filterData = [];
      for (let i = 0; i < arr.length; i++) {
        filterData.push(arr[i]);
      }
      // if (req.query.admin) {
      // 	res.status(200).send({ data: arr, length: arr.length })
      // } else {
      // 	res.status(200).send({ data: filterData, length: arr.length })
      // }
      let mainCategoryStiched2 = req.query.mainCategoryStiched;
      if (mainCategoryStiched2 === "stiched") {
        filterArr = arr.filter((a) => a.category === mainCategoryStiched2);

        res.status(200).send({ data: filterArr });
      }
    })
    .catch((err) => console.log(err));
  // if (!arr.length) {
  // 	// console.log(arr.length)
  // }
  // else {

  // let mainCategoryUnstiched = req.query.mainCategoryunStiched
  // const array=[
  // 	{category:'unstiched',name:'rizwan'},
  // 	{category:'stiched',name:'rizwan'},
  // 	{category:'stiched',name:'rizwan'},
  // 	{category:'unstiched',name:'rizwan'},
  // ]

  // }
});

app.get("/get_featured_normal", (req, res) => {
  firebase
    .database()
    .ref("all_products")
    .once("value")
    .then((snapshot) => {
      // ...
      //   });
      // .on('value', (snapShot) => {
      arr = Object.values(snapshot.val());
      arr = arr.sort(function (a, b) {
        return Number(b.code) - Number(a.code);
      });
      let filterData = [];
      let start = req.query.start;
      let end = req.query.end;
      for (let i = 0; i < arr.length; i++) {
        if (i >= start && i <= end) {
          filterData.push(arr[i]);
        }
      }
      if (req.query.admin) {
        console.log(req.query.admin);
        res.status(200).send({ data: arr, length: arr.length });
      } else {
        res.status(200).send({ data: filterData, length: arr.length });
      }
    });
  // if (!arr.length) {
  // 	// console.log(arr.length)
  // }
  // else {

  // 	// console.log(req.query)
  // 	arr = arr.sort(function (a, b) { return Number(b.code) - Number(a.code) });
  // 	filterArr = arr
  // 	// console.log(filterArr)
  // 	let mainCategory = req.query.mainCategory
  // 	console.log('mainCategory', mainCategory)
  // 	let category = req.query.category
  // 	console.log('category', category)
  // 	if (mainCategory === 'normalWear') {
  // 		console.log('mainCategory----normalwaer se phele', mainCategory)
  // 		let normalWear = filterArr.filter(val => val.subCategory === 'normalWear')
  // 		// console.log('mainCategory----normalwaer bad', normalWear)

  // 		if (category === 'newArrival') {
  // 			if (normalWear) {
  // 				let normalNewArrival = normalWear.filter(val => val.featured === 'newArrival')

  // 				res.status(200).send({ data: normalNewArrival })

  // 			}
  // 		}
  // 		else if (category === 'featured') {
  // 			if (normalWear) {
  // 				let normalFeatured = normalWear.filter(val => val.featured === 'featured')

  // 				res.status(200).send({ data: normalFeatured })
  // 			}
  // 		} else if (category === 'bestSeller') {
  // 			if (normalWear) {
  // 				let normalWearSeller = normalWear.filter(val => val.featured === 'bestSeller')
  // 				res.status(200).send({ data: normalWearSeller })
  // 			}
  // 		}

  // 	}

  // 	else if (mainCategory === 'exclusive') {

  // 		let exclusive = filterArr.filter(val => val.subCategory === 'exclusiveWear')

  // 		if (category === 'newArrival') {

  // 			if (exclusive) {
  // 				let exclusiveNewArrival = exclusive.filter(val => val.featured === 'newArrival')
  // 				res.status(200).send({ data: exclusiveNewArrival })

  // 			}

  // 		} else if (category === 'featured') {
  // 			if (exclusive) {

  // 				let exclusiveFeatured = exclusive.filter(val => val.featured === 'featured')

  // 				// console.log(exclusiveFeatured)
  // 				res.status(200).send({ data: exclusiveFeatured })
  // 			}
  // 		}
  // 		else if (category === 'bestSeller') {

  // 			if (exclusive) {
  // 				let exclusiveBestSeller = exclusive.filter(val => val.featured === 'bestSeller')

  // 				res.status(200).send({ data: exclusiveBestSeller })
  // 			}

  // 		}

  // 	}
  // 	else if (mainCategory === 'toprated') {

  // 		let toprated = filterArr.filter(val => val.subCategory === 'toprated')

  // 		if (category === 'newArrival') {
  // 			if (toprated) {
  // 				let topratedNewArrival = toprated.filter(val => val.featured === 'newArrival')

  // 				res.status(200).send({ data: topratedNewArrival })
  // 			}

  // 		} else if (category === 'featured') {
  // 			if (toprated) {
  // 				let topratedFeatured = toprated.filter(val => val.featured === 'featured')

  // 				res.status(200).send({ data: topratedFeatured })
  // 			}

  // 			// let exclusiveFeatured=exclusiveWear.filter(val=>val.featured==='featured')
  // 		}
  // 		else if (category === 'bestSeller') {
  // 			if (toprated) {
  // 				let topratedBestSeller = toprated.filter(val => val.featured === 'bestSeller')

  // 				res.status(200).send({ data: topratedBestSeller })

  // 			}
  // 		}

  // 	}
  // 	// else {
  // 	// 	console.log('No data')
  // 	// }
  // 	let mainCategoryAllProducts = req.query.mainCategoryAllProducts

  // 	if (mainCategoryAllProducts) {
  // 		// 	let Size ={
  // 		// 	}
  // 		// 	let SizeL =[],
  // 		// 	SizeM=[],
  // 		// 	SizeXs=[],
  // 		// 	SizeXl=[],
  // 		// 	SizeS=[]

  // 		// filterArr.filter(val  =>{
  // 		// 		if(val.tags){
  // 		// 			SizeL.push(val.tags.includes('L'))
  // 		// 			SizeS.push(val.tags.includes('S'))
  // 		// 			SizeXs.push(val.tags.includes('Xs'))
  // 		// 			SizeXl.push(val.tags.includes('Xl'))
  // 		// 			SizeM.push(val.tags.includes('M'))

  // 		// 		}
  // 		// 	})
  // 		// 	Size.SizeL= SizeL.length
  // 		// 	Size.SizeM= SizeM.length
  // 		// 	Size.SizeXl= SizeXl.length
  // 		// 	Size.SizeXs= SizeXs.length
  // 		// 	Size.SizeS= SizeS.length
  // 		// 	console.log(Size)
  // 		let stiched = filterArr.filter(val => val.category === 'stiched')
  // 		let unStiched = filterArr.filter(val => val.category === 'unstiched')
  // 		let sizeL = filterArr.filter(val => val.tags.includes('L'))
  // 		let sizeM = filterArr.filter(val => val.tags.includes('M'))
  // 		let sizeXl = filterArr.filter(val => val.tags.includes('XL'))
  // 		let sizeXs = filterArr.filter(val => val.tags.includes('XS'))
  // 		let sizeS = filterArr.filter(val => val.tags.includes('XS'))
  // 		let colorRed = filterArr.filter(val => val.color ? val.color.includes('RED') : null)
  // 		let colorBlack = filterArr.filter(val => val.color ? val.color.includes('BLACK') : null)
  // 		let colorGreen = filterArr.filter(val => val.color ? val.color.includes('GREEN') : null)
  // 		let colorWhite = filterArr.filter(val => val.color ? val.color.includes('WHITE') : null)
  // 		let colorFlagGreen = filterArr.filter(val => val.color ? val.color.includes('FLAG-GREEN') : null)
  // 		let colorNavyBlue = filterArr.filter(val => val.color ? val.color.includes('BLACK') : null)
  // 		let colorOrange = filterArr.filter(val => val.color ? val.color.includes('NAVY-BLUE') : null)
  // 		let colorMaroon = filterArr.filter(val => val.color ? val.color.includes('MAROON') : null)
  // 		// let colorPink = filterArr.filter(val => val.color ? val.color.includes('PINK') : null)
  // 		res.status(200).send(200, {
  // 			// size:Size
  // 			sizes: {
  // 				sizeL: sizeL.length, sizeM: sizeM.length, sizeS: sizeS.length, sizeXl: sizeXl.length, sizeXs: sizeXs.length
  // 			},
  // 			colors: {
  // 				colorNavyBlue: colorNavyBlue.length, colorBlack: colorBlack.length, colorOrange: colorOrange.length, colorWhite: colorWhite.length, colorFlagGreen: colorFlagGreen.length, colorMaroon: colorMaroon.length, colorGreen: colorGreen.length, colorRed: colorRed.length,
  // 			},
  // 			stiched: stiched.length,
  // 			unstiched: unStiched.length
  // 		});
  // 		// if(Size){
  // 		// 	res.status(200).send(Size)
  // 		// }
  // 	}

  // 	let mainCategoryColor = req.query.mainCategoryColor
  // 	if (mainCategoryColor) {
  // 		if (mainCategoryColor === 'RED') {
  // 			console.log(mainCategoryColor)
  // 			let colorProducts = filterArr.filter(val => val.color ? val.color.includes(mainCategoryColor) : null)
  // 			res.send(200, { data: colorProducts })

  // 			// res.send(200, { data: colorProducts })

  // 		}
  // 		else if (mainCategoryColor === 'BLACK') {
  // 			let colorProducts = filterArr.filter(val => val.color ? val.color.includes(mainCategoryColor) : null)
  // 			res.send(200, { data: colorProducts })

  // 		}
  // 		else if (mainCategoryColor === 'MAROON') {
  // 			let colorProducts = filterArr.filter(val => val.color ? val.color.includes(mainCategoryColor) : null)
  // 			res.send(200, { data: colorProducts })

  // 		}
  // 		else if (mainCategoryColor === 'ORANGE') {
  // 			let colorProducts = filterArr.filter(val => val.color ? val.color.includes(mainCategoryColor) : null)
  // 			res.send(200, { data: colorProducts })

  // 		}
  // 		else if (mainCategoryColor === 'NAVY-BLUE') {
  // 			let colorProducts = filterArr.filter(val => val.color ? val.color.includes(mainCategoryColor) : null)
  // 			res.send(200, { data: colorProducts })

  // 		}
  // 		else if (mainCategoryColor === 'GREEN') {
  // 			let colorProducts = filterArr.filter(val => val.color ? val.color.includes(mainCategoryColor) : null)
  // 			res.send(200, { data: colorProducts })

  // 		}
  // 		else if (mainCategoryColor === 'FLAG-GREEN') {
  // 			let colorProducts = filterArr.filter(val => val.color ? val.color.includes(mainCategoryColor) : null)
  // 			res.send(200, { data: colorProducts })

  // 		}

  // 	}

  // 	let mainCategoryPrice = req.query.mainCategoryPrice

  // 	if (mainCategoryPrice) {
  // 		if (mainCategoryPrice < 2000) {

  // 			let priceData = filterArr.filter(val => val.price <= 2000 && val.price > 100)
  // 			res.send(200, { data: priceData })
  // 		}
  // 		else if (mainCategoryPrice < 4000) {

  // 			let priceData = filterArr.filter(val => val.price <= 4000 && val.price > 2000)
  // 			res.send(200, { data: priceData })
  // 		}
  // 		else if (mainCategoryPrice < 6000) {

  // 			let priceData = filterArr.filter(val => val.price <= 6000 && val.price > 4000)
  // 			res.send(200, { data: priceData })
  // 		}
  // 		else if (mainCategoryPrice < 8000) {

  // 			let priceData = filterArr.filter(val => val.price <= 8000 && val.price > 6000)
  // 			res.send(200, { data: priceData })
  // 		}
  // 		else if (mainCategoryPrice < 10000) {

  // 			let priceData = filterArr.filter(val => val.price <= 10000 && val.price > 8000)
  // 			res.send(200, { data: priceData })
  // 		}

  // 	}

  // 	let mainCategorySize = req.query.mainCategorySize
  // 	console.log(mainCategorySize)
  // 	// "XS,S,M,L,XL"
  // 	if (mainCategorySize === 'M') {
  // 		let sizeM = filterArr.filter(val => val.tags.includes(mainCategorySize))
  // 		res.send(200, { data: sizeM })

  // 	}
  // 	else if (mainCategorySize === 'XL') {
  // 		let sizeXl = filterArr.filter(val => val.tags.includes(mainCategorySize))
  // 		res.send(200, { data: sizeXl })

  // 	}
  // 	else if (mainCategorySize === 'S') {
  // 		let sizeS = filterArr.filter(val => val.tags.includes(mainCategorySize))
  // 		res.send(200, { data: sizeS })

  // 	}
  // 	else if (mainCategorySize === 'XS') {
  // 		let sizeXs = filterArr.filter(val => val.tags.includes(mainCategorySize))

  // 		res.send(200, { data: sizeXs })

  // 	}
  // 	else if (mainCategorySize === 'L') {
  // 		let sizeL = filterArr.filter(val => val.tags.includes(mainCategorySize))

  // 		res.send(200, { data: sizeL })

  // 	}
  // 	let mainCategoryStiched = req.query.mainCategoryStiched
  // 	let mainCategoryUnstiched = req.query.mainCategoryunStiched

  // 	if (mainCategoryStiched === "stiched" && mainCategoryUnstiched === "false") {
  // 		filterArr = filterArr.filter((a) => a.category.toUpperCase() === mainCategoryStiched.toUpperCase())
  // 	} else if (mainCategoryStiched === "false" && mainCategoryUnstiched === "unstiched") {
  // 		filterArr = filterArr.filter((a) => a.category.toUpperCase() === mainCategoryUnstiched.toUpperCase())
  // 	} else if (mainCategoryStiched && mainCategoryUnstiched) {
  // 		filterArr = arr
  // 	}

  // 	let kurti = req.query.kurti
  // 	let twoPiece = req.query.twoPiece
  // 	let threePiece = req.query.threePiece

  // 	if (kurti === "kurti" && twoPiece === 'false' && threePiece === 'false') {
  // 		kurti = kurti.toUpperCase()
  // 		let re = new RegExp(kurti);
  // 		filterArr = filterArr.filter((a) => a.title.toUpperCase().match(re))
  // 	} else if (kurti === "kurti" && twoPiece === 'twoPiece' && threePiece === 'false') {
  // 		let twoPiece1 = '2'
  // 		let twoPiece2 = 'piece'

  // 		kurti = kurti.toUpperCase()
  // 		twoPiece1 = twoPiece1.toUpperCase()
  // 		twoPiece2 = twoPiece2.toUpperCase()

  // 		let re = new RegExp(kurti);
  // 		let re1 = new RegExp(twoPiece1);
  // 		let re2 = new RegExp(twoPiece2);

  // 		filterArr = filterArr.filter((a) => {
  // 			return (
  // 				a.title.toUpperCase().match(re1) && a.title.toUpperCase().match(re2)
  // 				|| a.subTitle.toUpperCase().match(re1) && a.subTitle.toUpperCase().match(re2)
  // 				|| a.title.toUpperCase().match(re)
  // 			)
  // 		})
  // 	} else if (kurti === "kurti" && twoPiece === 'false' && threePiece === 'threePiece') {
  // 		let threePiece1 = '3'
  // 		let threePiece2 = 'piece'

  // 		kurti = kurti.toUpperCase()
  // 		threePiece1 = threePiece1.toUpperCase()
  // 		threePiece2 = threePiece2.toUpperCase()

  // 		let re = new RegExp(kurti);
  // 		let re1 = new RegExp(threePiece1);
  // 		let re2 = new RegExp(threePiece2);

  // 		filterArr = filterArr.filter((a) => {
  // 			return (
  // 				a.title.toUpperCase().match(re1) && a.title.toUpperCase().match(re2)
  // 				|| a.subTitle.toUpperCase().match(re1) && a.subTitle.toUpperCase().match(re2)
  // 				|| a.title.toUpperCase().match(re)
  // 			)
  // 		})
  // 	} else if (kurti === "false" && twoPiece === 'twoPiece' && threePiece === 'false') {
  // 		let twoPiece1 = '2'
  // 		let twoPiece2 = 'piece'

  // 		twoPiece1 = twoPiece1.toUpperCase()
  // 		twoPiece2 = twoPiece2.toUpperCase()

  // 		let re1 = new RegExp(twoPiece1);
  // 		let re2 = new RegExp(twoPiece2);

  // 		filterArr = filterArr.filter((a) => {
  // 			return (
  // 				a.title.toUpperCase().match(re1) && a.title.toUpperCase().match(re2)
  // 				|| a.subTitle.toUpperCase().match(re1) && a.subTitle.toUpperCase().match(re2)
  // 			)
  // 		})
  // 	} else if (kurti === "false" && twoPiece === 'false' && threePiece === 'threePiece') {
  // 		let threePiece1 = '3'
  // 		let threePiece2 = 'piece'

  // 		threePiece1 = threePiece1.toUpperCase()
  // 		threePiece2 = threePiece2.toUpperCase()

  // 		let re1 = new RegExp(threePiece1);
  // 		let re2 = new RegExp(threePiece2);

  // 		filterArr = filterArr.filter((a) => {
  // 			return (
  // 				a.title.toUpperCase().match(re1) && a.title.toUpperCase().match(re2)
  // 				|| a.subTitle.toUpperCase().match(re1) && a.subTitle.toUpperCase().match(re2)
  // 				|| a.title.toUpperCase().match(re)
  // 			)
  // 		})
  // 	} else if (kurti === "kurti" && twoPiece === 'twoPiece' && threePiece === 'false') {
  // 		let twoPiece1 = '2'
  // 		let twoPiece2 = 'piece'
  // 		let threePiece1 = '3'
  // 		let threePiece2 = 'piece'

  // 		twoPiece1 = twoPiece1.toUpperCase()
  // 		twoPiece2 = twoPiece2.toUpperCase()
  // 		threePiece1 = threePiece1.toUpperCase()
  // 		threePiece2 = threePiece2.toUpperCase()

  // 		let re1 = new RegExp(twoPiece1);
  // 		let re2 = new RegExp(twoPiece2);
  // 		let re3 = new RegExp(threePiece1);
  // 		let re4 = new RegExp(threePiece2);

  // 		filterArr = filterArr.filter((a) => {
  // 			return (
  // 				a.title.toUpperCase().match(re1) && a.title.toUpperCase().match(re2)
  // 				|| a.subTitle.toUpperCase().match(re1) && a.subTitle.toUpperCase().match(re2)
  // 				|| a.title.toUpperCase().match(re3) && a.title.toUpperCase().match(re3)
  // 				|| a.subTitle.toUpperCase().match(re4) && a.subTitle.toUpperCase().match(re4)
  // 			)
  // 		})
  // 	}

  // 	let priceArr = req.query.priceArr;

  // 	if (priceArr) {
  // 		priceArr = priceArr.split(',')
  // 		let startingVal = Number(priceArr[0])
  // 		let endingVal = Number(priceArr[1])
  // 		// console.log(startingVal, endingVal)
  // 		filterArr = filterArr.filter((a) => startingVal <= Number(a.price) && endingVal >= Number(a.price))
  // 	}

  // 	let searchValue = req.query.searchValue

  // 	if (searchValue) {
  // 		// searchValue = searchValue.toUpperCase()
  // 		// let arr = searchValue.split(" ")
  // 		// let filterArr2 = []
  // 		// let filterObj = {}
  // 		// // console.log(arr)
  // 		// // for (let i = 0; i < arr.length; i++) {
  // 		// // 	if (arr[i] !== "") {
  // 		// // 		let ree = new RegExp(arr[i])
  // 		// // 		filterObj[`arr${i}`] = filterArr.filter((a) => {
  // 		// // 			return (
  // 		// // 				a.title.toUpperCase().match(ree)
  // 		// // 				|| a.subTitle.toUpperCase().match(ree)
  // 		// // 			)
  // 		// // 		})
  // 		// // 	}
  // 		// // }
  // 		// let re = new RegExp(searchValue);
  // 		// filterArr = filterArr.filter((a) => {
  // 		// 	return (
  // 		// 		a.title.toUpperCase().match(re)
  // 		// 		|| a.subTitle.toUpperCase().match(re)
  // 		// 	)
  // 		// })
  // 		// // filterArr = []
  // 		// // for (const property in filterObj) {
  // 		// // 	let abc = filterObj[property]

  // 		// // }

  // 		filterArr = filterArr.filter(function (item) {
  // 			return item.title.toLowerCase().search(
  // 				searchValue.toLowerCase()) !== -1
  // 				||
  // 				item.subTitle.toLowerCase().search(
  // 					searchValue.toLowerCase()) !== -1
  // 				;
  // 		});
  // 	}

  // 	let filterData = []
  // 	let start = req.query.start
  // 	let end = req.query.end
  // 	for (let i = 0; i < filterArr.length; i++) {
  // 		if (i >= start && i <= end) {
  // 			filterData.push(filterArr[i])
  // 		}
  // 	}
  // 	if (req.query.admin) {
  // 		res.status(200).send({ data: arr, length: arr.length })
  // 	} else {
  // 		res.status(200).send({ data: filterData, length: filterArr.length })
  // 	}
  // }
});

// app.get('/normal_products', (req, res) => {
// 	firebase.database().ref('all_products').
// 		once('value').then((snapshot) => {
// 			// ...
// 			//   });
// 			// .on('value', (snapShot) => {
// 			arr = Object.values(snapshot.val())
// 			arr = arr.sort(function (a, b) { return Number(b.code) - Number(a.code) });
// 			let filterData = []
// 			let start = req.query.start
// 			let end = req.query.end
// 			for (let i = 0; i < arr.length; i++) {
// 				if (i >= start && i <= end) {
// 					filterData.push(arr[i])
// 				}
// 			}
// 			if (req.query.admin) {
// 				res.status(200).send({ data: arr, length: arr.length })
// 			} else {
// 				res.status(200).send({ data: filterData, length: arr.length })
// 			}
// 		})
// })

app.get("/get-single-product", (req, res) => {
  let code = req.query.id;
  if (!arr.length) {
    firebase
      .database()
      .ref("all_products")
      .once("value")
      .then(function (snapshot) {
        // ...
        //   });
        // .on('value', (snapShot) => {
        arr = Object.values(snapshot.val());
        let obj = arr.filter((a) => a.code === code);
        res.status(200).send({ data: obj });
      });
  } else {
    filterArr = arr;
    let obj = filterArr.filter((a) => a.code === code);
    res.status(200).send({ data: obj });
  }
});

app.get("/images", (req, res) => {
  //console.log(req.query.filename)
  var filename = req.query.filename;
  let file_path = __dirname + "/Images/" + filename;
  if (fs.existsSync(file_path)) {
    res.sendFile(file_path);
  } else {
    res.send({
      message: "file not found",
    });
  }
});

var cpUpload = upload.fields([
  { name: "imageUrl", maxCount: 8 },
  { name: "gallery", maxCount: 8 },
]);

app.post(
  "/admin/post_product",
  uploader.array("imageUrl", 10),
  (req, res, next) => {
    let files = req.files;

    try {
      if (req.body) {
        // console.log(req.body)
        let newUrls = [];
        for (var i = 0; i < files.length; i++) {
          const blob = bucket.file(
            new Date().getTime() + files[i].originalname
          );
          const blobWriter = blob.createWriteStream({});
          blobWriter.on("error", (err) => console.log(err.message));

          blobWriter.on("finish", () => {
            // Assembling public URL for accessing the file via HTTP
            const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${
              bucket.name
            }/o/${encodeURI(blob.name)}?alt=media`;
            newUrls.push(publicUrl);
            // Return the file name and its public URL
            //res
            // .status(200)
            //	.send({ fileLocation: publicUrl });
            //if (i == files.length - 1) {
            // console.log(publicUrl)
            // console.log('runnn')
            // console.log(newUrls.length)
            if (newUrls.length === files.length) {
              firebase
                .database()
                .ref()
                .child("all_products")
                .child(req.body.code)
                .set({ ...req.body, imageUrl: newUrls })
                .then((value) => {
                  console.log(i, files.length);
                  res.send({
                    success: true,
                    message: "your data successfully send ",
                  });
                  blobWriter.end(files[i].buffer);
                  res.end();
                })
                .catch((err) => {
                  res.end();
                  res.send({ success: false, message: err.message });
                });
            }
          });
          //}
          if (i == files.length - 1) {
            // res.send({ success: true, message: "your data successfully send " })
            // res.render('template')
          }
          blobWriter.end(files[i].buffer);
        }

        // When there is no more data to be consumed from the stream
        //if (newUrls.length == files.length) {
        //	console.log('runnnnnn')

        //}
        //}).catch((err) => console.log(err.message))
        //});
      }
    } catch (err) {
      console.log(err.message);
    }
  }
);

app.post("/paymentMethod", (req, res) => {
  const CardDetails = req.body.CardDetails;
});

app.post("/create_user",(req,res)=>{
const user_create=req.body.user
const user_created={
  name:user_create.name,
  email:user_create.email,
  city:user_create.city,
  address:user_create.address,

}
firebase.auth().createUserWithEmailAndPassword(user_create.email,user_create.password)
  .then((userCredential) => {
    var user = userCredential.user;
    firebase
    .database()
    .ref()
    .child("users_created_accounts")
    .set({key:user.uid,user_created})
    .then((value) => {
      res.send({
        success: true,
        message: "User Created Successfully ",
      });
      blobWriter.end(files[i].buffer);
      res.end();
    })
    .catch((err) => {
      res.end();
      res.send({ success: false, message: err.message });
    });



  })
  .catch((error) => {
    var errorCode = error.code;
    var errorMessage = error.message;
  });



})

app.post("/login",(req,res)=>{
  const {email,password}=req.body.user
  firebase.auth().signInWithEmailAndPassword(email, password)
  .then((userCredential) => {
    // Signed in
    var user = userCredential.user;
    res.send({
      mesage:'Successfully Login...!'
    })
    // ...
  })
  .catch((error) => {
    var errorCode = error.code;
    var errorMessage = error.message;
    res.send(errorMessage)
  });



})

// app.post("/userDetails", (req, res) => {
//   const user = req.body.user;
//   console.log("user====>", user);

//   firebase
//     .database()
//     .ref("user_details")
//     .set({ user: user })
//     .then((value) => {
//       res.send({
//         success: true,
//         message: "user details successfully Saved ",
//       });
//       res.end();
//     })
//     .catch((err) => {
//       res.end();
//       res.send({ success: false, message: err.message });
//     });
// });

app.get("/all_users", (req, res) => {
  firebase
    .database()
    .ref("user_details")
    .on("value", (snapshot) => {
      console.log("snapshot",snapshot);
    })

    .then((value) => {
      res.send({
        success: true,
        message: "user details successfully Saved ",
      });
      res.end();
    })
    .catch((err) => {
      res.end();
      res.send({ success: false, message: err.message });
    });
});

app.post("/checkout", (req, res) => {
  let arr = req.body;
  code = req.query.code;
  // let total = req.query.total
  // console.log(code + "========")
  let obj = {
    code: code,
    data: arr,
    order: false,
    PSID: "",
    Confirm: false,
  };
  obj.total = req.query.total;
  // console.log(obj.total, req.query.total)
  // console.log(obj)

  userData.push(obj);

  res.send(req.query.code);
});

// app.post('/action', (req, res) => {
// 	let name = req.query.name
// 	let PSID = req.query.PSID
// 	greetings(PSID)
// 	// console.log(name)
// 	// console.log(PSID,"abc")
// 	// request({
// 	// 	"uri": "https://graph.facebook.com/v7.0/me/messages",
// 	// 	"qs": { "access_token": WebHookAccesToken },
// 	// 	"method": "POST",
// 	// 	"json": {
// 	// 		"recipient": {
// 	// 			"id": PSID
// 	// 		},
// 	// 		"message": {
// 	// 			"text": `abc`,
// 	// 		},
// 	// 		// "recipient": {
// 	// 		// 	"id": PSID
// 	// 		// },
// 	// 		// "messaging_type": "RESPONSE",
// 	// 		// "message": {
// 	// 		// 	"text": "Is this your orders ?",
// 	// 		// 	"quick_replies": [
// 	// 		// 		{
// 	// 		// 			"content_type": "text",
// 	// 		// 			"title": "Yes",
// 	// 		// 			"payload": "<POSTBACK_PAYLOAD>",
// 	// 		// 			// "image_url": "http://example.com/img/red.png"
// 	// 		// 		}, {
// 	// 		// 			"content_type": "text",
// 	// 		// 			"title": "No",
// 	// 		// 			"payload": "<POSTBACK_PAYLOAD>",
// 	// 		// 			// "image_url": "http://example.com/img/green.png"
// 	// 		// 		}
// 	// 		// 	]
// 	// 		// }
// 	// 	}
// 	// })

// })

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log("webhook is listening"));
